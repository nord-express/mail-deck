// worker.js, the background's messages, against a fake Chrome: an action and its Undo window,
// one that outlives the worker, the mail of a search hidden with its feed's copy, and an action
// done in one account and not in another (time runs a hundred times faster there); where a
// mail opens with no tab or window (core/open.js); an offscreen document that never answers.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const EXT = path.join(__dirname, '../../extension');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const FAST = 100;

// the feed's link of a mail, and the link Gmail's search gives the same mail
const feedLink = (n, id) => `https://mail.google.com/mail/u/${n}?account_id=user${n}@gmail.com&message_id=${id}&view=conv&extsrc=atom`;
const searchLink = (n, id) => `https://mail.google.com/mail/u/${n}?message_id=${id}&view=conv&extsrc=atom`;

// local: what the local storage holds when the worker starts; fails: the links Gmail refuses;
// heads: a mail's header as the offscreen document reads it, by link; posts: the requests sent
// to a sender, which fail with postFails
const start = ({local = {}, session = {}, fails = [], heads = {}, postFails = false} = {}) => {
  const copy = o => o === undefined ? o : JSON.parse(JSON.stringify(o));
  const area = store => ({
    get: async d => {
      const keys = typeof d === 'string' ? {[d]: undefined} : d;
      const o = {};
      for (const k in keys) {
        if (k in store) {
          o[k] = copy(store[k]);
        }
        else if (keys[k] !== undefined) {
          o[k] = keys[k];
        }
      }
      return o;
    },
    set: async o => Object.assign(store, copy(o)),
    remove: async k => [].concat(k).forEach(k => delete store[k])
  });
  const out = {local, session, dispatched: [], toasts: [], alarms: {}, listeners: [], refreshed: 0, posts: [], asked: []};
  const chrome = {
    i18n: {getMessage: () => 'x', getUILanguage: () => 'en'},
    runtime: {onMessage: {addListener: fn => out.listeners.push(fn)}, onInstalled: {addListener() {}}, getManifest: () => ({})},
    action: {onClicked: {addListener() {}}},
    notifications: {create: (o, cb) => out.toasts.push(o.message)},
    storage: {local: area(local), session: area(session)},
    alarms: {create: (name, o) => out.alarms[name] = o, clear: async name => delete out.alarms[name]},
    cookies: {get() {}},
    tabs: {create() {}}
  };
  const ctx = {chrome, console: {log() {}, info() {}, warn() {}, error() {}}, Date, Promise, Map, Set, JSON, out, AbortSignal,
    setTimeout: (fn, ms, ...args) => setTimeout(fn, ms / FAST, ...args), clearTimeout,
    fetch: async (url, o) => {
      out.posts.push({url, ...o, signal: Boolean(o.signal)});
      if (postFails) {
        throw TypeError('Failed to fetch');
      }
      return {type: 'opaque', status: 0, ok: false};
    }};
  ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(EXT + '/core/utils/resolved.js', 'utf8'), ctx, {filename: 'resolved.js'});
  // what the check knows: the feed's copy of a mail, found by its account and thread
  ctx.checkEmails = {
    same: async links => links.map(link => /u\/(\d+)\?message_id=([^&]+)/.exec(link)).filter(Boolean).map(([, n, id]) => feedLink(n, id)),
    refresh: async () => out.refreshed++,
    opened() {}
  };
  ctx.Services = {dispatch: async request => {
    out.dispatched.push(copy({cmd: request.cmd, links: request.links}));
    const failed = request.links.filter(link => fails.includes(link));
    return failed.length ? {message: 'refused', failed} : true;
  }};
  vm.runInContext('var repeater = {reset() {}}; var sound = {}; var offscreen = {}; self.openLink = () => {};', ctx);
  vm.runInContext('offscreen', ctx).command = async ({cmd, request}) => {
    out.asked.push(cmd);
    return cmd === 'gmail.headers' ? copy(heads[request.link]) || {message: 'core.js -> headers -> not read'} : {};
  };
  vm.runInContext(fs.readFileSync(EXT + '/worker.js', 'utf8'), ctx, {filename: 'worker.js'});
  // a message from the panel; its answer, once the worker gives one
  out.send = request => new Promise(resolve => {
    let kept = false;
    for (const fn of out.listeners) {
      kept = fn(copy(request), {}, value => resolve({value: copy(value)})) === true || kept;
    }
    if (!kept) {
      resolve({none: true});
    }
  });
  out.hidden = () => (session['resolved.links'] || []).map(o => o.link).sort();
  return out;
};

const tests = [
  ['an action waits out its Undo window, then goes; its mail and the feed\'s copy leave the badge at once', async () => {
    const w = start();
    const link = searchLink(1, 't1');
    const answer = w.send({method: 'gmail.action', cmd: 'rc_^i', links: [link], id: 'a', delay: 5000});
    await wait(5);
    assert.deepStrictEqual(w.hidden(), [feedLink(1, 't1'), link].sort());
    assert.deepStrictEqual(w.local['actions.pending'].map(o => o.id), ['a']);
    assert.deepStrictEqual(w.dispatched, []);
    assert.deepStrictEqual(await answer, {value: undefined});
    assert.deepStrictEqual(w.dispatched, [{cmd: 'rc_^i', links: [link]}]);
    assert.deepStrictEqual(w.local['actions.pending'], []);
    assert.ok(!w.alarms['actions.pending']);
  }],
  ['an Undo stops it: nothing reaches Gmail and the mail shows again', async () => {
    const w = start();
    const answer = w.send({method: 'gmail.action', cmd: 'tr', links: [searchLink(0, 't2')], id: 'b', delay: 5000});
    await wait(5);
    await w.send({method: 'gmail.action.cancel', id: 'b'});
    await answer;
    await wait(80);
    assert.deepStrictEqual([w.dispatched, w.hidden(), w.local['actions.pending']], [[], [], []]);
  }],
  ['an action the browser quit in the middle of goes once the worker starts again', async () => {
    const link = feedLink(0, 't3');
    const w = start({local: {'actions.pending': [{id: 'c', cmd: 'rc_^i', links: [link], due: Date.now() - 1000}]}});
    await wait(5);
    assert.deepStrictEqual(w.hidden(), [link], 'it stays out of the badge meanwhile');
    await wait(60);
    assert.deepStrictEqual(w.dispatched, [{cmd: 'rc_^i', links: [link]}]);
    assert.deepStrictEqual(w.local['actions.pending'], []);
  }],
  ['an Undo that reaches a worker just started still stops the action', async () => {
    const w = start({local: {'actions.pending': [{id: 'd', cmd: 'tr', links: [feedLink(0, 't4')], due: Date.now() + 4000}]}});
    await wait(5);
    await w.send({method: 'gmail.action.cancel', id: 'd'});
    await wait(80);
    assert.deepStrictEqual([w.dispatched, w.local['actions.pending'], w.hidden()], [[], [], []]);
  }],
  ['an action done in one account and refused in another: only the refused mail shows again, and the panel is told which', async () => {
    const a = feedLink(0, 'a1');
    const b = searchLink(2, 'b1');
    const w = start({fails: [b]});
    const answer = await w.send({method: 'gmail.action', cmd: 'rd', links: [a, b]});
    assert.deepStrictEqual(answer.value.failed, [b]);
    assert.deepStrictEqual(w.hidden(), [a]);
    assert.strictEqual(w.toasts.length, 1);
  }],
  ['the mail read on opening it from a search leaves the feed\'s copy too', async () => {
    const w = start();
    await w.send({method: 'gmail.action', cmd: 'rd', links: [searchLink(3, 'r1')]});
    assert.deepStrictEqual(w.hidden(), [feedLink(3, 'r1'), searchLink(3, 'r1')].sort());
  }],
  ['a star changes no count', async () => {
    const w = start();
    await w.send({method: 'gmail.action', cmd: 'st', links: [feedLink(0, 's1')]});
    assert.deepStrictEqual([w.dispatched.length, w.hidden()], [1, []]);
  }],
  ['one click: the background posts RFC 8058\'s request to the header\'s own address, with nothing of the browser', async () => {
    const link = feedLink(0, 'n1');
    const w = start({heads: {[link]: {messageId: 'm@x', unsubscribe: {post: 'https://news.example/one?u=1', web: 'https://news.example/one?u=1', mailto: null}}}});
    assert.deepStrictEqual((await w.send({method: 'gmail.headers', link})).value.unsubscribe.post, 'https://news.example/one?u=1');
    assert.deepStrictEqual((await w.send({method: 'gmail.unsubscribe', link, url: 'https://evil.example/'})).value, {sent: true});
    assert.deepStrictEqual(JSON.parse(JSON.stringify(w.posts)), [{url: 'https://news.example/one?u=1', method: 'POST', mode: 'no-cors', credentials: 'omit', redirect: 'follow',
      referrerPolicy: 'no-referrer', cache: 'no-store', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: 'List-Unsubscribe=One-Click', signal: true}]);
    // the header is read once for the menu and the click
    assert.deepStrictEqual(w.asked, ['gmail.headers']);
  }],
  ['no one-click without its header; a request that fails says so', async () => {
    const link = feedLink(0, 'n2');
    const w = start({heads: {[link]: {messageId: '', unsubscribe: {post: null, web: 'https://x.example/u', mailto: null}}}});
    assert.ok((await w.send({method: 'gmail.unsubscribe', link})).value.message);
    assert.ok((await w.send({method: 'gmail.unsubscribe', link: feedLink(0, 'none')})).value.message);
    assert.deepStrictEqual(w.posts, []);
    const f = start({postFails: true, heads: {[link]: {unsubscribe: {post: 'https://x.example/one'}}}});
    assert.strictEqual((await f.send({method: 'gmail.unsubscribe', link})).value.message, 'Failed to fetch');
  }]
];

// core/open.js against a browser with the windows given ({tabs}: those of the current window)
const opener = ({tabs = [], windows = true, prefs = {}} = {}) => {
  const out = {created: [], windows: [], updated: []};
  const chrome = {
    storage: {local: {get: (d, cb) => cb({...d, ...prefs})}},
    tabs: {
      query: (o, cb) => cb(o.active ? tabs.filter(t => t.active) : tabs),
      update: (id, o) => out.updated.push([id, o.url]),
      create: async o => {
        if (!windows) {
          throw Error('No current window');
        }
        out.created.push(o);
      }
    },
    windows: {create: async o => out.windows.push(o.type ? o : o.url), update() {}, getCurrent: async () => ({}),
      getLastFocused: async () => windows === true ? {left: 100, top: 50, width: 1440, height: 900, state: 'normal'} : Promise.reject(Error('none'))},
    i18n: {getMessage: () => 'x'}
  };
  const ctx = {chrome, URL, Promise, console, toast() {}};
  ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(EXT + '/core/open.js', 'utf8'), ctx, {filename: 'open.js'});
  out.open = url => (ctx.openLink(url), wait(10));
  return out;
};
const mail = 'https://mail.google.com/mail/u/0/?shva=1#inbox/t1';
tests.push(
  ['a mail opens with no tab active: in a new tab, "in the current tab" and "next to it" too', async () => {
    for (const prefs of [{}, {currentTab: true}, {relatedToCurrent: true}]) {
      const o = opener({prefs});
      await o.open(mail);
      assert.deepStrictEqual(o.created.map(c => c.url), [mail], JSON.stringify(prefs));
    }
    // and next to the active tab when there is one
    const o = opener({tabs: [{id: 3, index: 4, active: true, url: 'https://example.com/'}], prefs: {relatedToCurrent: true}});
    await o.open(mail);
    assert.strictEqual(o.created[0].index, 5);
  }],
  ['a mail opens with no window at all, in a window of its own', async () => {
    const o = opener({windows: false});
    await o.open(mail);
    assert.deepStrictEqual(o.windows, [mail]);
  }],
  ['Gmail\'s compose window opens small, over the window in front, without tabs; the setting keeps it in a tab', async () => {
    const compose = 'https://mail.google.com/mail/u/1/?view=cm&fs=1&to=a%40b.c&su=Re%3A%20x';
    const o = opener({tabs: [{id: 3, index: 0, active: true, url: 'https://mail.google.com/mail/u/1/#inbox'}]});
    await o.open(compose);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(o.windows)), [{url: compose, type: 'popup', focused: true, width: 720, height: 640, left: 460, top: 137}]);
    assert.deepStrictEqual([o.created, o.updated], [[], []]);
    // the context menu's compose too
    const menu = opener();
    await menu.open('https://mail.google.com/mail/?ui=2&view=cm');
    assert.strictEqual(menu.windows[0].type, 'popup');
    // a tab, as before
    const tab = opener({prefs: {'compose.popup': false}});
    await tab.open(compose);
    assert.deepStrictEqual([tab.windows, tab.created.map(c => c.url)], [[], [compose]]);
    // a mail is no compose window
    const read = opener();
    await read.open(mail);
    assert.deepStrictEqual([read.windows, read.created.map(c => c.url)], [[], [mail]]);
  }]
);

// core/offscreen.js: a document that never answers gives the command an error in time
tests.push(['a command the offscreen document never answers fails in time', async () => {
  const chrome = {
    runtime: {getContexts: async () => [{}], sendMessage() {}, onMessage: {addListener() {}}, lastError: null},
    offscreen: {}
  };
  const ctx = {chrome, setTimeout, clearTimeout, Promise, log() {}};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(EXT + '/core/offscreen.js', 'utf8') + ';offscreen.WAIT = 50;', ctx, {filename: 'offscreen.js'});
  const r = await vm.runInContext('offscreen', ctx).command({cmd: 'gmail.action', request: {}});
  assert.ok(r.message);
  assert.strictEqual(vm.runInContext('offscreen.pending', ctx), 0);
}]);

// core/remind.js: the list has one writer, so a reminder set while another rings stays
tests.push(['a reminder set while another one rings is kept, and the one that rang opens at its account\'s place now', async () => {
  const local = {'remind.links': [{link: feedLink(1, 'old'), open: 'https://mail.google.com/mail/u/1/?shva=1#inbox/old', account: 'user1@gmail.com', until: Date.now() - 1000}]};
  const session = {};
  const store = area => ({
    // as slow as a real one, so the ring and the message meet
    get: async d => (await wait(5), JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(typeof d === 'string' ? {[d]: undefined} : d || {})
      .map(([k, v]) => [k, k in area ? area[k] : v]))))),
    set: async o => (await wait(5), Object.assign(area, JSON.parse(JSON.stringify(o)))),
    remove: async k => [].concat(k).forEach(k => delete area[k])
  });
  const fns = {alarm: [], message: []};
  const chrome = {
    storage: {local: store(local), session: {...store(session), get: async () => ({})}, onChanged: {addListener() {}}},
    alarms: {create() {}, clear() {}, onAlarm: {addListener: fn => fns.alarm.push(fn)}},
    notifications: {getAll: cb => cb({}), create() {}, onClicked: {addListener() {}}},
    runtime: {onMessage: {addListener: fn => fns.message.push(fn)}},
    i18n: {getMessage: () => 'x'}
  };
  const ctx = {chrome, Date, Promise, Math, JSON, setTimeout, console, repeater: {reset() {}},
    checkEmails: {relink: async link => link.replace('/u/1', '/u/0')}};
  ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(EXT + '/core/utils/remind.js', 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(EXT + '/core/remind.js', 'utf8'), ctx);
  fns.alarm.forEach(fn => fn({name: 'remind'}));
  await new Promise(resolve => fns.message.forEach(fn => fn({method: 'remind.add', items: [{link: feedLink(0, 'new')}], until: Date.now() + 3600000}, {}, resolve)));
  await wait(50);
  assert.deepStrictEqual(local['remind.links'].map(o => o.link), [feedLink(0, 'new')]);
  assert.deepStrictEqual(Object.values(session).map(o => o.open), ['https://mail.google.com/mail/u/0/?shva=1#inbox/old']);
}]);

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
