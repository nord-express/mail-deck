// The settings page's own logic (extension/data/settings/index.js) in node: what a backup may
// bring, where an account's labels go, which services keep their sites, the quiet hours'
// times, and the AI card: its engine, a provider's key, Chrome's access and the models. The page
// runs in a vm with a small document and chrome.*; nothing is drawn. The AI module
// (data/ai/ai.js, tested on its own) is replaced by a stub that writes down what it is asked.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const EXT = path.join(__dirname, '../../extension');
const en = JSON.parse(fs.readFileSync(path.join(EXT, '_locales/en/messages.json'), 'utf8'));

// a document just big enough for the page to start: elements by id, and the listeners it adds
const elements = new Map();
const element = id => {
  if (!elements.has(id)) {
    elements.set(id, {
      id, hidden: false, value: '', checked: false, dataset: {}, style: {setProperty() {}},
      classList: {add() {}, remove() {}, toggle() {}},
      setAttribute(name, value) {
        (this.attrs ||= {})[name] = String(value);
      },
      getAttribute(name) {
        return this.attrs?.[name] ?? null;
      },
      removeAttribute() {}, add() {}, click() {}, scrollIntoView() {},
      focus() {
        focused = this.id;
      },
      // what the page puts in an element, for the checks that look
      append(...kids) {
        this.kids = [...(this.kids || []), ...kids];
      },
      replaceChildren(...kids) {
        this.kids = kids;
      },
      querySelector: () => element('(query)'), querySelectorAll: () => []
    });
  }
  return elements.get(id);
};
const listeners = {};
let made = 0;
// the element focused last
let focused = null;
const document = {
  getElementById: element,
  querySelector: () => element('(query)'),
  querySelectorAll: () => [],
  addEventListener: (type, fn) => listeners[type] = fn,
  createElement: () => element('(new ' + (made += 1) + ')'),
  documentElement: {},
  body: {dataset: {}}
};

// chrome.*: storage in plain objects, what the page asks of Chrome written down
const local = {};
let session = {'cached-objects': []};
const set = [];
const removed = [];
const forgotten = [];
const synced = [];
// the AI providers' sites: given only when a check gives them; every other site is given
const AI_SITES = ['https://api.openai.com/*', 'https://api.anthropic.com/*', 'https://api.z.ai/*', 'https://auth.openai.com/*', 'http://127.0.0.1/*'];
const PLAN_SITES = ['https://api.openai.com/*', 'https://auth.openai.com/*'];
const granted = new Set();
const requested = [];
let grant = true;
const store = {
  // the page's own start waits for this forever: the checks below call its parts one by one
  get: () => new Promise(() => {}),
  set: async values => {
    set.push(values);
    Object.assign(local, values);
  },
  remove: async keys => {
    for (const k of [keys].flat()) {
      forgotten.push(k);
      delete local[k];
    }
  }
};
const chrome = {
  i18n: {
    getMessage: (key, subs = []) => (en[key]?.message || '').replace(/\$(\d)/g, (_, i) => subs[i - 1] ?? ''),
    getUILanguage: () => 'en'
  },
  storage: {
    local: store,
    session: {get: async defaults => ({...defaults, ...session})},
    sync: {get: async () => ({}), set: async values => {
      synced.push(values);
    }, remove: async () => {}},
    onChanged: {addListener() {}}
  },
  permissions: {
    contains: async ({origins}) => origins.every(o => !AI_SITES.includes(o) || granted.has(o)),
    // written down as it is asked, before anything is awaited: that is what Chrome takes as the click's
    request: async ({origins}) => {
      requested.push(origins);
      if (grant) {
        origins.forEach(o => granted.add(o));
      }
      return grant;
    },
    remove: async ({origins}) => {
      removed.push(...origins);
      origins.forEach(o => granted.delete(o));
      return true;
    },
    onAdded: {addListener() {}},
    onRemoved: {addListener() {}}
  },
  commands: {getAll: () => Promise.resolve([])},
  runtime: {getManifest: () => ({version: '0'}), sendMessage: async () => null},
  tabs: {create() {}}
};

// the page's timers do not keep node waiting once the checks are done (the diagnostics' 8 s)
const later = (fn, ms, ...args) => {
  const id = setTimeout(fn, ms, ...args);
  id.unref?.();
  return id;
};
const ctx = {document, chrome, location: {hash: '', reload() {}}, addEventListener() {}, confirm: () => true,
  setTimeout: later, clearTimeout, URL, Blob, console};
ctx.self = ctx;
vm.createContext(ctx);
// the page's scripts in its order: the mail services first, then the page; the AI module's place
// is taken by the stub below
const html = fs.readFileSync(path.join(EXT, 'data/settings/index.html'), 'utf8');
for (const [, src] of html.matchAll(/<script src="([^"]+)"/g)) {
  const file = src.startsWith('/') ? path.join(EXT, src) : path.join(EXT, 'data/settings', src);
  if (file.endsWith(path.join('data', 'ai', 'ai.js'))) {
    continue;
  }
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, {filename: file});
}
// self.AI as data/ai/ai.js gives it, with answers a check sets: what is asked, in order
const asked = [];
const ai = {
  availability: 'available', state: null, checkError: null, modelsError: null, account: null, revoked: true,
  models: [
    {id: 'claude-opus-5-5', name: 'Claude Opus 5.5', recommended: true, tag: 'best', default: true},
    {id: 'claude-haiku-5-5', name: 'Claude Haiku 5.5', recommended: true, tag: 'fast'},
    {id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5'}
  ],
  progress: [],
  downloaded: null
};
ctx.AI = {
  ENGINES: ['off', 'builtin', 'chatgpt', 'openai', 'anthropic', 'zai'],
  state: async p => {
    asked.push(['state', p.engine]);
    return ai.state || {ok: ai.availability === 'available', reason: ai.availability, lang: 'en'};
  },
  check: async (engine, key) => {
    asked.push(['check', engine, key]);
    if (ai.checkError) {
      throw ai.checkError;
    }
    return true;
  },
  models: async (engine, key) => {
    asked.push(['models', engine, key]);
    if (ai.modelsError) {
      throw ai.modelsError;
    }
    return ai.models.map(m => ({...m}));
  },
  // the ChatGPT plan: the account as the module tells it, a sign-in that asks Chrome for the
  // sites from the click as the module does, a sign-out that may not be confirmed
  chatgpt: {
    usage: 'https://chatgpt.com/settings/usage',
    account: async () => {
      asked.push(['account']);
      return ai.account && {...ai.account};
    },
    signIn: () => {
      const p = chrome.permissions.request({origins: [...PLAN_SITES, 'http://127.0.0.1/*']});
      asked.push(['signIn']);
      return p.then(ok => {
        if (!ok) {
          throw {code: 'no-access'};
        }
        return true;
      });
    },
    signOut: async () => {
      asked.push(['signOut']);
      ai.account = null;
      return {revoked: ai.revoked};
    },
    resume: async () => {
      asked.push(['resume']);
    }
  },
  builtin: {
    availability: async lang => {
      asked.push(['availability', lang]);
      return ai.availability;
    },
    download: onProgress => {
      asked.push(['download']);
      ai.progress.forEach(p => onProgress(p));
      return new Promise((resolve, reject) => ai.downloaded = {resolve, reject});
    }
  }
};
const page = code => vm.runInContext(code, ctx);
// from here on the page reads what the checks put in local
store.get = async defaults => {
  if (defaults === null) {
    return {...local};
  }
  return Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, k in local ? local[k] : v]));
};

let n = 0;
const checks = [];
const check = (name, fn) => checks.push([name, fn]);

const gmail = (n, email) => ({meta: {}, xml: {title: email, rootLink: `https://mail.google.com/mail/u/${n}`, link: `https://mail.google.com/mail/u/${n}/#inbox`}});
const proton = (n, email) => ({meta: {service: 'proton'}, xml: {title: email, service: 'proton', rootLink: `https://mail.proton.me/u/${n}/inbox`, link: `https://mail.proton.me/u/${n}/inbox`}});

check('a backup keeps what is in range and leaves out the rest', () => {
  const sanitize = page('sanitize');
  const good = {
    'period': 300, 'initialPeriod': 0, 'soundVolume': 100, 'panelScale': 1.1, 'oldFashion': 2,
    'quiet.from': '22:30', 'quiet.to': '07:05', 'backgroundColor': '#12AB9f', 'notificationTruncate': 150,
    'notification.sound.media.custom0.selector': 2, 'notification.sound.media.custom0.filter': 'boss',
    'feeds_3': 'inbox, work', 'notify.never': 'news\nnoreply@', 'alert': false
  };
  assert.deepStrictEqual({...sanitize(good)}, good);
  const bad = {
    'period': 1, 'initialPeriod': 0.5, 'soundVolume': 500, 'panelScale': 40, 'oldFashion': 9, 'silentTime': 0,
    'quiet.from': 'abc', 'quiet.to': '24:00', 'backgroundColor': 'red', 'notificationTime': -5,
    'notification.sound.media.custom1.selector': 7, 'notification.sound.media.custom1.filter': 'x'.repeat(201),
    'notify.only': 'x'.repeat(20001), 'alert': 'yes', 'sync.settings': true, 'unknown': 1
  };
  assert.deepStrictEqual({...sanitize(bad)}, {});
});
check('a backup keeps the security checks on own sounds', () => {
  const out = page('sanitize')({
    'notification.sound.media.default.type': 4,
    'notification.sound.media.default.file': 'https://tracker.example/ping.mp3',
    'notification.sound.media.custom0.type': 9
  });
  assert.strictEqual(out['notification.sound.media.default.file'], undefined);
  assert.strictEqual(out['notification.sound.media.default.type'], 0);
  assert.strictEqual(out['notification.sound.media.custom0.type'], 0);
});
check('a backup keeps the panel order and the addresses hidden from it', () => {
  const out = page('sanitize')({
    accountOrder: ['b@gmail.com', 'a@gmail.com', 'b@gmail.com', 7],
    accounts: {'a@gmail.com': {ignored: true, signedOutHidden: true, other: 'x'}, 'y@yahoo.com': {service: 'yahoo'}, 'z@x.com': {service: 'nope'}},
    services: ['yahoo', 'nope', 3]
  });
  assert.deepStrictEqual([...out.accountOrder], ['b@gmail.com', 'a@gmail.com']);
  assert.deepStrictEqual({...out.accounts['a@gmail.com']}, {ignored: true, quiet: false, signedOutHidden: true});
  assert.deepStrictEqual({...out.accounts['y@yahoo.com']}, {ignored: false, quiet: false, service: 'yahoo'});
  assert.deepStrictEqual({...out.accounts['z@x.com']}, {ignored: false, quiet: false});
  assert.deepStrictEqual([...out.services], ['yahoo']);
});
check('labels belong to Gmail accounts only, not to a Proton mailbox at /u/0', () => {
  const slots = page('gmailSlots')([gmail(0, 'a@gmail.com'), proton(0, 'me@proton.me'), gmail(1, 'b@gmail.com'), gmail(12, 'far@gmail.com')]);
  assert.deepStrictEqual({...slots}, {'a@gmail.com': 0, 'b@gmail.com': 1});
});
check('an export holds the panel order and the labels under each address', async () => {
  Object.assign(local, {feeds_0: 'inbox, a-work', feeds_1: '^smartlabel_personal', accountOrder: ['b@gmail.com']});
  session = {'cached-objects': [gmail(0, 'a@gmail.com'), gmail(1, 'b@gmail.com'), proton(0, 'me@proton.me')]};
  const out = await page('collect(false)');
  assert.deepStrictEqual([...out.accountOrder], ['b@gmail.com']);
  assert.deepStrictEqual({...out.labels}, {'a@gmail.com': 'inbox, a-work', 'b@gmail.com': '^smartlabel_personal'});
  assert.strictEqual('notification.sound.media.default.file' in out, false);
  assert.strictEqual('notification.sound.media.default.file' in await page('collect(true)'), true);
  // the labels kept by address (1.6) win over a slot's, and an account signed out keeps its own
  local.labels = {'b@gmail.com': 'b-work', 'gone@gmail.com': 'old-work'};
  const now = await page('collect(false)');
  assert.deepStrictEqual({...now.labels}, {'a@gmail.com': 'inbox, a-work', 'b@gmail.com': 'b-work', 'gone@gmail.com': 'old-work'});
  for (const k of ['feeds_0', 'feeds_1', 'labels', 'accountOrder']) {
    delete local[k];
  }
});
check('restored labels go by address, joining the ones kept here; the other computer\'s slots are not used', async () => {
  const backup = {feeds_0: 'a-labels', feeds_1: 'b-labels', feeds_5: 'old', labels: {'a@gmail.com': 'a-labels', 'b@gmail.com': 'b-labels'}};
  // here b signed in first, a second, and c, unknown to the backup, third
  session = {'cached-objects': [gmail(0, 'b@gmail.com'), gmail(1, 'a@gmail.com'), gmail(2, 'c@gmail.com')]};
  local.labels = {'c@gmail.com': 'c-labels', 'a@gmail.com': 'mine'};
  const out = await page('restorable')(backup);
  assert.deepStrictEqual({...out.labels}, {'c@gmail.com': 'c-labels', 'a@gmail.com': 'a-labels', 'b@gmail.com': 'b-labels'});
  assert.deepStrictEqual(Object.keys(out).filter(k => k.startsWith('feeds_')), []);
  // a fresh install before its first check knows no account: the addresses are enough
  session = {'cached-objects': []};
  delete local.labels;
  const fresh = await page('restorable')(backup);
  assert.deepStrictEqual({...fresh.labels}, {'a@gmail.com': 'a-labels', 'b@gmail.com': 'b-labels'});
  // a labels entry that is not a string, or too long, or not under an address, is not used
  const odd = await page('restorable')({feeds_0: 'x', labels: {'a@gmail.com': 5, 'b@gmail.com': 'x'.repeat(2001), 'feeds_3': 'y', 'c@gmail.com': 'ok'}});
  assert.deepStrictEqual({...odd.labels}, {'c@gmail.com': 'ok'});
  assert.strictEqual('feeds_0' in odd, false);
  // a backup older than the labels by address brings its slots, for the background to move
  const old = await page('restorable')({feeds_0: 'a-labels'});
  assert.deepStrictEqual([old.feeds_0, 'labels' in old], ['a-labels', false]);
});
check('a label typed for an account is kept under its address, never its slot', async () => {
  set.length = 0;
  local.labels = {'x@gmail.com': 'x-work'};
  await page('saveLabels')('a@gmail.com', 'inbox, a-work');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(set.at(-1))), {labels: {'x@gmail.com': 'x-work', 'a@gmail.com': 'inbox, a-work'}});
  // shown: the address's labels, or a slot's from before 1.6 until the background moves it
  page('prefs.feeds_2 = "legacy"');
  assert.deepStrictEqual([page('labelsOf')(local.labels, 'a@gmail.com', 2), page('labelsOf')({}, 'a@gmail.com', 2), page('labelsOf')({}, 'a@gmail.com', 3)],
    ['inbox, a-work', 'legacy', '']);
  page('prefs.feeds_2 = ""');
  delete local.labels;
});
check('a restore gives back the sites of the services it leaves off', async () => {
  removed.length = 0;
  await page('apply')({services: ['yahoo']});
  const all = Object.values(ctx.MailServices);
  const want = all.filter(s => s.id !== 'yahoo').flatMap(s => s.origins).sort();
  assert.deepStrictEqual(removed.sort(), want);
  assert.ok(!removed.some(o => o.includes('yahoo')));
  // a reset turns them all off; a backup without services leaves them as they are
  removed.length = 0;
  await page('apply')({...page('DEFAULTS')});
  assert.deepStrictEqual(removed.sort(), all.flatMap(s => s.origins).sort());
  removed.length = 0;
  await page('apply')({alert: true});
  assert.deepStrictEqual(removed, []);
});
check('a cleared time keeps the one before; equal ends are saved and get a note', async () => {
  page(`prefs = {'quiet.from': '22:00', 'quiet.to': '08:00', services: []}`);
  set.length = 0;
  const from = {dataset: {key: 'quiet.from'}, type: 'time', value: '', hasAttribute: () => false};
  listeners.change({target: from});
  assert.strictEqual(from.value, '22:00');
  assert.strictEqual(set.length, 0);
  page('paintQuiet()');
  assert.strictEqual(element('quiet-same').hidden, true);
  listeners.change({target: {...from, value: '08:00'}});
  await new Promise(r => setTimeout(r, 0));
  assert.deepStrictEqual(set.map(v => ({...v})), [{'quiet.from': '08:00'}]);
  assert.strictEqual(element('quiet-same').hidden, false);
  listeners.change({target: {...from, value: '23:15'}});
  assert.strictEqual(element('quiet-same').hidden, true);
});
check('the page has a note element for equal quiet times, and every new string', () => {
  assert.ok(/id="quiet-same"[^>]*data-i18n="quietSame"/.test(html));
  for (const key of ['opt_quietSame', 'opt_ruleField', 'opt_serviceAccess']) {
    assert.ok(en[key]?.message, key);
  }
});
check('a backup keeps what the count, the repeat and the auto-advance may be, and nothing else', () => {
  const sanitize = page('sanitize');
  const good = {'badge.count': 'new', 'notify.repeat': 15, 'autoAdvance': true};
  assert.deepStrictEqual({...sanitize(good)}, good);
  assert.deepStrictEqual({...sanitize({'badge.count': 'some', 'notify.repeat': 7, 'autoAdvance': 'yes'})}, {});
  assert.deepStrictEqual({...sanitize({'badge.count': 1, 'notify.repeat': '5'})}, {});
  // what the page offers is what a backup may hold, its default among it
  for (const key of ['notify.repeat', 'badge.count']) {
    const select = new RegExp(`<select data-key="${key.replace('.', '\\.')}"[^>]*>([\\s\\S]*?)</select>`).exec(html);
    assert.ok(select, key);
    const numeric = /data-type="number"/.test(select[0]);
    const values = [...select[1].matchAll(/value="([^"]*)"/g)].map(m => numeric ? Number(m[1]) : m[1]);
    assert.ok(values.length > 1 && values.every(v => page('VALID')[key](v)), key);
    assert.ok(values.includes(page('DEFAULTS')[key]), key + ' offers its default');
  }
});
check('an inbox left out of the count stays out of it in a backup', () => {
  const out = page('sanitize')({accounts: {'a@gmail.com': {uncounted: true}, 'b@gmail.com': {uncounted: 'yes', quiet: true}}});
  assert.deepStrictEqual({...out.accounts['a@gmail.com']}, {ignored: false, quiet: false, uncounted: true});
  assert.deepStrictEqual({...out.accounts['b@gmail.com']}, {ignored: false, quiet: true});
});
check('an export holds the new settings, not the time the panel was last opened', async () => {
  Object.assign(local, {'badge.count': 'new', 'badge.seen': 123, 'notify.repeat': 30});
  const out = await page('collect(false)');
  assert.deepStrictEqual([out['badge.count'], out['notify.repeat'], out.autoAdvance], ['new', 30, false]);
  assert.strictEqual('badge.seen' in out, false);
});
check('the new settings default as the background does, and their rows and strings are there', () => {
  const defaults = page('DEFAULTS');
  assert.deepStrictEqual([defaults['badge.count'], defaults['notify.repeat'], defaults.autoAdvance], ['all', 0, false]);
  const background = fs.readFileSync(path.join(EXT, 'core/check.js'), 'utf8');
  assert.ok(background.includes(`'badge.count': 'all'`) && background.includes(`'notify.repeat': 0`));
  assert.ok(/data-key="autoAdvance"/.test(html) && /data-i18n="countHint"/.test(html));
  for (const key of ['opt_countChip', 'opt_countHint', 'opt_badgeCount', 'opt_badgeAll', 'opt_badgeNew', 'opt_badgeCountText',
    'opt_repeat', 'opt_repeatOff', 'opt_repeatText', 'opt_autoAdvance', 'opt_autoAdvanceText']) {
    assert.ok(en[key]?.message, key);
  }
  assert.ok(en.opt_formatText.message.includes('[account]'));
});

/* the AI card */
const msg = (key, ...subs) => chrome.i18n.getMessage(key, subs.map(String));
const tick = () => new Promise(r => setTimeout(r, 0));
const OPENAI_KEY = 'sk-proj-SECRET-openai-0123456789';
const ANTHROPIC_KEY = 'sk-ant-api03-SECRET-anthropic-0123456789';
const ZAI_KEY = '0123456789abcdef0123456789abcdef.SECRETzai01234';
const PLAN_TOKEN = 'eyJhbGciOiJSUzI1NiJ9.SECRET-plan.sig';
// the ChatGPT sign-in as data/ai/ai.js keeps it in storage: never shown, exported or synced
const PLAN_AUTH = {client_id: 'oaiapp_SECRET', email: 'me@example.com', sub: 'user-SECRET', access_token: PLAN_TOKEN,
  refresh_token: 'rt-SECRET-plan', id_token: PLAN_TOKEN, expires_at: 1, scopes: []};
const ACCOUNT = {email: 'me@example.com', plan: true, limit: false};
// a fresh card for each check: the defaults, no key, no provider's site, the stub's answers
const freshAI = (values = {}) => {
  for (const k of Object.keys(local)) {
    delete local[k];
  }
  Object.assign(local, values);
  granted.clear();
  grant = true;
  for (const list of [set, removed, forgotten, synced, requested, asked]) {
    list.length = 0;
  }
  Object.assign(ai, {availability: 'available', state: null, checkError: null, modelsError: null, progress: [], downloaded: null,
    account: null, revoked: true});
  page(`prefs = {...DEFAULTS, ...${JSON.stringify(values)}}; aiKeys = {}; aiConnecting = false; aiDownload = null;
    aiAccount = null; aiSigning = false; aiPlanNote = '';
    for (const id of Object.keys(aiLists)) delete aiLists[id];
    for (const id of Object.keys(aiAccess)) delete aiAccess[id];
    clearTimeout(aiPoll);`);
  for (const id of ['ai-key', 'ai-error', 'ai-model', 'ai-model-note', 'ai-builtin-error', 'ai-builtin-lang', 'ai-plan-note', 'ai-plan-wait',
    'ai-plan-text', 'ai-key-hint']) {
    Object.assign(element(id), {value: '', textContent: '', hidden: false, kids: []});
  }
  element('ai-key').type = 'password';
  element('ai-signout').attrs = {};
  focused = null;
  // what the card reads to start is not what a check asks
  return Promise.all([page('readAIKeys()'), page('syncAIAccess()'), page('readAccount()')]).then(() => {
    asked.length = 0;
  });
};
const has = (value, secret) => JSON.stringify(value).includes(secret);

check('the AI settings default as the module does; a backup keeps them and never a key', () => {
  const defaults = page('DEFAULTS');
  assert.deepStrictEqual(['ai.engine', 'ai.chatgpt.model', 'ai.openai.model', 'ai.anthropic.model', 'ai.zai.model', 'ai.summary', 'ai.reply',
    'ai.buttons'].map(k => defaults[k]), ['off', '', '', '', '', 'click', true, true]);
  assert.ok(!Object.keys(defaults).some(k => k.endsWith('.key') || k.startsWith('ai.chatgpt.') && !k.endsWith('.model')),
    'no key and nothing of the ChatGPT sign-in among the settings a backup is made of');
  const sanitize = page('sanitize');
  const good = {'ai.engine': 'anthropic', 'ai.anthropic.model': 'claude-opus-5-5', 'ai.openai.model': 'gpt-5.1-mini',
    'ai.summary': 'auto', 'ai.reply': false, 'ai.zai.model': 'glm-5.3', 'ai.chatgpt.model': 'gpt-5.5', 'ai.buttons': false};
  assert.deepStrictEqual({...sanitize(good)}, good);
  for (const engine of ['chatgpt', 'zai']) {
    assert.deepStrictEqual({...sanitize({'ai.engine': engine})}, {'ai.engine': engine});
  }
  assert.deepStrictEqual({...sanitize({'ai.engine': 'builtin', 'ai.summary': 'off', 'ai.openai.model': ''})},
    {'ai.engine': 'builtin', 'ai.summary': 'off', 'ai.openai.model': ''});
  const bad = {'ai.engine': 'gemini', 'ai.summary': 'always', 'ai.reply': 'yes', 'ai.openai.model': 'gpt 5',
    'ai.anthropic.model': 'c'.repeat(101), 'ai.openai.key': OPENAI_KEY, 'ai.anthropic.key': ANTHROPIC_KEY,
    'ai.zai.key': ZAI_KEY, 'ai.zai.model': 'glm 5', 'ai.buttons': 'no', 'ai.chatgpt.auth': {access_token: PLAN_TOKEN},
    'ai.chatgpt.client': {id: 'oaiapp_x'}, 'ai.chatgpt.host': 'urn:uuid:x', 'ai.chatgpt.welcomed': true,
    'ai.replies': {x: {r: 1, w: 'asks', t: 1}}};
  assert.deepStrictEqual({...sanitize(bad)}, {});
  // what the page offers is what a backup may hold, its default among it
  const select = /<select data-key="ai\.summary"[^>]*>([\s\S]*?)<\/select>/.exec(html);
  const values = [...select[1].matchAll(/value="([^"]*)"/g)].map(m => m[1]);
  assert.deepStrictEqual(values, ['off', 'click', 'auto']);
  assert.ok(values.every(v => page('VALID')['ai.summary'](v)) && values.includes(defaults['ai.summary']));
  const engines = [...html.matchAll(/name="ai\.engine" value="([^"]+)"/g)].map(m => m[1]);
  assert.deepStrictEqual(engines, [...ctx.AI.ENGINES]);
});
check('a key is never in an export, in Chrome sync or in the diagnostics', async () => {
  await freshAI({'ai.engine': 'openai', 'ai.openai.model': 'gpt-5-mini', 'ai.openai.key': OPENAI_KEY,
    'ai.anthropic.key': ANTHROPIC_KEY, 'ai.zai.key': ZAI_KEY, 'ai.chatgpt.auth': PLAN_AUTH, 'ai.chatgpt.client': {id: 'oaiapp_SECRET', sub: 'user-SECRET'},
    'ai.chatgpt.host': 'urn:uuid:SECRET', 'ai.chatgpt.model': 'gpt-5.5', 'sync.settings': true});
  granted.add('https://api.openai.com/*');
  const secret = v => ['SECRET', 'me@example.com'].some(s => has(v, s));
  for (const files of [true, false]) {
    const out = await page(`collect(${files})`);
    assert.strictEqual(out['ai.engine'], 'openai');
    assert.strictEqual(out['ai.openai.model'], 'gpt-5-mini');
    assert.strictEqual(out['ai.chatgpt.model'], 'gpt-5.5');
    assert.ok(!secret(out) && !Object.keys(out).some(k => k.endsWith('.key') || /^ai\.chatgpt\.(auth|client|host)$/.test(k)));
  }
  // the copy in Chrome sync, made at once instead of 1.5 s later
  ctx.setTimeout = fn => fn();
  try {
    page('pushSync()');
    await tick();
    await tick();
  }
  finally {
    ctx.setTimeout = later;
  }
  assert.ok(synced.length > 0, 'a copy went to Chrome sync');
  assert.ok(synced.every(v => !secret(v)));
  assert.ok(synced.some(v => has(v, 'gpt-5-mini')), 'the model goes along');
  // the diagnostics ask the provider with the key and say how it went, without it
  const line = await page('aiDiag()');
  assert.deepStrictEqual([...line], ['ai', true, 'OpenAI · gpt-5-mini']);
  assert.ok(asked.some(([what, engine, key]) => what === 'check' && engine === 'openai' && key === OPENAI_KEY));
  ai.checkError = {code: 'auth'};
  const refused = await page('aiDiag()');
  assert.deepStrictEqual([...refused], ['ai', false, 'OpenAI: ' + msg('opt_aiErrAuth', 'OpenAI')]);
  granted.clear();
  assert.deepStrictEqual([...await page('aiDiag()')], ['ai', false, 'OpenAI: ' + msg('opt_aiDiagNoAccess', 'api.openai.com')]);
  delete local['ai.openai.key'];
  assert.deepStrictEqual([...await page('aiDiag()')], ['ai', false, 'OpenAI: ' + msg('opt_aiDiagNoKey')]);
  // the plan: checked with its sign-in, said without the account or a token
  page(`prefs['ai.engine'] = 'chatgpt'`);
  assert.deepStrictEqual([...await page('aiDiag()')], ['ai', false, 'ChatGPT: ' + msg('opt_aiDiagSignedOut')]);
  ai.account = {...ACCOUNT};
  assert.deepStrictEqual([...await page('aiDiag()')], ['ai', false, 'ChatGPT: ' + msg('opt_aiDiagNoAccess', 'api.openai.com')]);
  granted.add('https://api.openai.com/*');
  granted.add('https://auth.openai.com/*');
  ai.checkError = null;
  const planLine = await page('aiDiag()');
  assert.deepStrictEqual([...planLine], ['ai', true, msg('opt_aiPlan') + ' · gpt-5.5']);
  assert.ok(asked.some(([what, engine]) => what === 'check' && engine === 'chatgpt'));
  ai.checkError = {code: 'limit'};
  assert.deepStrictEqual([...await page('aiDiag()')], ['ai', false, 'ChatGPT: ' + msg('ai_err_limit')]);
  assert.ok(!secret(planLine) && !secret(await page('aiDiag()')));
  page(`prefs['ai.engine'] = 'off'`);
  assert.deepStrictEqual([...await page('aiDiag()')], ['ai', null, msg('opt_aiOff')]);
  // the line is one of the browser's
  assert.ok(/aiDiag\(\)\s*\]\);/.test(fs.readFileSync(path.join(EXT, 'data/settings/index.js'), 'utf8')));
});
check('the engine and what the AI does are saved as they change, and the keys load as stored', async () => {
  await freshAI({'ai.anthropic.key': ANTHROPIC_KEY});
  listeners.change({target: {name: 'ai.engine', value: 'anthropic', dataset: {}}});
  listeners.change({target: {dataset: {key: 'ai.summary'}, type: 'select-one', value: 'auto', hasAttribute: () => false}});
  listeners.change({target: {dataset: {key: 'ai.reply'}, type: 'checkbox', checked: false, hasAttribute: () => false}});
  // an engine the page does not offer is not saved
  listeners.change({target: {name: 'ai.engine', value: 'gemini', dataset: {}}});
  await tick();
  assert.deepStrictEqual(set.map(v => ({...v})), [{'ai.engine': 'anthropic'}, {'ai.summary': 'auto'}, {'ai.reply': false}]);
  // a key stored, its site not given: connected, with a word and a button to give it again
  await page('syncAIAccess()');
  page('paintCloud()');
  assert.strictEqual(element('ai-key-row').hidden, true);
  assert.strictEqual(element('ai-connected').hidden, false);
  assert.strictEqual(element('ai-connected-title').textContent, msg('opt_aiConnected', 'Anthropic'));
  assert.strictEqual(element('ai-access').hidden, false);
  assert.strictEqual(element('ai-access').textContent, msg('opt_aiNoAccess', 'api.anthropic.com'));
  assert.strictEqual(element('ai-allow').hidden, false);
  assert.strictEqual(element('ai-model-row').hidden, true);
  // no key: the field, its provider's key page and what a subscription does not give
  page(`prefs['ai.engine'] = 'openai'`);
  page('paintCloud()');
  assert.strictEqual(element('ai-key-row').hidden, false);
  assert.strictEqual(element('ai-connected').hidden, true);
  assert.strictEqual(element('ai-key-link').href, 'https://platform.openai.com/api-keys');
  assert.strictEqual(element('ai-key-plan').textContent, msg('opt_aiKeyText', 'ChatGPT Plus', 'OpenAI'));
  assert.strictEqual(element('ai-key-label').textContent, msg('opt_aiKey', 'OpenAI'));
  // under the field: a ChatGPT plan is used without a key
  assert.strictEqual(element('ai-key-hint').textContent, msg('opt_aiOpenAIHint'));
  assert.strictEqual(element('ai-key-hint').hidden, false);
  page(`prefs['ai.engine'] = 'anthropic'; aiKeys['ai.anthropic.key'] = ''`);
  page('paintCloud()');
  assert.strictEqual(element('ai-key-link').href, 'https://console.anthropic.com/settings/keys');
  // a Claude subscription cannot be used by other apps: the word under the field says so, for a key
  assert.strictEqual(element('ai-key-plan').textContent, '');
  assert.strictEqual(element('ai-key-hint').textContent, msg('opt_aiAnthropicHint'));
  assert.ok(/Claude Pro and Max.*console\.anthropic\.com/.test(msg('opt_aiAnthropicHint')));
  page(`prefs['ai.engine'] = 'zai'`);
  page('paintCloud()');
  assert.strictEqual(element('ai-key-label').textContent, msg('opt_aiKey', 'Z.ai'));
  assert.strictEqual(element('ai-key-link').href, 'https://z.ai/manage-apikey/apikey-list');
  assert.strictEqual(element('ai-key-hint').textContent, msg('opt_aiZaiHint'));
  assert.ok(/standard API key from z\.ai.*GLM Coding Plan key works only in coding tools/.test(msg('opt_aiZaiHint')));
  // the field never shows a stored key
  assert.ok(!has(element('ai-key').value, ANTHROPIC_KEY));
  // the key field: a password, nothing filled in or checked by the browser
  assert.ok(/<input type="password" id="ai-key" autocomplete="off" spellcheck="false"/.test(html));
});
check('Connect asks Chrome for that provider\'s site from the click, then checks the key and lists its models', async () => {
  await freshAI({'ai.engine': 'anthropic'});
  element('ai-key').value = '  ' + ANTHROPIC_KEY + ' ';
  const done = element('ai-connect').onclick();
  // asked from the click itself, before anything was awaited
  assert.deepStrictEqual(requested.map(o => [...o]), [['https://api.anthropic.com/*']]);
  assert.strictEqual(asked.length, 0, 'the key is checked only after Chrome gave the site');
  assert.strictEqual(await done, true);
  assert.deepStrictEqual(asked.map(a => a.join(' ')), [`check anthropic ${ANTHROPIC_KEY}`, `models anthropic ${ANTHROPIC_KEY}`]);
  assert.strictEqual(local['ai.anthropic.key'], ANTHROPIC_KEY);
  assert.strictEqual(local['ai.anthropic.model'], 'claude-opus-5-5', 'the model the module marks');
  assert.strictEqual(element('ai-key').value, '', 'the field forgets the key');
  assert.strictEqual(element('ai-error').hidden, true);
  assert.strictEqual(element('ai-connected').hidden, false);
  assert.strictEqual(element('ai-model-row').hidden, false);
  // the models: what the account had picked first, recommended ones in a group, with what for
  const groups = element('ai-model').kids;
  assert.strictEqual(groups[0].label, msg('opt_aiRecommended'));
  assert.deepStrictEqual(groups[0].kids.map(o => o.textContent),
    ['Claude Opus 5.5 · ' + msg('opt_aiBest'), 'Claude Haiku 5.5 · ' + msg('opt_aiFast')]);
  assert.strictEqual(groups[1].label, msg('opt_aiOtherModels'));
  assert.deepStrictEqual(groups[1].kids.map(o => o.value), ['claude-sonnet-5-5']);
  // a model picked before stays picked on a new key
  await freshAI({'ai.engine': 'openai', 'ai.openai.model': 'gpt-4.1'});
  ai.models = [{id: 'gpt-5', name: 'gpt-5', recommended: true, tag: 'best'}, {id: 'gpt-5-mini', name: 'gpt-5-mini', recommended: true, tag: 'fast', default: true}, {id: 'gpt-4.1', name: 'gpt-4.1'}];
  element('ai-key').value = OPENAI_KEY;
  assert.strictEqual(await element('ai-connect').onclick(), true);
  assert.deepStrictEqual(requested.map(o => [...o]), [['https://api.openai.com/*']]);
  assert.strictEqual(local['ai.openai.model'], 'gpt-4.1');
  // Enter in the field connects as well
  await freshAI({'ai.engine': 'openai'});
  element('ai-key').value = OPENAI_KEY;
  let prevented = false;
  element('ai-key').onkeydown({key: 'Enter', preventDefault: () => prevented = true});
  assert.ok(prevented && requested.length === 1);
  // that connect ends before the next check starts
  await new Promise(r => setTimeout(r, 20));
  assert.strictEqual(local['ai.openai.key'], OPENAI_KEY);
});
check('Connect says precisely why a key did not connect, and keeps nothing of it', async () => {
  // nothing pasted, or another provider's key: said at once, Chrome is not asked
  await freshAI({'ai.engine': 'openai'});
  assert.strictEqual(await element('ai-connect').onclick(), false);
  assert.strictEqual(element('ai-error').textContent, msg('opt_aiKeyEmpty'));
  assert.strictEqual(element('ai-error').hidden, false);
  element('ai-key').value = ANTHROPIC_KEY;
  assert.strictEqual(await element('ai-connect').onclick(), false);
  assert.strictEqual(element('ai-error').textContent, msg('opt_aiKeyOther', 'Anthropic', 'OpenAI'));
  assert.strictEqual(requested.length, 0);
  // typing clears the word
  element('ai-key').oninput();
  assert.strictEqual(element('ai-error').hidden, true);
  // Chrome's access refused: no key check, nothing kept
  element('ai-key').value = OPENAI_KEY;
  grant = false;
  assert.strictEqual(await element('ai-connect').onclick(), false);
  assert.strictEqual(element('ai-error').textContent, msg('opt_aiErrAccess', 'api.openai.com'));
  assert.strictEqual(asked.length, 0);
  assert.ok(!('ai.openai.key' in local));
  // the provider refuses the key: said so, and the site given for it goes back to Chrome
  grant = true;
  ai.checkError = {code: 'auth'};
  assert.strictEqual(await element('ai-connect').onclick(), false);
  assert.strictEqual(element('ai-error').textContent, msg('opt_aiErrAuth', 'OpenAI'));
  assert.ok(!('ai.openai.key' in local) && !granted.has('https://api.openai.com/*'));
  assert.deepStrictEqual(removed, ['https://api.openai.com/*']);
  // the module's own words where they suit this page
  ai.checkError = null;
  ai.modelsError = {code: 'network'};
  assert.strictEqual(await element('ai-connect').onclick(), false);
  assert.strictEqual(element('ai-error').textContent, msg('ai_err_network'));
  // a key with no model Mail Deck can use
  ai.modelsError = null;
  const models = ai.models;
  ai.models = [];
  assert.strictEqual(await element('ai-connect').onclick(), false);
  assert.strictEqual(element('ai-error').textContent, msg('opt_aiNoModels'));
  ai.models = models;
  assert.ok(!set.some(v => 'ai.openai.key' in v), 'no key that failed was ever stored');
});
check('every AIError code reads as what to do', () => {
  const text = page('aiErrorText');
  const expect = {
    'auth': msg('opt_aiErrAuth', 'OpenAI'),
    'no-access': msg('opt_aiErrAccess', 'api.openai.com'),
    'model': msg('opt_aiNoModels'),
    'no-models': msg('opt_aiNoModels'),
    'quota': msg('ai_err_quota'),
    'rate': msg('ai_err_rate'),
    'network': msg('ai_err_network'),
    'server': msg('ai_err_server'),
    'unavailable': msg('ai_err_unavailable'),
    'too-long': msg('ai_err_too_long'),
    'refusal': msg('ai_err_refusal'),
    'bad-output': msg('ai_err_bad_output'),
    'aborted': '',
    'something-new': msg('opt_aiErrOther')
  };
  for (const [code, want] of Object.entries(expect)) {
    assert.strictEqual(text({code}, 'openai'), want, code);
    assert.ok(code === 'aborted' || want, code + ' has words');
  }
  assert.strictEqual(text(new TypeError('Failed to fetch'), 'openai'), msg('opt_aiErrOther'));
  assert.strictEqual(text({code: 'auth'}, 'anthropic'), msg('opt_aiErrAuth', 'Anthropic'));
  assert.strictEqual(text({code: 'auth'}, 'zai'), msg('opt_aiErrAuth', 'Z.ai'));
  assert.strictEqual(text({code: 'no-access'}, 'zai'), msg('opt_aiErrAccess', 'api.z.ai'));
  // the plan has no key: its own words, the module's for the rest, OpenAI's for a policy
  const plan = {
    'no-access': msg('opt_aiPlanAccess'), 'model': msg('opt_aiPlanNoModels'), 'no-models': msg('opt_aiPlanNoModels'),
    'limit': msg('ai_err_limit'), 'no-plan': msg('ai_err_no_plan'), 'signed-out': msg('ai_err_signed_out'),
    'denied': msg('ai_err_denied'), 'sign-in': msg('ai_err_sign_in'), 'other-account': msg('ai_err_other_account'),
    'server': msg('ai_err_server'), 'aborted': ''
  };
  for (const [code, want] of Object.entries(plan)) {
    assert.strictEqual(text({code}, 'chatgpt'), want, 'chatgpt ' + code);
    assert.ok(code === 'aborted' || want, code + ' has words');
  }
  assert.strictEqual(text({code: 'auth', message: 'Country, region, or territory not supported'}, 'chatgpt'), 'Country, region, or territory not supported');
  assert.ok(!/key/i.test(text({code: 'auth'}, 'chatgpt')), 'no key to check');
});
check('Disconnect forgets the key and the model and gives the provider\'s site back', async () => {
  await freshAI({'ai.engine': 'anthropic', 'ai.anthropic.key': ANTHROPIC_KEY, 'ai.anthropic.model': 'claude-haiku-5-5',
    'ai.openai.key': OPENAI_KEY});
  granted.add('https://api.anthropic.com/*');
  granted.add('https://api.openai.com/*');
  await page('syncAIAccess()');
  await element('ai-disconnect').onclick();
  assert.ok(!('ai.anthropic.key' in local) && !('ai.anthropic.model' in local));
  assert.strictEqual(local['ai.openai.key'], OPENAI_KEY, 'the other provider keeps its key');
  assert.deepStrictEqual(removed, ['https://api.anthropic.com/*']);
  assert.ok(granted.has('https://api.openai.com/*'));
  assert.strictEqual(element('ai-key-row').hidden, false);
  assert.strictEqual(element('ai-connected').hidden, true);
});
check('a reset forgets every key and the ChatGPT sign-in, and gives back every provider\'s site', async () => {
  await freshAI({'ai.engine': 'openai', 'ai.openai.key': OPENAI_KEY, 'ai.anthropic.key': ANTHROPIC_KEY, 'ai.zai.key': ZAI_KEY,
    'ai.openai.model': 'gpt-5-mini', 'ai.replies': {x: {r: 1, w: 'asks', t: 1}}, 'ai.chatgpt.auth': PLAN_AUTH,
    'ai.chatgpt.client': {id: 'oaiapp_1'}, 'ai.chatgpt.host': 'urn:uuid:1', 'ai.chatgpt.model': 'gpt-5.5'});
  ai.account = {...ACCOUNT};
  AI_SITES.forEach(o => granted.add(o));
  await element('reset').onclick();
  assert.ok(!('ai.openai.key' in local) && !('ai.anthropic.key' in local) && !('ai.zai.key' in local) && !('ai.replies' in local));
  // revoked at OpenAI first, while its site is still given
  assert.ok(asked.some(([what]) => what === 'signOut'));
  assert.ok(!('ai.chatgpt.auth' in local));
  assert.deepStrictEqual([local['ai.chatgpt.client'], local['ai.chatgpt.host']], [{id: 'oaiapp_1'}, 'urn:uuid:1'], 'kept for a later sign-in');
  assert.strictEqual(local['ai.engine'], 'off');
  assert.strictEqual(local['ai.openai.model'], '');
  assert.strictEqual(local['ai.chatgpt.model'], '');
  assert.ok(AI_SITES.every(o => removed.includes(o) && !granted.has(o)));
  assert.ok(en.opt_resetConfirm.message.includes('AI'));
});
check('the built-in model: a line for each state Chrome tells, and the download from the click', async () => {
  const views = {
    'available': ['opt_aiReady', 'opt_aiReadyText', 'ok', false, false],
    'downloadable': ['opt_aiNeedsDownload', 'opt_aiNeedsDownloadText', 'wait', true, false],
    'downloading': ['opt_aiDownloading', '', 'wait', false, true],
    'unavailable': ['opt_aiUnavailable', 'opt_aiUnavailableText', 'bad', false, false],
    'old-chrome': ['opt_aiOldChrome', 'opt_aiOldChromeText', 'bad', false, false]
  };
  for (const [status, [title, text, state, download, meter]] of Object.entries(views)) {
    await freshAI({'ai.engine': 'builtin'});
    ai.availability = status;
    ai.state = status === 'old-chrome' ? {ok: false, reason: 'old-chrome', lang: 'en'} : null;
    await page('paintBuiltin()');
    page('clearTimeout(aiPoll)');
    assert.strictEqual(element('ai-builtin-title').textContent, msg(title), status);
    assert.strictEqual(element('ai-builtin-title').dataset.state, state, status);
    assert.strictEqual(element('ai-builtin-text').textContent, text && msg(text), status);
    assert.strictEqual(element('ai-builtin-text').hidden, !text, status);
    assert.strictEqual(element('ai-download').hidden, !download, status);
    assert.strictEqual(element('ai-meter').hidden, !meter, status);
    assert.strictEqual(element('ai-builtin-lang').hidden, true, status + ': the UI language is spoken');
  }
  // a UI language the model does not speak: it answers in English, and the card says so
  await freshAI({'ai.engine': 'builtin'});
  const ui = chrome.i18n.getUILanguage;
  chrome.i18n.getUILanguage = () => 'ru';
  try {
    ai.state = {ok: true, lang: 'en', note: 'x'};
    await page('paintBuiltin()');
    assert.strictEqual(element('ai-builtin-lang').hidden, false);
    assert.strictEqual(element('ai-builtin-lang').textContent, msg('opt_aiEnglish', new Intl.DisplayNames(['ru'], {type: 'language'}).of('ru')));
    assert.deepStrictEqual(asked.filter(a => a[0] === 'availability'), [['availability', 'en']], 'asked for the language it answers in');
  }
  finally {
    chrome.i18n.getUILanguage = ui;
  }
  // Download: called from the click itself; the meter follows Chrome's progress; ready at its end
  await freshAI({'ai.engine': 'builtin'});
  ai.availability = 'downloadable';
  ai.progress = [0.25];
  element('ai-download').onclick();
  assert.deepStrictEqual(asked.slice(-1), [['download']], 'download() is the click\'s first call');
  assert.strictEqual(element('ai-meter').hidden, false);
  assert.strictEqual(element('ai-progress').value, 25);
  assert.strictEqual(element('ai-percent').textContent, '25%');
  assert.strictEqual(element('ai-download').hidden, true);
  // a second click while it downloads asks for nothing more
  element('ai-download').onclick();
  assert.strictEqual(asked.filter(a => a[0] === 'download').length, 1);
  ai.availability = 'available';
  ai.downloaded.resolve();
  await tick();
  await tick();
  await tick();
  assert.strictEqual(element('ai-builtin-title').textContent, msg('opt_aiReady'));
  assert.strictEqual(element('toast').textContent, msg('opt_aiReady'));
  // a download that fails says why
  await freshAI({'ai.engine': 'builtin'});
  ai.availability = 'downloadable';
  element('ai-download').onclick();
  ai.downloaded.reject({code: 'unavailable'});
  await tick();
  await tick();
  assert.strictEqual(element('ai-builtin-error').hidden, false);
  assert.strictEqual(element('ai-builtin-error').textContent, msg('ai_err_unavailable'));
});
check('a model the account no longer has stays shown, with a word to pick another', async () => {
  await freshAI({'ai.engine': 'openai', 'ai.openai.key': OPENAI_KEY, 'ai.openai.model': 'gpt-4-old'});
  granted.add('https://api.openai.com/*');
  ai.models = [{id: 'gpt-5-mini', name: 'gpt-5-mini', recommended: true, tag: 'fast', default: true}, {id: 'gpt-4.1', name: 'gpt-4.1'}];
  await page('syncAIAccess()');
  page('paintCloud()');
  // what is stored shows at once, the list follows
  assert.deepStrictEqual(element('ai-model').kids.map(o => o.value), ['gpt-4-old']);
  await tick();
  await tick();
  const kids = element('ai-model').kids;
  assert.strictEqual(kids[0].value, 'gpt-4-old');
  assert.strictEqual(kids[1].label, msg('opt_aiRecommended'));
  assert.strictEqual(element('ai-model-note').hidden, false);
  assert.strictEqual(element('ai-model-note').textContent, msg('opt_aiModelGone', 'gpt-4-old'));
  // picking one saves it for that provider, and the word goes
  element('ai-model').value = 'gpt-5-mini';
  element('ai-model').onchange();
  await tick();
  await tick();
  assert.strictEqual(local['ai.openai.model'], 'gpt-5-mini');
  assert.strictEqual(element('ai-model-note').hidden, true);
  // a key revoked meanwhile: the list does not come, and the row says why
  await freshAI({'ai.engine': 'openai', 'ai.openai.key': OPENAI_KEY, 'ai.openai.model': 'gpt-5-mini'});
  granted.add('https://api.openai.com/*');
  ai.modelsError = {code: 'auth'};
  await page('syncAIAccess()');
  page('paintCloud()');
  await tick();
  await tick();
  assert.strictEqual(element('ai-model-note').textContent, msg('opt_aiErrAuth', 'OpenAI'));
  assert.strictEqual(asked.filter(a => a[0] === 'models').length, 1, 'asked once, not again on every paint');
  page('paintCloud()');
  await tick();
  assert.strictEqual(asked.filter(a => a[0] === 'models').length, 1);
});
check('the card follows what changes elsewhere: another tab, chrome://extensions', async () => {
  await freshAI({});
  page('followAI')({'ai.engine': {newValue: 'openai'}, 'ai.summary': {newValue: 'off'}});
  assert.strictEqual(page(`prefs['ai.engine']`), 'openai');
  assert.strictEqual(page(`prefs['ai.summary']`), 'off');
  page('followAI')({'ai.openai.key': {newValue: OPENAI_KEY}});
  assert.strictEqual(page(`aiKeyOf('openai')`), OPENAI_KEY);
  assert.strictEqual(element('ai-connected').hidden, false);
  // the site taken back on chrome://extensions: the card says so in place
  await page('syncAIAccess()');
  page('paintCloud()');
  assert.strictEqual(element('ai-access').hidden, false);
  assert.strictEqual(element('ai-model-row').hidden, true);
  // given again from the card's button
  await element('ai-allow').onclick();
  assert.deepStrictEqual(requested.map(o => [...o]), [['https://api.openai.com/*']]);
  assert.strictEqual(element('ai-access').hidden, true);
  assert.strictEqual(element('ai-model-row').hidden, false);
  // a key removed in another tab
  page('followAI')({'ai.openai.key': {oldValue: OPENAI_KEY}});
  assert.strictEqual(element('ai-key-row').hidden, false);
  // the page follows storage and Chrome's access in its start
  const code = fs.readFileSync(path.join(EXT, 'data/settings/index.js'), 'utf8');
  assert.ok(/followAI\(ps\)/.test(code) && /onRemoved\?\.addListener\(followAccess\)/.test(code));
});
check('Z.ai connects as the other keys do: its site from the click, the key checked, its models with what they are for', async () => {
  await freshAI({'ai.engine': 'zai'});
  const claude = ai.models;
  ai.models = [
    {id: 'glm-5.3', name: 'GLM-5.3', recommended: true, tag: 'best', default: true},
    {id: 'glm-5.3-flash', name: 'GLM-5.3-Flash', recommended: true, tag: 'fast'},
    {id: 'glm-4.7-flash', name: 'GLM-4.7-Flash', tag: 'free'}
  ];
  try {
    element('ai-key').value = ZAI_KEY;
    const done = element('ai-connect').onclick();
    assert.deepStrictEqual(requested.map(o => [...o]), [['https://api.z.ai/*']]);
    assert.strictEqual(await done, true);
    assert.deepStrictEqual(asked.map(a => a.slice(0, 2).join(' ')), ['check zai', 'models zai']);
    assert.strictEqual(local['ai.zai.key'], ZAI_KEY);
    assert.strictEqual(local['ai.zai.model'], 'glm-5.3');
    const [best, rest] = element('ai-model').kids;
    assert.deepStrictEqual(best.kids.map(o => o.textContent), ['GLM-5.3 · ' + msg('opt_aiBest'), 'GLM-5.3-Flash · ' + msg('opt_aiFast')]);
    assert.deepStrictEqual(rest.kids.map(o => o.textContent), ['GLM-4.7-Flash · ' + msg('opt_aiFree')]);
    page('paintAI()');
    assert.strictEqual(element('ai-privacy').textContent, msg('opt_aiPrivacy', 'Z.ai'));
    // a key of another provider pasted here is said to be one
    await freshAI({'ai.engine': 'zai'});
    element('ai-key').value = OPENAI_KEY;
    assert.strictEqual(await element('ai-connect').onclick(), false);
    assert.strictEqual(element('ai-error').textContent, msg('opt_aiKeyOther', 'OpenAI', 'Z.ai'));
  }
  finally {
    ai.models = claude;
  }
});
check('the ChatGPT plan: Continue with ChatGPT asks for its sites from the click, then waits for the sign-in', async () => {
  await freshAI({'ai.engine': 'chatgpt'});
  page('paintAI()');
  // signed out: the offer in OpenAI's words, the Plus limit; no key, no model
  assert.strictEqual(element('ai-plan').hidden, false);
  assert.strictEqual(element('ai-key-row').hidden, true);
  assert.strictEqual(element('ai-connected').hidden, true);
  assert.strictEqual(element('ai-model-row').hidden, true);
  assert.strictEqual(element('ai-plan-title').textContent, msg('opt_aiPlanUse'));
  assert.strictEqual(element('ai-plan-title').dataset.state, 'none');
  assert.deepStrictEqual(element('ai-plan-text').kids, [msg('opt_aiPlanUseText')]);
  assert.strictEqual(element('ai-plan-plus').hidden, false);
  assert.ok(/five-hour usage limit, shared across all the apps/.test(msg('opt_aiPlanPlus')));
  assert.strictEqual(element('ai-signin').hidden, false);
  assert.strictEqual(element('ai-signout').hidden, true);
  assert.strictEqual(msg('opt_aiSignIn'), 'Continue with ChatGPT');
  assert.ok(/data-i18n="aiSignIn">Continue with ChatGPT</.test(html) && !/chatgpt[\w-]*\.(svg|png)/i.test(html), 'a text button, no logo');
  assert.strictEqual(element('ai-privacy').textContent, msg('opt_aiPrivacyPlan'));
  // the click: the sites first, before anything is awaited, then the module's sign-in
  const done = element('ai-signin').onclick();
  assert.deepStrictEqual(requested.map(o => [...o]), [[...PLAN_SITES, 'http://127.0.0.1/*']]);
  await done;
  assert.ok(asked.some(([what]) => what === 'signIn'));
  assert.strictEqual(element('ai-plan-wait').hidden, false);
  assert.strictEqual(element('ai-plan-wait').textContent, msg('opt_aiSignInWait'));
  assert.strictEqual(focused, 'ai-signin');
  // the sign-in comes back, in storage: the account, its usage, Sign out, the models
  ai.account = {...ACCOUNT};
  page('followAI')({'ai.chatgpt.auth': {newValue: {}}});
  for (let i = 0; i < 4; i += 1) {
    await tick();
  }
  assert.strictEqual(element('ai-plan-title').textContent, msg('opt_aiSignedIn', 'me@example.com'));
  assert.strictEqual(element('ai-plan-title').dataset.state, 'ok');
  const [using, dot, usage] = element('ai-plan-text').kids;
  assert.deepStrictEqual([using, dot], [msg('opt_aiPlanUsing'), ' · ']);
  assert.deepStrictEqual([usage.href, usage.target, usage.textContent], ['https://chatgpt.com/settings/usage', '_blank', msg('opt_aiManageUsage')]);
  usage.onclick();
  assert.ok(asked.some(([what]) => what === 'resume'), 'Manage usage lets what waited for the limit go again');
  assert.strictEqual(element('ai-signin').hidden, true);
  assert.strictEqual(element('ai-signout').hidden, false);
  assert.strictEqual(element('ai-plan-wait').hidden, true);
  assert.strictEqual(element('ai-plan-note').hidden, true);
  assert.strictEqual(element('ai-model-row').hidden, false);
  assert.strictEqual(element('ai-model-text').textContent, msg('opt_aiPlanModelText'));
  assert.ok(asked.some(([what, engine, key]) => what === 'models' && engine === 'chatgpt' && key === ''));
  // the sites refused: said, and nothing waits
  await freshAI({'ai.engine': 'chatgpt'});
  grant = false;
  await element('ai-signin').onclick();
  assert.strictEqual(element('ai-plan-note').textContent, msg('opt_aiPlanAccess'));
  assert.strictEqual(element('ai-plan-wait').hidden, true);
  // the page follows a sign-in underway or over in the session
  const code = fs.readFileSync(path.join(EXT, 'data/settings/index.js'), 'utf8');
  assert.ok(/area === 'session' && \('ai\.chatgpt\.pending' in ps/.test(code));
});
check('the plan says why it does not work now: no access, the usage limit, not this account\'s', async () => {
  await freshAI({'ai.engine': 'chatgpt'});
  ai.account = {...ACCOUNT};
  await page('readAccount()');
  page('paintAI()');
  // signed in, its sites taken back: a button to give them again
  assert.strictEqual(element('ai-plan-title').dataset.state, 'bad');
  assert.strictEqual(element('ai-plan-note').textContent, msg('opt_aiNoAccess', 'api.openai.com'));
  assert.strictEqual(element('ai-plan-allow').hidden, false);
  assert.strictEqual(element('ai-model-row').hidden, true);
  await element('ai-plan-allow').onclick();
  assert.deepStrictEqual(requested.map(o => [...o]), [PLAN_SITES]);
  assert.strictEqual(element('ai-plan-allow').hidden, true);
  assert.strictEqual(element('ai-model-row').hidden, false);
  // the usage limit: said, with Manage usage at hand
  ai.account = {...ACCOUNT, limit: true};
  await page('followPlan()');
  assert.strictEqual(element('ai-plan-title').dataset.state, 'wait');
  assert.strictEqual(element('ai-plan-note').textContent, msg('ai_err_limit'));
  assert.ok(element('ai-plan-text').kids.some(k => k.href === 'https://chatgpt.com/settings/usage'));
  // not this account's plan: said, and a new sign-in may allow it
  ai.account = {...ACCOUNT, plan: false};
  await page('followPlan()');
  assert.strictEqual(element('ai-plan-title').dataset.state, 'bad');
  assert.strictEqual(element('ai-plan-note').textContent, msg('ai_err_no_plan'));
  assert.strictEqual(element('ai-signin').hidden, false);
  assert.strictEqual(element('ai-signout').hidden, false);
  assert.strictEqual(element('ai-model-row').hidden, true);
  assert.strictEqual(element('ai-plan-plus').hidden, true);
});
check('Sign out: revoked and forgotten; OpenAI\'s API stays for an OpenAI key; an unconfirmed one says where to finish', async () => {
  await freshAI({'ai.engine': 'chatgpt', 'ai.openai.key': OPENAI_KEY});
  ai.account = {...ACCOUNT};
  [...PLAN_SITES, 'http://127.0.0.1/*'].forEach(o => granted.add(o));
  await page('readAccount()');
  await page('syncAIAccess()');
  await element('ai-signout').onclick();
  assert.ok(asked.some(([what]) => what === 'signOut'));
  assert.deepStrictEqual(removed, ['https://auth.openai.com/*', 'http://127.0.0.1/*'], 'api.openai.com stays for the key');
  assert.strictEqual(element('toast').textContent, msg('opt_aiSignedOut'));
  assert.strictEqual(element('ai-plan-note').hidden, true);
  assert.strictEqual(element('ai-signin').hidden, false);
  assert.strictEqual(focused, 'ai-signin');
  // OpenAI did not confirm it; no key: every site goes
  await freshAI({'ai.engine': 'chatgpt'});
  ai.account = {...ACCOUNT};
  ai.revoked = false;
  await page('readAccount()');
  await element('ai-signout').onclick();
  assert.deepStrictEqual(removed, [...PLAN_SITES, 'http://127.0.0.1/*']);
  assert.strictEqual(element('ai-plan-note').textContent, msg('opt_aiSignOutUnconfirmed'));
  assert.ok(/disconnect Mail Deck in your ChatGPT settings/.test(msg('opt_aiSignOutUnconfirmed')));
  // a key's Disconnect leaves OpenAI's API while the plan is signed in
  await freshAI({'ai.engine': 'openai', 'ai.openai.key': OPENAI_KEY});
  ai.account = {...ACCOUNT};
  await page('readAccount()');
  await element('ai-disconnect').onclick();
  assert.ok(!('ai.openai.key' in local));
  assert.deepStrictEqual(removed, [], 'api.openai.com stays for the plan');
});
check('the word after the first sign-in with the plan: once, with Got it', async () => {
  await freshAI({'ai.engine': 'chatgpt'});
  const dialog = element('ai-welcome');
  let shown = 0;
  // as a <dialog> does: close() fires close, as Esc does
  Object.assign(dialog, {open: false, showModal() {
    shown += 1;
    this.open = true;
  }, close() {
    this.open = false;
    this.onclose?.();
  }});
  try {
    ai.account = {...ACCOUNT, plan: false};
    await page('followPlan()');
    assert.strictEqual(shown, 0, 'not without the plan');
    ai.account = {...ACCOUNT};
    await page('followPlan()');
    assert.strictEqual(shown, 1);
    assert.strictEqual(focused, 'ai-welcome-ok');
    await page('followPlan()');
    assert.strictEqual(shown, 1, 'not twice while it is open');
    element('ai-welcome-ok').onclick();
    await tick();
    assert.strictEqual(dialog.open, false);
    assert.strictEqual(local['ai.chatgpt.welcomed'], true);
    assert.strictEqual(focused, 'ai-signout', 'the focus back in the card');
    await page('followPlan()');
    assert.strictEqual(shown, 1, 'once');
    // dismissed with Esc: seen as well
    delete local['ai.chatgpt.welcomed'];
    await page('followPlan()');
    dialog.close();
    await tick();
    assert.strictEqual(local['ai.chatgpt.welcomed'], true);
  }
  finally {
    delete dialog.showModal;
  }
  assert.strictEqual(msg('opt_aiWelcome'), 'You’re using your ChatGPT plan');
  assert.ok(/^Eligible AI requests in Mail Deck use the usage included in your ChatGPT plan\. Manage usage in your ChatGPT settings\.$/.test(msg('opt_aiWelcomeText')));
  assert.strictEqual(msg('opt_aiGotIt'), 'Got it');
  assert.ok(!('ai.chatgpt.welcomed' in page('DEFAULTS')), 'not a setting a backup carries');
});
check('a link to an engine (#ai-chatgpt, #ai-openai, …) picks it and focuses its next step', async () => {
  const go = async (hash, values = {}, account = null, sites = []) => {
    await freshAI(values);
    ai.account = account;
    sites.forEach(o => granted.add(o));
    await Promise.all([page('readAccount()'), page('syncAIAccess()')]);
    ctx.location.hash = hash;
    page('followHash()');
    return focused;
  };
  try {
    assert.strictEqual(await go('#ai-chatgpt'), 'ai-signin');
    assert.strictEqual(local['ai.engine'], 'chatgpt');
    assert.strictEqual(await go('#ai-zai'), 'ai-key');
    assert.strictEqual(local['ai.engine'], 'zai');
    assert.strictEqual(element('ai-key-label').textContent, msg('opt_aiKey', 'Z.ai'));
    assert.strictEqual(await go('#ai-openai'), 'ai-key');
    assert.strictEqual(await go('#ai-anthropic', {'ai.anthropic.key': ANTHROPIC_KEY}), 'ai-allow', 'a key without its site: give it');
    granted.add('https://api.anthropic.com/*');
    await page('syncAIAccess()');
    page('paintCloud(); followHash()');
    assert.strictEqual(focused, 'ai-model');
    assert.strictEqual(await go('#ai-builtin'), '(query)');
    assert.strictEqual(local['ai.engine'], 'builtin');
    assert.strictEqual(await go('#ai-chatgpt', {}, {...ACCOUNT}), 'ai-plan-allow', 'signed in without its sites: give them');
    assert.strictEqual(await go('#ai-chatgpt', {}, {...ACCOUNT}, PLAN_SITES), 'ai-model');
    assert.strictEqual(await go('#ai-chatgpt', {}, {...ACCOUNT, plan: false}, PLAN_SITES), 'ai-signin', 'no plan: sign in again');
    // nothing for an engine there is none of, or the AI off
    for (const hash of ['#ai-gemini', '#ai-off', '#ai', '#services', '']) {
      await go(hash, {'ai.engine': 'openai'});
      assert.strictEqual(page(`prefs['ai.engine']`), 'openai', hash);
      assert.strictEqual(set.length, 0, hash);
    }
  }
  finally {
    ctx.location.hash = '';
  }
  const code = fs.readFileSync(path.join(EXT, 'data/settings/index.js'), 'utf8');
  assert.ok(/\.then\(paintAI\)\.then\(followHash\)/.test(code) && /addEventListener\('hashchange', followHash\)/.test(code));
});
check('the AI buttons switch: on by default, saved, in a backup, and usable while the AI is off', () => {
  assert.strictEqual(page('DEFAULTS')['ai.buttons'], true);
  const row = /<label class="row"( data-ai)?>\s*<span class="text"><b data-i18n="aiButtons">[^<]*<\/b><small data-i18n="aiButtonsText">[^<]*<\/small><\/span>\s*<input type="checkbox" role="switch" data-key="ai\.buttons">/.exec(html);
  assert.ok(row, 'its row');
  assert.ok(!row[1], 'it does not fade with the AI off: that is when it matters');
  assert.strictEqual(msg('opt_aiButtons'), 'Show AI buttons while the assistant is off');
  assert.strictEqual(msg('opt_aiButtonsText'), 'The summary, reply and assistant buttons stay in the panel and offer to turn it on.');
  assert.strictEqual(msg('opt_aiReply'), 'Sort unread mail');
  assert.strictEqual(msg('opt_aiReplyText'), 'Finds mail waiting for your reply, important mail, and newsletters you can clear in one go.');
  assert.ok(/data-key="ai\.reply"/.test(html));
});
check('the AI card has its strings and loads the module before the page', () => {
  assert.ok(html.indexOf('<script src="../ai/ai.js">') > 0 && html.indexOf('<script src="../ai/ai.js">') < html.indexOf('<script src="index.js">'));
  for (const [, key] of html.matchAll(/data-i18n(?:-label)?="(ai\w*)"/g)) {
    assert.ok(en['opt_' + key]?.message, key);
  }
  for (const key of ['opt_aiPrivacy', 'opt_aiPrivacyLocal', 'opt_aiKeyText', 'opt_aiGetKey', 'opt_aiConnect', 'opt_aiDisconnect']) {
    assert.ok(en[key]?.message, key);
  }
  // the subscription note and the privacy note say what the spec asks
  assert.ok(/does not include API access/.test(en.opt_aiKeyText.message));
  assert.ok(/straight to \$1, with your key\. Mail Deck has no servers\./.test(en.opt_aiPrivacy.message));
  const manifest = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));
  assert.ok(manifest.permissions.includes('activeTab'));
  assert.ok(AI_SITES.every(o => manifest.optional_host_permissions.includes(o) && !manifest.host_permissions.includes(o)));
});

(async () => {
  for (const [name, fn] of checks) {
    await fn();
    n += 1;
    console.log('ok', name);
  }
  console.log(n, 'checks passed');
})().catch(e => {
  console.error(e);
  process.exit(1);
});
