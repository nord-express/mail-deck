// The background check of core/check.js against a fake Gmail: a number of
// signed-in accounts whose feeds answer after a delay, and past them the index
// Gmail redirects to /u/0/, the way it tells a signed-out account.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const EXT = path.join(__dirname, '../../extension');

const feedXml = n => `<?xml version="1.0" encoding="UTF-8"?><feed version="0.3" xmlns="http://purl.org/atom/ns#"><title>Gmail - Inbox for user${n}@gmail.com</title><tagline>New messages in your Gmail Inbox</tagline><fullcount>1</fullcount><link rel="alternate" href="https://mail.google.com/mail/u/${n}" type="text/html"/><modified>2026-10-31T10:00:00Z</modified><entry><title>Hi ${n}</title><summary>s</summary><link rel="alternate" href="https://mail.google.com/mail?account_id=user${n}@gmail.com&amp;message_id=m${n}&amp;view=conv&amp;extsrc=atom" type="text/html"/><modified>2026-10-31T09:00:00Z</modified><issued>2026-10-31T09:00:00Z</issued><id>tag:gmail.google.com,2004:${n}</id><author><name>A</name><email>a@x.com</email></author></entry></feed>`;

// signedIn accounts, each feed answering after delay ms; known is what the last
// check remembered (undefined: nothing); the feed of index hang never answers
// services: the mailboxes the other mail services answer (core/services.js), after delay ms
const check = ({signedIn, delay = 100, known, hang = -1, timeout = 9000, services = []}) => {
  const deep = () => new Proxy(function() {}, {get: (t, k) => k === 'then' ? undefined : deep(), apply: () => deep()});
  const session = known === undefined ? {} : {'accounts.count': known};
  const local = {timeout};
  const area = store => ({
    get: (d, cb) => {
      const keys = typeof d === 'string' ? {[d]: undefined} : d;
      const o = {};
      for (const k in keys) {
        o[k] = k in store ? store[k] : keys[k];
      }
      cb && cb(o);
      return Promise.resolve(o);
    },
    set: (o, cb) => {
      Object.assign(store, o);
      cb && cb();
      return Promise.resolve();
    },
    remove: () => Promise.resolve()
  });
  const chrome = new Proxy({}, {get: (t, k) => {
    if (k === 'storage') {
      return {session: area(session), local: area(local), onChanged: {addListener() {}}};
    }
    if (k === 'i18n') {
      return {getMessage: () => 'x'};
    }
    if (k === 'runtime') {
      return {sendMessage: (m, cb) => cb && cb(), lastError: null, onMessage: {addListener() {}}};
    }
    return deep();
  }});
  let requests = 0;
  const fetch = (href, o = {}) => new Promise((resolve, reject) => {
    requests += 1;
    const n = Number(/u\/(\d+)/.exec(href)[1]);
    o.signal?.addEventListener('abort', () => reject(Error('aborted')));
    if (n === hang) {
      return;
    }
    setTimeout(() => {
      // nobody signed in to Google: Gmail refuses even the first account
      if (signedIn === 0) {
        return resolve({ok: false, status: 401, url: href, text: async () => ''});
      }
      const out = n < signedIn ? n : 0;
      resolve({ok: true, status: 200, url: `https://mail.google.com/mail/u/${out}/feed/atom`, text: async () => feedXml(out)});
    }, delay);
  });
  const quiet = {log() {}, info() {}, warn() {}, error() {}};
  const ctx = {chrome, fetch, console: quiet, setTimeout, clearTimeout, AbortController, URL, Intl, Date, Promise, Map, Set,
    navigator: {userAgent: 'Chrome', platform: 'Mac', language: 'en'}};
  ctx.self = ctx;
  ctx.importScripts = (...files) => files.forEach(p => vm.runInContext(fs.readFileSync(EXT + p, 'utf8'), ctx, {filename: p}));
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(EXT + '/core/utils/log.js', 'utf8'), ctx);
  vm.runInContext(`var button = new Proxy({}, {set: () => true, get: () => () => {}});
    var context = {accounts() {}}; var repeater = {reset() {}}; var sound = {play: () => Promise.resolve()};
    var offscreen = {}; var toast = () => {}; self.openLink = () => {};`, ctx);
  ctx.Services = {
    of: () => undefined,
    collect: () => new Promise(resolve => setTimeout(resolve, delay, services.map(email => ({
      network: true,
      notAuthorized: false,
      xml: {id: 'yahoo:' + email, title: email, label: '', service: 'yahoo', fullcount: 1, modified: new Date().toISOString(),
        rootLink: 'https://mail.yahoo.com/n/folders/1', link: 'https://mail.yahoo.com/n/folders/1', authorized: true, entries: []},
      newIDs: [],
      commit() {}
    }))))
  };
  vm.runInContext(fs.readFileSync(EXT + '/core/check.js', 'utf8'), ctx, {filename: 'check.js'});
  const t0 = Date.now();
  return ctx.checkEmails.execute(false).then(() => ({
    ms: Date.now() - t0,
    requests,
    // copied out of the context, whose arrays are not this one's
    found: [...(session['cached-objects'] || []).map(o => String(o.xml.title))],
    saved: session['accounts.count']
  }));
};
const users = (...ns) => ns.map(n => `user${n}@gmail.com`);
const range = n => [...Array(n).keys()];
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const tests = [
  ['the accounts known from the last check come at once, with no extra requests', async () => {
    const r = await check({signedIn: 9, delay: 100, known: 9});
    assert.deepStrictEqual(r.found, users(...range(9)));
    assert.strictEqual(r.requests, 10);
    assert.ok(r.ms < 450, `took ${r.ms} ms`);
    assert.strictEqual(r.saved, 9);
  }],
  ['a first check walks the accounts one by one', async () => {
    const r = await check({signedIn: 9, delay: 50});
    assert.deepStrictEqual(r.found, users(...range(9)));
    assert.strictEqual(r.requests, 10);
    assert.ok(r.ms >= 9 * 50, `took ${r.ms} ms`);
    assert.strictEqual(r.saved, 9);
  }],
  ['accounts added since the last check are all found', async () => {
    const r = await check({signedIn: 9, delay: 30, known: 3});
    assert.deepStrictEqual(r.found, users(...range(9)));
    assert.strictEqual(r.saved, 9);
  }],
  ['accounts signed out since the last check are left out', async () => {
    const r = await check({signedIn: 3, delay: 30, known: 9});
    assert.deepStrictEqual(r.found, users(0, 1, 2));
    assert.strictEqual(r.saved, 3);
  }],
  ['one account', async () => {
    const r = await check({signedIn: 1, delay: 30, known: 1});
    assert.deepStrictEqual(r.found, users(0));
    assert.strictEqual(r.requests, 2);
  }],
  ['the other services are asked alongside Gmail and listed after it', async () => {
    const r = await check({signedIn: 2, delay: 100, known: 2, services: ['ann@yahoo.com']});
    assert.deepStrictEqual(r.found, [...users(0, 1), 'ann@yahoo.com']);
    assert.ok(r.ms < 450, `took ${r.ms} ms`);
    assert.strictEqual(r.saved, 2);
  }],
  ['a service mailbox alone counts as signed in', async () => {
    const r = await check({signedIn: 0, delay: 30, services: ['ann@yahoo.com']});
    assert.deepStrictEqual(r.found, ['ann@yahoo.com']);
  }],
  ['a feed that never answers is given up after the timeout; the rest are found', async () => {
    const r = await check({signedIn: 9, delay: 30, known: 9, hang: 4, timeout: 300});
    assert.deepStrictEqual(r.found, users(0, 1, 2, 3, 5, 6, 7, 8));
    assert.ok(r.ms < 2000, `took ${r.ms} ms`);
  }]
];

/*
 * The check against a fake Gmail whose mail is given, for what a check tells and keeps:
 * notifications, sound, the badge's count, the cache and what the panel is sent. mail lists
 * the mailboxes of the signed-in accounts: {'0': [entries], '0/work': [entries]}, each entry
 * {id, age} with age in minutes. local and session are the storage the check starts from.
 */
const boot = ({mail = {}, local = {}, session = {}, online} = {}) => {
  const deep = () => new Proxy(function() {}, {get: (t, k) => k === 'then' ? undefined : deep(), apply: () => deep()});
  // the storage hands out copies, the way Chrome does
  const copy = o => o === undefined ? o : JSON.parse(JSON.stringify(o));
  const area = store => ({
    get: (d, cb) => {
      const keys = typeof d === 'string' ? {[d]: undefined} : d;
      const o = {};
      for (const k in keys) {
        o[k] = k in store ? copy(store[k]) : keys[k];
      }
      cb && cb(o);
      return Promise.resolve(o);
    },
    // out.full: a local storage with no room for the mail told
    set: (o, cb) => {
      if (store === local && out.full && Object.keys(o).some(k => k.startsWith('ids.'))) {
        return Promise.reject(Error('QUOTA_BYTES quota exceeded'));
      }
      Object.assign(store, copy(o));
      cb && cb();
      return Promise.resolve();
    },
    remove: k => {
      [].concat(k).forEach(k => delete store[k]);
      return Promise.resolve();
    }
  });
  const out = {local, session, told: [], sounds: [], messages: [], opened: [], toasts: [], requests: 0, offline: false,
    badges: [], icons: [], alarms: {}, alarmFns: [], changeFns: [], resets: []};
  const chrome = new Proxy({}, {get: (t, k) => {
    if (k === 'storage') {
      return {session: area(session), local: area(local), onChanged: {addListener: fn => out.changeFns.push(fn)}};
    }
    // kept, never fired by themselves: out.fire() rings one
    if (k === 'alarms') {
      return {
        create: (name, o) => out.alarms[name] = o,
        clear: name => Promise.resolve(delete out.alarms[name]),
        get: async name => out.alarms[name],
        onAlarm: {addListener: fn => out.alarmFns.push(fn)}
      };
    }
    if (k === 'i18n') {
      return {getMessage: k => k === 'notification' ? '[title]' : 'x'};
    }
    if (k === 'runtime') {
      return {sendMessage: (m, cb) => {
        out.messages.push(copy(m));
        cb && cb();
      }, lastError: null, onMessage: {addListener() {}}};
    }
    if (k === 'notifications') {
      return {create: (id, o) => out.told.push(o), clear() {}, onClicked: {addListener() {}}, onButtonClicked: {addListener() {}}};
    }
    if (k === 'idle') {
      return {queryState: async () => 'active'};
    }
    return deep();
  }});
  const iso = age => new Date(Date.now() - age * 60000).toISOString();
  // the feed of user<who> signed in at /u/<n>
  const xml = (n, label, entries, who = n) => `<?xml version="1.0" encoding="UTF-8"?><feed version="0.3" xmlns="http://purl.org/atom/ns#"><title>Gmail - ${label ? `Label '${label}'` : 'Inbox'} for user${who}@gmail.com</title><tagline>New messages in your Gmail ${label ? `'${label}' label` : 'Inbox'}</tagline><fullcount>${entries.length}</fullcount><link rel="alternate" href="https://mail.google.com/mail/u/${n}" type="text/html"/><modified>${iso(0)}</modified>` +
    entries.map(({id, age = 1}) => `<entry><title>Mail ${id}</title><summary>s</summary><link rel="alternate" href="https://mail.google.com/mail?account_id=user${who}@gmail.com&amp;message_id=${id}&amp;view=conv&amp;extsrc=atom" type="text/html"/><modified>${iso(age)}</modified><issued>${iso(age)}</issued><id>tag:gmail.google.com,2004:${id}</id><author><name>A</name><email>a@x.com</email></author></entry>`).join('') + '</feed>';
  // out.places, when set, says who is signed in at each place: [1, 2] is user1 at /u/0 and
  // user2 at /u/1, as after user0 signed out; mail is kept by user. Otherwise user<n> is at /u/<n>.
  const fetch = href => {
    out.requests += 1;
    if (out.offline) {
      return Promise.reject(new TypeError('Failed to fetch'));
    }
    const [, n, label] = /u\/(\d+)\/feed\/atom(?:\/([^?]+))?/.exec(href);
    const who = out.places ? out.places[n] : Object.keys(mail).some(k => k.split('/')[0] === n) ? n : undefined;
    const box = who + (label ? '/' + decodeURIComponent(label) : '');
    // an account nobody signed in to: Gmail answers with the first account's feed
    if (who === undefined) {
      const first = out.places ? out.places[0] : 0;
      return Promise.resolve({ok: true, status: 200, url: 'https://mail.google.com/mail/u/0/feed/atom', text: async () => xml(0, '', mail[first] || [], first)});
    }
    return Promise.resolve({ok: true, status: 200, url: href, text: async () => xml(n, label && decodeURIComponent(label), mail[box] || [], who)});
  };
  const quiet = {log() {}, info() {}, warn() {}, error() {}};
  const ctx = {chrome, fetch, console: quiet, setTimeout, clearTimeout, AbortController, URL, Intl, Date, Promise, Map, Set,
    navigator: {userAgent: 'Chrome', platform: 'Linux', language: 'en', onLine: online}, out};
  ctx.self = ctx;
  ctx.importScripts = (...files) => files.forEach(p => vm.runInContext(fs.readFileSync(EXT + p, 'utf8'), ctx, {filename: p}));
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(EXT + '/core/utils/log.js', 'utf8'), ctx);
  vm.runInContext(`var button = new Proxy({}, {set: (t, k, v) => {
      if (k === 'badge') out.badges.push(v);
      if (k === 'icon') out.icons.push(v);
      return true;
    }, get: () => () => {}});
    var context = {accounts() {}}; var repeater = {reset: (reason, delay) => out.resets.push([reason, delay])};
    var sound = {play: e => (out.sounds.push(e.length), Promise.resolve()), stop() {}};
    var offscreen = {}; var toast = m => out.toasts.push(m); self.openLink = l => out.opened.push(l);`, ctx);
  ctx.Services = {of: () => undefined, collect: async () => []};
  vm.runInContext(fs.readFileSync(EXT + '/core/check.js', 'utf8'), ctx, {filename: 'check.js'});
  out.ctx = ctx;
  out.Resolved = vm.runInContext('Resolved', ctx);
  out.Remind = vm.runInContext('Remind', ctx);
  // a notification is made a moment after the check, once its settings are read
  out.run = (forced = false) => ctx.checkEmails.execute(forced).then(() => wait(20));
  // an alarm rings, a stored setting changes (Chrome tells every listener of the area)
  out.fire = name => Promise.all(out.alarmFns.map(fn => fn({name}))).then(() => wait(20));
  out.change = (ps, where = 'local') => Promise.all(out.changeFns.map(fn => fn(ps, where))).then(() => wait(20));
  // the entries of the last 'update' the panel was sent, all mailboxes together
  out.panel = () => {
    const m = out.messages.filter(m => m.method === 'update').at(-1);
    return m ? m.data.reduce((p, o) => p + o.xml.entries.length, 0) : undefined;
  };
  return out;
};
const linkOf = (n, id) => `https://mail.google.com/mail?account_id=user${n}@gmail.com&message_id=${id}&view=conv&extsrc=atom`;
// a clock that runs ms ahead of Gmail's (behind, when negative)
const shifted = ms => class extends Date {
  constructor(...a) {
    super(...(a.length ? a : [Date.now() + ms]));
  }
  static now() {
    return Date.now() + ms;
  }
};
// what Gmail answers a feed: 401 for an account that needs its password again, a status of an
// outage, or Google's sign-in page it sends the request to
const refuse = status => Promise.resolve({ok: false, status, url: 'x', text: async () => ''});
const signInPage = () => Promise.resolve({ok: true, status: 200, url: 'https://accounts.google.com/v3/signin/identifier?continue=x',
  text: async () => '<html><head><title>Sign in - Google Accounts</title></head><body></body></html>'});
const titles = b => b.session['cached-objects'].map(o => o.xml.title);

tests.push(
  // #1
  ['a network that fails keeps the badge, the panel and the resolved mail, and opens no sign-in tab', async () => {
    const b = boot({mail: {'0': [{id: 'a', age: 60}]}});
    await b.run();
    await b.Resolved.record([linkOf(0, 'a')], 15000);
    const before = {count: b.session.count, known: b.session['accounts.count']};
    b.offline = true;
    await b.run();
    assert.strictEqual(b.session.count, before.count);
    assert.strictEqual(b.session['cached-objects'].length, 1);
    assert.strictEqual(b.session[b.Resolved.KEY].length, 1);
    assert.strictEqual(b.session['accounts.count'], before.known);
    // forced, the way the panel's Check mail asks: the last state is shown again
    await b.run(true);
    assert.deepStrictEqual([b.opened, b.toasts], [[], []]);
    assert.strictEqual(b.session.count, 0, 'the resolved mail stays out of the count');
    assert.strictEqual(b.session['cached-objects'].length, 1);
  }],
  ['a browser that knows it is offline asks no feed', async () => {
    const b = boot({mail: {'0': [{id: 'a', age: 60}]}, online: false});
    await b.run(true);
    assert.strictEqual(b.requests, 0);
    assert.deepStrictEqual([b.opened, b.toasts], [[], []]);
  }],
  ['an outage of Gmail (503 on every feed) is no sign-out: the last state stays, no tab opens, a check comes again soon', async () => {
    const b = boot({mail: {'0': [{id: 'a', age: 60}], '1': [{id: 'b', age: 60}]}});
    await b.run();
    await b.Resolved.record([linkOf(0, 'a')], 15000);
    b.ctx.fetch = () => refuse(503);
    await b.run(true);
    assert.deepStrictEqual(titles(b), users(0, 1));
    assert.deepStrictEqual([b.session.count, b.session[b.Resolved.KEY].length, b.opened, b.toasts], [1, 1, [], []]);
    assert.ok(!b.icons.includes('blue'), 'the icon does not turn signed out');
    // 5, 15 and 30 seconds, then the regular period
    await b.run();
    await b.run();
    await b.run();
    assert.deepStrictEqual(b.resets.filter(([r]) => r === 'network.retry').map(([, ms]) => ms), [5000, 15000, 30000]);
  }],
  ['a rate limit (429) is no sign-out either', async () => {
    const b = boot({mail: {'0': [{id: 'a', age: 60}]}});
    await b.run();
    b.ctx.fetch = () => refuse(429);
    await b.run(true);
    assert.deepStrictEqual([titles(b), b.opened], [users(0), []]);
  }],
  ['an account that needs its password again is left out alone; the accounts after it stay', async () => {
    const mail = {'0': [{id: 'a'}], '1': [{id: 'b'}], '2': [{id: 'c'}], '3': [{id: 'd'}]};
    const b = boot({mail});
    const gmail = b.ctx.fetch;
    b.ctx.fetch = href => /u\/1\//.test(href) ? refuse(401) : gmail(href);
    await b.run();
    assert.deepStrictEqual(titles(b), users(0, 2, 3));
    assert.strictEqual(b.session['accounts.count'], 4, 'the next check still asks all four at once');
    assert.deepStrictEqual([b.told.length, b.opened], [1, []]);
    // Gmail sends two such accounts to Google's sign-in page: the same page twice is no repeated feed
    const c = boot({mail});
    c.ctx.fetch = href => /u\/[13]\//.test(href) ? signInPage() : gmail(href);
    await c.run();
    assert.deepStrictEqual(titles(c), users(0, 2));
  }],
  ['a signed-out Google account still counts as signed out', async () => {
    const b = boot({mail: {}, session: {count: 1}});
    b.ctx.fetch = () => Promise.resolve({ok: false, status: 401, url: 'https://mail.google.com/mail/u/0/feed/atom', text: async () => ''});
    await b.run(true);
    assert.strictEqual(b.session.count, -1);
    assert.strictEqual(b.opened.length, 1);
  }],
  // #2
  ['an Undo brings the mail back to the badge and the panel at once', async () => {
    const b = boot({mail: {'0': [{id: 'a', age: 60}]}});
    await b.run();
    assert.strictEqual(b.session.count, 1);
    await b.Resolved.record([linkOf(0, 'a')], 15000);
    await b.ctx.checkEmails.refresh();
    assert.deepStrictEqual([b.session.count, b.panel()], [0, 0]);
    await b.Resolved.forget([linkOf(0, 'a')]);
    await b.ctx.checkEmails.refresh();
    assert.deepStrictEqual([b.session.count, b.panel()], [1, 1]);
  }],
  ['mail waiting for its reminder stays out of the badge and the panel, and comes back when let go', async () => {
    const link = linkOf(0, 'a');
    const b = boot({mail: {'0': [{id: 'a', age: 60}, {id: 'b', age: 60}]}, local: {'remind.links': [{link, until: Date.now() + 3600000}]}});
    await b.run();
    assert.deepStrictEqual([b.session.count, b.panel()], [1, 1]);
    // what the panel reads when it opens: the cache with the hidden mail taken out
    const shown = b.Resolved.apply(b.Resolved.apply(b.session['cached-objects'], b.session[b.Resolved.KEY]),
      b.Remind.waiting(b.local['remind.links']));
    assert.strictEqual(shown[0].xml.entries.length, 1);
    assert.strictEqual((await b.ctx.checkEmails.visible())[0].xml.entries.length, 1);
    await b.Remind.remove([link]);
    await b.ctx.checkEmails.refresh();
    assert.deepStrictEqual([b.session.count, b.panel()], [2, 2]);
  }],
  // #3
  ['two label feeds of one account tell their new mail once', async () => {
    const b = boot({mail: {'0': [{id: 'i1'}], '0/work': [{id: 'w1'}]}, local: {feeds_0: 'inbox, work'}});
    for (let i = 0; i < 4; i += 1) {
      await b.run();
    }
    assert.strictEqual(b.told.length, 1);
    assert.deepStrictEqual(b.sounds, [2]);
  }],
  ['the mail an earlier version told is not told again', async () => {
    const b = boot({mail: {'0': [{id: 'i1'}]}, local: {'ids.account.user0@gmail.com': ['tag:gmail.google.com,2004:i1']}});
    await b.run();
    await b.run();
    assert.strictEqual(b.told.length, 0);
    assert.ok(Array.isArray(b.local['ids.box.user0@gmail.com']));
  }],
  ['a local storage that is full does not make the same mail be told at every check', async () => {
    const b = boot({mail: {'0': [{id: 'n', age: 1}]}});
    b.full = true;
    await b.run();
    await b.run();
    await b.run();
    assert.strictEqual(b.told.length, 1);
  }],
  ['the list of an earlier version\'s feed is read once, then the account keeps its own', async () => {
    const b = boot({mail: {'0': [{id: 'i1'}]}, local: {'ids.feed.https://mail.google.com/mail/u/0/feed/atom': ['tag:gmail.google.com,2004:i1']}});
    await b.run();
    assert.strictEqual(b.told.length, 0);
    assert.ok(Array.isArray(b.local['ids.box.user0@gmail.com']));
    assert.ok(!('ids.feed.https://mail.google.com/mail/u/0/feed/atom' in b.local));
  }],
  ['a mail in two watched labels is told once', async () => {
    const b = boot({mail: {'0': [{id: 'x'}], '0/work': [{id: 'x'}]}, local: {feeds_0: 'inbox, work'}});
    await b.run();
    assert.strictEqual(b.told.length, 1);
    assert.strictEqual(b.told[0].type, 'basic');
    assert.deepStrictEqual(b.sounds, [1]);
  }],
  // #4
  ['a forced check is quiet about mail that is not new', async () => {
    const b = boot({mail: {'0': [{id: 'a', age: 60}]}});
    await b.run();
    await b.run(true);
    await b.run(true);
    assert.deepStrictEqual([b.told.length, b.sounds], [0, []]);
    assert.strictEqual(b.session.count, 1);
    assert.strictEqual(b.panel(), 1);
  }],
  ['a forced check tells new mail', async () => {
    const b = boot({mail: {'0': [{id: 'a', age: 1}]}});
    await b.run(true);
    assert.deepStrictEqual([b.told.length, b.sounds], [1, [1]]);
  }],
  ['two checks started together tell new mail once', async () => {
    const b = boot({mail: {'0': [{id: 'a', age: 1}]}});
    await Promise.all([b.run(), b.run()]);
    assert.deepStrictEqual([b.told.length, b.sounds], [1, [1]]);
  }]
);

const where = b => b.session['cached-objects'].map(o => o.xml.title.replace('@gmail.com', '') + (o.xml.label ? '/' + o.xml.label : '') +
  '@' + /u\/(\d)/.exec(o.xml.rootLink)[1]);
tests.push(
  // the labels an account watches go with its address
  ['the labels an account watches follow it to another place in the browser', async () => {
    const mail = {'0': [{id: 'a', age: 60}], '1': [{id: 'b', age: 60}], '1/work': [{id: 'w', age: 60}], '2': [{id: 'c', age: 60}]};
    const b = boot({mail, local: {labels: {'user1@gmail.com': 'inbox, work'}}});
    await b.run();
    assert.deepStrictEqual(where(b), ['user0@0', 'user1@1', 'user1/work@1', 'user2@2']);
    // user0 signs out: user1 is at /u/0, user2 at /u/1; the check that finds it asks again
    b.places = [1, 2];
    const moving = b.requests;
    await b.run();
    assert.deepStrictEqual(where(b), ['user1@0', 'user1/work@0', 'user2@1']);
    // /u/0 inbox, /u/1 inbox and work, /u/2 and /u/3 at once; then /u/0 work: the inboxes are not asked twice
    assert.strictEqual(b.requests - moving, 6);
    // and the next one asks for each feed once
    const before = b.requests;
    await b.run();
    assert.deepStrictEqual(where(b), ['user1@0', 'user1/work@0', 'user2@1']);
    assert.strictEqual(b.requests - before, 4);
  }],
  ['a browser just started finds the labels of each account in its first check', async () => {
    const b = boot({mail: {'0': [{id: 'a', age: 60}], '1/work': [{id: 'w', age: 60}], '1': [{id: 'b', age: 60}]},
      local: {labels: {'user1@gmail.com': 'work'}}});
    await b.run();
    assert.deepStrictEqual(where(b), ['user0@0', 'user1/work@1']);
  }],
  ['an account that moves to another place does not tell its mail again', async () => {
    const mail = {'0': [{id: 'a'}], '1': [{id: 'b'}]};
    const b = boot({mail});
    await b.run();
    assert.strictEqual(b.told.length, 1);
    b.places = [1];
    await b.run();
    assert.strictEqual(b.told.length, 1);
  }],
  ['mail waiting for its reminder stays hidden after its account moves to another place', async () => {
    const mail = {'0': [{id: 'a', age: 60}], '1': [{id: 'b', age: 60}, {id: 'c', age: 60}]};
    // set from Gmail's search at /u/1, whose link names the place alone
    const link = 'https://mail.google.com/mail/u/1?message_id=b&view=conv&extsrc=atom';
    const b = boot({mail, local: {'remind.links': [{link, open: 'https://mail.google.com/mail/u/1/?shva=1#inbox/b', account: 'user1@gmail.com', until: Date.now() + 3600000}]}});
    await b.run();
    assert.strictEqual(b.panel(), 2);
    b.places = [1];
    await b.run();
    assert.deepStrictEqual([where(b), b.panel()], [['user1@0'], 1]);
    assert.strictEqual(await b.ctx.checkEmails.relink(b.local['remind.links'][0].open, 'user1@gmail.com'), 'https://mail.google.com/mail/u/0/?shva=1#inbox/b');
    assert.strictEqual(await b.ctx.checkEmails.relink(link, 'gone@gmail.com'), link);
  }],
  ['a label setting of a place (1.5 and before) moves to the address of the account there, once', async () => {
    const mail = {'0': [{id: 'a', age: 60}], '1': [{id: 'b', age: 60}], '1/work': [{id: 'w', age: 60}], '2': [{id: 'c', age: 60}]};
    const b = boot({mail, local: {feeds_1: 'inbox, work', feeds_4: 'news'}});
    await b.run();
    assert.deepStrictEqual(where(b), ['user0@0', 'user1@1', 'user1/work@1', 'user2@2']);
    assert.deepStrictEqual(b.local.labels, {'user1@gmail.com': 'inbox, work'});
    assert.ok(!('feeds_1' in b.local), 'the place\'s setting goes');
    assert.strictEqual(b.local.feeds_4, 'news', 'a place nobody is at keeps its setting for whoever signs in there');
    // the check's own move asks for no check; a change in the settings does
    await b.change({labels: {newValue: b.local.labels}});
    assert.deepStrictEqual(b.resets, []);
    await b.change({labels: {newValue: {'user1@gmail.com': 'work'}}});
    assert.deepStrictEqual(b.resets.map(([r]) => r), ['change.of.feeds']);
    b.places = [1, 2];
    await b.run();
    assert.deepStrictEqual(where(b), ['user1@0', 'user1/work@0', 'user2@1']);
  }],
  // a feed that does not answer this once
  ['a feed that does not answer shows its last answer: the account, its count and its resolved mail stay', async () => {
    const mail = {'0': [{id: 'a', age: 60}], '1': [{id: 'b', age: 60}, {id: 'c', age: 60}]};
    const b = boot({mail});
    await b.run();
    await b.Resolved.record([linkOf(1, 'b')], 15000);
    const gmail = b.ctx.fetch;
    b.ctx.fetch = href => /u\/1\//.test(href) ? Promise.reject(Error('TIMEOUT')) : gmail(href);
    await b.run();
    assert.deepStrictEqual(titles(b), users(0, 1));
    assert.deepStrictEqual([b.session.count, b.session[b.Resolved.KEY].length, b.told.length], [2, 1, 0]);
    // Gmail answers 500 the next time: the same
    b.ctx.fetch = href => /u\/1\//.test(href) ? refuse(500) : gmail(href);
    await b.run();
    assert.deepStrictEqual([titles(b), b.session.count], [users(0, 1), 2]);
  }],
  ['a last answer older than ten minutes is not shown', async () => {
    const b = boot({mail: {'0': [{id: 'a', age: 60}], '1': [{id: 'b', age: 60}]}});
    await b.run();
    // the last answer of user1 came eleven minutes ago, by Gmail's clock
    b.session['cached-objects'][1].xml.modified = new Date(Date.now() - 11 * 60000).toISOString();
    b.ctx.checkEmails.cached = null;
    const gmail = b.ctx.fetch;
    b.ctx.fetch = href => /u\/1\//.test(href) ? Promise.reject(Error('TIMEOUT')) : gmail(href);
    await b.run();
    assert.deepStrictEqual(titles(b), users(0));
  }],
  ['the last answer of a place another account has taken is not shown', async () => {
    const b = boot({mail: {'0': [{id: 'a', age: 60}], '1': [{id: 'b', age: 60}], '1/work': [{id: 'w', age: 60}], '2': [{id: 'c', age: 60}]},
      local: {feeds_1: 'inbox, work'}});
    await b.run();
    assert.deepStrictEqual(titles(b), users(0, 1, 1, 2));
    // user1 signs out: user2 is at /u/1 now, and the feed of user1's label there does not answer
    const gmail = b.ctx.fetch;
    b.ctx.fetch = href => {
      if (/u\/1\/feed\/atom\/work/.test(href)) {
        return Promise.reject(Error('TIMEOUT'));
      }
      if (/u\/1\/feed\/atom\?/.test(href)) {
        return gmail('https://mail.google.com/mail/u/2/feed/atom').then(async r => {
          const text = (await r.text()).replace(/mail\/u\/2/g, 'mail/u/1');
          return {...r, url: href, text: async () => text};
        });
      }
      return /u\/2\//.test(href) ? gmail('https://mail.google.com/mail/u/0/feed/atom').then(r => ({...r, url: 'https://mail.google.com/mail/u/0/feed/atom'})) : gmail(href);
    };
    await b.run();
    assert.deepStrictEqual(titles(b), users(0, 2));
  }],
  // the computer's clock against Gmail's
  ['a clock a quarter of an hour ahead of Gmail\'s still tells new mail', async () => {
    const b = boot({mail: {'0': [{id: 'n', age: 1}, {id: 'o', age: 60}]}});
    b.ctx.Date = shifted(15 * 60000);
    await b.run();
    assert.deepStrictEqual([b.told.length, b.sounds], [1, [1]]);
  }],
  ['a clock behind Gmail\'s keeps archived mail hidden while the feed still lists it', async () => {
    for (const skew of [-60000, -5 * 60000, 3 * 60000]) {
      const b = boot({mail: {'0': [{id: 'a', age: 60}, {id: 'b', age: 60}]}});
      b.ctx.Date = shifted(skew);
      await b.run();
      await b.Resolved.record([linkOf(0, 'a')]);
      await b.run();
      assert.deepStrictEqual([b.panel(), b.session[b.Resolved.KEY].length], [1, 1], 'skew ' + skew);
    }
  }],
  ['"new" in the count is the mail since the panel opened by Gmail\'s clock', async () => {
    // the panel opened 30 minutes ago by a clock an hour ahead: by Gmail's, 30 minutes ago too; the
    // mail of 20 minutes ago counts, the one of 45 does not
    const b = boot({mail: {'0': [{id: 'a', age: 20}, {id: 'b', age: 45}]}, local: {'badge.count': 'new'}});
    b.ctx.Date = shifted(60 * 60000);
    b.local['badge.seen'] = Date.now() + 60 * 60000 - 30 * 60000;
    await b.run();
    assert.strictEqual(b.badges.at(-1), 1);
  }]
);

tests.push(
  // the inbox a notification is about
  ['a notification about one inbox is titled with its address; [account] fills in', async () => {
    const b = boot({mail: {'0': [{id: 'a'}]}, local: {notificationFormat: '[account]|[author_email]'}});
    await b.run();
    assert.strictEqual(b.told.length, 1);
    assert.strictEqual(b.told[0].title, 'user0@gmail.com');
    assert.strictEqual(b.told[0].message, 'user0@gmail.com|a@x.com');
  }],
  ['a notification about several inboxes keeps the extension\'s name', async () => {
    const b = boot({mail: {'0': [{id: 'a'}], '1': [{id: 'b'}]}, local: {notificationFormat: '[account]'}});
    await b.run();
    assert.strictEqual(b.told.length, 1);
    assert.strictEqual(b.told[0].title, 'x');
    assert.deepStrictEqual([...b.told[0].items.map(i => i.message)].sort(), users(0, 1));
  }],
  // an inbox left out of the count
  ['an inbox left out of the count stays in the panel but leaves the badge', async () => {
    const b = boot({mail: {'0': [{id: 'a', age: 60}], '1': [{id: 'b', age: 60}]}, local: {accounts: {'user1@gmail.com': {uncounted: true}}}});
    await b.run();
    assert.deepStrictEqual([b.session.count, b.badges.at(-1), b.panel()], [1, 1, 2]);
    await b.ctx.checkEmails.refresh();
    assert.deepStrictEqual([b.session.count, b.badges.at(-1)], [1, 1]);
  }],
  ['by default every inbox counts', async () => {
    const b = boot({mail: {'0': [{id: 'a', age: 60}], '1': [{id: 'b', age: 60}]}});
    await b.run();
    assert.deepStrictEqual([b.session.count, b.badges.at(-1)], [2, 2]);
  }],
  ['new mail of an inbox out of the count is told, and the icon does not blink for it', async () => {
    const b = boot({mail: {'0': [{id: 'a', age: 60}], '1': [{id: 'b', age: 1}]}, local: {accounts: {'user1@gmail.com': {uncounted: true}}}});
    await b.run();
    assert.strictEqual(b.told.length, 1);
    assert.deepStrictEqual([b.icons.at(-1), b.badges.at(-1)], ['red', 1]);
  }],
  // the count of the mail since the panel was last opened
  ['"new" counts only the mail since the panel was last opened; the true total stays', async () => {
    const mail = {'0': [{id: 'a', age: 60}, {id: 'b', age: 60}]};
    const b = boot({mail, local: {'badge.count': 'new', 'badge.seen': Date.now() - 30 * 60000}});
    await b.run();
    assert.deepStrictEqual([b.session.count, b.badges.at(-1), b.icons.at(-1)], [2, 0, 'red']);
    mail['0'].push({id: 'c', age: 1});
    await b.run();
    assert.deepStrictEqual([b.session.count, b.badges.at(-1)], [3, 1]);
  }],
  ['opening the panel draws the number again', async () => {
    const b = boot({mail: {'0': [{id: 'a', age: 60}]}, local: {'badge.count': 'new', 'badge.seen': Date.now() - 90 * 60000}});
    await b.run();
    assert.strictEqual(b.badges.at(-1), 1);
    b.local['badge.seen'] = Date.now();
    await b.change({'badge.seen': {newValue: b.local['badge.seen']}});
    assert.deepStrictEqual([b.badges.at(-1), b.session.count], [0, 1]);
  }],
  ['switching the count to "new" counts from now on', async () => {
    const b = boot({mail: {'0': [{id: 'a', age: 60}]}});
    await b.run();
    assert.strictEqual(b.badges.at(-1), 1);
    b.local['badge.count'] = 'new';
    await b.change({'badge.count': {newValue: 'new'}});
    assert.ok(Math.abs(b.local['badge.seen'] - Date.now()) < 5000);
    await b.change({'badge.seen': {newValue: b.local['badge.seen']}});
    assert.strictEqual(b.badges.at(-1), 0);
  }],
  // a notification repeated while its mail is unread
  ['a repeated notification comes back, with its sound, while its mail is unread', async () => {
    const b = boot({mail: {'0': [{id: 'a'}]}, local: {'notify.repeat': 5}});
    await b.run();
    assert.strictEqual(b.told.length, 1);
    assert.ok(b.alarms['repeat.notify'].when > Date.now() + 4 * 60000);
    delete b.alarms['repeat.notify'];
    await b.fire('repeat.notify');
    assert.strictEqual(b.told.length, 2);
    assert.strictEqual(b.told[1].title, 'user0@gmail.com');
    assert.deepStrictEqual(b.sounds, [1, 1]);
    assert.ok(b.alarms['repeat.notify'].when > Date.now() + 4 * 60000, 'and comes back again');
  }],
  ['a repeat ends once its mail is read', async () => {
    const b = boot({mail: {'0': [{id: 'a'}]}, local: {'notify.repeat': 5}});
    await b.run();
    await b.Resolved.record([linkOf(0, 'a')], 60000);
    delete b.alarms['repeat.notify'];
    await b.fire('repeat.notify');
    assert.strictEqual(b.told.length, 1);
    assert.ok(!('repeat.report' in b.session) && !b.alarms['repeat.notify']);
  }],
  ['a repeat ends once Gmail no longer lists the mail', async () => {
    const mail = {'0': [{id: 'a'}]};
    const b = boot({mail, local: {'notify.repeat': 5}});
    await b.run();
    mail['0'] = [];
    await b.run();
    delete b.alarms['repeat.notify'];
    await b.fire('repeat.notify');
    assert.strictEqual(b.told.length, 1);
    assert.ok(!('repeat.report' in b.session) && !b.alarms['repeat.notify']);
  }],
  ['quiet hours hold a repeat back without ending it', async () => {
    const b = boot({mail: {'0': [{id: 'a'}]}, local: {'notify.repeat': 5}});
    await b.run();
    // a window around the present hour, whatever the time of day (it may cross midnight)
    const hh = n => String((new Date().getHours() + n + 24) % 24).padStart(2, '0') + ':00';
    Object.assign(b.local, {'quiet.hours': true, 'quiet.from': hh(-1), 'quiet.to': hh(2)});
    delete b.alarms['repeat.notify'];
    await b.fire('repeat.notify');
    assert.deepStrictEqual([b.told.length, b.sounds], [1, [1]]);
    assert.ok(b.alarms['repeat.notify'] && b.session['repeat.report']);
  }],
  ['a notification is not repeated by default, nor once repeating is switched off', async () => {
    const b = boot({mail: {'0': [{id: 'a'}]}});
    await b.run();
    assert.strictEqual(b.told.length, 1);
    assert.ok(!b.alarms['repeat.notify'] && !('repeat.report' in b.session));
    const on = boot({mail: {'0': [{id: 'a'}]}, local: {'notify.repeat': 5}});
    await on.run();
    on.local['notify.repeat'] = 0;
    await on.fire('repeat.notify');
    assert.strictEqual(on.told.length, 1);
    assert.ok(!('repeat.report' in on.session));
  }]
);

/*
 * core/repeater.js and core/watch.js against a fake Chrome that keeps what is asked of it:
 * the alarms, the listeners, the checks run. Its alarms never fire by themselves.
 */
const timers = ({local = {}, file}) => {
  const out = {alarms: {}, listeners: {}, checks: [], resets: []};
  const on = name => ({addListener: fn => (out.listeners[name] = out.listeners[name] || []).push(fn), removeListener() {}});
  const chrome = {
    storage: {
      local: {get: (d, cb) => {
        const o = {};
        for (const k in d) {
          o[k] = k in local ? local[k] : d[k];
        }
        cb && cb(o);
        return Promise.resolve(o);
      }},
      onChanged: on('storage')
    },
    // the events of chrome.alarms have nothing but their listeners
    alarms: {
      get: async name => out.alarms[name],
      create: (name, o) => out.alarms[name] = {name, scheduledTime: o.when, periodInMinutes: o.periodInMinutes},
      onAlarm: on('alarm')
    },
    runtime: {onStartup: on('startup'), onInstalled: on('installed')},
    idle: {onStateChanged: on('idle'), setDetectionInterval() {}},
    webRequest: {onCompleted: on('webRequest')}
  };
  const ctx = {chrome, setTimeout, clearTimeout, Date, Promise, isNaN, log() {}, out,
    checkEmails: {execute: forced => out.checks.push(forced)}};
  vm.createContext(ctx);
  if (file === '/core/watch.js') {
    vm.runInContext('var repeater = {reset: (reason, delay) => out.resets.push(reason)};', ctx);
  }
  vm.runInContext(fs.readFileSync(EXT + file, 'utf8'), ctx, {filename: file});
  out.repeater = file === '/core/repeater.js' ? vm.runInContext('repeater', ctx) : undefined;
  return out;
};

tests.push(
  // #7
  ['"right away" checks right away, and an alarm of it runs a check', async () => {
    const t = timers({local: {initialPeriod: 0}, file: '/core/repeater.js'});
    t.listeners.startup[0]();
    await wait(400);
    assert.deepStrictEqual(t.checks, [false]);
    t.listeners.alarm.forEach(fn => fn({name: 'repeater'}));
    assert.deepStrictEqual(t.checks, [false, false]);
  }],
  // #5
  ['a check asked for within seconds runs from a timer, once, and forced when asked so', async () => {
    const t = timers({file: '/core/repeater.js'});
    t.repeater.reset('popup.forced');
    t.repeater.reset('webrequest', 1000);
    await wait(50);
    // the alarm stays as the fallback, after the timer
    assert.ok(t.alarms.repeater.scheduledTime - Date.now() > 900, 'the alarm comes after the timer');
    await wait(1200);
    assert.deepStrictEqual(t.checks, [true]);
    // the regular check is counted from the one that ran
    assert.ok(t.alarms.repeater.scheduledTime - Date.now() > 100000);
  }],
  // #6
  ['the idle listener is there at once and follows its setting', async () => {
    const t = timers({file: '/core/repeater.js'});
    assert.strictEqual(t.listeners.idle.length, 1);
    await t.listeners.idle[0]('active');
    await wait(300);
    assert.deepStrictEqual(t.checks, [false]);
    const off = timers({local: {'idle.watch': false}, file: '/core/repeater.js'});
    await off.listeners.idle[0]('active');
    await wait(300);
    assert.deepStrictEqual(off.checks, []);
  }],
  ['a label setting changed asks for a check; one the background moved to an address does not', async () => {
    const t = timers({file: '/core/repeater.js'});
    t.listeners.storage[0]({feeds_1: {oldValue: 'work'}});
    await wait(50);
    assert.ok(!t.alarms.repeater);
    t.listeners.storage[0]({feeds_custom: {newValue: 'https://mail.google.com/a/x.com/feed/atom'}});
    await wait(50);
    assert.ok(t.alarms.repeater);
  }],
  // #8, #6
  ['a Gmail tab asks for a check, the extension\'s own requests do not', async () => {
    const t = timers({file: '/core/watch.js'});
    assert.strictEqual(t.listeners.webRequest.length, 1);
    const post = tabId => t.listeners.webRequest[0]({tabId, type: 'xmlhttprequest', method: 'POST', url: 'https://mail.google.com/mail/u/0/s/?v=or&ik=1'});
    await post(-1);
    assert.deepStrictEqual(t.resets, []);
    await post(7);
    assert.deepStrictEqual(t.resets, ['webrequest']);
    const off = timers({local: {'network.watch': false}, file: '/core/watch.js'});
    await off.listeners.webRequest[0]({tabId: 7, type: 'main_frame', method: 'GET', url: 'https://mail.google.com/mail/u/0/'});
    assert.deepStrictEqual(off.resets, []);
  }]
);

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
