'use strict';

// The page a new user meets (worker.js opens it on install): the inboxes Mail Deck found, the
// icon pinned, the panel tried. Each step ticks off by itself as it happens, in any order.

// the strings live in _locales as welcome_*
const t = (key, ...subs) => chrome.i18n.getMessage('welcome_' + key, subs.map(String)) || key;
const $ = id => document.getElementById(id);
const h = (tag, props, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'class') {
      el.className = v;
    }
    else if (k === 'style') {
      el.style.cssText = v;
    }
    else {
      el[k] = v;
    }
  }
  el.append(...kids.filter(k => k !== null && k !== undefined && k !== false));
  return el;
};

// Google's page that signs in to one more account, as the panel opens it
const ADD_ACCOUNT = 'https://accounts.google.com/AddSession?continue=https://mail.google.com/mail/';
// the panel's colours, in the same order: an inbox has the colour here it has there
const PALETTE = ['#3567e6', '#169b62', '#d9822b', '#d23f3a', '#8b55d9', '#138fa8', '#c9447f', '#5e7a1f', '#a8612a', '#4f5b6b'];
// A check takes a few seconds, a slow feed up to its 9 s timeout. One that has not answered by
// then (no network, or a newer check took over) counts as nothing found; a later one still shows.
const LOOK_MS = 15000;
// Edge shows an eye where Chrome has a pin
const EDGE = Boolean(navigator.userAgentData?.brands?.some(b => b.brand === 'Microsoft Edge')) || / Edg\//.test(navigator.userAgent);

const state = {
  accounts: [], // {title, unread, color}: one per address, in the background's order
  looking: false, // a check asked for, not answered yet
  checked: false, // a check has answered with no account
  asked: 0, // when the last check was asked for
  // whether the icon is on the toolbar; where Chrome cannot tell, the user's Done says it is
  canTell: Boolean(chrome.action?.getUserSettings),
  pinned: false,
  tried: false, // the panel has been open
  windowId: null,
  said: new Set(), // the steps done, each said to a screen reader once
  ready: false
};

const STEPS = {
  inboxes: () => state.accounts.length > 0,
  pin: () => state.pinned,
  try: () => state.tried
};

/* step 1: the inboxes, as the background finds them */
// An empty list the background sends says no account is signed in (any more); the empty cache
// of a new install says only that no check has run yet.
const found = (objs, answer = true) => {
  const by = new Map();
  (Array.isArray(objs) ? objs : []).forEach((o, i) => {
    const title = o?.xml?.title;
    if (!title) {
      return;
    }
    // an account's label feeds count as one inbox, coloured as its first one is in the panel
    if (!by.has(title)) {
      by.set(title, {title, unread: 0, color: PALETTE[i % PALETTE.length]});
    }
    by.get(title).unread += Number(o.xml.fullcount) || 0;
  });
  state.accounts = [...by.values()];
  if (state.accounts.length || answer) {
    clearTimeout(look.timer);
    state.looking = false;
    state.checked = state.checked || !state.accounts.length;
  }
  paint();
};
// Asks the background for a check, as the panel does, but not a forced one: a forced check with
// no account signed in opens Gmail in a tab, which is the Sign in button's to do.
const look = () => {
  state.looking = true;
  state.asked = Date.now();
  clearTimeout(look.timer);
  look.timer = setTimeout(nothing, LOOK_MS);
  chrome.runtime.sendMessage({method: 'update'}, () => chrome.runtime.lastError);
  paint();
};
const nothing = () => {
  if (state.looking && !state.accounts.length) {
    clearTimeout(look.timer);
    state.looking = false;
    state.checked = true;
    paint();
  }
};
const signIn = () => chrome.tabs.create({url: ADD_ACCOUNT});

const paintInboxes = () => {
  const some = state.accounts.length > 0;
  $('looking').hidden = some || state.checked;
  $('found').hidden = !some;
  $('none').hidden = some || !state.checked;
  // Check again stays where it is while it looks, so it keeps the focus
  $('again').setAttribute('aria-disabled', state.looking);
  $('again').classList.toggle('busy', state.looking);
  // an inbox found now arrives; one shown already only gets its new count
  const shown = new Set([...$('accounts').querySelectorAll('.addr')].map(el => el.textContent));
  const rows = state.accounts.map(a => h('li', {class: shown.has(a.title) ? 'acc' : 'acc new'},
    h('span', {class: 'dot', style: `--c:${a.color}`}, (a.title.match(/[\p{L}\p{N}]/u) || ['?'])[0].toUpperCase()),
    h('span', {class: 'who'},
      h('span', {class: 'addr', title: a.title}, a.title),
      h('span', {class: 'count'}, a.unread ? t('unread', a.unread) : t('noUnread')))
  ));
  // the same list drawn again would only flicker
  const sig = JSON.stringify(state.accounts);
  if ($('accounts').dataset.sig !== sig) {
    $('accounts').dataset.sig = sig;
    $('accounts').replaceChildren(...rows);
  }
};

/* step 2: the icon pinned. Chrome tells (getUserSettings), and since 130 says when it changes;
   before that it is asked every second while the page is in view. */
const readPin = () => chrome.action.getUserSettings().then(s => {
  if (state.pinned !== (s?.isOnToolbar === true)) {
    state.pinned = s?.isOnToolbar === true;
    paint();
  }
}, () => {
  state.canTell = false;
  paint();
});
const paintPin = () => {
  const art = $('art');
  art.classList.toggle('is-pinned', state.pinned);
  art.classList.toggle('edge', EDGE);
  const unread = state.accounts.reduce((p, a) => p + a.unread, 0);
  $('art-count').textContent = unread > 999 ? '999+' : unread || '';
  $('pin-how').textContent = state.pinned ? t('pinned') : EDGE ? t('pinHowEdge') : t('pinHow');
  $('pin-manual').hidden = state.canTell || state.pinned;
};

/* step 3: the panel, from the side panel button, the icon or its shortcut */
// the popup or the side panel of the extension, open anywhere now
const panelOpen = async () => {
  try {
    if (chrome.runtime.getContexts) {
      return (await chrome.runtime.getContexts({contextTypes: ['POPUP', 'SIDE_PANEL']})).length > 0;
    }
    return (chrome.extension?.getViews?.({type: 'popup'}) || []).length > 0;
  }
  catch (e) {
    return false;
  }
};
const tried = () => {
  if (!state.tried) {
    state.tried = true;
    paint();
  }
};
const lookForPanel = () => !state.tried && panelOpen().then(open => open && tried());
const openSide = () => {
  // Chrome opens it only from a click, so nothing may be awaited before
  try {
    chrome.sidePanel.open({windowId: state.windowId}).then(tried, failed);
  }
  catch (e) {
    failed();
  }
};
const failed = () => {
  $('try-text').textContent = t('sideFailed');
};
const testNotification = () => {
  const id = 'welcome.test';
  // the same id again: the new one replaces it rather than piling up
  chrome.notifications.clear(id, () => chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: '/data/icons/notification/48.png',
    title: t('testTitle'),
    message: t('testText'),
    priority: 2
  }, () => {
    const error = chrome.runtime.lastError;
    const show = level => $('test-state').textContent = error || level === 'denied' ? t('testDenied') : t('testSent');
    if (chrome.notifications.getPermissionLevel) {
      chrome.notifications.getPermissionLevel(show);
    }
    else {
      show('granted');
    }
  }));
  // and the sound that comes with new mail
  chrome.runtime.sendMessage({method: 'test-play'}, () => chrome.runtime.lastError);
};
// the panel's shortcut, as Chrome has it now; coming back from its shortcuts page too
const paintShortcut = () => chrome.commands?.getAll?.().then(commands => {
  const key = commands.find(c => c.name === '_execute_action')?.shortcut;
  const el = $('keys');
  if (key) {
    const [before, after = ''] = t('shortcut', '\u0001').split('\u0001');
    el.replaceChildren(before, h('kbd', {}, key), after);
  }
  else if (!navigator.userAgent.includes('Firefox')) {
    el.replaceChildren(h('button', {type: 'button', class: 'link', onclick: () => chrome.tabs.create({url: 'chrome://extensions/shortcuts'})},
      t('setShortcut')));
  }
  el.hidden = !el.childNodes.length;
}).catch(() => {});

/* the steps */
const say = text => {
  $('said').textContent = text;
};
const paint = () => {
  paintInboxes();
  paintPin();
  let current = null;
  for (const [name, done] of Object.entries(STEPS)) {
    const el = $('step-' + name);
    const ok = done();
    if (!ok && !current) {
      current = name;
    }
    el.classList.toggle('is-done', ok);
    el.classList.toggle('current', name === current);
    if (name === current) {
      el.setAttribute('aria-current', 'step');
    }
    else {
      el.removeAttribute('aria-current');
    }
    // what ticks off while the page is open is said; what was done already is only shown
    if (ok && !state.said.has(name) && state.ready) {
      say(t('stepDone', el.querySelector('h2').textContent));
    }
    state.said[ok ? 'add' : 'delete'](name);
  }
  document.body.classList.toggle('all-set', !current);
  $('lede').textContent = current ? t('lede') : t('allSet');
};

/* the page */
document.documentElement.lang = chrome.i18n.getUILanguage();
document.documentElement.dir = chrome.i18n.getMessage('@@bidi_dir') || 'ltr';
for (const el of document.querySelectorAll('[data-i18n]')) {
  el.textContent = t(el.dataset.i18n);
}
{
  const site = chrome.runtime.getManifest().homepage_url;
  if (site) {
    $('site').href = site;
    $('policy').href = new URL('privacy.html', site).href;
  }
}
$('add').onclick = signIn;
$('sign-in').onclick = signIn;
$('again').onclick = () => !state.looking && look();
$('pin-done').onclick = () => {
  state.pinned = true;
  paint();
};
$('test').onclick = testNotification;
if (chrome.sidePanel?.open) {
  $('side').onclick = openSide;
}
else {
  $('side').hidden = true;
  $('or-icon').textContent = t('clickIcon');
}

// what the background finds: the panel's own updates, and the accounts it keeps for the session
chrome.runtime.onMessage.addListener(request => {
  if (['update', 'update-reset', 'update-date'].includes(request?.method) && Array.isArray(request.data)) {
    found(request.data);
  }
  // the background closes the panel when it finds no account signed in
  else if (request?.method === 'close-popup') {
    nothing();
  }
});
chrome.storage.onChanged.addListener((ps, area) => {
  if (area === 'session' && ps['cached-objects']) {
    found(ps['cached-objects'].newValue);
  }
});
if (state.canTell) {
  if (chrome.action.onUserSettingsChanged) {
    chrome.action.onUserSettingsChanged.addListener(change => {
      // a change of another setting does not say isOnToolbar
      if (change && 'isOnToolbar' in change) {
        state.pinned = change.isOnToolbar === true;
        paint();
      }
      else {
        readPin();
      }
    });
  }
  else {
    setInterval(() => state.canTell && document.visibilityState === 'visible' && readPin(), 1000);
  }
}
chrome.windows?.getCurrent?.().then(w => state.windowId = w.id, () => {});
paintShortcut();
// Back from signing in, or from the toolbar: a look for the new account (the background checks
// on its own once Gmail opens, this is for a tab that never got there), the pin, the panel.
// The popup takes the focus from the page when it opens.
const back = () => {
  if (document.visibilityState === 'visible' && !state.accounts.length && !state.looking && Date.now() - state.asked > 3000) {
    look();
  }
  if (state.canTell) {
    readPin();
  }
  lookForPanel();
};
document.addEventListener('visibilitychange', back);
addEventListener('focus', () => {
  back();
  paintShortcut();
});
addEventListener('blur', () => {
  setTimeout(lookForPanel, 400);
  setTimeout(lookForPanel, 1500);
});

// what is done already when the page opens is shown, not said
Promise.all([
  chrome.storage.session.get({'cached-objects': []}).then(prefs => {
    found(prefs['cached-objects'], false);
    // Nothing yet on a new install: the first check runs a few seconds after it. A check asked
    // for now runs sooner, and finding nothing is said by the background closing the panel.
    if (!state.accounts.length) {
      look();
    }
  }),
  state.canTell && readPin(),
  lookForPanel()
]).finally(() => {
  state.ready = true;
});
paint();
