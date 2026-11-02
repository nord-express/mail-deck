const gmail = {};
// what this document waits for Gmail: an answer that never comes fails the action, which then
// shows its mail again, instead of leaving it hidden for good
const WAIT = 15000;
const wait = () => AbortSignal.timeout(WAIT);
// The ID key of an account is fetched from a whole Gmail page. The background keeps it for the
// browser session, tied to the address it belongs to, and gives it only while that address is
// at the account's place (/u/<n>): this document does not keep one of its own, which would
// outlive an account that signed out.
gmail.page = async n => {
  const kept = await chrome.runtime.sendMessage({method: 'ik-get', n}).catch(() => null);
  if (kept) {
    return {ik: kept};
  }
  const groups = await gmail.fetchPage(n);
  chrome.runtime.sendMessage({method: 'ik-set', n, ik: groups.ik}).catch(() => {});
  return groups;
};
// Gmail refused the key or the token: the next action fetches them again
const forget = (n, status) => {
  if ([400, 401, 403].includes(status)) {
    chrome.runtime.sendMessage({method: 'ik-forget', n}).catch(() => {});
  }
};
gmail.fetchPage = n => {
  const page = localStorage.getItem('page-' + n) || `https://mail.google.com/mail/u/${n}/s/`;

  const next = async href => {
    const r = await fetch(href, {
      credentials: 'include',
      signal: wait()
    });
    if (r.ok) {
      const content = await r.text();
      const m = content.match(/ID_KEY\s*=\s*['"](?<ik>[^'"]*)['"]/);

      if (m) {
        return m.groups;
      }
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const meta = doc.querySelector('meta[http-equiv="refresh"]');
      if (meta) {
        const url = meta.content.split('url=')[1];
        if (url) {
          const o = new URL(url, page);
          localStorage.setItem('page-' + n, o.href);

          return next(o.href);
        }
      }
    }
    throw Error('core.js -> id_key');
  };

  return next(page);
};
const cookie = n => new Promise(resolve => chrome.runtime.sendMessage({
  method: 'get-at',
  n
}, resolve));
// the account's token, read from its cookie each time: a cookie of the place (/u/<n>) is the
// account's that is there now
gmail.at = (n, thread) => {
  return new Promise((resolve, reject) => cookie(n).then(async at => {
    // the print view of a thread sets the cookie; the panel opens one before it
    // acts, an action sent from a closed panel has only this
    if (!at && thread) {
      await fetch(`https://mail.google.com/mail/u/${n}/?ui=2&view=pt&dsqt=1&search=all&msg=${thread}`, {
        credentials: 'include',
        signal: wait()
      }).catch(() => {});
      at = await cookie(n);
    }
    if (at) {
      resolve(at);
    }
    // Gmail's basic HTML view, the old way to the token, is gone since 2024
    else {
      reject(Error('core.js -> at; open Gmail once in this account to set the cookie'));
    }
  }));
};


gmail.search = async ({url, query}) => {
  const m = url.match(/u\/(?<n>\d+)/);
  if (m) {
    const {n} = m.groups;
    const {ik} = await gmail.page(n);
    if (!ik) {
      throw Error('core.js -> ik -> empty');
    }
    const at = await gmail.at(n);
    if (!at) {
      throw Error('core.js -> at -> empty');
    }
    const body = new URLSearchParams();
    body.append('s_jr', JSON.stringify([null, [
      [null, null, null, null, null, null, [null, true, false]],
      [null, [null, query, 0, null, 80, null, null, null, false, [], [], true]]
    ], 2, null, null, null, ik]));

    const href = `https://mail.google.com/mail/u/${n}/s/?v=or&ik=${ik}&at=${at}&subui=chrome&hl=en&ts=` + Date.now();
    const r = await fetch(href, {
      method: 'POST',
      credentials: 'include',
      body,
      signal: wait()
    });
    if (!r.ok) {
      forget(n, r.status);
      throw Error('core.js -> body: ' + r.status);
    }
    const content = await r.text();
    // Gmail asks to confirm the sign-in first (spreauth)
    if (!content || content.includes('/spreauth')) {
      const links = content.match(/\bhttps?:\/\/[^\s<>"'()]+/gi) || [];
      const e = new Error('core.js -> permission_error');
      e.details = {links};

      throw e;
    }

    const parts = content.split(/\d+&/);

    const results = parts[2];
    const j = JSON.parse(results);
    const entries = j[1][0][2][5].map(a => {
      const entry = {};
      entry.subject = a[3];
      entry.thread = a[11];
      entry.labels = a[8] || [];
      entry.date = a[7];
      entry.from = a[5];
      entry.text = a[4];

      try {
        if (a[10][2] === 1) {
          entry.labels.push('STARRED');
        }
      }
      catch (e) {}
      return entry;
    });

    return {
      'count': entries.length,
      'name': 'NA',
      'logged-in': true,
      'responseURL': r.responseURL,
      entries
    };
  }
  else {
    throw Error('core.js -> valid_m');
  }
};

/*
 * The raw message, read as far as its header ends: what a mail's List-Unsubscribe says (RFC
 * 2369, RFC 8058) and its Message-ID. Gmail's own "Download original" (view=att, disp=comp) gives
 * the message as it came; "Show original" (view=om) shows it in a page. Either is read only up to
 * the empty line after the header, and never past HEAD_MAX: the body, its pictures and files are
 * not fetched. Only the few fields below leave this document.
 */
const HEAD_MAX = 256 * 1024;
// a URL waits for its message this long; a message that never comes is given up
const HEAD_WAIT = 10000;
const FIELDS = ['list-unsubscribe', 'list-unsubscribe-post', 'message-id', 'authentication-results', 'dkim-signature'];
// the few entities a page's <pre> writes the header with
const unescape = s => s.replace(/&(#x[\da-f]+|#\d+|lt|gt|amp|quot|apos|#39);/gi, (all, e) => {
  const k = e.toLowerCase();
  if (k[0] === '#') {
    const code = k[1] === 'x' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
    return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : all;
  }
  return {lt: '<', gt: '>', amp: '&', quot: '"', apos: '\'', '#39': '\''}[k];
});
// The header of what has come so far, or null while it has not ended: the message's own text
// starts at the top; a page has it in its <pre id="raw_message_text">. last: nothing more comes.
const headerIn = (text, page, last) => {
  let from = 0;
  if (page) {
    const m = /<pre\b[^>]*\bid=["']?raw_message_text\b[^>]*>/i.exec(text);
    if (!m) {
      return null;
    }
    from = m.index + m[0].length;
  }
  const rest = text.slice(from).replace(/^\s*\n/, '');
  const end = /\r?\n\r?\n|<\/pre>/i.exec(rest);
  if (!end && !last) {
    return null;
  }
  const head = end ? rest.slice(0, end.index) : rest;
  return page ? unescape(head) : head;
};
// the fields of a header, unfolded (RFC 5322 2.2.3), each with every value it has
gmail.fields = head => {
  const out = {};
  for (const line of head.replace(/\r?\n(?=[ \t])/g, '').split(/\r?\n/)) {
    const m = /^([!-9;-~]+)[ \t]*:[ \t]*(.*)$/.exec(line);
    const name = m?.[1].toLowerCase();
    if (name && FIELDS.includes(name)) {
      (out[name] ||= []).push(m[2].trim().slice(0, 8192));
    }
  }
  return out;
};
// a message's header, read from the stream until it ends: the rest is never asked for
const readHeader = async (r, page) => {
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) {
        break;
      }
      bytes += value.length;
      text += decoder.decode(value, {stream: true});
      const head = headerIn(text, page, false);
      if (head !== null) {
        return head;
      }
      if (bytes >= HEAD_MAX) {
        return null;
      }
    }
    return headerIn(text + decoder.decode(), page, true);
  }
  finally {
    reader.cancel().catch(() => {});
  }
};
// Gmail's ID of a message, in the old hexadecimal form of its links and in the msg-f: form its
// pages use now
const permOf = id => /^[\da-f]{1,16}$/i.test(id) ? 'msg-f:' + BigInt('0x' + id).toString() : '';
gmail.headers = async ({link}) => {
  const m = /u\/(?<n>\d+).*message_id=(?<id>[^&#]+)/.exec(link || '');
  if (!m) {
    throw Error('core.js -> headers -> no message');
  }
  const {n, id} = m.groups;
  const {ik} = await gmail.page(n);
  const base = `https://mail.google.com/mail/u/${n}/?ik=${ik}&`;
  const perm = permOf(id);
  const forms = [
    perm && base + `view=att&permmsgid=${perm}&attid=0&disp=comp&safe=1&zw`,
    base + `view=att&th=${id}&attid=0&disp=comp&safe=1&zw`,
    perm && base + `view=om&permmsgid=${perm}`,
    base + `view=om&th=${id}`
  ];
  // the form that served last goes first, so a form Gmail no longer takes is not asked each time
  const last = Number(globalThis.localStorage?.getItem('head-form')) || 0;
  const order = [last, ...forms.keys()].filter((i, k, all) => forms[i] && all.indexOf(i) === k);
  for (const i of order) {
    const href = forms[i];
    try {
      const r = await fetch(href, {credentials: 'include', signal: AbortSignal.timeout(HEAD_WAIT)});
      // a signed-out account is sent to Google's sign-in page
      if (!r.ok || !r.body || (r.url && new URL(r.url).host !== 'mail.google.com')) {
        continue;
      }
      const page = /html/i.test(r.headers.get('content-type') || '');
      const head = await readHeader(r, page);
      // a header starts with a field, as "Delivered-To: …" or "Received: …"
      if (head && /^[!-9;-~]+[ \t]*:/.test(head)) {
        globalThis.localStorage?.setItem('head-form', String(i));
        const fields = gmail.fields(head);
        return {
          messageId: (fields['message-id']?.[0] || '').replace(/^\s*<|>\s*$/g, ''),
          unsubscribe: gmail.unsubscribe(fields)
        };
      }
    }
    catch (e) {}
  }
  throw Error('core.js -> headers -> not read');
};

/*
 * How a mail is unsubscribed from, by its List-Unsubscribe (RFC 2369): its URIs in angle
 * brackets, in the order the sender prefers them, comments and the spaces folding left aside.
 * One click (RFC 8058) only for an https URI with List-Unsubscribe-Post: List-Unsubscribe=One-Click,
 * in a mail whose DKIM signature Gmail found valid and that signs both fields: else anyone could
 * have Mail Deck post to an address of their choosing. {post, web, mailto: {to, subject, body}}
 * or null.
 */
const decode = s => {
  try {
    return decodeURIComponent(s);
  }
  catch (e) {
    return s;
  }
};
// RFC 6068: addresses before the ?, then to, subject and body; a + is a plus there, not a space
const mailtoOf = uri => {
  const at = uri.indexOf('?');
  const to = [decode(uri.slice(7, at === -1 ? undefined : at))];
  const o = {};
  for (const pair of at === -1 ? [] : uri.slice(at + 1).split('&')) {
    const i = pair.indexOf('=');
    const k = decode(i === -1 ? pair : pair.slice(0, i)).toLowerCase();
    const v = decode(i === -1 ? '' : pair.slice(i + 1));
    if (k === 'to') {
      to.push(v);
    }
    else if ((k === 'subject' || k === 'body') && !(k in o)) {
      o[k] = v;
    }
  }
  const list = to.join(',').split(',').map(s => s.trim()).filter(s => /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]+$/.test(s));
  return list.length ? {to: list.join(','), subject: o.subject || 'unsubscribe', body: o.body || ''} : null;
};
const urisOf = value => {
  // a URI is what is between < and >, with no space in it; one without is taken as it stands
  const bracketed = [...value.matchAll(/<([^<>]*)>/g)].map(m => m[1].replace(/\s+/g, ''));
  return (bracketed.length ? bracketed : value.replace(/\([^()]*\)/g, ' ').split(',').map(s => s.trim()))
    .filter(s => /^(https?|mailto):/i.test(s));
};
// Gmail's verdict on the mail, the first Authentication-Results it wrote (RFC 8601), and a
// signature it passed of a domain that signs both fields
const signed = fields => {
  const verdict = (fields['authentication-results'] || []).find(v => /^mx\.google\.com\s*;/i.test(v));
  if (!verdict) {
    return false;
  }
  const passed = [...verdict.matchAll(/\bdkim\s*=\s*pass\b([^;]*)/gi)]
    .map(m => (/\bheader\.[id]\s*=\s*([^\s;]+)/i.exec(m[1]) || [])[1]?.toLowerCase().replace(/^.*@/, '')).filter(Boolean);
  return (fields['dkim-signature'] || []).some(sig => {
    const tags = Object.fromEntries(sig.split(';').map(t => {
      const i = t.indexOf('=');
      return [t.slice(0, i).trim().toLowerCase(), t.slice(i + 1).replace(/\s+/g, '').toLowerCase()];
    }));
    const h = (tags.h || '').split(':');
    const d = tags.d || '';
    return d && h.includes('list-unsubscribe') && h.includes('list-unsubscribe-post') &&
      passed.some(p => p === d || p.endsWith('.' + d));
  });
};
gmail.unsubscribe = fields => {
  const uris = (fields['list-unsubscribe'] || []).flatMap(urisOf);
  const webAt = uris.findIndex(u => /^https?:\/\/[^/\s]+/i.test(u));
  const mailAt = uris.findIndex(u => /^mailto:/i.test(u) && mailtoOf(u));
  const https = uris.find(u => /^https:\/\/[^/\s]+/i.test(u));
  const oneClick = (fields['list-unsubscribe-post'] || []).some(v => /^list-unsubscribe\s*=\s*one-click$/i.test(v.trim()));
  const out = {
    post: oneClick && https && signed(fields) ? https : null,
    web: webAt === -1 ? null : uris[webAt],
    mailto: mailAt === -1 ? null : mailtoOf(uris[mailAt]),
    // of a page and a message, the one the sender lists first
    first: mailAt !== -1 && (webAt === -1 || mailAt < webAt) ? 'mailto' : 'web'
  };
  return out.post || out.web || out.mailto ? out : null;
};

// Gmail's search for a label: its name in lower case, spaces and slashes as dashes
const labelQuery = label => 'label:' + label.toLowerCase().replace(/[\s/&"]+/g, '-');
// Whether a search finds the thread with what was asked of it: by its Message-ID, which finds that
// mail alone, or else among what the query finds, by its ID. Gmail's search may take a moment.
const found = async (n, id, query) => {
  const mid = await gmail.headers({link: `https://mail.google.com/mail/u/${n}?message_id=${id}`}).then(h => h.messageId, () => '');
  for (const ms of [400, 1200]) {
    await new Promise(resolve => setTimeout(resolve, ms));
    const r = await gmail.search({url: `https://mail.google.com/mail/u/${n}`, query: mid ? `rfc822msgid:${mid} ${query}` : query}).catch(() => null);
    if (r?.entries.some(e => mid || e.thread === id)) {
      return true;
    }
  }
  return false;
};
/*
 * A label added to threads: Gmail's internal call above has no known way to, so the request goes
 * the way Gmail's web app sent it before (act=ac_<label>), and whether Gmail took it is asked of
 * its search afterwards. A label that does not show there is a failure: the mail is not said to
 * be labelled when it may not be.
 */
gmail.label = async ({a, label, at, ik}) => {
  const n = a[0].n;
  const body = new URLSearchParams();
  a.forEach(o => body.append('t', o.thread));
  const href = `https://mail.google.com/mail/u/${n}/?ui=2&ik=${ik}&at=${at}&view=up&act=${encodeURIComponent('ac_' + label)}&rt=c`;
  const r = await fetch(href, {
    method: 'POST',
    credentials: 'include',
    body,
    signal: wait()
  });
  if (!r.ok) {
    forget(n, r.status);
    throw Error('core.js -> label -> ' + r.status);
  }
  const content = await r.text();
  if (content.includes('/spreauth')) {
    const e = new Error('core.js -> permission_error');
    e.details = {links: content.match(/\bhttps?:\/\/[^\s<>"'()]+/gi) || []};
    throw e;
  }
  for (const o of a) {
    if (!await found(n, o.thread, labelQuery(label))) {
      throw Error('core.js -> label -> not confirmed');
    }
  }
};

gmail.action = async ({links, cmd, prefs}) => {
  links = typeof links === 'string' ? [links] : links;

  const a = links.map(link => {
    const m = link.match(/u\/(?<n>\d+).*message_id=(?<thread>[^&]+)/);
    if (m) {
      return m.groups;
    }
  }).filter(o => o);

  if (a.length) {
    const at = await gmail.at(a[0].n, a[0].thread);

    if (!at) {
      throw Error('core.js -> at');
    }
    const {ik} = await gmail.page(a[0].n);
    if (!ik) {
      throw Error('core.js -> ik');
    }

    const action = {
      command: 'l:all',
      labels: [],
      ids: []
    };

    if (cmd === 'rd' || cmd === 'rd-all') { // mark as read
      action.code = 3;
    }
    else if (cmd === 'rc_^i' || cmd === 'rc_Inbox') { // archive
      action.code = 1;
      if (prefs.doReadOnArchive === true || prefs.doReadOnArchive === 'true') {
        gmail.action({
          links,
          cmd: 'rd',
          prefs
        });
      }
    }
    else if (cmd === 'sp' || cmd === 'rc_Spam') { // report spam
      action.code = 7;
    }
    else if (cmd === 'tr') { // trash
      action.code = 9;
    }
    else if (cmd === 'st') { // star
      action.code = 5;
    }
    else if (cmd === 'xst') { // remove star
      action.code = 6;
    }
    // mark as unread: the code next to read's, as Checker Plus for Gmail sends it (its
    // MARK_AS_UNREAD); not seen in Gmail's own traffic
    else if (cmd === 'ur') {
      action.code = 4;
    }
    // ac_<label> adds a label; mv_<label> moves there: the label, and once Gmail has it, out of the inbox
    else if (cmd.startsWith('ac_') || cmd.startsWith('mv_')) {
      const label = cmd.slice(3);
      if (!label) {
        throw Error('core.js -> action_not_supported: ' + cmd);
      }
      await gmail.label({a, label, at, ik});
      return cmd.startsWith('mv_') ? gmail.action({links, cmd: 'rc_^i', prefs}) : true;
    }
    // removing a label other than the inbox and spam has no known call
    if (!action.code) {
      throw Error('core.js -> action_not_supported: ' + cmd);
    }

    const body = new FormData();
    body.append('s_jr', JSON.stringify([null, [
      ...a.map(o => [null, null, null, [
        null, action.code, o.thread, (o.id || o.thread), action.command, [], action.labels, o.ids
      ]]),
      [null, null, null, null, null, null, [null, true, false]],
      [null, null, null, null, null, null, [null, true, false]]
    ], 2, null, null, null, ik]));

    const href = `https://mail.google.com/mail/u/${a[0].n}/s/?v=or&ik=${ik}&at=${at}&subui=chrome&hl=en&ts=` + Date.now();
    const r = await fetch(href, {
      method: 'POST',
      credentials: 'include',
      body,
      signal: wait()
    });
    // an answer other than 200 is a refusal, though it carries no permission error
    if (!r.ok) {
      forget(a[0].n, r.status);
      throw Error('core.js -> action -> ' + r.status);
    }
    // do we have permission to do the action?
    const content = await r.text();
    if (!content || content.includes('/spreauth')) {
      const links = content.match(/\bhttps?:\/\/[^\s<>"'()]+/gi) || [];
      const e = new Error('core.js -> permission_error');
      e.details = {links};

      throw e;
    }

    return r;
  }
  throw Error('core.js -> no_links');
};
