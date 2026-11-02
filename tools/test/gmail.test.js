// core/offscreen/gmail/core.js against a fake Gmail: a mail's header read from its raw message
// and no further, how List-Unsubscribe says to unsubscribe (RFC 2369, RFC 8058), and the action
// calls for unread and labels (time runs a hundred times faster there).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const EXT = path.join(__dirname, '../../extension');
const link = (n, id) => `https://mail.google.com/mail/u/${n}?account_id=x&message_id=${id}&view=conv&extsrc=atom`;

// a body in chunks, counting how many were read and whether the rest was let go
const stream = chunks => {
  const out = {pulled: 0, cancelled: false};
  out.body = new ReadableStream({
    pull(c) {
      if (out.pulled < chunks.length) {
        c.enqueue(new TextEncoder().encode(chunks[out.pulled++]));
      }
      else {
        c.close();
      }
    },
    cancel() {
      out.cancelled = true;
    }
  }, {highWaterMark: 0});
  return out;
};
// Gmail's search answer: its parts, the threads (subject, thread) in the third
const searchAnswer = threads => '4&[[]]9&' + JSON.stringify([null, [[null, null, [null, null, null, null, null,
  threads.map(([subject, thread]) => [null, null, null, subject, '', 'x@y.z', null, Date.now(), ['^u'], null, [null, null, 0], thread])]]]]);

// answer(url, options) gives a Response (or a {stream} of one) for each request; requests lists them
const start = answer => {
  const requests = [];
  const chrome = {
    runtime: {
      sendMessage: (m, cb) => {
        const r = m.method === 'ik-get' ? 'IK' : m.method === 'get-at' ? 'AT' : undefined;
        cb?.(r);
        return Promise.resolve(r);
      }
    }
  };
  const fetch = async (url, o = {}) => {
    requests.push({url: String(url), method: o.method || 'GET', body: o.body});
    return answer(String(url), o);
  };
  const kept = new Map();
  const localStorage = {getItem: k => kept.get(k) ?? null, setItem: (k, v) => kept.set(k, String(v))};
  const ctx = {chrome, fetch, localStorage, console, URL, URLSearchParams, FormData, TextDecoder, TextEncoder, AbortSignal, Promise, JSON, BigInt, Error,
    setTimeout: (fn, ms, ...args) => setTimeout(fn, ms / 100, ...args)};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(EXT + '/core/offscreen/gmail/core.js', 'utf8') + ';this.gmail = gmail;', ctx, {filename: 'core.js'});
  return {gmail: ctx.gmail, requests};
};
const ok = (text, type = 'text/plain') => new Response(text, {status: 200, headers: {'content-type': type}});
const head = lines => lines.join('\r\n') + '\r\n\r\n';
const fields = lines => start(() => ok('')).gmail.fields(lines.join('\r\n'));

const tests = [
  ['a raw message is read only as far as its header: the body is never fetched', async () => {
    const s = stream([
      'Delivered-To: me@gmail.com\r\nMessage-ID: <abc@news.example.com>\r\nList-Unsubscribe: <mailto:off@news.example.com?subject=stop>,\r\n',
      ' <https://news.example.com/u?id=1>\r\nSubject: hi\r\n\r\nbody starts',
      ...Array.from({length: 50}, () => 'x'.repeat(65536))
    ]);
    const g = start(url => url.includes('view=att') && url.includes('permmsgid') ? Object.assign(new Response(s.body, {headers: {'content-type': 'text/plain'}})) : new Response('', {status: 404}));
    const r = await g.gmail.headers({link: link(1, '18b4c3d2e1f0a9b8')});
    assert.strictEqual(r.messageId, 'abc@news.example.com');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(r.unsubscribe)), {post: null, web: 'https://news.example.com/u?id=1',
      mailto: {to: 'off@news.example.com', subject: 'stop', body: ''}, first: 'mailto'});
    assert.ok(s.pulled <= 3, 'read ' + s.pulled + ' chunks');
    assert.ok(s.cancelled, 'the rest is let go');
    // its account's place and ID key, the message by its msg-f: ID
    assert.strictEqual(g.requests[0].url, 'https://mail.google.com/mail/u/1/?ik=IK&view=att&permmsgid=msg-f:' + BigInt('0x18b4c3d2e1f0a9b8') + '&attid=0&disp=comp&safe=1&zw');
  }],
  ['Gmail\'s Show original page serves when the raw message does not, its <pre> unescaped', async () => {
    const page = '<html><head><style>p{}</style></head><body><table><tr><td>Message ID</td><td>&lt;m@x&gt;</td></tr></table>' +
      '<pre class="raw_message_text" id="raw_message_text">\nMessage-ID: &lt;m@x.example&gt;\nList-Unsubscribe: &lt;https://x.example/u?a=1&amp;b=2&gt;\n\nHello</pre></body></html>';
    const g = start(url => url.includes('view=om') && url.includes('permmsgid') ? ok(page, 'text/html; charset=utf-8') : new Response('', {status: 404}));
    const r = await g.gmail.headers({link: link(0, 'abc')});
    assert.strictEqual(r.messageId, 'm@x.example');
    assert.strictEqual(r.unsubscribe.web, 'https://x.example/u?a=1&b=2');
    assert.deepStrictEqual(g.requests.map(q => q.url.match(/view=\w+&(permmsgid|th)/)[0]), ['view=att&permmsgid', 'view=att&th', 'view=om&permmsgid']);
    // the form that served is asked first next time
    await g.gmail.headers({link: link(0, 'abd')});
    assert.strictEqual(g.requests.length, 4);
    assert.ok(g.requests[3].url.includes('view=om&permmsgid'));
  }],
  ['Google\'s sign-in page, a page with no message and a header with no end are no header', async () => {
    const signIn = Object.defineProperty(ok('Delivered-To: x\r\n\r\n'), 'url', {value: 'https://accounts.google.com/ServiceLogin'});
    const answers = [signIn, ok('<html><body>Temporary Error</body></html>', 'text/html'), ok('Delivered-To: x\r\n' + 'X-Long: y\r\n'.repeat(30000)), ok('<html>')];
    const g = start(() => answers.shift());
    await assert.rejects(g.gmail.headers({link: link(0, 'abc')}), /not read/);
    assert.strictEqual(g.requests.length, 4);
  }],
  ['List-Unsubscribe: every URI in its brackets, comments, folding and spaces aside, in the sender\'s order', async () => {
    // what the other realm made, as plain objects
    const u = lines => JSON.parse(JSON.stringify(start(() => ok('')).gmail.unsubscribe(fields(lines))));
    // RFC 2369 §3.2
    assert.deepStrictEqual(u(['List-Unsubscribe: <mailto:list@host.com?subject=unsubscribe>']).mailto, {to: 'list@host.com', subject: 'unsubscribe', body: ''});
    assert.deepStrictEqual(u(['List-Unsubscribe: (Use this command to get off the list)', '     <mailto:list-manager@host.com?body=unsubscribe%20list>']).mailto,
      {to: 'list-manager@host.com', subject: 'unsubscribe', body: 'unsubscribe list'});
    const both = u(['List-Unsubscribe: <http://www.host.com/list.cgi?cmd=unsub&lst=list>,', '\t<mailto:list-request@host.com?subject=unsubscribe>']);
    assert.deepStrictEqual([both.web, both.mailto.to, both.first], ['http://www.host.com/list.cgi?cmd=unsub&lst=list', 'list-request@host.com', 'web']);
    // a URI folded in two, its spaces left out
    assert.strictEqual(u(['List-Unsubscribe: <https://example.com/unsub?', '  id=1&t=2>']).web, 'https://example.com/unsub?id=1&t=2');
    // mailto (RFC 6068): a + stays a plus, addresses before the ? and in to=, an address that is none left out
    assert.deepStrictEqual(u(['List-Unsubscribe: <mailto:a+b@x.com,c@x.com?to=d@x.com&subject=Unsub+me&body=bye%0Anow>']).mailto,
      {to: 'a+b@x.com,c@x.com,d@x.com', subject: 'Unsub+me', body: 'bye\nnow'});
    assert.strictEqual(u(['List-Unsubscribe: <mailto:nobody>, <https://x.com/u>']).mailto, null);
    // a sender that leaves out the brackets; one with nothing to use
    assert.strictEqual(u(['List-Unsubscribe: https://x.com/u']).web, 'https://x.com/u');
    assert.strictEqual(u(['List-Unsubscribe: <ftp://x.com/u>']), null);
    assert.strictEqual(u(['Subject: no list']), null);
  }],
  ['one click (RFC 8058) only for an https URI with One-Click, in mail Gmail found signed by a domain that signs both fields', async () => {
    const signed = (h = 'from:subject:list-unsubscribe:list-unsubscribe-post', verdict = 'mx.google.com;\r\n       dkim=pass header.i=@news.example.com header.s=s1;\r\n       spf=pass') => [
      'Authentication-Results: ' + verdict,
      'DKIM-Signature: v=1; a=rsa-sha256; d=example.com; s=s1;', '  h=' + h + '; bh=abc=; b=def+g/h==',
      'List-Unsubscribe: <mailto:u@example.com>, <https://example.com/one?c=1>',
      'List-Unsubscribe-Post: List-Unsubscribe=One-Click'
    ];
    const u = lines => start(() => ok('')).gmail.unsubscribe(fields(lines));
    assert.strictEqual(u(signed()).post, 'https://example.com/one?c=1');
    // the signature leaves List-Unsubscribe-Post out, the DKIM check failed, or the verdict is someone else's
    assert.strictEqual(u(signed('from:list-unsubscribe')).post, null);
    assert.strictEqual(u(signed(undefined, 'mx.google.com; dkim=fail header.i=@news.example.com')).post, null);
    assert.strictEqual(u(signed(undefined, 'mx.example.com; dkim=pass header.i=@news.example.com')).post, null);
    // Gmail's own verdict is the first; one the sender added below it does not count
    assert.strictEqual(u(['Authentication-Results: mx.google.com; dkim=fail header.i=@example.com', ...signed()]).post, null);
    // a signature of another domain than the one that passed
    assert.strictEqual(u(signed(undefined, 'mx.google.com; dkim=pass header.i=@other.com')).post, null);
    // no One-Click, or no https URI: the page (or the message) instead
    const plain = u(signed().filter(l => !l.startsWith('List-Unsubscribe-Post')));
    assert.deepStrictEqual([plain.post, plain.web, plain.first], [null, 'https://example.com/one?c=1', 'mailto']);
    assert.strictEqual(u(signed().map(l => l.replace('https://', 'http://'))).post, null);
  }],
  ['mark as unread is Gmail\'s action 4, as read is 3', async () => {
    const g = start(() => ok('ok'));
    await g.gmail.action({links: [link(2, 't1')], cmd: 'ur', prefs: {}});
    const sent = JSON.parse(g.requests.at(-1).body.get('s_jr'));
    assert.deepStrictEqual(sent[1][0][3].slice(1, 5), [4, 't1', 't1', 'l:all']);
    assert.ok(g.requests.at(-1).url.startsWith('https://mail.google.com/mail/u/2/s/?v=or&ik=IK&at=AT&'));
  }],
  ['a label is added, and counts as added once Gmail\'s search finds the mail with it', async () => {
    const g = start((url, o) => url.includes('act=ac_') ? ok(')]}\'\n[]') :
      url.includes('view=att') ? ok(head(['Message-ID: <m1@x.com>'])) :
        url.includes('/s/?v=or') ? ok(searchAnswer([['Hi', 't9']])) : new Response('', {status: 404}));
    await g.gmail.action({links: [link(0, 't1')], cmd: 'ac_Work/Projects', prefs: {}});
    const label = g.requests.find(q => q.url.includes('act='));
    assert.ok(label.url.includes('ui=2&ik=IK&at=AT&view=up&act=' + encodeURIComponent('ac_Work/Projects')) && label.method === 'POST');
    assert.deepStrictEqual([...label.body.getAll('t')], ['t1']);
    const search = JSON.parse(g.requests.find(q => q.url.includes('/s/?v=or')).body.get('s_jr'));
    assert.strictEqual(search[1][1][1][1], 'rfc822msgid:m1@x.com label:work-projects');
    // no internal action call was made for it
    assert.ok(!g.requests.some(q => q.body instanceof FormData));
  }],
  ['a label Gmail\'s search does not show is a failure; without a Message-ID the thread is looked for by its ID', async () => {
    const g = start(url => url.includes('act=ac_') ? ok('') : url.includes('/s/?v=or') ? ok(searchAnswer([['Other', 't8']])) : new Response('', {status: 404}));
    await assert.rejects(g.gmail.action({links: [link(0, 't1')], cmd: 'ac_Work', prefs: {}}), /not confirmed/);
    const searches = g.requests.filter(q => q.url.includes('/s/?v=or')).map(q => JSON.parse(q.body.get('s_jr'))[1][1][1][1]);
    assert.deepStrictEqual(searches, ['label:work', 'label:work']);
    // found by its ID
    const h = start(url => url.includes('act=ac_') ? ok('') : url.includes('/s/?v=or') ? ok(searchAnswer([['Mine', 't1']])) : new Response('', {status: 404}));
    await h.gmail.action({links: [link(0, 't1')], cmd: 'ac_Work', prefs: {}});
  }],
  ['a move adds the label, then archives; Gmail refusing the label archives nothing; another label\'s removal is not sent', async () => {
    const g = start(url => url.includes('act=ac_') ? ok('') : url.includes('view=att') ? ok(head(['Message-ID: <m@x>'])) :
      url.includes('/s/?v=or') ? ok(searchAnswer([['Hi', 't1']])) : new Response('', {status: 404}));
    await g.gmail.action({links: [link(0, 't1')], cmd: 'mv_Work', prefs: {doReadOnArchive: false}});
    const actions = g.requests.filter(q => q.body instanceof FormData).map(q => JSON.parse(q.body.get('s_jr'))[1][0][3]?.[1]);
    assert.deepStrictEqual(actions, [1]);
    const refused = start(url => url.includes('act=ac_') ? new Response('', {status: 400}) : ok(''));
    await assert.rejects(refused.gmail.action({links: [link(0, 't1')], cmd: 'mv_Work', prefs: {}}), /label -> 400/);
    assert.ok(!refused.requests.some(q => q.body instanceof FormData));
    const none = start(() => ok(''));
    await assert.rejects(none.gmail.action({links: [link(0, 't1')], cmd: 'rc_Work', prefs: {}}), /action_not_supported/);
    assert.ok(!none.requests.some(q => q.method === 'POST'));
  }]
];

(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log('ok', name);
    }
    catch (e) {
      failed += 1;
      console.log('not ok', name, '-', e.message);
    }
  }
  process.exit(failed ? 1 : 0);
})();
