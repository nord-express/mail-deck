'use strict';

// Every setting this page shows, with the background's defaults
const DEFAULTS = {
  'period': 120,
  'initialPeriod': 3,
  'network.watch': true,
  'idle.watch': true,
  'alphabetic': false,
  'notification': true,
  'notificationTime': 10,
  'notification.state.active': true,
  'notification.state.idle': true,
  'notification.state.locked': true,
  'notification.buttons.markasread': true,
  'notification.buttons.archive': true,
  'notification.buttons.trash': false,
  'combined': false,
  'threatAsNew': 10,
  'notificationFormat': chrome.i18n.getMessage('notification'),
  'notificationTruncate': 70,
  'silentTime': 10,
  'alert': true,
  'soundVolume': 80,
  'sound.state.active': true,
  'sound.state.idle': true,
  'sound.state.locked': true,
  'badge': true,
  'backgroundColor': '#e5484d',
  'minimal': true,
  'oldFashion': 0,
  'smartOpen': true,
  'currentTab': false,
  'newWindow': false,
  'ignoreOpens': false,
  'searchMode': true,
  'background': false,
  'relatedToCurrent': false,
  'onGmailNotification': true,
  'doReadOnArchive': true,
  'quiet.hours': false,
  'quiet.from': '22:00',
  'quiet.to': '08:00',
  'quiet.weekend': false,
  'notify.never': '',
  'notify.only': '',
  // minutes between repeats of a notification whose mail stays unread; 0: no repeat
  'notify.repeat': 0,
  // what the toolbar count shows: all unread mail, or the mail since the panel was last opened
  'badge.count': 'all',
  'panelScale': 1,
  'readOnOpen': false,
  // an action in an open message opens the next one instead of the list
  'autoAdvance': false,
  'senderLogos': true,
  // Gmail's own categories as chips over the panel's list, and the searches saved as chips there
  'gmailCategories': true,
  'savedSearches': [],
  // the other mail services turned on (core/services/)
  'services': [],
  // the AI (data/ai/ai.js): which engine, each one's model, what it does. The keys and the
  // ChatGPT sign-in are kept apart from these (AI_SECRETS): never in a backup, in Chrome sync
  // or on the screen.
  'ai.engine': 'off',
  'ai.chatgpt.model': '',
  'ai.openai.model': '',
  'ai.anthropic.model': '',
  'ai.zai.model': '',
  'ai.summary': 'click',
  'ai.reply': true,
  // a quicker, cheaper model of the engine for sorting and searching the mail (data/ai/ai.js)
  'ai.fast': true,
  // the panel's AI buttons while the AI is off: they offer to turn it on
  'ai.buttons': true,
  'sync.settings': false
};
const AI_ENGINES = ['off', 'builtin', 'chatgpt', 'openai', 'anthropic', 'zai'];
// the providers of a key: its page, the subscription that does not give one (plan), a word under the field (hint)
const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI', plan: 'ChatGPT Plus', hint: 'aiOpenAIHint', origin: 'https://api.openai.com/*', host: 'api.openai.com',
    keys: 'https://platform.openai.com/api-keys', placeholder: 'sk-…'
  },
  anthropic: {
    name: 'Anthropic', hint: 'aiAnthropicHint', origin: 'https://api.anthropic.com/*', host: 'api.anthropic.com',
    keys: 'https://console.anthropic.com/settings/keys', placeholder: 'sk-ant-…'
  },
  zai: {
    name: 'Z.ai', hint: 'aiZaiHint', origin: 'https://api.z.ai/*', host: 'api.z.ai',
    keys: 'https://z.ai/manage-apikey/apikey-list', placeholder: ''
  }
};
// the ChatGPT plan: a sign-in instead of a key, which needs OpenAI's API, its sign-in site and,
// while it is underway, the loopback address it comes back to (data/ai/ai.js)
const AI_PLAN = {
  name: 'ChatGPT', origins: ['https://api.openai.com/*', 'https://auth.openai.com/*'], host: 'api.openai.com',
  loopback: 'http://127.0.0.1/*', usage: 'https://chatgpt.com/settings/usage'
};
const AI_KEYS = Object.keys(AI_PROVIDERS).map(id => `ai.${id}.key`);
const AI_SECRETS = [...AI_KEYS, 'ai.chatgpt.auth', 'ai.chatgpt.client', 'ai.chatgpt.host'];
const AI_ORIGINS = [...new Set([...Object.values(AI_PROVIDERS).map(p => p.origin), ...AI_PLAN.origins, AI_PLAN.loopback])];
const SERVICES = Object.values(self.MailServices || {});
// the default sound and five special ones, each a type (0-3 built in, 4 own file), a file and a mime
const MEDIA = ['default', 'custom0', 'custom1', 'custom2', 'custom3', 'custom4'].map(n => 'notification.sound.media.' + n);
for (const m of MEDIA) {
  DEFAULTS[m + '.type'] = 0;
}
for (const m of MEDIA.slice(1)) {
  DEFAULTS[m + '.selector'] = 0;
  DEFAULTS[m + '.filter'] = '';
}
for (let i = 0; i < 10; i += 1) {
  DEFAULTS['feeds_' + i] = '';
}
const SOUNDS = ['soundChime', 'soundBell', 'soundDing', 'soundClassic'];
const SWATCHES = ['#e5484d', '#4352e3', '#169b62', '#d9822b', '#8b55d9', '#4f5b6b'];
// an inbox's colour, as the panel gives it (data/panel/index.js)
const PALETTE = ['#3567e6', '#169b62', '#d9822b', '#d23f3a', '#8b55d9', '#138fa8', '#c9447f', '#5e7a1f', '#a8612a', '#4f5b6b'];
const ADD_ACCOUNT = 'https://accounts.google.com/AddSession?continue=https://mail.google.com/mail/';
// What a setting may hold beyond its type: what this page offers, and what an older or
// hand-edited backup can sensibly bring. Anything else in a backup is left out.
const int = (min, max) => v => Number.isInteger(v) && v >= min && v <= max;
const oneOf = (...list) => v => list.includes(v);
const upTo = n => v => v.length <= n;
const TIME = v => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
// a model id as the providers write them (gpt-5-mini, claude-opus-5-5, glm-5.3, o4-mini); empty: not picked yet
const MODEL = v => /^([\w][\w.:\/-]{0,99})?$/.test(v);
const VALID = {
  'period': int(30, 3600), // seconds; Chrome's alarms come no faster than every 30 s
  'initialPeriod': int(0, 600),
  'notificationTime': int(1, 600),
  'threatAsNew': int(0, 43200), // minutes
  'notificationTruncate': int(10, 10000),
  'silentTime': int(1, 1440), // minutes
  'soundVolume': int(0, 100), // an audio volume over 100% throws, and no sound plays at all
  'oldFashion': oneOf(0, 1, 2),
  'panelScale': v => v >= 0.5 && v <= 2,
  'backgroundColor': v => /^#[0-9a-f]{6}$/i.test(v),
  'quiet.from': TIME,
  'quiet.to': TIME,
  'notificationFormat': upTo(2000),
  'notify.never': upTo(20000),
  'notify.only': upTo(20000),
  'notify.repeat': oneOf(0, 5, 15, 30, 60), // minutes
  'badge.count': oneOf('all', 'new'),
  'ai.engine': oneOf(...AI_ENGINES),
  'ai.summary': oneOf('off', 'click', 'auto'),
  'ai.chatgpt.model': MODEL,
  'ai.openai.model': MODEL,
  'ai.anthropic.model': MODEL,
  'ai.zai.model': MODEL
};
for (const m of MEDIA.slice(1)) {
  VALID[m + '.selector'] = oneOf(0, 1, 2);
  VALID[m + '.filter'] = upTo(200);
}
for (let i = 0; i < 10; i += 1) {
  VALID['feeds_' + i] = upTo(2000);
}

const store = chrome.storage.local;
// what the background last read: one object per inbox, label and mailbox
const sessionObjects = () => chrome.storage.session.get({'cached-objects': []}).then(r => r['cached-objects'] || []);
// Gmail's accounts by address, each with its slot in the browser, /mail/u/<n>, where its labels
// belonged up to 1.5 (feeds_<n>). A mailbox of another service is not one: Proton's links have a /u/<n> too.
const gmailSlots = objs => {
  const slot = {};
  for (const o of objs) {
    const m = o?.xml?.service ? null : /\/u\/(\d+)/.exec(o?.xml?.rootLink || o?.xml?.link || '');
    if (m && o.xml.title && Number(m[1]) < 10) {
      slot[o.xml.title] = Number(m[1]);
    }
  }
  return slot;
};
// the page's strings live in _locales as opt_*; English stays in the HTML as the fallback
const t = (key, ...subs) => chrome.i18n.getMessage('opt_' + key, subs.map(String)) || key;
const $ = id => document.getElementById(id);
const h = (tag, props, ...kids) => {
  const el = Object.assign(document.createElement(tag), props);
  el.append(...kids.filter(k => k !== null && k !== undefined && k !== false));
  return el;
};
let prefs = {};

/* saving: the rail says how it went (ui.js); a toast is for what a button did */
let toastTimer;
const toast = (text, bad = false) => {
  const el = $('toast');
  el.textContent = text;
  el.classList.toggle('bad', bad);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), bad ? 5000 : 2400);
};
const save = values => {
  Object.assign(prefs, values);
  const saving = store.set(values);
  self.UI?.saved(saving);
  return saving.then(() => {
    if (prefs['sync.settings']) {
      pushSync();
    }
  }, e => {
    // the rail says it; a page without ui.js, a toast
    if (!self.UI) {
      toast(e.message, true);
    }
  });
};
// a question before what cannot be undone: the page's own dialog (ui.js), or the browser's
const askFirst = (text, options) => (self.UI?.confirm || (m => Promise.resolve(confirm(m))))(text, options);
// a page that reloads itself says why once it is back
const reloadWith = text => {
  try {
    sessionStorage.setItem('toast', text);
  }
  catch (e) {}
  location.reload();
};

// a row that depends on a switch fades out while the switch is off
const syncNeeds = () => {
  for (const row of document.querySelectorAll('[data-needs]')) {
    const on = prefs[row.dataset.needs];
    row.classList.toggle('off', !on);
    row.querySelectorAll('input, select, button, textarea').forEach(el => el.disabled = !on);
  }
};

/* plain fields: data-key names the stored setting; only: which of them to paint */
const paintFields = (only = () => true) => {
  for (const el of document.querySelectorAll('[data-key]')) {
    if (!only(el.dataset.key)) {
      continue;
    }
    const value = prefs[el.dataset.key];
    if (el.type === 'checkbox') {
      el.checked = el.hasAttribute('data-invert') ? !value : value;
    }
    // one of a segmented control's choices
    else if (el.type === 'radio') {
      el.checked = el.value === String(value);
    }
    else {
      if (el.tagName === 'SELECT' && ![...el.options].some(o => o.value === String(value))) {
        el.add(new Option(t('custom', value), value));
      }
      el.value = value;
    }
  }
  const mode = prefs.currentTab ? 'current' : prefs.newWindow ? 'window' : 'tab';
  document.querySelector(`input[name="open"][value="${mode}"]`).checked = true;
  // a text size the control does not offer (a backup, a hand-edited one) gets a choice of its own
  for (const group of document.querySelectorAll('.segmented')) {
    const radios = [...group.querySelectorAll('input[data-key]')];
    if (radios.length && only(radios[0].dataset.key) && !radios.some(r => r.checked)) {
      const value = prefs[radios[0].dataset.key];
      const input = h('input', {type: 'radio', name: radios[0].name, value: String(value), checked: true});
      Object.assign(input.dataset, radios[0].dataset);
      group.append(h('label', {}, input, h('span', {textContent: new Intl.NumberFormat(uiLang(), {style: 'percent'}).format(value)})));
    }
  }
};
// quiet hours that start when they end quiet nothing (core/utils/quiet.js): the row says so
const paintQuiet = () => {
  $('quiet-same').hidden = prefs['quiet.from'] !== prefs['quiet.to'];
  // the day's bar, the line on when it is quiet, the hero's chip
  self.UI?.quiet();
};
document.addEventListener('change', ({target}) => {
  const key = target.dataset.key;
  if (key) {
    let value = target.value;
    if (target.type === 'checkbox') {
      value = target.hasAttribute('data-invert') ? !target.checked : target.checked;
    }
    else if (target.dataset.type === 'number') {
      value = Number(value);
    }
    // a cleared time keeps the one before it
    else if (target.type === 'time') {
      if (!/^\d\d:\d\d/.test(value)) {
        target.value = prefs[key];
        return;
      }
      value = value.slice(0, 5);
    }
    save({[key]: value});
    syncNeeds();
    paintQuiet();
    if (key === 'sync.settings' && !value) {
      dropSync();
    }
  }
  else if (target.name === 'open') {
    save({currentTab: target.value === 'current', newWindow: target.value === 'window'});
  }
  else if (target.name === 'ai.engine') {
    pickEngine(target.value);
  }
});

/* badge colour: a few presets and any other colour */
const paintSwatches = () => {
  const color = prefs.backgroundColor;
  const pick = h('input', {type: 'color', className: 'pick', title: t('anyColour'), value: SWATCHES.includes(color) ? '#e5484d' : color});
  pick.classList.toggle('on', !SWATCHES.includes(color));
  pick.setAttribute('aria-label', t('anyColour'));
  pick.onchange = () => save({backgroundColor: pick.value}).then(paintSwatches);
  $('swatches').replaceChildren(...SWATCHES.map(c => {
    const input = h('input', {type: 'radio', name: 'swatch', value: c, checked: c === color, title: c});
    input.style.setProperty('--c', c);
    input.setAttribute('aria-label', c);
    input.onchange = () => save({backgroundColor: c}).then(paintSwatches);
    return input;
  }), pick);
};

/* sounds */
const pickFile = () => new Promise((resolve, reject) => {
  const input = $('file');
  input.value = '';
  input.oncancel = () => reject(Error('cancelled'));
  input.onchange = () => {
    const file = input.files[0];
    if (!file || !(file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
      toast(t('pickAudio'));
      return reject(Error('not audio'));
    }
    const reader = new FileReader();
    reader.onload = () => resolve({data: reader.result, type: file.type});
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  };
  input.click();
});
const soundPicker = media => {
  const select = h('select', {}, ...SOUNDS.map((name, i) => h('option', {value: i, textContent: t(name)})),
    h('option', {value: 4, textContent: t('ownFile')}));
  select.setAttribute('aria-label', t('sound'));
  select.value = prefs[media + '.type'];
  select.onchange = () => {
    if (select.value !== '4') {
      return save({[media + '.type']: Number(select.value)});
    }
    pickFile().then(file => save({[media + '.file']: file.data, [media + '.mime']: file.type, [media + '.type']: 4}))
      .catch(() => select.value = prefs[media + '.type']);
  };
  return select;
};

// special sounds: up to five "when this contains that, play this" rules
const shownRules = new Set();
const paintRules = () => {
  MEDIA.slice(1).forEach((m, i) => prefs[m + '.filter'] && shownRules.add(i));
  $('sound-rules').replaceChildren(...[...shownRules].sort().map(i => {
    const m = MEDIA[i + 1];
    const field = h('select', {}, ...['ruleSender', 'ruleSubject', 'ruleText'].map((name, v) => h('option', {value: v, textContent: t(name)})));
    field.setAttribute('aria-label', t('ruleField'));
    field.value = prefs[m + '.selector'];
    field.onchange = () => save({[m + '.selector']: Number(field.value)});
    const word = h('input', {type: 'text', value: prefs[m + '.filter'], placeholder: t('rulePlaceholder'), spellcheck: false});
    word.setAttribute('aria-label', t('rulePlaceholder'));
    word.onchange = () => save({[m + '.filter']: word.value.trim()});
    const remove = h('button', {type: 'button', className: 'icon-btn', title: t('ruleRemove')}, self.UI?.icon('close') || '×');
    remove.setAttribute('aria-label', t('ruleRemove'));
    remove.onclick = () => {
      shownRules.delete(i);
      // the row and its button go: the focus stays in the list, on adding another
      save({[m + '.filter']: '', [m + '.selector']: 0, [m + '.type']: 0}).then(() => {
        paintRules();
        $('add-rule').focus();
      });
    };
    const row = h('div', {className: 'rule'}, field, word, soundPicker(m), remove);
    row.dataset.rule = i;
    return row;
  }));
  $('add-rule').hidden = shownRules.size >= 5;
  syncNeeds();
};
$('add-rule').onclick = () => {
  const free = [0, 1, 2, 3, 4].find(i => !shownRules.has(i));
  shownRules.add(free);
  paintRules();
  // the rows go in their order, so the new one is not always the last
  $('sound-rules').querySelector(`[data-rule="${free}"] input`).focus();
};

/* saved searches: each a chip in the panel that asks Gmail what it finds (data/panel/index.js) */
const SAVED_MAX = 10;
// What one may hold, from this page or a backup: a name, a Gmail search, and the address of the
// inbox it searches, or none for every one. One without a search is not kept.
const cleanSaved = list => (Array.isArray(list) ? list : []).filter(x => x && typeof x === 'object' && typeof x.query === 'string')
  .map(x => ({
    name: typeof x.name === 'string' ? x.name.trim().slice(0, 60) : '',
    query: x.query.trim().slice(0, 500),
    account: typeof x.account === 'string' && x.account.includes('@') && x.account.length <= 320 ? x.account : ''
  })).filter(x => x.query).slice(0, SAVED_MAX);
// the rows on the page: a new one stays here, unsaved, until it has a search
let savedRows = null;
const saveSaved = () => save({savedSearches: cleanSaved(savedRows)});
const paintSaved = async () => {
  savedRows ||= cleanSaved(prefs.savedSearches);
  const {accounts} = await store.get({accounts: {}});
  // the Gmail inboxes, and one a search names that is signed out now
  const gmails = Object.keys(accounts).filter(name => name.includes('@') && !accounts[name]?.service);
  $('saved-list').replaceChildren(...savedRows.map((x, i) => {
    const name = h('input', {type: 'text', value: x.name, placeholder: t('savedName'), maxLength: 60});
    name.setAttribute('aria-label', t('savedName'));
    name.onchange = () => {
      savedRows[i].name = name.value.trim();
      saveSaved();
    };
    const query = h('input', {type: 'text', value: x.query, placeholder: t('savedQueryHint'), spellcheck: false, maxLength: 500, dir: 'auto'});
    query.setAttribute('aria-label', t('savedQuery'));
    query.onchange = () => {
      savedRows[i].query = query.value.trim();
      saveSaved();
    };
    const account = h('select', {}, h('option', {value: '', textContent: t('savedAll')}),
      ...[...new Set([...gmails, x.account].filter(Boolean))].map(a => h('option', {value: a, textContent: a})));
    account.value = x.account;
    account.setAttribute('aria-label', t('savedIn'));
    account.onchange = () => {
      savedRows[i].account = account.value;
      saveSaved();
    };
    const remove = h('button', {type: 'button', className: 'icon-btn', title: t('savedRemove')}, self.UI?.icon('close') || '×');
    remove.setAttribute('aria-label', t('savedRemove'));
    // the row and its button go: the focus stays in the list, on adding another
    remove.onclick = () => {
      savedRows.splice(i, 1);
      saveSaved().then(paintSaved).then(() => $('add-saved').focus());
    };
    return h('div', {className: 'saved'}, name, query, account, remove);
  }));
  $('add-saved').hidden = savedRows.length >= SAVED_MAX;
};
$('add-saved').onclick = () => {
  savedRows.push({name: '', query: '', account: ''});
  paintSaved().then(() => $('saved-list').lastElementChild?.querySelector('input')?.focus());
};

/* inboxes */
const cleanLabels = value => value.split(',')
  .map(tag => tag.trim().replace(/^"|"$/g, '').replace(/[\s/]+/g, '-').toLowerCase())
  .filter((tag, i, all) => tag && all.indexOf(tag) === i)
  .join(', ');
// the Primary tab has a feed of its own, watched like a label in place of the inbox
const PRIMARY = '^smartlabel_personal';
const hasPrimary = value => value.split(',').map(s => s.trim()).includes(PRIMARY);
const withPrimary = (value, on) => {
  const list = value.split(',').map(s => s.trim()).filter(Boolean);
  if (on) {
    return list.includes(PRIMARY) ? list : list.includes('inbox') ? list.map(l => l === 'inbox' ? PRIMARY : l) : [PRIMARY, ...list];
  }
  const rest = list.filter(l => l !== PRIMARY && l !== 'inbox');
  return rest.length ? ['inbox', ...rest] : [];
};
// each inbox row's switches, so that a change made elsewhere (the toolbar menu, a check that
// finds a new inbox) shows here: in place, or with the list drawn again when inboxes come or go
const accountRows = new Map();
const accountsShape = accounts => JSON.stringify(Object.entries(accounts || {}).map(([name, o]) => [name, o?.service || '']));
let shownShape = null;
// the inboxes as last read: the services' rows say which of them they read
let shownAccounts = {};
const followAccounts = accounts => {
  if (accountsShape(accounts) !== shownShape) {
    return paintAccounts();
  }
  shownAccounts = accounts;
  for (const [name, row] of accountRows) {
    row.toggle.checked = accounts[name]?.ignored !== true;
    row.notify.checked = accounts[name]?.quiet !== true;
    row.count.checked = accounts[name]?.uncounted !== true;
    row.paintShown();
  }
  paintServiceLines();
  self.UI?.status();
};
// no inbox yet: how to get one
const noInboxes = () => {
  const check = h('button', {type: 'button', className: 'btn'}, self.UI?.icon('refresh') || '', h('span', {textContent: t('checkNow')}));
  // the button keeps the focus while the check runs: aria-disabled, not disabled
  check.onclick = () => {
    if (check.getAttribute('aria-disabled') === 'true') {
      return;
    }
    check.setAttribute('aria-disabled', 'true');
    chrome.runtime.sendMessage({method: 'update', forced: true}).catch(() => {});
    setTimeout(() => check.setAttribute('aria-disabled', 'false'), 4000);
  };
  return h('div', {className: 'empty'},
    h('span', {className: 'tile48'}, self.UI?.icon('mail') || ''),
    h('b', {textContent: t('noInboxesTitle')}),
    h('p', {textContent: t('noInboxes')}),
    h('span', {className: 'inline'},
      h('a', {className: 'btn primary', href: ADD_ACCOUNT, target: '_blank', rel: 'noopener', textContent: t('signInGmail')}),
      check,
      h('a', {className: 'btn quiet', href: '#services', textContent: t('services')})));
};
// A Gmail account's labels go by its address ('labels'), since its slot moves when an account
// before it signs out; one set by the slot before 1.6 shows until the background moves it there.
const labelsOf = (byAddress, name, n) => typeof byAddress[name] === 'string' ? byAddress[name] : prefs['feeds_' + n] || '';
const saveLabels = (name, value) => store.get({labels: {}}).then(p => save({labels: {...p.labels, [name]: value}}));
const paintAccounts = async () => {
  const {accounts, avatars, labels: byAddress} = await store.get({accounts: {}, avatars: {}, labels: {}});
  // labels belong to a Gmail account, found by its slot in the browser
  const objs = await sessionObjects();
  const slot = gmailSlots(objs);
  accountRows.clear();
  shownShape = accountsShape(accounts);
  shownAccounts = accounts;
  paintServiceLines();
  const names = Object.keys(accounts);
  if (names.length === 0) {
    $('account-list').replaceChildren(noInboxes());
    self.UI?.status();
    return;
  }
  $('account-list').replaceChildren(...names.map(name => {
    // one account's change keeps what is stored for the others
    const update = values => store.get({accounts: {}}).then(p => {
      p.accounts[name] = {...p.accounts[name], ...values};
      return save({accounts: p.accounts});
    });
    // a chip says its state with a check as well as its colour
    const chip = (text, checked, onchange, className = '') => h('label', {className: ('chip ' + className).trim()},
      h('input', {type: 'checkbox', checked, onchange}), h('span', {}, self.UI?.icon('done', 'ck') || '', h('span', {textContent: text})));

    const toggle = h('input', {type: 'checkbox', checked: accounts[name].ignored !== true});
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-label', t('showInbox', name));
    // a quiet inbox stays in the panel and the badge, without notifications or sound
    const notify = chip(t('notifyChip'), accounts[name].quiet !== true, ev => {
      update({quiet: !ev.target.checked});
      paintShown();
    });
    // an inbox out of the count stays in the panel and notifies; the number on the toolbar icon leaves it out
    const count = chip(t('countChip'), accounts[name].uncounted !== true, ev => update({uncounted: !ev.target.checked}), 'adv');
    count.title = t('countHint');
    count.dataset.adv = 'count';
    const n = slot[name];
    let primary = null;
    let labels = null;
    if (n !== undefined && !accounts[name].service) {
      labels = h('input', {type: 'text', className: 'labels', value: labelsOf(byAddress, name, n), placeholder: t('labelsPlaceholder'), spellcheck: false});
      labels.setAttribute('aria-label', t('labelsFor', name));
      labels.onchange = () => {
        labels.value = cleanLabels(labels.value);
        primary.firstChild.checked = hasPrimary(labels.value);
        saveLabels(name, labels.value);
      };
      primary = chip(t('primaryChip'), hasPrimary(labels.value), ev => {
        labels.value = cleanLabels(withPrimary(labels.value, ev.target.checked).join(', '));
        saveLabels(name, labels.value);
      }, 'adv');
      labels.classList.add('adv');
    }
    // the labels as chips (ui.js), written into the field above, which saves them; Primary is a chip of its own
    let words = null;
    let field = labels;
    let note = null;
    if (labels) {
      primary.dataset.adv = 'primary';
      labels.hidden = true;
      words = self.UI?.tokenField(labels, {commas: true, keep: [PRIMARY], label: t('labelsFor', name),
        // nothing typed watches the inbox, or the Primary tab when that is on
        placeholder: list => list.length || hasPrimary(labels.value) ? t('labelsPlaceholder') : 'inbox'});
      field = h('div', {className: 'labels-field adv'}, labels, words?.box || '', h('small', {textContent: t('labelsHint')}));
      field.dataset.adv = 'labels';
      // only while Primary is on: it reads a feed Google does not document
      note = h('small', {className: 'adv', textContent: t('primaryHint')});
    }
    const options = h('span', {className: 'options'}, h('span', {className: 'chips'}, notify, count, primary), field, note);
    // a chip changed: the labels' chips and the word on Primary follow
    options.onchange = () => {
      words?.paint();
      if (note) {
        note.hidden = !primary.firstChild.checked;
      }
    };
    options.onchange();
    // the line under the address: an inbox switched off, or one without a sound
    const state = h('small');
    const row = h('div', {className: 'row acc'});
    const paintShown = () => {
      options.classList.toggle('off', !toggle.checked);
      options.querySelectorAll('input, button').forEach(el => el.disabled = !toggle.checked);
      row.classList.toggle('muted', !toggle.checked);
      state.textContent = !toggle.checked ? t('offHint') : notify.firstChild.checked ? '' : t('quietHint');
      state.hidden = !state.textContent;
    };
    toggle.onchange = () => {
      paintShown();
      update({ignored: !toggle.checked});
    };
    paintShown();
    accountRows.set(name, {toggle, notify: notify.firstChild, count: count.firstChild, paintShown});
    const service = self.MailServices?.[accounts[name].service];
    // the panel's colour for the inbox: that of its first mailbox in the background's list
    const at = objs.findIndex(o => o?.xml?.title === name);
    const color = PALETTE[(at === -1 ? names.indexOf(name) : at) % PALETTE.length];
    row.append(
      self.UI?.avatar(name, color, avatars?.[name]?.url, service) || h('span', {className: 'avatar', textContent: name[0].toUpperCase()}),
      h('span', {className: 'text'},
        h('b', {className: 'addr'}, h('bdi', {textContent: name}), service && h('span', {className: 'tag', textContent: service.name})),
        state, options),
      toggle);
    return row;
  }));
  self.UI?.status();
};

/* the other mail services: each asks Chrome for its sites when it is turned on */
// A switch shows on only while the settings want the service and Chrome gives it its sites (the
// background checks both). One the settings want without the sites, as after a restore on
// another computer, says so, with a button that asks for them. The rows stay; their state follows in place.
const serviceRows = new Map();
const asking = new Set();
const syncServices = async () => {
  const granted = await Promise.all(SERVICES.map(s => chrome.permissions.contains({origins: s.origins}).catch(() => false)));
  SERVICES.forEach((s, i) => {
    const row = serviceRows.get(s.id);
    if (row && !asking.has(s.id)) {
      const wanted = (prefs.services || []).includes(s.id);
      row.toggle.checked = wanted && granted[i];
      row.note.hidden = !wanted || granted[i];
    }
  });
  paintServiceLines();
  self.UI?.status();
};
// under a service's name: the mailboxes it reads, or its site and where to sign in
const paintServiceLines = () => {
  for (const [id, row] of serviceRows) {
    const boxes = Object.keys(shownAccounts || {}).filter(name => shownAccounts[name]?.service === id);
    const signIn = h('a', {href: row.service.signIn, target: '_blank', rel: 'noopener', textContent: t('serviceSignIn')});
    row.line.replaceChildren(...(row.toggle.checked && boxes.length ? [t('reading', boxes.join(', '))] :
      [new URL(row.service.hosts[0]).host, ' · ', signIn]));
  }
};
const paintServices = () => {
  serviceRows.clear();
  $('service-list').replaceChildren(...SERVICES.map(s => {
    const toggle = h('input', {type: 'checkbox'});
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-label', s.name);
    // wanted without its sites: a word, and a button that asks Chrome for them from its click
    const allow = h('button', {type: 'button', className: 'btn sm', textContent: t('aiAllow')});
    allow.onclick = () => chrome.permissions.request({origins: s.origins}).catch(() => false).then(() => syncServices());
    const note = h('div', {className: 'notice', id: 'service-note-' + s.id, hidden: true},
      self.UI?.icon('alert') || '', h('span', {textContent: t('serviceAccess', s.name)}), allow);
    toggle.setAttribute('aria-describedby', note.id);
    toggle.onchange = () => {
      const on = toggle.checked;
      asking.add(s.id);
      // Chrome asks only from the click itself, before anything is awaited
      const asked = on ? chrome.permissions.request({origins: s.origins}) : chrome.permissions.remove({origins: s.origins});
      asked.catch(() => false).then(ok => {
        // on with its sites, or off; a refusal turns it off in the settings too
        const ids = prefs.services.filter(id => id !== s.id);
        const next = on && ok ? [...ids, s.id] : ids;
        if (next.join() !== prefs.services.join()) {
          return save({services: next});
        }
      }).finally(() => {
        asking.delete(s.id);
        syncServices();
      });
    };
    const line = h('small', {className: 'svc-line'});
    serviceRows.set(s.id, {toggle, note, line, service: s});
    return h('div', {className: 'row svc-row'},
      h('span', {className: 'tile', textContent: s.name[0]}),
      h('span', {className: 'text'}, h('b', {textContent: s.name}), line),
      toggle, note);
  }));
  paintServiceLines();
  return syncServices();
};
// a backup or a reset that leaves services off gives Chrome back their sites
const revokeOff = ids => {
  const origins = SERVICES.filter(s => !ids.includes(s.id)).flatMap(s => s.origins);
  return origins.length ? chrome.permissions.remove({origins}).catch(() => false) : Promise.resolve(true);
};
// A link to a part of the page: #services, #ai, #quiet, or any other id, the panel's among them.
// What waits under its section's More options is shown first, then it comes into view. A link to
// an engine (#ai-chatgpt) is followHash's; one to no engine there is (#ai-off) goes to the AI.
const followSection = () => {
  let id = '';
  try {
    id = decodeURIComponent(location.hash.slice(1));
  }
  catch (e) {}
  const engine = /^ai-([a-z]+)$/.exec(id)?.[1];
  if (!id || (engine && engine !== 'off' && AI_ENGINES.includes(engine))) {
    return null;
  }
  const el = document.getElementById(id) || (engine ? $('ai') : null);
  if (!el) {
    return null;
  }
  self.UI?.reveal(el);
  el.scrollIntoView({block: 'start'});
  return el;
};
$('forget').onclick = () => store.remove('accounts').then(() => {
  toast(t('forgotten'));
  paintAccounts();
});

/* AI: an engine, a provider's key or the ChatGPT sign-in, a model, and what it does (self.AI, data/ai/ai.js) */
// The page works without the module as well: the card then says the AI is not available.
const aiModule = () => self.AI;
const uiLang = () => chrome.i18n.getUILanguage();
// each provider's key as chrome.storage.local holds it: never in prefs (a backup's source),
// never written into the page; the field is for a new key only
let aiKeys = {};
// the ChatGPT plan as the module tells it, {email, plan, limit} or null: never a token
let aiAccount = null;
// while a sign-in waits in its tab; what went wrong with the last one, or a sign-out OpenAI did not confirm
let aiSigning = false;
let aiPlanNote = '';
// whether Chrome gives the provider's site: a key without it is of no use
const aiAccess = {};
// the models a provider's key may use, as this page last heard, or {error}
const aiLists = {};
const aiListing = new Set();
let aiConnecting = false;
// while this page downloads the built-in model: {part}, the fraction done when Chrome says it
let aiDownload = null;
let aiPoll;
let builtinRun = 0;
let builtinLang = '';
// what the built-in model's card last showed (AI_BUILTIN's states): its badge and the hero say it
let builtinShown = '';
const aiKeyOf = engine => aiKeys[`ai.${engine}.key`] || '';
const aiModelKey = engine => `ai.${engine}.model`;
// an engine with what it needs to list its models: a key, or the plan signed in
const aiReady = engine => AI_PROVIDERS[engine] ? Boolean(aiKeyOf(engine)) : engine === 'chatgpt' && Boolean(aiAccount);
const readAIKeys = () => store.get(Object.fromEntries(AI_KEYS.map(k => [k, '']))).then(r => {
  aiKeys = r;
});
const readAccount = () => Promise.resolve().then(() => aiModule()?.chatgpt?.account()).catch(() => null).then(a => {
  // signed in or out, or another account: its models are asked for anew
  if (Boolean(a) !== Boolean(aiAccount) || a?.email !== aiAccount?.email) {
    delete aiLists.chatgpt;
  }
  aiAccount = a && typeof a === 'object' ? a : null;
});
// the sites another engine still needs: a key kept, or the plan signed in
const aiNeeded = except => new Set([
  ...Object.keys(AI_PROVIDERS).filter(id => id !== except && aiKeyOf(id)).map(id => AI_PROVIDERS[id].origin),
  ...(except !== 'chatgpt' && aiAccount ? AI_PLAN.origins : [])
]);
const aiOrigins = engine => AI_PROVIDERS[engine] ? [AI_PROVIDERS[engine].origin] : AI_PLAN.origins;
const syncAIAccess = async () => {
  const ids = [...Object.keys(AI_PROVIDERS), 'chatgpt'];
  const granted = await Promise.all(ids.map(id => chrome.permissions.contains({origins: aiOrigins(id)}).catch(() => false)));
  ids.forEach((id, i) => {
    // access given again (or taken) asks for the list anew
    if (aiAccess[id] !== granted[i]) {
      delete aiLists[id];
    }
    aiAccess[id] = granted[i] === true;
  });
};

// What went wrong, in words that say what to do: an AIError's code (data/ai/ai.js) or the page's
// own (no-models). The module's messages (ai_err_*) serve where they need nothing of this page.
const aiErrorText = (e, engine) => {
  const p = AI_PROVIDERS[engine];
  const code = e?.code;
  if (code === 'aborted') {
    return '';
  }
  // the plan has no key: what OpenAI said keeps it out (a region, say), or its sites not given
  if (engine === 'chatgpt' && (code === 'auth' || code === 'no-access' || code === 'model' || code === 'no-models')) {
    return code === 'auth' ? e.message || t('aiErrOther') : code === 'no-access' ? t('aiPlanAccess') : t('aiPlanNoModels');
  }
  if (code === 'auth') {
    return t('aiErrAuth', p ? p.name : '');
  }
  if (code === 'no-access') {
    return t('aiErrAccess', p ? p.host : '');
  }
  if (code === 'model' || code === 'no-models') {
    return t('aiNoModels');
  }
  return (typeof code === 'string' && chrome.i18n.getMessage('ai_err_' + code.replace(/-/g, '_'))) || t('aiErrOther');
};
// the provider a key's form names: Anthropic's start with sk-ant-, OpenAI's with sk- (sk-proj-…)
const aiKeyProvider = key => /^sk-ant-/.test(key) ? 'anthropic' : /^sk-/.test(key) ? 'openai' : '';
// the model a key gets until one is picked: the one data/ai/ai.js marks, else as it picks one
// (the lists come newest first)
const aiDefaultModel = (engine, list) => {
  const marked = list.find(m => m.default);
  if (marked) {
    return marked.id;
  }
  const ids = list.map(m => m.id);
  if (engine === 'anthropic') {
    return ids.includes('claude-opus-5-5') ? 'claude-opus-5-5' : ids[0] || '';
  }
  return ids.find(id => /^gpt-\d+(\.\d+)?-mini$/.test(id)) || ids.find(id => id.startsWith('gpt-')) || ids[0] || '';
};
const aiPrefsFor = engine => ({
  engine, model: prefs[aiModelKey(engine)] || '', summary: prefs['ai.summary'], reply: prefs['ai.reply'],
  ...(AI_PROVIDERS[engine] ? {key: aiKeyOf(engine)} : {})
});
// a setting the page sets on its own, as a model picked for a new key: saved without a toast
const keep = values => {
  Object.assign(prefs, values);
  return store.set(values).then(() => prefs['sync.settings'] && pushSync(), () => {});
};

/* the built-in model: what Chrome says of it, and its one-time download */
// each state's line: a title, a word under it, and the Download button or the meter with it
const AI_BUILTIN = {
  'checking': {title: 'aiChecking', state: 'wait'},
  'available': {title: 'aiReady', text: 'aiReadyText', state: 'ok'},
  'downloadable': {title: 'aiNeedsDownload', text: 'aiNeedsDownloadText', state: 'wait', download: true},
  'downloading': {title: 'aiDownloading', state: 'wait', meter: true},
  'unavailable': {title: 'aiUnavailable', text: 'aiUnavailableText', state: 'bad'},
  'old-chrome': {title: 'aiOldChrome', text: 'aiOldChromeText', state: 'bad'}
};
const sameLanguage = (a, b) => String(a).toLowerCase().split(/[-_]/)[0] === String(b).toLowerCase().split(/[-_]/)[0];
const languageName = lang => {
  try {
    return new Intl.DisplayNames([uiLang()], {type: 'language'}).of(lang) || lang;
  }
  catch (e) {
    return lang;
  }
};
// {status, lang}: what the model can do here, and the language it answers in
const builtinStatus = async () => {
  const AI = aiModule();
  if (!AI?.builtin) {
    return {status: 'unavailable', lang: uiLang()};
  }
  const state = await Promise.resolve().then(() => AI.state?.(aiPrefsFor('builtin'))).catch(() => null);
  const lang = state?.lang || uiLang();
  if (state?.reason === 'old-chrome') {
    return {status: 'old-chrome', lang};
  }
  const status = await Promise.resolve().then(() => AI.builtin.availability(lang)).catch(() => 'unavailable');
  return {status: AI_BUILTIN[status] && status !== 'checking' ? status : 'unavailable', lang};
};
const paintMeter = () => {
  const part = aiDownload?.part;
  const known = typeof part === 'number';
  const progress = $('ai-progress');
  // without a fraction yet the bar runs to and fro
  if (known) {
    progress.value = Math.round(part * 100);
  }
  else {
    progress.removeAttribute('value');
  }
  $('ai-percent').textContent = known ? new Intl.NumberFormat(uiLang(), {style: 'percent'}).format(part) : '';
};
const showBuiltin = (status, lang) => {
  const view = AI_BUILTIN[status] || AI_BUILTIN.checking;
  const title = $('ai-builtin-title');
  title.textContent = t(view.title);
  title.dataset.state = view.state;
  $('ai-builtin-text').textContent = view.text ? t(view.text) : '';
  $('ai-builtin-text').hidden = !view.text;
  $('ai-download').hidden = !view.download;
  $('ai-meter').hidden = !view.meter;
  paintMeter();
  // a UI language the model does not speak: it answers in English (data/ai/ai.js)
  const english = Boolean(lang) && !sameLanguage(lang, uiLang()) && ['available', 'downloadable', 'downloading'].includes(status);
  $('ai-builtin-lang').textContent = english ? t('aiEnglish', languageName(uiLang())) : '';
  $('ai-builtin-lang').hidden = !english;
  builtinShown = AI_BUILTIN[status] ? status : 'checking';
  paintBadges();
  self.UI?.status();
};
const builtinError = text => {
  $('ai-builtin-error').textContent = text || '';
  $('ai-builtin-error').hidden = !text;
};
const paintBuiltin = async () => {
  clearTimeout(aiPoll);
  if (prefs['ai.engine'] !== 'builtin') {
    return;
  }
  if (aiDownload) {
    return showBuiltin('downloading', builtinLang);
  }
  const run = builtinRun += 1;
  const {status, lang} = await builtinStatus();
  // a later paint, or another engine picked meanwhile, wins
  if (run !== builtinRun || prefs['ai.engine'] !== 'builtin') {
    return;
  }
  builtinLang = lang;
  showBuiltin(aiDownload ? 'downloading' : status, lang);
  // a download another page started: its end shows here too
  if (status === 'downloading' && !aiDownload) {
    aiPoll = setTimeout(paintBuiltin, 3000);
  }
};
$('ai-download').onclick = () => {
  const AI = aiModule();
  if (!AI?.builtin?.download || aiDownload) {
    return;
  }
  aiDownload = {part: null};
  builtinError('');
  let done;
  // Chrome downloads the model only from a click: the call comes first, before anything is awaited
  try {
    done = Promise.resolve(AI.builtin.download(loaded => {
      const n = Number(loaded);
      if (aiDownload) {
        aiDownload.part = Number.isFinite(n) ? Math.min(1, Math.max(0, n > 1 ? n / 100 : n)) : null;
        paintMeter();
      }
    }));
  }
  catch (e) {
    done = Promise.reject(e);
  }
  showBuiltin('downloading', builtinLang);
  // the button goes: the focus stays in the card, on the engine it belongs to
  document.querySelector('input[name="ai.engine"][value="builtin"]')?.focus();
  return done.then(() => {
    aiDownload = null;
    toast(t('aiReady'));
  }, e => {
    aiDownload = null;
    builtinError(aiErrorText(e, 'builtin'));
  }).then(paintBuiltin);
};

/* a provider: its key, Chrome's access to its site, its models */
const aiError = text => {
  $('ai-error').textContent = text || '';
  $('ai-error').hidden = !text;
  $('ai-key').setAttribute('aria-invalid', text ? 'true' : 'false');
};
const listModels = engine => {
  const key = aiKeyOf(engine);
  if (aiListing.has(engine) || !aiReady(engine)) {
    return;
  }
  aiListing.add(engine);
  Promise.resolve().then(() => aiModule().models(engine, key)).then(list => {
    list = (Array.isArray(list) ? list : []).filter(m => m && typeof m.id === 'string');
    aiLists[engine] = list.length ? list : {error: {code: 'no-models'}};
    // a key without a model picked (a backup from before, a model removed) gets the module's own
    if (list.length && !prefs[aiModelKey(engine)]) {
      keep({[aiModelKey(engine)]: aiDefaultModel(engine, list)});
    }
  }, e => {
    aiLists[engine] = {error: e};
  }).finally(() => {
    aiListing.delete(engine);
    if (prefs['ai.engine'] === engine) {
      paintCloud();
    }
  });
};
const paintModels = engine => {
  const select = $('ai-model');
  const note = $('ai-model-note');
  const stored = prefs[aiModelKey(engine)];
  const list = aiLists[engine];
  // a model says what it is for: the best summaries, the fastest and cheapest, or no cost at all
  const TAGS = {best: 'aiBest', fast: 'aiFast', free: 'aiFree'};
  const option = (m, label = [m.name || m.id, TAGS[m.tag] && t(TAGS[m.tag])].filter(Boolean).join(' · ')) =>
    h('option', {value: m.id, textContent: label, selected: m.id === stored});
  if (!Array.isArray(list)) {
    // the model stored shows at once; the provider's list follows, or why it did not come
    select.replaceChildren(option({id: stored}, stored || '…'));
    note.textContent = list?.error ? aiErrorText(list.error, engine) : '';
    note.hidden = !note.textContent;
    if (!list) {
      listModels(engine);
    }
    return;
  }
  // recommended first (data/ai/ai.js marks them), the rest under them
  const group = (label, models) => {
    const g = h('optgroup', {label});
    g.append(...models.map(m => option(m)));
    return g;
  };
  const best = list.filter(m => m.recommended);
  const rest = list.filter(m => !m.recommended);
  const gone = Boolean(stored) && !list.some(m => m.id === stored);
  select.replaceChildren(
    ...(gone ? [option({id: stored}, stored)] : []),
    ...(best.length ? [group(t('aiRecommended'), best), rest.length && group(t('aiOtherModels'), rest)].filter(Boolean) : rest.map(m => option(m))));
  select.value = stored;
  // a model the account no longer has stays shown, with a word to pick another
  note.textContent = gone ? t('aiModelGone', stored) : '';
  note.hidden = !gone;
};
// The ChatGPT plan: the offer to sign in, or the account signed in with its usage. A note says
// why it does not work now: no access, a plan that is not this account's, its usage limit.
const paintPlan = () => {
  const on = prefs['ai.engine'] === 'chatgpt';
  $('ai-plan').hidden = !on;
  if (!on) {
    return;
  }
  const a = aiAccount;
  const access = aiAccess.chatgpt === true;
  const title = $('ai-plan-title');
  if (!a) {
    title.textContent = t('aiPlanUse');
    title.dataset.state = 'none';
    $('ai-plan-text').replaceChildren(t('aiPlanUseText'));
  }
  else {
    title.textContent = a.email ? t('aiSignedIn', a.email) : t('aiSignedInPlain');
    title.dataset.state = !access || !a.plan ? 'bad' : a.limit ? 'wait' : 'ok';
    const usage = h('a', {href: AI_PLAN.usage, target: '_blank', rel: 'noopener', textContent: t('aiManageUsage')});
    // there the user may raise the limit: what waited for it is asked again
    usage.onclick = () => aiModule()?.chatgpt?.resume?.();
    $('ai-plan-text').replaceChildren(...(a.plan ? [t('aiPlanUsing'), ' · '] : []), usage);
  }
  $('ai-plan-plus').hidden = Boolean(a) && !a.plan;
  const note = aiPlanNote || (!a ? '' : !access ? t('aiNoAccess', AI_PLAN.host) : !a.plan ? chrome.i18n.getMessage('ai_err_no_plan') :
    a.limit ? chrome.i18n.getMessage('ai_err_limit') : '');
  $('ai-plan-note').textContent = note;
  $('ai-plan-note').hidden = !note;
  $('ai-plan-wait').textContent = aiSigning && !a ? t('aiSignInWait') : '';
  $('ai-plan-wait').hidden = !$('ai-plan-wait').textContent;
  // signed in without the plan's use: a new sign-in may allow it
  $('ai-signin').hidden = Boolean(a) && a.plan;
  $('ai-signout').hidden = !a;
  $('ai-plan-allow').hidden = !a || access;
};
// each engine's word on its card: ready, signed in, connected, or the access Chrome took back
const paintBadges = () => {
  const badge = (engine, text, warn = false) => {
    const el = $('ai-badge-' + engine);
    el.textContent = text;
    el.dataset.tone = warn ? 'warn' : 'ok';
    el.hidden = !text;
  };
  badge('builtin', builtinShown === 'available' ? t('aiReady') : '');
  badge('chatgpt', !aiAccount ? '' : aiAccess.chatgpt ? t('aiSignedInBadge') : t('aiNeedsAccess'), Boolean(aiAccount) && !aiAccess.chatgpt);
  for (const id of Object.keys(AI_PROVIDERS)) {
    badge(id, !aiKeyOf(id) ? '' : aiAccess[id] ? t('aiConnectedBadge') : t('aiNeedsAccess'), Boolean(aiKeyOf(id)) && !aiAccess[id]);
  }
};
const paintCloud = () => {
  const engine = prefs['ai.engine'];
  const p = AI_PROVIDERS[engine];
  const key = p ? aiKeyOf(engine) : '';
  paintBadges();
  self.UI?.status();
  $('ai-key-row').hidden = !p || Boolean(key);
  $('ai-connected').hidden = !p || !key;
  // the models of a key Chrome lets Mail Deck use, or of the plan signed in
  const plan = engine === 'chatgpt' && Boolean(aiAccount?.plan) && aiAccess.chatgpt === true;
  $('ai-model-row').hidden = !(p ? key && aiAccess[engine] : plan);
  $('ai-model-text').textContent = t(engine === 'chatgpt' ? 'aiPlanModelText' : 'aiModelText');
  paintPlan();
  if (plan) {
    paintModels(engine);
  }
  if (!p) {
    return;
  }
  if (!key) {
    $('ai-key-label').textContent = t('aiKey', p.name);
    $('ai-key-plan').textContent = p.plan ? t('aiKeyText', p.plan, p.name) : '';
    $('ai-key-hint').textContent = p.hint ? t(p.hint) : '';
    $('ai-key-hint').hidden = !p.hint || aiConnecting;
    // while the provider checks the key, the word under the field says so
    $('ai-key-wait').textContent = aiConnecting ? t('aiCheckingKey', p.name) : '';
    $('ai-key-wait').hidden = !aiConnecting;
    $('ai-key-link').href = p.keys;
    $('ai-key').placeholder = p.placeholder;
    $('ai-key').readOnly = aiConnecting;
    // the button keeps the focus while it works: aria-disabled, not disabled
    $('ai-connect').setAttribute('aria-disabled', aiConnecting ? 'true' : 'false');
    $('ai-connect').textContent = t(aiConnecting ? 'aiConnecting' : 'aiConnect');
    return;
  }
  const access = aiAccess[engine];
  $('ai-connected-title').textContent = t('aiConnected', p.name);
  $('ai-connected-title').dataset.state = access ? 'ok' : 'bad';
  $('ai-access').textContent = access ? '' : t('aiNoAccess', p.host);
  $('ai-access').hidden = access;
  $('ai-allow').hidden = access;
  if (access) {
    paintModels(engine);
  }
};
const paintAI = () => {
  const engine = prefs['ai.engine'];
  for (const radio of document.querySelectorAll('input[name="ai.engine"]')) {
    radio.checked = radio.value === engine;
  }
  // with the AI off its features go, and the panel's AI buttons are offered in their place;
  // with it on, the reverse
  const off = !AI_ENGINES.includes(engine) || engine === 'off';
  for (const row of document.querySelectorAll('[data-ai]')) {
    row.hidden = off;
    row.querySelectorAll('input, select').forEach(el => el.disabled = off);
  }
  $('ai-buttons-row').hidden = !off;
  const p = AI_PROVIDERS[engine];
  $('ai-privacy').textContent = p ? t('aiPrivacy', p.name) : engine === 'builtin' ? t('aiPrivacyLocal') :
    engine === 'chatgpt' ? t('aiPrivacyPlan') : '';
  $('ai-privacy-note').hidden = !$('ai-privacy').textContent;
  $('ai-builtin').hidden = engine !== 'builtin';
  paintBuiltin();
  paintCloud();
};
// the key in the field shown as text, or hidden again; the eye button says which
const showKey = show => {
  $('ai-key').type = show ? 'text' : 'password';
  const button = $('ai-key-show');
  button.setAttribute('aria-pressed', String(show));
  button.setAttribute('aria-label', t(show ? 'aiHide' : 'aiShow'));
  button.title = t(show ? 'aiHide' : 'aiShow');
};
const resetKeyField = () => {
  $('ai-key').value = '';
  showKey(false);
  aiError('');
};
const pickEngine = engine => {
  if (!AI_ENGINES.includes(engine) || engine === prefs['ai.engine']) {
    return;
  }
  // a key typed for one provider never goes to another
  resetKeyField();
  builtinError('');
  aiPlanNote = '';
  save({'ai.engine': engine});
  paintAI();
};
// Connect: Chrome's access to the provider's site, asked from the click; then the key, checked
// with the provider; then its models. Only a key that passed is kept.
const connect = () => {
  const engine = prefs['ai.engine'];
  const p = AI_PROVIDERS[engine];
  const field = $('ai-key');
  const key = field.value.trim();
  if (!p || aiConnecting) {
    return Promise.resolve(false);
  }
  const other = aiKeyProvider(key);
  if (!key || (other && other !== engine)) {
    aiError(key ? t('aiKeyOther', AI_PROVIDERS[other].name, p.name) : t('aiKeyEmpty'));
    field.focus();
    return Promise.resolve(false);
  }
  const had = aiAccess[engine] === true;
  // Chrome asks only from the click itself, before anything is awaited
  const asked = chrome.permissions.request({origins: [p.origin]});
  aiConnecting = true;
  aiError('');
  paintCloud();
  return Promise.resolve(asked).catch(() => false).then(async granted => {
    if (!granted) {
      throw {code: 'no-access'};
    }
    aiAccess[engine] = true;
    const AI = aiModule();
    if (!AI?.check || !AI.models) {
      throw {code: 'unavailable'};
    }
    await AI.check(engine, key);
    const list = ((await AI.models(engine, key)) || []).filter(m => m && typeof m.id === 'string');
    if (list.length === 0) {
      throw {code: 'no-models'};
    }
    const stored = prefs[aiModelKey(engine)];
    const model = list.some(m => m.id === stored) ? stored : aiDefaultModel(engine, list);
    aiLists[engine] = list;
    aiKeys[`ai.${engine}.key`] = key;
    prefs[aiModelKey(engine)] = model;
    try {
      await store.set({[`ai.${engine}.key`]: key, [aiModelKey(engine)]: model});
    }
    catch (e) {
      aiKeys[`ai.${engine}.key`] = '';
      throw e;
    }
    field.value = '';
    showKey(false);
    toast(t('aiConnected', p.name));
    if (prefs['sync.settings']) {
      pushSync();
    }
    return true;
  }).catch(e => {
    // a key that did not connect leaves Chrome's access as it found it
    if (!had && e?.code !== 'no-access') {
      aiAccess[engine] = false;
      chrome.permissions.remove({origins: [p.origin]}).catch(() => false);
    }
    aiError(aiErrorText(e, engine));
    return false;
  }).then(ok => {
    aiConnecting = false;
    paintCloud();
    if (prefs['ai.engine'] === engine) {
      (ok ? ($('ai-model-row').hidden ? $('ai-disconnect') : $('ai-model')) : field).focus();
    }
    return ok;
  });
};
// Disconnect: the key and the model forgotten, the provider's site given back to Chrome (but
// not OpenAI's while the ChatGPT plan, signed in, uses it too)
const disconnect = () => {
  const engine = prefs['ai.engine'];
  const p = AI_PROVIDERS[engine];
  if (!p) {
    return Promise.resolve();
  }
  delete aiLists[engine];
  aiKeys[`ai.${engine}.key`] = '';
  prefs[aiModelKey(engine)] = '';
  aiAccess[engine] = false;
  const origins = [p.origin].filter(o => !aiNeeded(engine).has(o));
  return Promise.all([
    store.remove([`ai.${engine}.key`, aiModelKey(engine)]),
    origins.length ? chrome.permissions.remove({origins}).catch(() => false) : true
  ]).then(() => {
    toast(t('aiDisconnected', p.name));
    if (prefs['sync.settings']) {
      pushSync();
    }
  }, e => toast(e.message)).then(() => {
    resetKeyField();
    paintCloud();
    $('ai-key').focus();
  });
};
$('ai-connect').onclick = () => connect();
$('ai-key').onkeydown = ev => {
  if (ev.key === 'Enter') {
    ev.preventDefault();
    connect();
  }
};
$('ai-key').oninput = () => aiError('');
$('ai-key-show').onclick = () => showKey($('ai-key').type === 'password');
$('ai-disconnect').onclick = () => disconnect();
// a key kept while Chrome's access was taken (on chrome://extensions, say): asked for again
$('ai-allow').onclick = () => {
  const engine = prefs['ai.engine'];
  const p = AI_PROVIDERS[engine];
  if (!p) {
    return;
  }
  return Promise.resolve(chrome.permissions.request({origins: [p.origin]})).catch(() => false).then(granted => {
    aiAccess[engine] = granted === true;
    delete aiLists[engine];
    paintCloud();
    if (granted) {
      $('ai-model').focus();
    }
  });
};

/* the ChatGPT plan: Continue with ChatGPT, Sign out, and the word after the first sign-in */
// Sign-in: the module asks Chrome for the sites from the click itself, before anything is
// awaited, then opens ChatGPT in a tab. The sign-in comes back there (data/ai/callback.html);
// this page follows it in storage.
$('ai-signin').onclick = () => {
  const AI = aiModule();
  if (!AI?.chatgpt) {
    return;
  }
  let started;
  try {
    started = Promise.resolve(AI.chatgpt.signIn());
  }
  catch (e) {
    started = Promise.reject(e);
  }
  aiPlanNote = '';
  aiSigning = true;
  paintPlan();
  return started.then(() => {
    // Chrome's access was asked for and given: the card shows it as it is
    aiAccess.chatgpt = true;
  }, e => {
    aiSigning = false;
    aiPlanNote = aiErrorText(e, 'chatgpt');
  }).then(() => {
    paintCloud();
    $('ai-signin').focus();
  });
};
// Sign out: revoked at OpenAI and forgotten here; the sites go back to Chrome, but not OpenAI's
// API while an OpenAI key uses it. When OpenAI did not confirm it, the card says where to finish it.
$('ai-signout').onclick = () => {
  const AI = aiModule();
  const button = $('ai-signout');
  if (!AI?.chatgpt || button.getAttribute('aria-disabled') === 'true') {
    return;
  }
  button.setAttribute('aria-disabled', 'true');
  return Promise.resolve().then(() => AI.chatgpt.signOut()).then(r => {
    aiAccount = null;
    delete aiLists.chatgpt;
    aiPlanNote = r?.revoked === false ? t('aiSignOutUnconfirmed') : '';
    const origins = [...AI_PLAN.origins, AI_PLAN.loopback].filter(o => !aiNeeded('chatgpt').has(o));
    aiAccess.chatgpt = false;
    toast(t('aiSignedOut'));
    return chrome.permissions.remove({origins}).catch(() => false);
  }, e => toast(aiErrorText(e, 'chatgpt') || t('aiErrOther'))).then(() => {
    button.setAttribute('aria-disabled', 'false');
    paintCloud();
    $('ai-signin').focus();
  });
};
// the plan signed in while Chrome's access was taken: asked for again
$('ai-plan-allow').onclick = () => Promise.resolve(chrome.permissions.request({origins: AI_PLAN.origins})).catch(() => false).then(granted => {
  aiAccess.chatgpt = granted === true;
  delete aiLists.chatgpt;
  paintCloud();
  if (granted) {
    $('ai-model').focus();
  }
});
// once, after the first sign-in that may use the plan
const welcome = async () => {
  const dialog = $('ai-welcome');
  if (prefs['ai.engine'] !== 'chatgpt' || !aiAccount?.plan || dialog.open || typeof dialog.showModal !== 'function') {
    return;
  }
  const {'ai.chatgpt.welcomed': seen} = await store.get({'ai.chatgpt.welcomed': false});
  if (!seen && !dialog.open) {
    dialog.showModal();
    $('ai-welcome-ok').focus();
  }
};
// Got it, or Esc: seen
$('ai-welcome').onclose = () => {
  store.set({'ai.chatgpt.welcomed': true}).catch(() => {});
  ($('ai-model-row').hidden ? $('ai-signout') : $('ai-model')).focus();
};
$('ai-welcome-ok').onclick = () => $('ai-welcome').close?.();
// what the module says of the plan changed in storage: a sign-in that came back or ended, a
// refresh, a sign-out in another tab, the usage limit
const followPlan = () => readAccount().then(() => {
  if (aiAccount) {
    aiSigning = false;
    aiPlanNote = '';
  }
  paintCloud();
  return welcome();
});
// The panel's links to an engine (#ai-chatgpt, #ai-openai, #ai-anthropic, #ai-zai, #ai-builtin):
// that engine picked, the card in view, and its next step focused: the sign-in or the key while
// there is none, then the model
const followHash = () => {
  const engine = /^#ai-([a-z]+)$/.exec(location.hash)?.[1];
  if (!engine || engine === 'off' || !AI_ENGINES.includes(engine)) {
    return;
  }
  pickEngine(engine);
  const shown = (...ids) => ids.map($).find(el => !el.hidden);
  const next = engine === 'builtin' ? document.querySelector('input[name="ai.engine"][value="builtin"]') :
    engine === 'chatgpt' ? ($('ai-model-row').hidden ? shown('ai-signin', 'ai-plan-allow', 'ai-signout') : $('ai-model')) :
    !aiKeyOf(engine) ? $('ai-key') : $('ai-model-row').hidden ? shown('ai-allow', 'ai-disconnect') : $('ai-model');
  $('ai').scrollIntoView({block: 'start'});
  next?.focus();
};

$('ai-model').onchange = () => {
  const engine = prefs['ai.engine'];
  if (AI_PROVIDERS[engine] || engine === 'chatgpt') {
    save({[aiModelKey(engine)]: $('ai-model').value}).then(() => paintModels(engine));
  }
};
// what another page changes (another settings tab, a reset): the card follows; a key only as
// stored, the plan's sign-in only as the module tells it
const followAI = changes => {
  let changed = false;
  if ('ai.chatgpt.auth' in changes) {
    followPlan();
  }
  for (const [k, change] of Object.entries(changes)) {
    if (AI_KEYS.includes(k)) {
      const value = change.newValue || '';
      if (aiKeys[k] !== value) {
        aiKeys[k] = value;
        delete aiLists[k.split('.')[1]];
        changed = true;
      }
    }
    else if (k.startsWith('ai.') && k in DEFAULTS) {
      const value = 'newValue' in change ? change.newValue : DEFAULTS[k];
      if (prefs[k] !== value) {
        prefs[k] = value;
        changed = true;
      }
    }
  }
  if (changed) {
    paintFields(k => k.startsWith('ai.'));
    paintAI();
  }
};
// What a reset leaves of the AI: no key, no ChatGPT sign-in (revoked first, while its site is
// given), no provider's site, no reply marks kept. The plan's client and this browser's id stay
// for a later sign-in.
const forgetAI = () => Promise.resolve().then(() => aiModule()?.chatgpt?.signOut()).catch(() => null).then(() => Promise.all([
  store.remove([...AI_KEYS, 'ai.chatgpt.auth', 'ai.replies']),
  chrome.permissions.remove({origins: AI_ORIGINS}).catch(() => false)
]));

/* the panel's shortcut: Chrome keeps it, and changes it on chrome://extensions/shortcuts */
const paintShortcut = () => chrome.commands.getAll(commands => {
  const key = commands.find(c => c.name === '_execute_action')?.shortcut;
  $('shortcut').replaceChildren(key ? h('kbd', {textContent: key}) : h('span', {className: 'none', textContent: t('shortcutNone')}));
});
$('shortcut-change').onclick = () => chrome.tabs.create({url: 'chrome://extensions/shortcuts'});
// coming back from the shortcuts page
addEventListener('focus', paintShortcut);

/* backup: a settings file, and a copy in Chrome sync */
// what a backup holds: this page's settings and the inboxes' switches, not caches or the mail already seen
const SOUND_FILES = MEDIA.flatMap(m => [m + '.file', m + '.mime']);
// An own sound is the file this page read (pickFile): a data: URL of audio or video, never an
// address to fetch, which would tell its owner each time mail comes. The local storage holds
// 10 MB in all, so no own sound saved here is larger. core/offscreen/index.js checks the same.
const SOUND_MAX = 10 * 1024 * 1024;
const soundFile = v => typeof v === 'string' && v.length <= SOUND_MAX &&
  /^data:(audio|video)\/[\w.+-]+(;\s*[\w.+-]+=[\w.+"-]+)*;base64,/i.test(v.slice(0, 200));
const soundMime = v => typeof v === 'string' && /^(audio|video)\/[\w.+-]+$/i.test(v);
// with the panel's order of the mailboxes, and each Gmail account's labels under its address
// as well: another computer that signed in to the accounts in another order puts them right
const collect = async files => {
  const settings = await store.get({
    ...Object.fromEntries(Object.entries(DEFAULTS).filter(([k]) => k !== 'sync.settings')),
    accounts: {},
    accountOrder: [],
    ...(files ? Object.fromEntries(SOUND_FILES.map(k => [k, null])) : {})
  });
  const slot = gmailSlots(await sessionObjects());
  const {labels} = await store.get({labels: {}});
  settings.labels = {...Object.fromEntries(Object.entries(slot).map(([email, n]) => [email, settings['feeds_' + n]])), ...labels};
  // an AI key is never in DEFAULTS, so never asked for above; and should one ever be, it stays here
  for (const k of AI_SECRETS) {
    delete settings[k];
  }
  return settings;
};
// keeps only what a backup may hold, each value of its setting's type and within its range
const sanitize = data => {
  const out = {};
  for (const [k, v] of Object.entries(data || {})) {
    // a file that carries an AI key, whoever wrote it, does not bring it here
    if (AI_SECRETS.includes(k)) {
      continue;
    }
    if (k in DEFAULTS && k !== 'sync.settings' && k !== 'services' && k !== 'savedSearches' && typeof v === typeof DEFAULTS[k] &&
      (typeof v !== 'number' || (Number.isFinite(v) && v >= 0)) && (!VALID[k] || VALID[k](v))) {
      out[k] = v;
    }
    else if (k === 'accounts' && v && typeof v === 'object' && !Array.isArray(v)) {
      out.accounts = Object.fromEntries(Object.entries(v).map(([name, o]) => [name, {
        ignored: o?.ignored === true,
        quiet: o?.quiet === true,
        // an address hidden from the panel's signed-out list stays hidden
        ...(o?.signedOutHidden === true ? {signedOutHidden: true} : {}),
        // an inbox left out of the toolbar count stays out of it
        ...(o?.uncounted === true ? {uncounted: true} : {}),
        ...(self.MailServices?.[o?.service] ? {service: o.service} : {})
      }]));
    }
    else if (k === 'accountOrder' && Array.isArray(v)) {
      out.accountOrder = v.filter((name, i) => typeof name === 'string' && v.indexOf(name) === i).slice(0, 100);
    }
    else if (k === 'services' && Array.isArray(v)) {
      out.services = v.filter(id => typeof id === 'string' && self.MailServices?.[id]);
    }
    else if (k === 'savedSearches' && Array.isArray(v)) {
      out.savedSearches = cleanSaved(v);
    }
    else if (SOUND_FILES.includes(k) && (v === null || (k.endsWith('.file') ? soundFile(v) : soundMime(v)))) {
      out[k] = v;
    }
  }
  // an own sound whose file did not come along, or came as anything but a sound, plays the
  // built-in one; so does a sound this page does not offer (0-3 built in, 4 own file)
  for (const m of MEDIA) {
    if ((out[m + '.type'] === 4 && !out[m + '.file']) || (m + '.type' in out && ![0, 1, 2, 3, 4].includes(out[m + '.type']))) {
      out[m + '.type'] = 0;
    }
  }
  return out;
};
// A backup keeps each Gmail account's labels under its address: they join the ones kept here,
// and never those of whichever account had a slot on the other computer. A backup older than
// that brings its slots, which the background then gives to the account it finds there.
const restorable = async settings => {
  const out = sanitize(settings);
  const labels = settings?.labels;
  if (labels && typeof labels === 'object' && !Array.isArray(labels)) {
    for (let i = 0; i < 10; i += 1) {
      delete out['feeds_' + i];
    }
    const {labels: here} = await store.get({labels: {}});
    out.labels = {...here, ...Object.fromEntries(Object.entries(labels).filter(([email, value]) =>
      email.includes('@') && email.length <= 320 && typeof value === 'string' && VALID.feeds_0(value)))};
  }
  return out;
};
const apply = async values => {
  await store.set(values);
  if (Array.isArray(values.services)) {
    await revokeOff(values.services);
  }
};

$('export').onclick = async () => {
  const data = {
    app: 'mail-deck',
    version: chrome.runtime.getManifest().version,
    exported: new Date().toISOString(),
    settings: await collect(true)
  };
  const a = h('a', {
    href: URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'})),
    download: `mail-deck-settings-${data.exported.slice(0, 10)}.json`
  });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
$('import').onclick = () => {
  const input = $('settings-file');
  input.value = '';
  input.onchange = () => input.files[0].text().then(text => {
    const data = JSON.parse(text);
    if (data?.app !== 'mail-deck' || !data.settings || typeof data.settings !== 'object') {
      throw Error('not a Mail Deck file');
    }
    return askFirst(t('importConfirm'), {title: t('import'), yes: t('replace')}).then(ok => {
      if (ok) {
        return restorable(data.settings).then(apply).then(() => reloadWith(t('imported')));
      }
    });
  }).catch(() => toast(t('importBad'), true));
  input.click();
};

// Chrome sync holds 8 KB an item: the settings go as JSON cut in pieces, with a note of how many
const SYNC = 'settings.';
const PIECE = 2400; // characters; even at three bytes each a piece fits QUOTA_BYTES_PER_ITEM
const pieceKeys = n => [...Array(n).keys()].map(i => SYNC + i);
let syncTimer;
const pushSync = () => {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      const text = JSON.stringify(await collect(false));
      const n = Math.ceil(text.length / PIECE);
      const pieces = Object.fromEntries(pieceKeys(n).map((k, i) => [k, text.slice(i * PIECE, (i + 1) * PIECE)]));
      const {[SYNC + 'meta']: old} = await chrome.storage.sync.get(SYNC + 'meta');
      await chrome.storage.sync.set({...pieces, [SYNC + 'meta']: {n, at: Date.now()}});
      if (old?.n > n) {
        await chrome.storage.sync.remove(pieceKeys(old.n).slice(n));
      }
    }
    catch (e) {
      toast(t('syncFailed'));
    }
  }, 1500);
};
const readSync = async () => {
  const {[SYNC + 'meta']: meta} = await chrome.storage.sync.get(SYNC + 'meta');
  if (!meta?.n) {
    return null;
  }
  const pieces = await chrome.storage.sync.get(pieceKeys(meta.n));
  try {
    return {at: meta.at, settings: JSON.parse(pieceKeys(meta.n).map(k => pieces[k] || '').join(''))};
  }
  catch (e) {
    return null;
  }
};
const dropSync = async () => {
  clearTimeout(syncTimer);
  const {[SYNC + 'meta']: meta} = await chrome.storage.sync.get(SYNC + 'meta');
  await chrome.storage.sync.remove([SYNC + 'meta', ...pieceKeys(meta?.n || 0)]);
};
// a fresh install, with nothing set on this page yet, offers the copy another computer keeps
const offerRestore = async () => {
  const local = await store.get(null);
  if (Object.keys(DEFAULTS).some(k => k in local)) {
    return;
  }
  const backup = await readSync();
  if (!backup) {
    return;
  }
  $('restore-text').textContent = t('restoreText', new Date(backup.at).toLocaleDateString(chrome.i18n.getUILanguage(), {dateStyle: 'long'}));
  $('restore').hidden = false;
  $('restore-no').onclick = () => $('restore').hidden = true;
  $('restore-yes').onclick = () => restorable(backup.settings).then(out => apply({...out, 'sync.settings': true}))
    .then(() => reloadWith(t('restored')));
};

/* diagnostics: every signed-in inbox asked live; read only, no action is ever sent */
const DIAG_MS = 8000;
const within = promise => Promise.race([promise, new Promise((resolve, reject) => setTimeout(reject, DIAG_MS, Error('timeout')))]);
const page = async url => {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), DIAG_MS);
  try {
    return await fetch(url, {credentials: 'include', cache: 'no-store', signal: c.signal});
  }
  finally {
    clearTimeout(id);
  }
};
// [name, true | false | null (skipped), why]
const check = (name, run) => run().then(([ok, why]) => [name, ok, why], () => [name, false, t('diagNoAnswer')]);
const answered = r => [false, t('diagStatus', r.status)];
// a mailbox of another service: the background asks the service the way a check does
const serviceChecks = id => Promise.all([check('diagService', async () => {
  const r = await within(chrome.runtime.sendMessage({method: 'services.check', id}));
  if (!r || r.message) {
    return [false, r?.message || t('diagNoAnswer')];
  }
  return r.boxes.length ? [true, r.boxes.map(b => `${b.email}: ${t('diagUnread', b.unread)}`).join(', ')] : [false, t('diagSignedOut')];
})]);
const inboxChecks = o => {
  if (o.xml.service) {
    return serviceChecks(o.xml.service);
  }
  const root = (o.xml.rootLink || '').replace(/\/$/, '');
  const n = (/\/u\/(\d+)/.exec(root) || [])[1];
  const thread = (/message_id=([^&]+)/.exec(o.xml.entries?.[0]?.link || '') || [])[1];
  return Promise.all([
    check('diagFeed', async () => {
      const r = await page(root + '/feed/atom');
      // Gmail sends a signed-out slot back to the first account
      if (r.url.includes('/u/0/') && !root.endsWith('/u/0')) {
        return [false, t('diagSignedOut')];
      }
      return r.ok ? [true, t('diagOk')] : answered(r);
    }),
    check('diagSearch', async () => {
      const entries = await within(chrome.runtime.sendMessage({method: 'gmail.search', url: root, query: 'in:inbox'}));
      return Array.isArray(entries) ? [true, t('diagFound', entries.length)] : [false, t('diagNoAnswer')];
    }),
    check('diagToken', async () => {
      const at = await within(chrome.runtime.sendMessage({method: 'get-at', n}));
      return at ? [true, t('diagOk')] : [false, t('diagOpenGmail')];
    }),
    // the print view the panel reads a message from, with the panel's msg= and its th= fallback
    check('diagPrint', async () => {
      if (!thread) {
        return [null, t('diagNoMail')];
      }
      let r = await page(`${root}/?ui=2&view=pt&dsqt=1&search=all&msg=${thread}`);
      if (r.status === 400) {
        r = await page(`${root}/?ui=2&view=pt&dsqt=1&search=all&th=${thread}`);
      }
      if (!r.ok) {
        return answered(r);
      }
      return /class="?message/.test(await r.text()) ? [true, t('diagOk')] : [false, t('diagNoMessage')];
    }),
    check('diagPrimary', async () => {
      const r = await page(root + '/feed/atom/%5Esmartlabel_personal');
      return r.ok ? [true, t('diagOk')] : answered(r);
    })
  ]);
};
const browserChecks = () => Promise.all([
  check('diagSide', async () => chrome.sidePanel ? [true, t('diagOk')] : [false, t('diagNoSide')]),
  check('diagShortcut', async () => {
    const commands = await chrome.commands.getAll();
    const key = commands.find(c => c.name === '_execute_action')?.shortcut;
    return key ? [true, key] : [false, t('shortcutNone')];
  }),
  aiDiag()
]);
// the AI's line: the engine and whether it works now (a key or the plan's sign-in is asked of
// its provider), never the key, the account or a token
const aiDiag = () => check('ai', async () => {
  const engine = prefs['ai.engine'];
  const p = AI_PROVIDERS[engine];
  if (engine === 'chatgpt') {
    const AI = aiModule();
    const a = await within(Promise.resolve().then(() => AI?.chatgpt?.account())).catch(() => null);
    if (!a) {
      return [false, `${AI_PLAN.name}: ${t('aiDiagSignedOut')}`];
    }
    if (!await chrome.permissions.contains({origins: AI_PLAN.origins}).catch(() => false)) {
      return [false, `${AI_PLAN.name}: ${t('aiDiagNoAccess', AI_PLAN.host)}`];
    }
    return within(Promise.resolve().then(() => AI.check('chatgpt'))).then(
      () => [true, [t('aiPlan'), prefs[aiModelKey(engine)]].filter(Boolean).join(' · ')],
      e => [false, `${AI_PLAN.name}: ${aiErrorText(e, engine)}`]);
  }
  if (!p && engine !== 'builtin') {
    return [null, t('aiOff')];
  }
  if (!p) {
    const {status} = await within(builtinStatus());
    return [status === 'available', `${t('aiBuiltin')}: ${t(AI_BUILTIN[status].title)}`];
  }
  const name = `ai.${engine}.key`;
  const {[name]: key} = await store.get({[name]: ''});
  if (!key) {
    return [false, `${p.name}: ${t('aiDiagNoKey')}`];
  }
  if (!await chrome.permissions.contains({origins: [p.origin]}).catch(() => false)) {
    return [false, `${p.name}: ${t('aiDiagNoAccess', p.host)}`];
  }
  return within(Promise.resolve().then(() => aiModule().check(engine, key))).then(
    () => [true, [p.name, prefs[aiModelKey(engine)]].filter(Boolean).join(' · ')],
    e => [false, `${p.name}: ${aiErrorText(e, engine)}`]);
});
const diagMark = ok => ok ? 'done' : ok === null ? 'dash' : 'close';
const diagBlock = (title, lines) => h('div', {className: 'diag-block'},
  h('b', {textContent: title}),
  h('ul', {}, ...lines.map(([name, ok, why]) => h('li', {className: ok ? 'ok' : ok === null ? 'skip' : 'bad'},
    h('span', {className: 'mark'}, self.UI?.icon(diagMark(ok)) || (ok ? '✓' : ok === null ? '–' : '✗')),
    h('span', {className: 'name', textContent: t(name)}),
    h('span', {className: 'why', textContent: why})))));
// The check as plain text, for a bug report: the version, the browser and every line, with the
// addresses shortened (a•••@gmail.com), since a report may be posted where anyone reads it
const diagReport = blocks => [
  `Mail Deck ${chrome.runtime.getManifest().version} · ${self.navigator?.userAgent || ''}`,
  ...blocks.map(([title, lines]) => [title, ...lines.map(([name, ok, why]) => `  ${ok ? '✓' : ok === null ? '–' : '✗'} ${t(name)}: ${why}`)].join('\n'))
].join('\n\n').replace(/([\p{L}\p{N}])[\p{L}\p{N}._%+-]*@/gu, '$1•••@');
$('diag-run').onclick = async () => {
  const button = $('diag-run');
  const out = $('diag');
  // the button keeps the focus while the check runs: aria-disabled, not disabled
  if (button.getAttribute('aria-disabled') === 'true') {
    return;
  }
  button.setAttribute('aria-disabled', 'true');
  button.textContent = t('diagRunning');
  out.hidden = false;
  out.replaceChildren();
  const {'cached-objects': objs} = await chrome.storage.session.get({'cached-objects': []});
  // labels watched in an inbox share its account: one round per account
  // a service answers for all its mailboxes at once: one round per service
  const inboxes = objs.filter((o, i) => objs.findIndex(x => o.xml.service ? x.xml.service === o.xml.service : x.xml.rootLink === o.xml.rootLink) === i);
  // a service turned on without a mailbox in the panel is checked as well
  const quiet = (await Promise.all(SERVICES.filter(s => prefs.services.includes(s.id) && !inboxes.some(o => o.xml.service === s.id))
    .map(async s => await chrome.permissions.contains({origins: s.origins}) ? s : null))).filter(Boolean);
  const [rounds, browser, away] = await Promise.all([Promise.all(inboxes.map(inboxChecks)), browserChecks(), Promise.all(quiet.map(s => serviceChecks(s.id)))]);
  const title = o => o.xml.service ? self.MailServices?.[o.xml.service]?.name || o.xml.title : o.xml.title;
  const blocks = [...inboxes.map((o, i) => [title(o), rounds[i]]), ...quiet.map((s, i) => [s.name, away[i]]), [t('diagBrowser'), browser]];
  // the whole first: every check passed, or how many did not; and the report to copy
  const lines = blocks.flatMap(([, list]) => list);
  const failed = lines.filter(([, ok]) => ok === false).length;
  const copy = h('button', {type: 'button', className: 'btn sm'}, self.UI?.icon('copy') || '', h('span', {textContent: t('diagCopy')}));
  copy.onclick = () => navigator.clipboard.writeText(diagReport(blocks)).then(() => toast(t('diagCopied')), () => toast(t('aiErrOther'), true));
  out.replaceChildren(
    h('div', {className: 'diag-sum' + (failed ? ' bad' : '')}, self.UI?.icon(failed ? 'alert' : 'done') || '',
      h('span', {textContent: failed ? t('diagFailed', failed) : t('diagPassed', lines.filter(([, ok]) => ok).length)}), copy),
    ...(inboxes.length ? [] : [h('p', {className: 'empty-line', textContent: t('diagNone')})]),
    ...blocks.map(([name, list]) => diagBlock(name, list)));
  button.setAttribute('aria-disabled', 'false');
  button.textContent = t('diagRun');
};

/* the rest */
$('reset').onclick = () => askFirst(t('resetConfirm'), {title: t('reset'), yes: t('resetDo'), danger: true}).then(ok => {
  if (ok) {
    // the copy in Chrome sync stays on and follows the defaults; the services go off, their sites too;
    // the AI goes off, its keys and its providers' sites with it
    return apply({...DEFAULTS, 'sync.settings': prefs['sync.settings'], accounts: {}}).then(forgetAI).then(() => location.reload());
  }
});
document.addEventListener('click', ({target}) => {
  if (target.closest?.('#play')) {
    chrome.runtime.sendMessage({method: 'test-play'});
  }
});

document.title = t('settingsTitle');
document.documentElement.lang = chrome.i18n.getUILanguage();
// Arabic and Hebrew read from the right: the layout mirrors with them
document.documentElement.dir = chrome.i18n.getMessage('@@bidi_dir') || 'ltr';
for (const el of document.querySelectorAll('[data-i18n]')) {
  el.textContent = t(el.dataset.i18n, ...(el.dataset.i18nArg ? [el.dataset.i18nArg] : []));
}
for (const el of document.querySelectorAll('[data-i18n-label]')) {
  el.setAttribute('aria-label', t(el.dataset.i18nLabel));
}
for (const el of document.querySelectorAll('[data-i18n-placeholder]')) {
  el.placeholder = t(el.dataset.i18nPlaceholder);
}
try {
  const said = sessionStorage.getItem('toast');
  if (said) {
    sessionStorage.removeItem('toast');
    toast(said);
  }
}
catch (e) {}

// the page's scripts all run first (ui.js comes after this one), then the settings are drawn
const parsed = new Promise(resolve => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', resolve) : resolve());
Promise.all([store.get(DEFAULTS), parsed]).then(([stored]) => {
  prefs = stored;
  paintFields();
  paintQuiet();
  paintSwatches();
  $('default-sound').replaceChildren(soundPicker(MEDIA[0]),
    h('button', {type: 'button', className: 'btn', id: 'play'}, self.UI?.icon('play') || '', h('span', {textContent: t('play')})));
  // the page's look on the settings as they are: More options, the search, the hero, word lists as chips
  self.UI?.start();
  paintRules();
  paintSaved();
  syncNeeds();
  paintShortcut();
  // the background adds inboxes on its own; the copy catches up when the page opens
  if (prefs['sync.settings']) {
    pushSync();
  }
  offerRestore();
  paintServices();
  // what changes while the page is open: inboxes the background finds, the toolbar menu's
  // switches, a service's sites given or taken on chrome://extensions
  chrome.storage.onChanged.addListener((ps, area) => {
    // the session: a ChatGPT sign-in underway or over, the plan's pause at its usage limit
    if (area === 'session' && ('ai.chatgpt.pending' in ps || 'ai.chatgpt.limit' in ps)) {
      if ('ai.chatgpt.pending' in ps) {
        aiSigning = Boolean(ps['ai.chatgpt.pending'].newValue);
      }
      followPlan();
    }
    if (area !== 'local') {
      return;
    }
    if (ps.services) {
      prefs.services = ps.services.newValue || [];
      syncServices();
    }
    if (ps.accounts) {
      followAccounts(ps.accounts.newValue || {});
      // the inboxes a saved search may name; not while one is being written
      if (!$('saved-list').contains(document.activeElement)) {
        paintSaved();
      }
    }
    followAI(ps);
  });
  const followAccess = () => {
    syncServices();
    syncAIAccess().then(paintCloud);
  };
  chrome.permissions.onAdded?.addListener(followAccess);
  chrome.permissions.onRemoved?.addListener(followAccess);
  // the AI card: the keys and the plan's account as stored and Chrome's access first, so it
  // shows as it is at once; then the engine a link names, and the word after a first sign-in
  Promise.all([readAIKeys(), syncAIAccess(), readAccount()]).then(paintAI).then(followHash).then(welcome);
  addEventListener('hashchange', followHash);
  addEventListener('hashchange', followSection);
  // a link to another part of the page, once the inboxes above it are drawn
  return paintAccounts().then(followSection);
});
