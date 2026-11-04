/* global Resolved, Remind, gmail, codeOf, Sender */
'use strict';

// One colour per mailbox, in the order Google lists the signed-in accounts
const PALETTE = ['#3567e6', '#169b62', '#d9822b', '#d23f3a', '#8b55d9', '#138fa8', '#c9447f', '#5e7a1f', '#a8612a', '#4f5b6b'];
const ICONS = {
  refresh: ['M20 12a8 8 0 1 1-2.34-5.66', 'M20 4v5h-5'],
  open: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  compose: ['M12 20h8', 'M16.5 3.6a2.1 2.1 0 0 1 3 3L7.5 18.6 4 19.5l.9-3.5Z'],
  tune: ['M4 7h9', 'M17 7h3', 'M13 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0', 'M4 17h3', 'M11 17h9', 'M7 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0'],
  read: ['M3 10l9-6 9 6v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z', 'M3 10l9 6 9-6'],
  readAll: ['M2 12.5l4.5 4.5L16 7.5', 'M11.5 16.5l.5.5L21.5 7.5'],
  archive: ['M4.5 4h15A1.5 1.5 0 0 1 21 5.5v2A1.5 1.5 0 0 1 19.5 9h-15A1.5 1.5 0 0 1 3 7.5v-2A1.5 1.5 0 0 1 4.5 4Z', 'M5 9v9.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V9', 'M10 13h4'],
  trash: ['M4 7h16', 'M6.5 7l.9 12a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12', 'M9.5 7V4.5h5V7'],
  spam: ['M12 3l8 3.5v5.5c0 4.5-3.4 7.7-8 9-4.6-1.3-8-4.5-8-9V6.5Z', 'M12 8.5v4', 'M12 15.8v.2'],
  shield: ['M12 3l8 3.5v5.5c0 4.5-3.4 7.7-8 9-4.6-1.3-8-4.5-8-9V6.5Z', 'M8.8 12.2l2.2 2.2 4.2-4.4'],
  alert: ['M10.3 4.6a2 2 0 0 1 3.4 0l7.4 12.9a2 2 0 0 1-1.7 3H4.6a2 2 0 0 1-1.7-3Z', 'M12 10v4', 'M12 17v.1'],
  info: ['M12 20.5a8.5 8.5 0 1 0 0-17a8.5 8.5 0 0 0 0 17Z', 'M12 11v5', 'M12 7.9v.1'],
  back: ['M15 5l-7 7 7 7'],
  up: ['M6 15l6-6 6 6'],
  down: ['M6 9l6 6 6-6'],
  done: ['M4 12.5l5 5L20 6.5'],
  copy: ['M11 9h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z', 'M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3'],
  reply: ['M9.5 14.5L4 9l5.5-5.5', 'M4 9h10a6 6 0 0 1 6 6v4'],
  star: ['M12 3.6l2.55 5.2 5.7.83-4.13 4.02.98 5.68L12 16.65l-5.1 2.68.98-5.68-4.13-4.02 5.7-.83Z'],
  meet: ['M4.5 6h9A1.5 1.5 0 0 1 15 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 16.5v-9A1.5 1.5 0 0 1 4.5 6Z', 'M15 10.5l5.2-3.1a.5.5 0 0 1 .8.43v8.34a.5.5 0 0 1-.8.43L15 13.5'],
  mail: ['M4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11A1.5 1.5 0 0 1 4.5 5Z', 'M3.5 7l8.5 6 8.5-6'],
  search: ['M10.5 17a6.5 6.5 0 1 0 0-13a6.5 6.5 0 0 0 0 13Z', 'M15.5 15.5L20 20'],
  close: ['M6.5 6.5l11 11', 'M17.5 6.5l-11 11'],
  addUser: ['M10 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7Z', 'M3.5 20c.7-3.4 3.3-5.5 6.5-5.5 1.5 0 2.9.4 4 1.2', 'M18.5 14v6', 'M15.5 17h6'],
  clock: ['M12 20.5a8.5 8.5 0 1 0 0-17a8.5 8.5 0 0 0 0 17Z', 'M12 7.5V12l3 2'],
  side: ['M4.5 4h15A1.5 1.5 0 0 1 21 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-13A1.5 1.5 0 0 1 4.5 4Z', 'M15 4v16'],
  grip: ['M9 6h.01', 'M9 12h.01', 'M9 18h.01', 'M15 6h.01', 'M15 12h.01', 'M15 18h.01'],
  flag: ['M5.5 21V4.5', 'M5.5 4.5h11.5l-2.4 4.2 2.4 4.3H5.5'],
  bulk: ['M5 4.5h11a1 1 0 0 1 1 1V18a1.5 1.5 0 0 0 1.5 1.5h-12A1.5 1.5 0 0 1 5 18Z', 'M17 9h2.5a.5.5 0 0 1 .5.5V18a1.5 1.5 0 0 1-3 0', 'M8 8.5h6', 'M8 12h6', 'M8 15.5h3.5'],
  translate: ['M4 5.5h8', 'M8 3.5v2', 'M10.5 5.5c-.7 3.6-3 6.3-6 7.8', 'M6.2 8.6c1 1.9 2.6 3.4 4.6 4.3', 'M12.5 20.5l4-9.5 4 9.5', 'M13.9 17.2h5.2'],
  ask: ['M4.5 5h15A1.5 1.5 0 0 1 21 6.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V17h-1A1.5 1.5 0 0 1 3 15.5v-9A1.5 1.5 0 0 1 4.5 5Z', 'M10 9.3a2 2 0 1 1 2.7 1.9c-.4.2-.7.6-.7 1.1', 'M12 14.6v.1'],
  send: ['M12 19V5.5', 'M6.5 11L12 5.5l5.5 5.5'],
  stop: ['M8 7h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z'],
  attach: ['M20 11.5l-7.8 7.8a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8'],
  download: ['M12 4v11', 'M7.5 10.5L12 15l4.5-4.5', 'M5 19.5h14'],
  sparkle: ['M11 3.5l1.9 4.6 4.6 1.9-4.6 1.9L11 16.5l-1.9-4.6L4.5 10l4.6-1.9Z', 'M18.5 14.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9Z'],
  calendar: ['M5.5 5.5h13A1.5 1.5 0 0 1 20 7v11.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5Z', 'M4 10h16', 'M8.5 3.5v4', 'M15.5 3.5v4'],
  more: ['M5.5 12h.01', 'M12 12h.01', 'M18.5 12h.01'],
  pushpin: ['M8.5 3.5h7', 'M9.5 3.5v6l-3 3.5h11l-3-3.5v-6', 'M12 13v7.5'],
  keyboard: ['M4.5 6h15A1.5 1.5 0 0 1 21 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5v-9A1.5 1.5 0 0 1 4.5 6Z', 'M7 10h.01', 'M10.5 10h.01', 'M14 10h.01', 'M17 10h.01', 'M8.5 14h7'],
  plus: ['M12 5v14', 'M5 12h14'],
  // Gmail's own categories: Promotions, Social, Updates
  tag: ['M3.5 12.1V4.5a1 1 0 0 1 1-1h7.6a1 1 0 0 1 .7.3l7.7 7.7a1 1 0 0 1 0 1.4l-7.6 7.6a1 1 0 0 1-1.4 0l-7.7-7.7a1 1 0 0 1-.3-.7Z', 'M8 8h.01'],
  people: ['M9 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7Z', 'M2.5 20c.6-3.3 3.2-5.5 6.5-5.5s5.9 2.2 6.5 5.5', 'M16 4.3a3.5 3.5 0 0 1 0 6.4', 'M18.2 14.9c1.8.8 2.9 2.5 3.3 5.1'],
  info: ['M12 20.5a8.5 8.5 0 1 0 0-17a8.5 8.5 0 0 0 0 17Z', 'M12 11v5', 'M12 8v.1'],
  unread: ['M13.5 5h-9A1.5 1.5 0 0 0 3 6.5v11A1.5 1.5 0 0 0 4.5 19h15a1.5 1.5 0 0 0 1.5-1.5v-6', 'M3.5 7l8.5 6 3.2-2.3', 'M19 8.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5Z'],
  label: ['M3.5 12.1V4.5a1 1 0 0 1 1-1h7.6a1 1 0 0 1 .7.3l7.7 7.7a1 1 0 0 1 0 1.4l-7.6 7.6a1 1 0 0 1-1.4 0l-7.7-7.7a1 1 0 0 1-.3-.7Z', 'M8 8h.01'],
  move: ['M3 7.5V18a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18V9a1.5 1.5 0 0 0-1.5-1.5H12L10 5H4.5A1.5 1.5 0 0 0 3 6.5Z', 'M9 13.5h6.5', 'M13 11l2.5 2.5L13 16'],
  unsubscribe: ['M21 11V6.5A1.5 1.5 0 0 0 19.5 5h-15A1.5 1.5 0 0 0 3 6.5v11A1.5 1.5 0 0 0 4.5 19H12', 'M3.5 7l8.5 6 8.5-6', 'M15.5 17.5h6']
};
// the strings live in _locales as panel_*; a language without one falls back to English
const t = (key, ...subs) => chrome.i18n.getMessage('panel_' + key, subs.map(String)) || key;
const LANG = chrome.i18n.getUILanguage();
const ACTIONS = {
  'rd': {icon: 'read', title: t('markRead'), key: 'R', done: t('doneRead')},
  'rc_^i': {icon: 'archive', title: t('archive'), key: 'E', done: t('doneArchive')},
  'tr': {icon: 'trash', title: t('delete'), key: 'Del', done: t('doneDelete'), danger: true},
  'sp': {icon: 'spam', title: t('spam'), key: '!', done: t('doneSpam'), danger: true}
};
// how long an action waits for its Undo before it reaches Gmail
const UNDO_MS = 5000;
// Mailboxes whose senders share one domain; their logo says nothing about the sender
const FREEMAIL = /^(gmail|googlemail|yahoo|ymail|outlook|hotmail|live|icloud|me|mail|yandex|ya|proton|protonmail|pm|aol|gmx|inbox|bk|list|rambler)\./;
const ADD_ACCOUNT = 'https://accounts.google.com/AddSession?continue=https://mail.google.com/mail/';
// the side panel loads side.html, which comes here with ?side: that panel stays open after a click
const SIDE = new URLSearchParams(location.search).has('side');

const $ = id => document.getElementById(id);
// a mail's line in the list
const rowOf = link => $('list').querySelector(`.row[data-link="${CSS.escape(link)}"]`);
// state.focus is a link, or this: the first line of the list, when no mail is left to go to
const FIRST = Symbol('first');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const dark = matchMedia('(prefers-color-scheme: dark)');

const state = {
  objs: [], // the accounts as the background published them
  hidden: new Set(), // links acted on here, until the feed stops listing them
  reading: null, // {e, o, next, code}
  // the list's mail as the reader found it, link -> {e, o}: J and K walk it, though mail read on
  // opening has left the list by then
  trail: null,
  autoAdvance: false, // an action in the reader opens the next mail instead of the list
  badgeNew: false, // the toolbar count shows the mail since the panel was last opened
  focus: null, // the line the next drawing gives the focus to: a link, or FIRST
  only: null, // the mailbox the chips narrowed the list to
  // the site of the page the panel opened over, {domain, brand}; its address is never kept
  site: null,
  siteOnly: false, // the list narrowed to the site's mail ("N more")
  // the assistant (Settings → AI): its engine and features; ok once AI.state() said it is ready
  ai: {engine: 'off', summary: 'click', reply: true, buttons: true, ok: false},
  replies: new Map(), // replyId -> {reply, why}: the mail waiting for a reply, as the assistant sees it
  sortOnly: null, // the list narrowed to one kind of that sorting: 'reply', 'important' or 'bulk'
  replyError: null, // the assistant's last failure in that, shown as a dot on its chip
  rows: new Map(), // link -> {e, o}
  files: new Map(), // link#version -> [{name, view, download}]: a Gmail thread's attachments, read ahead
  pending: null, // the action waiting for its Undo: {cmd, links, ready, timer}
  // threads with a star; the feed does not tell, Gmail's search does
  starred: new Set(),
  // what the feed leaves out: its 20 entries are all it lists of a mailbox. accountName -> entries
  extra: new Map(),
  expanded: new Set(), // mailboxes showing their extra mail, by accountName
  search: null, // {q, busy, results: [{o, entries, failed}]}
  accounts: {}, // every address the extension has seen, with its settings
  order: [], // the mailboxes, by name, in the order they were dragged to
  drag: null, // the name of the mailbox being dragged
  readOnOpen: false,
  senderLogos: true, // the settings may turn the logos off; they come from Google's icon service
  askPictures: false, // Gmail's pictures wait for Show pictures, as other services' do
  avatars: {}, // address -> {url}: the accounts' own pictures
  windowId: null,
  // after a browser start, until the background has read the mail once: the list shows lines
  // that stand for it, never "Sign in" to someone signed in
  booting: false,
  unpinned: false, // the toolbar button is not pinned, and the hint about it not closed (pinHint)
  categories: true, // Gmail's own categories as chips over the list (Settings → Panel)
  saved: [], // the searches saved in the settings, a chip each: [{name, query, account}]
  rate: null // the days the panel was opened on, and what became of the rating it asked for (rateLine)
};
let refreshing = false;
// the list drawn as one types in the search: nothing it draws may ask the network (searchList)
let quiet = false;
// the first list with mail gives its first line the focus (renderList)
let firstFocus = true;

const h = (tag, props, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'class') {
      el.className = v;
    }
    else if (k === 'style') {
      el.style.cssText = v;
    }
    else if (k.startsWith('data-') || k.startsWith('aria-') || k === 'role') {
      el.setAttribute(k, v);
    }
    else {
      el[k] = v;
    }
  }
  el.append(...kids.flat().filter(k => k !== null && k !== undefined && k !== false));
  return el;
};
const icon = name => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = ICONS[name].map(d => `<path d="${d}"/>`).join('');
  return svg;
};
// A key as aria-keyshortcuts names it, from the way the tooltips write it
const ariaKey = key => ({Del: 'Delete', Esc: 'Escape', 'Alt+↑/↓': 'Alt+ArrowUp Alt+ArrowDown'})[key] || key;
// what a tooltip shows: a name, and its key when it has one. A key given in the name, as
// "Hide (I)", is taken out of it
const KEY_IN = /^(.+?) \(((?:Alt|Shift)\+\S+|[^()\s]{1,6})\)$/;
const tipped = (label, key = '') => {
  const m = !key && KEY_IN.exec(label);
  key = key || (m ? m[2] : '');
  label = m ? m[1] : label;
  return {'data-tip': label, ...(key ? {'data-key': key, 'aria-keyshortcuts': ariaKey(key)} : {})};
};
// data-focus names the button, so it gets the focus back once the list is drawn again; its name
// is its label and its tooltip (no native title, which would show as well)
const btn = (name, title, onclick, extra = '', key = '') => {
  const tip = tipped(title, key);
  return h('button', {
    'class': 'icon-btn ' + extra,
    'type': 'button',
    'aria-label': tip['data-tip'],
    ...tip,
    'data-focus': name,
    'onclick': ev => {
      ev.stopPropagation();
      onclick(ev);
    }
  }, icon(name));
};
// a check stands in for the icon for a moment, so a copy needs no look at the toast
const copyBtn = text => btn('copy', t('copyAddress'), ev => {
  const el = ev.currentTarget;
  navigator.clipboard.writeText(text).then(() => {
    el.replaceChildren(icon('done'));
    el.classList.add('copied');
    setTimeout(() => {
      el.replaceChildren(icon('copy'));
      el.classList.remove('copied');
    }, 1200);
  }, () => toast(t('copyFailed'), true));
}, 'copy');

/* one-time codes: a sign-in or verification code in a mail, a click from the clipboard */
// codeOf(text): core/utils/code.js, which the background's notifications read the codes with too
// copying marks nothing read and deletes nothing: the mail stays as it was. said: a toast to show
// once copied, for a code copied away from its mail
const copyCode = (code, el, said) => navigator.clipboard.writeText(code.copy).then(() => {
  el?.classList.add('copied');
  setTimeout(() => el?.classList.remove('copied'), 1200);
  if (said) {
    toast(said);
  }
}, () => toast(t('copyCodeFailed'), true));
const codePill = code => h('button', {
  'class': 'code',
  'type': 'button',
  ...tipped(t('copyCode'), 'C'),
  'aria-label': t('copyCode') + ' ' + code.shown,
  'data-focus': 'code',
  // the pill is not the mail: a click on it opens nothing
  'onclick': ev => {
    ev.stopPropagation();
    copyCode(code, ev.currentTarget);
  }
}, code.shown);

const when = iso => {
  const d = new Date(iso);
  if (isNaN(d)) {
    return '';
  }
  const now = new Date();
  const mins = (now - d) / 60000;
  if (mins < 1) {
    return t('now');
  }
  if (mins < 60) {
    return t('minutes', Math.floor(mins));
  }
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(LANG, {hour: 'numeric', minute: '2-digit'});
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return t('yesterday');
  }
  return d.toLocaleDateString(LANG, d.getFullYear() === now.getFullYear() ? {day: 'numeric', month: 'short'} : {});
};
const fullDate = iso => {
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleString(LANG, {dateStyle: 'long', timeStyle: 'short'});
};
// the reader's: the day and the time, the year only for another year's mail
const shortDate = iso => {
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleString(LANG, {weekday: 'short', day: 'numeric', month: 'short',
    ...(d.getFullYear() === new Date().getFullYear() ? {} : {year: 'numeric'}), hour: 'numeric', minute: '2-digit'});
};
// a reminder's moment: the time today, the day and the time this week, the date further on
const later = ms => {
  const d = new Date(ms);
  const days = (d - new Date()) / 86400000;
  return d.toLocaleString(LANG, d.toDateString() === new Date().toDateString() ? {hour: 'numeric', minute: '2-digit'} :
    days < 6 ? {weekday: 'short', hour: 'numeric', minute: '2-digit'} : {day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'});
};

// the account's own picture when Google has one (core/avatars.js finds it), the coloured dot otherwise
const mark = email => {
  const url = state.avatars[email]?.url;
  return url ? h('img', {
    class: 'me',
    src: url,
    alt: '',
    referrerPolicy: 'no-referrer',
    onerror: ev => ev.target.replaceWith(h('span', {class: 'dot'}))
  }) : h('span', {class: 'dot'});
};
// The registrable part of a host, what its owner bought: news.binance.com -> binance.com,
// mail.example.co.uk -> example.co.uk, www.bmw.de -> bmw.de. A two-part public suffix is a
// country's second level of this kind (co.uk, com.au, com.br, co.jp, ne.jp...).
const SUFFIX2 = new Set(['co', 'com', 'net', 'org', 'gov', 'edu', 'ac', 'or', 'ne', 'go', 'gob', 'ltd', 'plc', 'nic', 'mil', 'sch', 'gen', 'nom', 'biz']);
const registrable = host => {
  const parts = String(host || '').toLowerCase().replace(/\.$/, '').split('.');
  return parts.slice(parts.length > 2 && parts.at(-1).length === 2 && SUFFIX2.has(parts.at(-2)) ? -3 : -2).join('.');
};
// a sender address's registrable domain
const senderDomain = e => registrable((e.author_email || '').split('@')[1]);
// domain -> whether it has a logo, kept for the browser session
const logos = new Map();
// The icon service is Google's, and it answers without CORS, so the request carries the
// Google cookies: a mailbox of another service (Proton, Yandex...) shows the letter only,
// and its senders stay unknown to Google.
const avatar = (e, o) => {
  const name = e.author_name || e.author_email || '';
  const hash = [...(e.author_email || name)].reduce((p, c) => (p * 31 + c.charCodeAt(0)) >>> 0, 0);
  const el = h('span', {class: 'avatar', style: `--c:${PALETTE[hash % PALETTE.length]}`},
    (name.match(/[\p{L}\p{N}]/u) || ['?'])[0].toUpperCase());
  const root = senderDomain(e);
  // the search drawing as one types shows only the logos it already knows
  if (state.senderLogos && !serviceOf(o) && root.includes('.') && !FREEMAIL.test(root) && logos.get(root) !== false && !(quiet && !logos.has(root))) {
    const img = h('img', {alt: '', referrerPolicy: 'no-referrer'});
    // the service answers an unknown domain with a 16px globe
    img.onload = () => {
      const has = img.naturalWidth >= 32;
      el.classList.toggle('logo', has);
      if (logos.get(root) !== has) {
        logos.set(root, has);
        chrome.storage.session.set({logos: Object.fromEntries(logos)});
      }
    };
    img.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(root)}&sz=64`;
    // a logo seen before shows from the first frame instead of after the letter
    el.classList.toggle('logo', logos.get(root) === true);
    el.append(img);
  }
  return el;
};

const accountName = o => o.xml.title + (o.xml.label ? ` [${o.xml.label}]` : '');
// a mailbox of another service than Gmail (core/services/), and what it can do: Gmail can all
const serviceOf = o => o?.xml.service ? self.MailServices?.[o.xml.service] : undefined;
const can = (o, what) => {
  const s = serviceOf(o);
  return !s || Boolean(s.can?.[what]);
};
const openIn = o => serviceOf(o) ? t('openIn', serviceOf(o).name) : t('openInGmail');
const openInbox = o => serviceOf(o) ? t('openInboxIn', serviceOf(o).name) : t('openInbox');

// the accounts with what this panel already acted on taken out, in the order they were
// dragged to; a mailbox keeps its colour wherever it goes, a new one comes last
const view = () => {
  // mail acted on from Gmail's search or the assistant is the feed's mail too, printed otherwise:
  // the same thread at the same place (/u/<n>)
  const acted = new Set([...state.hidden].filter(link => gmail.get.id(link)).map(link => userOf(link) + '|' + thread(link)));
  const copies = acted.size ? state.objs.filter(o => !serviceOf(o)).flatMap(o => o.xml.entries.filter(e =>
    !state.hidden.has(e.link) && acted.has(userOf(o.xml.rootLink) + '|' + thread(e.link)))).map(e => e.link) : [];
  const objs = Resolved.apply(state.objs, [...state.hidden, ...copies].map(link => ({link})))
    .map((o, i) => ({...o, color: PALETTE[i % PALETTE.length]}));
  const place = o => {
    const i = state.order.indexOf(accountName(o));
    return i === -1 ? state.order.length + objs.indexOf(o) : i;
  };
  return objs.filter(o => o.meta?.ignored !== true).sort((a, b) => place(a) - place(b));
};
// a thread is the same in the feed and in Gmail's search, their links are not
const thread = link => gmail.get.id(link) || link;

const gmailLink = (e, o) => {
  const id = gmail.get.id(e.link);
  if (!id) {
    return e.link;
  }
  return o.xml.link.includes('#') ? o.xml.link + '/' + id : gmail.get.base(e.link) + '/?shva=1#inbox/' + id;
};
const openUrl = url => chrome.runtime.sendMessage({method: 'open', url}, () => {
  chrome.runtime.lastError;
  if (!SIDE) {
    window.close();
  }
});
const openEntry = (e, o, ev) => {
  const background = ev && (ev.button === 1 || ev.metaKey || ev.ctrlKey);
  chrome.runtime.sendMessage({
    method: 'open',
    url: {link: gmailLink(e, o), button: background ? 1 : 0}
  }, () => {
    chrome.runtime.lastError;
    if (!background && !SIDE) {
      window.close();
    }
  });
};
// the account number Gmail puts in its links: mail/u/1/...
const userOf = link => (link.match(/u\/(\d+)/) || [])[1] || 0;
// Gmail has no link that opens a reply to a thread, so the compose window gets the sender and the subject
const replyUrl = (e, o) => {
  const subject = e.title || '';
  const su = /^re:/i.test(subject) ? subject : 'Re: ' + subject;
  const s = serviceOf(o);
  if (s) {
    return s.compose(e.author_email, su);
  }
  return `https://mail.google.com/mail/u/${userOf(e.link)}/?view=cm&fs=1&to=${encodeURIComponent(e.author_email)}&su=${encodeURIComponent(su)}`;
};
// new mail goes out from the mailbox in view: the open message's, the chosen chip's, or the first one
const composeFrom = objs => state.reading?.o || objs.find(o => o.xml.link === state.only) || objs[0];
const composeUrl = o => serviceOf(o)?.compose() || `https://mail.google.com/mail/u/${o ? userOf(o.xml.link) : 0}/?view=cm&fs=1`;
// meet.google.com/new starts a meeting at once; authuser picks the account by its address
const meetUrl = o => 'https://meet.google.com/new?authuser=' + encodeURIComponent(o.xml.title);
const signInUrl = email => self.MailServices?.[state.accounts[email]?.service]?.signIn ||
  'https://accounts.google.com/AccountChooser?Email=' + encodeURIComponent(email) +
  '&continue=' + encodeURIComponent('https://mail.google.com/mail/');
const searchUrl = (o, q) => `https://mail.google.com/mail/u/${userOf(o.xml.link)}/#search/${encodeURIComponent(q)}`;

/* Gmail's search: what the feed does not say */
// its rows become feed entries, so the list, the reader and the actions take them as they are
const fromSearch = (a, o) => {
  const strings = [a.from].flat(Infinity).filter(s => typeof s === 'string' && s);
  const pair = strings.length === 1 && /^(.*?)\s*<([^>]+)>$/.exec(strings[0]);
  const email = pair ? pair[2] : strings.find(s => s.includes('@')) || '';
  const name = pair ? pair[1] : strings.find(s => !s.includes('@')) || email;
  // seconds, milliseconds or microseconds
  let date = Number(a.date) || 0;
  date = date > 1e14 ? date / 1000 : date < 1e11 ? date * 1000 : date;
  const labels = a.labels || [];
  seenLabels(o, labels);
  return {
    link: `${o.xml.rootLink.replace(/\/$/, '')}?message_id=${a.thread}&view=conv&extsrc=atom`,
    id: 'search:' + a.thread,
    title: a.subject || '',
    summary: a.text || '',
    author_name: name,
    author_email: email,
    modified: date ? new Date(date).toISOString() : '',
    unread: labels.includes('^u'),
    starred: labels.includes('STARRED'),
    // the tabs Gmail sorted the thread into, when the row says (categoriesOf)
    cats: categoriesOf(labels)
  };
};
// Gmail may not answer at all; the panel does not wait longer than this
const SEARCH_MS = 8000;
const searchIn = (o, query) => Promise.race([
  chrome.runtime.sendMessage({method: 'gmail.search', url: o.xml.rootLink, query}),
  new Promise(resolve => setTimeout(resolve, SEARCH_MS, null))
]).then(entries => Array.isArray(entries) ? entries.map(a => fromSearch(a, o)) : null, () => null);
// the search that lists what a mailbox's feed lists
const unreadQuery = o => {
  if (serviceOf(o)) {
    return null;
  }
  const label = o.xml.label;
  if (!label) {
    return 'in:inbox is:unread';
  }
  if (label.startsWith('^')) {
    return label === '^smartlabel_personal' ? 'in:inbox category:primary is:unread' : null;
  }
  return 'label:' + label.toLowerCase().replace(/[\s/&]+/g, '-') + ' is:unread';
};
// The stars, and the unread mail past the feed's 20: asked once a panel opens, and again when a
// mailbox's count moves, at most once in a few minutes (a side panel stays open for days). What
// the search found stays that long for a mailbox whose count has not moved, so a panel opened
// again shows it at once and asks Gmail nothing. A mailbox goes by its address and label
// (accountName): its place in the browser (/u/<n>) moves when an account before it signs out,
// and what was found before names the old place, so it is asked again.
const EXTRA = 'extra.cache';
const EXTRA_MS = 3 * 60 * 1000;
// what this panel found of each mailbox: name -> {at, fullcount, rootLink, entries}
const extraFound = new Map();
// the session's answers, read once a panel
let extraSaved = null;
// the last action here: what was found before it is not given to the next panel
let extraForgot = 0;
// an action here makes the answers old: the next panel asks again, this one once the count moves
const forgetExtra = () => {
  extraForgot = Date.now();
  extraSaved = Promise.resolve({});
  savedFound.clear();
  chrome.storage.session.remove([EXTRA, SAVED]);
};
const loadExtra = async () => {
  if (state.objs.length === 0) {
    return;
  }
  const saved = await (extraSaved ||= chrome.storage.session.get(EXTRA).then(prefs => prefs[EXTRA] || {}, () => ({})));
  const use = (o, found) => {
    extraFound.set(accountName(o), found);
    found.entries.filter(e => e.starred).forEach(e => state.starred.add(thread(e.link)));
    const listed = new Set(o.xml.entries.map(e => thread(e.link)));
    state.extra.set(accountName(o), found.entries.filter(e => !listed.has(thread(e.link))));
  };
  const asks = [];
  let changed = false;
  for (const o of state.objs) {
    const name = accountName(o);
    const query = unreadQuery(o);
    const had = extraFound.get(name);
    // nothing left past the feed's 20, or found at another place
    if (!query || !o.xml.fullcount || o.meta?.ignored || (had && had.rootLink !== o.xml.rootLink)) {
      changed = state.extra.delete(name) || changed;
      extraFound.delete(name);
      if (!query || !o.xml.fullcount || o.meta?.ignored) {
        continue;
      }
    }
    const found = extraFound.get(name);
    // its count has not moved, or it was asked a moment ago
    if (found && (found.fullcount === o.xml.fullcount || Date.now() - found.at < EXTRA_MS)) {
      continue;
    }
    const old = saved[name];
    if (!found && old && Date.now() - old.at < EXTRA_MS && old.fullcount === o.xml.fullcount && old.rootLink === o.xml.rootLink) {
      use(o, old);
      changed = true;
      continue;
    }
    // asked once at a time: an answer still on its way counts as found
    const asking = {at: Date.now(), fullcount: o.xml.fullcount, rootLink: o.xml.rootLink, entries: found?.entries || [], pending: true};
    extraFound.set(name, asking);
    asks.push(searchIn(o, query).then(entries => {
      if (extraFound.get(name) !== asking) {
        return;
      }
      if (entries) {
        use(o, {at: asking.at, fullcount: asking.fullcount, rootLink: asking.rootLink, entries});
      }
      // Gmail did not answer: asked again at the next check
      else if (found) {
        extraFound.set(name, found);
      }
      else {
        extraFound.delete(name);
      }
    }));
  }
  if (changed) {
    render();
    paintStar();
  }
  if (asks.length) {
    await Promise.all(asks);
    render();
    paintStar();
    scheduleReplies();
  }
  // for the next panel: what was found since the last action here
  if (changed || asks.length) {
    const kept = Object.fromEntries([...extraFound].filter(([, f]) => f.at > extraForgot && !f.pending));
    chrome.storage.session.set({[EXTRA]: kept});
  }
  loadCategories();
};

/* Gmail's own sorting of the inbox, its tabs: chips that narrow the list, with no AI */
// Promotions and Social are what the assistant's Newsletters is made of (BULK_QUERY): while it
// sorts the mail, its chip stands for them, and Updates keeps one of its own
const CATEGORIES = {
  promo: {icon: 'tag', query: 'category:promotions', labels: ['^smartlabel_promo', '^sq_ig_i_promo'], bulk: true},
  social: {icon: 'people', query: 'category:social', labels: ['^smartlabel_social', '^sq_ig_i_social'], bulk: true},
  updates: {icon: 'info', query: 'category:updates', labels: ['^smartlabel_notification', '^sq_ig_i_notification']}
};
// a label of that sorting, Primary's and Forums' as well
const SORTED = /^\^(smartlabel|sq_ig_i)_/;
// where a row of Gmail's search says its thread is: the categories it is in ([] for Primary), or
// null for a row that carries no label of the sorting at all
const categoriesOf = labels => labels.some(l => SORTED.test(l)) ?
  Object.keys(CATEGORIES).filter(k => CATEGORIES[k].labels.some(l => labels.includes(l))) : null;
// the categories that have a chip now
const shownCategories = () => !state.categories ? [] :
  Object.keys(CATEGORIES).filter(k => !(CATEGORIES[k].bulk && aiOn() && state.ai.reply && state.ai.ok));
// The categories of a mailbox's unread mail come with the search for its mail past the feed's 20
// (loadExtra): its rows' labels say them, and nothing more is asked. An inbox whose rows carry
// none has each category searched for instead, asked as that search is (once its count moves, at
// most once in a few minutes) and kept for the next panel too.
const CATS = 'categories.cache';
// what was found that way: name -> {at, fullcount, rootLink, threads: {promo: [thread...], ...}}
const catFound = new Map();
let catSaved = null;
// a mailbox's thread -> its categories, from what was found of it; made once for each answer
const catMaps = new WeakMap();
const categoriesIn = o => {
  const found = extraFound.get(accountName(o));
  if (found && !catMaps.has(found)) {
    catMaps.set(found, found.entries.some(e => e.cats) ? new Map(found.entries.map(e => [thread(e.link), e.cats || []])) : null);
  }
  if (found && catMaps.get(found)) {
    return catMaps.get(found);
  }
  const searched = catFound.get(accountName(o));
  if (searched && !catMaps.has(searched)) {
    const map = new Map();
    Object.entries(searched.threads).forEach(([kind, list]) => list.forEach(id => map.set(id, [...map.get(id) || [], kind])));
    catMaps.set(searched, map);
  }
  return searched ? catMaps.get(searched) : null;
};
const inCategory = (kind, e, o) => shownCategories().includes(kind) && Boolean(categoriesIn(o)?.get(thread(e.link))?.includes(kind));
const loadCategories = async () => {
  if (!state.categories || state.objs.length === 0) {
    return;
  }
  const saved = await (catSaved ||= chrome.storage.session.get(CATS).then(prefs => prefs[CATS] || {}, () => ({})));
  const asks = [];
  let changed = false;
  for (const o of state.objs) {
    const name = accountName(o);
    const found = extraFound.get(name);
    // its unread mail being asked for: what it had stays meanwhile
    if (found?.pending) {
      continue;
    }
    let had = catFound.get(name);
    // an inbox with unread mail found, whose rows do not say where it is
    if (unreadQuery(o) !== 'in:inbox is:unread' || !found?.entries.length || found.entries.some(e => e.cats)) {
      changed = catFound.delete(name) || changed;
      continue;
    }
    if (had && had.rootLink !== o.xml.rootLink) {
      catFound.delete(name);
      had = null;
      changed = true;
    }
    if (had && (had.fullcount === o.xml.fullcount || Date.now() - had.at < EXTRA_MS)) {
      continue;
    }
    const old = saved[name];
    if (!had && old && Date.now() - old.at < EXTRA_MS && old.fullcount === o.xml.fullcount && old.rootLink === o.xml.rootLink) {
      catFound.set(name, old);
      changed = true;
      continue;
    }
    const asking = {at: Date.now(), fullcount: o.xml.fullcount, rootLink: o.xml.rootLink, threads: had?.threads || {}, pending: true};
    catFound.set(name, asking);
    const kinds = Object.keys(CATEGORIES);
    asks.push(Promise.all(kinds.map(k => searchIn(o, 'in:inbox is:unread ' + CATEGORIES[k].query))).then(lists => {
      if (catFound.get(name) !== asking) {
        return;
      }
      // every category answered, or none counts: asked again at the next check
      if (lists.every(Boolean)) {
        catFound.set(name, {at: asking.at, fullcount: asking.fullcount, rootLink: asking.rootLink,
          threads: Object.fromEntries(kinds.map((k, i) => [k, lists[i].map(e => thread(e.link))]))});
      }
      else if (had) {
        catFound.set(name, had);
      }
      else {
        catFound.delete(name);
      }
    }));
  }
  if (changed) {
    render();
  }
  if (asks.length) {
    await Promise.all(asks);
    render();
  }
  if (changed || asks.length) {
    chrome.storage.session.set({[CATS]: Object.fromEntries([...catFound].filter(([, f]) => !f.pending))});
  }
};

/* toast */
let toastTimer;
const hideToast = () => $('toast').classList.remove('show');
const toast = (text, error, undo) => {
  const el = $('toast');
  el.replaceChildren(h('span', {}, text), undo ? h('button', {
    class: 'undo',
    type: 'button',
    ...tipped(t('undo'), 'Z'),
    onclick: undo
  }, t('undo')) : '');
  el.classList.toggle('error', Boolean(error));
  // the line under an Undo runs out with it, from the start for each new one
  el.classList.remove('counting');
  if (undo) {
    el.style.setProperty('--undo', UNDO_MS + 'ms');
    requestAnimationFrame(() => el.classList.add('counting'));
  }
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, undo ? UNDO_MS : error ? 4000 : 1800);
};

/* actions */
// archive and spam are not every service's
const allowed = (cmd, o) => (cmd !== 'rc_^i' || can(o, 'archive')) && (cmd !== 'sp' || can(o, 'spam'));
// Gmail accepts an action only with the GMAIL_AT cookie, which its print view sets
const ensureAt = async link => {
  const n = (link.match(/u\/(\d+)/) || [])[1];
  const at = await chrome.runtime.sendMessage({method: 'get-at', n}).catch(() => null);
  if (!at) {
    await gmail.body(link, true).catch(() => {});
  }
};
// the background waits out the Undo window (delay) itself: the panel may close any moment. Mail
// of several accounts may be done in some and not in others: only what failed comes back.
const send = ({cmd, links, id}, delay = 0) => chrome.runtime.sendMessage({method: 'gmail.action', cmd, links, id, delay}, failure => {
  if (chrome.runtime.lastError || failure) {
    (Array.isArray(failure?.failed) ? failure.failed : links).forEach(link => state.hidden.delete(link));
    render();
    toast(t('actionFailed'), true);
  }
});
// the Undo is gone: the action stays as it is
const commit = p => {
  if (state.pending === p) {
    state.pending = null;
    clearTimeout(p.timer);
  }
};
const undo = () => {
  const p = state.pending;
  if (!p) {
    return;
  }
  state.pending = null;
  clearTimeout(p.timer);
  hideToast();
  if (p.cmd === 'remind') {
    // the background writes the list, one change after the other
    chrome.runtime.sendMessage({method: 'remind.remove', links: p.links}).catch(() => Remind.remove(p.links));
  }
  else {
    chrome.runtime.sendMessage({method: 'gmail.action.cancel', id: p.id});
  }
  p.links.forEach(link => state.hidden.delete(link));
  state.focus = p.links[0];
  foldUntil = 0;
  render();
};
// the line that takes the place of these mails: the next one left, else the one before
const neighbour = links => {
  const all = [...$('list').querySelectorAll('.row')];
  const at = all.findLastIndex(r => links.includes(r.dataset.link));
  const left = r => !links.includes(r.dataset.link) && !state.hidden.has(r.dataset.link);
  return at === -1 ? null : all.slice(at + 1).find(left) || all.slice(0, at).reverse().find(left) || null;
};
// a list drawn while mail folds away would cut the fold short; the fold draws it when done
let foldUntil = 0;
const act = (cmd, links, until) => {
  // a second click, or the key pressed twice, while the mail folds away: it has its action
  // already, and a second one would outlive the Undo of the first
  links = links.filter(link => !state.pending?.links.includes(link));
  if (links.length === 0) {
    return;
  }
  // one Undo at a time: the action before this one is final now
  if (state.pending) {
    commit(state.pending);
  }
  const rows = links.map(rowOf).filter(Boolean);
  // the focus goes to the mail that takes their place; from the reader, to the line back()
  // focused; with no mail left, to the first line of the list
  const active = document.activeElement?.closest?.('#list .row');
  const next = neighbour(links) || (active && !links.includes(active.dataset.link) && !state.hidden.has(active.dataset.link) ? active : null);
  state.focus = next ? next.dataset.link : FIRST;

  links.forEach(link => state.hidden.add(link));
  forgetExtra();
  const duration = reducedMotion ? 0 : 180;
  foldUntil = performance.now() + duration;
  rows.forEach(el => el.animate([
    {height: el.offsetHeight + 'px', opacity: 1},
    {height: '0px', opacity: 0, paddingTop: 0, paddingBottom: 0}
  ], {duration, easing: 'ease-in', fill: 'forwards'}));
  setTimeout(render, duration);

  const p = {cmd, links, id: Math.random().toString(36).slice(2)};
  if (cmd === 'remind') {
    // the background keeps it out of the badge and rings when its time comes, in the account's
    // place as it is then
    const items = links.map(link => {
      const {e, o} = state.rows.get(link) || {};
      return {link, open: e ? gmailLink(e, o) : link, title: e?.title || '', from: e?.author_name || e?.author_email || '',
        ...(o && !serviceOf(o) ? {account: o.xml.title} : {})};
    });
    chrome.runtime.sendMessage({method: 'remind.add', items, until}).catch(() => Remind.add(items, until));
  }
  else {
    send(p, UNDO_MS);
  }
  p.timer = setTimeout(() => commit(p), UNDO_MS);
  state.pending = p;
  const many = links.length > 1 ? links.length : '';
  // a move names the label it went to (mv_<label>)
  toast(cmd === 'remind' ? t('doneRemind', later(until)) + (many && ` · ${many}`) :
    (cmd.startsWith('mv_') ? t('doneMove', cmd.slice(3)) : ACTIONS[cmd].done) + (many && `: ${many}`), false, undo);
};
const paintStar = () => {
  const el = $('reader-bar').querySelector('.star');
  if (el && state.reading) {
    const on = state.starred.has(thread(state.reading.e.link));
    el.classList.toggle('on', on);
    el.ariaLabel = el.dataset.tip = on ? t('unstar') : t('star');
    el.ariaPressed = String(on);
  }
};
const star = e => {
  const key = thread(e.link);
  const on = !state.starred.has(key);
  forgetExtra();
  const paint = on => {
    state.starred[on ? 'add' : 'delete'](key);
    paintStar();
    render();
  };
  paint(on);
  ensureAt(e.link).then(() => chrome.runtime.sendMessage({method: 'gmail.action', cmd: on ? 'st' : 'xst', links: [e.link]}, failure => {
    if (chrome.runtime.lastError || failure) {
      paint(!on);
      toast(t('starFailed'), true);
    }
  }));
};

/* menus: remind me later under the clock, the reader's other actions under ⋯ */
// the button the menu opened from; Esc gives it the focus back, or its mail's line
let menuFrom = null;
const closeMenu = (refocus = false) => {
  const from = menuFrom;
  const menu = $('menu');
  menuFrom = null;
  // its id goes first: the removal blurs its focused item, and that focusout must not close it twice
  menu?.removeAttribute('id');
  menu?.remove();
  from?.setAttribute('aria-expanded', 'false');
  if (refocus && from?.isConnected) {
    (from.closest('.row') || from).focus({preventScroll: true});
  }
};
// A box placed in the window by a button: under it, above it when there is no room below,
// inside the window either way. A larger text size zooms the page: the button's place and the
// window come in zoomed pixels, the box's size and place are written in the page's own, so
// the zoom is taken off. align: 'end' lines the box up with the button's end, 'center' with
// its middle; gap: the room between them.
const place = (box, anchor, align = 'end', gap = 4) => {
  const z = parseFloat(document.documentElement.style.zoom) || 1;
  const r = anchor.getBoundingClientRect();
  const [left, right, top, bottom, width, height] = [r.left, r.right, r.top, r.bottom, innerWidth, innerHeight].map(v => v / z);
  const w = box.offsetWidth;
  const ht = box.offsetHeight;
  const x = align === 'center' ? (left + right - w) / 2 : document.dir === 'rtl' ? left : right - w;
  box.style.left = Math.max(8, Math.min(x, width - w - 8)) + 'px';
  box.style.top = (bottom + gap + ht + 4 > height ? Math.max(4, top - ht - gap) : bottom + gap) + 'px';
};
// items: {label, hint, key, icon, danger, run} or 'sep'; the keys work while it is open
const openMenu = (anchor, title, items, label = title) => {
  closeMenu();
  // focusable itself, so a click on its title or edge keeps the focus inside
  const menu = h('div', {'class': 'menu', 'id': 'menu', 'role': 'menu', 'tabIndex': -1, 'aria-label': label, 'onclick': ev => ev.stopPropagation()},
    title && h('p', {class: 'menu-title'}, title),
    items.filter(Boolean).map(it => it === 'sep' ? h('div', {'class': 'menu-sep', 'role': 'separator'}) : h('button', {
      'type': 'button',
      'role': 'menuitem',
      'class': it.danger ? 'danger' : '',
      ...(it.key ? {'data-key': it.key, 'aria-keyshortcuts': ariaKey(it.key)} : {}),
      'onclick': ev => it.run(ev)
    }, it.icon && icon(it.icon), h('span', {}, it.label), it.hint && h('span', {class: 'hint'}, it.hint),
    it.key && h('kbd', {'aria-hidden': 'true'}, it.key))));
  // Tab, or a click into the message, leaves it: it closes, the focus stays where it went
  menu.addEventListener('focusout', ev => menu.id === 'menu' && !menu.contains(ev.relatedTarget) && closeMenu());
  document.body.append(menu);
  menuFrom = anchor;
  anchor.setAttribute('aria-expanded', 'true');
  hideTip();
  place(menu, anchor);
  (menu.querySelector('[role="menuitem"]') || menu).focus();
  return menu;
};
document.addEventListener('click', () => closeMenu());
const menuBtn = (name, label, key, open, extra) => {
  const el = btn(name, label, ev => open(ev.currentTarget), extra, key);
  el.setAttribute('aria-haspopup', 'menu');
  el.setAttribute('aria-expanded', 'false');
  return el;
};

/* remind me later: a short menu of times under the clock, each with its key, and a moment of one's own */
const remindAt = (links, until) => {
  closeMenu();
  if (state.reading) {
    actFromReader('remind', state.reading.e, until);
  }
  else {
    act('remind', links, until);
  }
};
const remindMenu = (anchor, links) => {
  const menu = openMenu(anchor, t('remind'), [
    ...Remind.times().map((o, i) => ({label: t(o.key), hint: later(o.until), key: String(i + 1), run: () => remindAt(links, o.until)})),
    'sep',
    {label: t('remindPick'), run: () => pickTime(menu, anchor, links)}
  ]);
};
// the menu becomes a date and a time (tomorrow at nine to start from), and Set
const pickTime = (menu, anchor, links) => {
  const local = d => new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  const input = h('input', {'type': 'datetime-local', 'value': local(start), 'min': local(new Date()), 'required': true, 'aria-label': t('remindPick')});
  // Esc in the field closes the menu, not the reader under it
  input.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      ev.stopPropagation();
      closeMenu(true);
    }
  });
  // the menu keeps the focus meanwhile: its item taken away with it would close it
  menu.focus();
  menu.replaceChildren(h('p', {class: 'menu-title'}, t('remind')), h('form', {class: 'menu-pick', onsubmit: ev => {
    ev.preventDefault();
    const until = new Date(input.value).getTime();
    if (until > Date.now()) {
      remindAt(links, until);
    }
  }}, input, h('button', {class: 'primary-btn', type: 'submit'}, t('remindSet'))));
  place(menu, anchor);
  input.focus();
};
const remindBtn = links => menuBtn('clock', t('remind'), 'B', anchor => remindMenu(anchor, links), 'remind');

/* mark as unread: Gmail's at once, the mail kept in the list (or back in it from the reader) */
const markUnread = (e, o) => {
  if (serviceOf(o)) {
    return;
  }
  // read on opening took it out of the list: it comes back, as it was should Gmail refuse
  const was = {hidden: state.hidden.has(e.link), unread: e.unread};
  state.hidden.delete(e.link);
  e.unread = true;
  closeMenu();
  render();
  if (state.reading?.e === e) {
    back();
  }
  toast(t('doneUnread'));
  ensureAt(e.link).then(() => chrome.runtime.sendMessage({method: 'gmail.action', cmd: 'ur', links: [e.link]}, failure => {
    if (chrome.runtime.lastError || failure) {
      if (was.hidden) {
        state.hidden.add(e.link);
      }
      e.unread = was.unread;
      render();
      toast(t('unreadFailed'), true);
    }
  }));
};

/* labels: Gmail's L (label as) and V (move to), a menu of the account's labels with a field to narrow it */
// The label actions ask Gmail the way its web app did before its internal call had them, and
// count as done only once Gmail's search shows the label (core/offscreen/gmail/core.js). That
// call is not proven against Gmail yet, so they stay out of the panel unless 'labels.beta' is set
let LABELS = false;
// the labels Gmail's search showed on an account's mail this panel: address -> Set. Gmail's own
// ones (^i, ^u...) and IDs that are no names stay out
const labelsSeen = new Map();
const seenLabels = (o, labels) => {
  const names = labels.filter(l => typeof l === 'string' && l && !l.startsWith('^') && l !== 'STARRED' && !/^Label_\d+$/.test(l));
  if (names.length) {
    const set = labelsSeen.get(o.xml.title) || new Set();
    names.forEach(l => set.add(l));
    labelsSeen.set(o.xml.title, set);
  }
};
// used here before, newest first, by address
const USED = 'labels.used';
const USED_MAX = 30;
const useLabel = (o, name) => chrome.storage.local.get({[USED]: {}}).then(prefs => {
  const all = prefs[USED] && typeof prefs[USED] === 'object' ? prefs[USED] : {};
  const list = (Array.isArray(all[o.xml.title]) ? all[o.xml.title] : []).filter(l => l !== name);
  return chrome.storage.local.set({[USED]: {...all, [o.xml.title]: [name, ...list].slice(0, USED_MAX)}});
}).catch(() => {});
// an account's labels: those used here, then those it is watched through (its mailboxes, Settings
// → Labels by address), then those its mail showed; each once, as first written
const labelsOf = async o => {
  const prefs = await chrome.storage.local.get({[USED]: {}, labels: {}}).catch(() => ({}));
  const used = prefs[USED]?.[o.xml.title];
  const watched = typeof prefs.labels?.[o.xml.title] === 'string' ? prefs.labels[o.xml.title].split(',') : [];
  const boxes = state.objs.filter(x => x.xml.title === o.xml.title && x.xml.label).map(x => x.xml.label);
  const all = [...(Array.isArray(used) ? used : []), ...boxes, ...watched, ...labelsSeen.get(o.xml.title) || []]
    .map(l => String(l).trim()).filter(l => l && !l.startsWith('^') && l.toLowerCase() !== 'inbox');
  return all.filter((l, i) => all.findIndex(x => x.toLowerCase() === l.toLowerCase()) === i);
};
// label: the label added, the mail staying where it is; move: added, and out of the inbox with the
// list's Undo, as an archive. A label Gmail took is offered first next time (a move's, once chosen).
const labelMail = (e, o, name, how) => {
  closeMenu();
  if (!name) {
    return;
  }
  if (how === 'move') {
    useLabel(o, name);
    if (state.reading?.e === e) {
      actFromReader('mv_' + name, e);
    }
    else {
      act('mv_' + name, [e.link]);
    }
    return;
  }
  toast(t('labelling'));
  ensureAt(e.link).then(() => chrome.runtime.sendMessage({method: 'gmail.action', cmd: 'ac_' + name, links: [e.link]}, failure => {
    const failed = Boolean(chrome.runtime.lastError || failure);
    toast(failed ? t('labelFailed') : t('doneLabel', name), failed);
    if (!failed) {
      useLabel(o, name);
    }
  }));
};
const labelMenu = async (anchor, e, o, how) => {
  const labels = await labelsOf(o);
  if (!anchor.isConnected) {
    return;
  }
  const kind = how === 'move' ? 'move' : 'label';
  const menu = openMenu(anchor, how === 'move' ? t('moveTitle') : t('labelTitle'), labels.map(name => ({icon: kind, label: name, run: () => labelMail(e, o, name, how)})));
  menu.classList.add('long');
  const items = [...menu.querySelectorAll('[role="menuitem"]')];
  const input = h('input', {'type': 'text', 'autocomplete': 'off', 'spellcheck': false, 'placeholder': t('labelFilter'), 'aria-label': t('labelFilter')});
  // a name typed that is not listed is offered as it stands
  const typed = h('button', {'type': 'button', 'role': 'menuitem', 'hidden': true, 'onclick': () => labelMail(e, o, input.value.trim(), how)},
    icon(kind), h('span', {}));
  const narrow = () => {
    const q = input.value.trim().toLowerCase();
    items.forEach(b => b.hidden = Boolean(q) && !b.textContent.toLowerCase().includes(q));
    typed.hidden = !q || items.some(b => b.textContent.toLowerCase() === q);
    typed.lastChild.textContent = how === 'move' ? t('moveNew', input.value.trim()) : t('labelNew', input.value.trim());
    place(menu, anchor);
  };
  input.addEventListener('input', narrow);
  // the field's keys: Esc closes the menu (not the reader under it), Enter takes the first shown,
  // the arrow goes down the list
  input.addEventListener('keydown', ev => {
    const shown = [...menu.querySelectorAll('[role="menuitem"]:not([hidden])')];
    if (ev.key === 'Escape') {
      closeMenu(true);
    }
    else if (ev.key === 'Enter') {
      shown[0]?.click();
    }
    else if (ev.key === 'ArrowDown') {
      shown[0]?.focus();
    }
    else {
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
  });
  menu.querySelector('.menu-title').after(h('form', {class: 'menu-pick menu-filter', onsubmit: ev => ev.preventDefault()}, input));
  menu.append(typed);
  place(menu, anchor);
  input.focus();
};

/* unsubscribe: what a Gmail mail's List-Unsubscribe says, asked of the background once a panel */
// link -> the header's answer, {messageId, unsubscribe: {post, web, mailto}} or null; known: the
// answers already in
const heads = new Map();
const headsKnown = new Map();
const headsOf = link => {
  if (!heads.has(link)) {
    const p = chrome.runtime.sendMessage({method: 'gmail.headers', link}).then(r => r && !r.message ? r : null, () => null);
    p.then(r => headsKnown.set(link, r));
    heads.set(link, p);
  }
  return heads.get(link);
};
const hostOf = url => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  }
  catch (e) {
    return '';
  }
};
// the way taken: one click when the sender offers it, else the one it lists first of a message
// and a page; and that way in a word
const wayOf = u => u?.post ? 'post' : u?.mailto && (!u.web || u.first === 'mailto') ? 'mailto' : u?.web ? 'web' : null;
const howTo = u => ({post: t('howOneClick'), mailto: t('howMail'), web: t('howWeb')})[wayOf(u)] || t('howNone');

// every unread mail from this sender, in each Gmail account (its search) and in the list, one
// line a thread; a service that cannot archive keeps its mail
const fromSender = async email => {
  const same = e => (e.author_email || '').toLowerCase() === email.toLowerCase();
  const gmails = view().filter(o => !serviceOf(o)).filter((o, i, l) => l.findIndex(x => x.xml.title === o.xml.title) === i);
  const found = await Promise.all(gmails.map(o => searchIn(o, `from:(${email}) is:unread`).then(list => (list || []).filter(same).map(e => ({e, o})))));
  const seen = new Set();
  return [...shownMail(view()).filter(({e}) => same(e)), ...found.flat()].filter(({e, o}) => {
    const key = userOf(e.link) + '|' + thread(e.link);
    const keep = !seen.has(key) && !state.hidden.has(e.link) && can(o, 'archive');
    seen.add(key);
    return keep;
  });
};
// archived at once with the list's Undo; from the reader, back to the list first. said: what the
// toast says before the count
const clearSender = async (e, said = t('doneArchive')) => {
  if (!e.author_email) {
    return;
  }
  toast(t('searching'));
  const mail = await fromSender(e.author_email);
  if (mail.length === 0) {
    toast(t('senderNone'));
    return;
  }
  mail.forEach(x => !state.rows.has(x.e.link) && state.rows.set(x.e.link, x));
  if (state.reading) {
    back();
  }
  const links = mail.map(x => x.e.link);
  act('rc_^i', links);
  if (state.pending?.links.some(link => links.includes(link))) {
    toast(said + ': ' + state.pending.links.length, false, undo);
  }
};

// Unsubscribing asks first, in a small dialog that names the sender and says what happens: one
// click sends the sender's own request from the background; a message opens in Gmail's compose
// window, to send; a page opens in a tab. Their unread mail may go to the archive as well.
const askUnsubscribe = (e, o, u) => {
  const way = wayOf(u);
  if (!way || $('sheet')) {
    return;
  }
  // the focus comes back to the button the menu opened from
  closeMenu(true);
  hideTip();
  sheetFrom = document.activeElement;
  const name = e.author_name || e.author_email || '';
  const text = way === 'post' ? t('unsubscribePost', hostOf(u.post)) : way === 'mailto' ? t('unsubscribeMail', u.mailto.to) :
    t('unsubscribeWeb', hostOf(u.web));
  const also = h('input', {type: 'checkbox'});
  const error = h('p', {'class': 'confirm-error', 'role': 'alert', 'hidden': true});
  const go = h('button', {class: 'primary-btn', type: 'button', onclick: async () => {
    const archive = also.checked;
    if (way === 'post' && !go.dataset.failed) {
      go.disabled = true;
      go.textContent = t('unsubscribeSending');
      const r = await chrome.runtime.sendMessage({method: 'gmail.unsubscribe', link: e.link}).catch(() => null);
      if (!r?.sent) {
        // the request did not go: the sender's page, when it has one, is the way left
        go.disabled = false;
        error.hidden = false;
        error.textContent = t('unsubscribeFailed');
        go.dataset.failed = u.web ? '1' : '';
        go.textContent = u.web ? t('unsubscribeOpen') : t('unsubscribe');
        go.focus();
        return;
      }
      closeSheet();
      if (archive) {
        await clearSender(e, t('unsubscribeSent') + ' · ' + t('doneArchive'));
      }
      else {
        toast(t('unsubscribeSent'));
      }
      return;
    }
    closeSheet();
    // the panel may close once the page opens: the mail goes to the archive first
    if (archive) {
      await clearSender(e);
    }
    openUrl(way === 'mailto' && !go.dataset.failed ? composeWith(o, u.mailto) : u.web);
  }}, way === 'post' ? t('unsubscribe') : way === 'mailto' ? t('unsubscribeWrite') : t('unsubscribeOpen'));
  const box = h('div', {'class': 'sheet confirm', 'role': 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'confirm-title',
    'aria-describedby': 'confirm-text', 'tabIndex': -1},
  h('header', {class: 'sheet-head'}, h('h2', {id: 'confirm-title'}, t('unsubscribeFrom', name)), btn('close', t('close'), () => closeSheet(), '', 'Esc')),
  h('p', {class: 'confirm-text', id: 'confirm-text'}, text),
  h('label', {class: 'confirm-also'}, also, h('span', {}, t('alsoArchive'))),
  error,
  h('div', {class: 'confirm-btns'}, h('button', {class: 'text-btn', type: 'button', onclick: () => closeSheet()}, t('cancel')), go));
  // a click beside it closes it; a handler that gave false would cancel the click on its checkbox
  const shade = h('div', {'class': 'sheet-shade', 'id': 'sheet', 'onclick': ev => {
    if (ev.target === shade) {
      closeSheet();
    }
  }}, box);
  document.body.append(shade);
  $('app').inert = true;
  go.focus();
};
// the Newsletters list's senders, each once with its newest Gmail mail, and how it is unsubscribed
// from: their headers are asked as the menu opens, a few at a time, each item saying it once known
const sendersMenu = (anchor, mail) => {
  const by = new Map();
  for (const x of mail.filter(({o}) => !serviceOf(o))) {
    const k = (x.e.author_email || '').toLowerCase();
    if (k && (!by.has(k) || (Date.parse(x.e.modified) || 0) > (Date.parse(by.get(k).e.modified) || 0))) {
      by.set(k, x);
    }
  }
  const list = [...by.values()].sort((a, b) => (a.e.author_name || a.e.author_email).localeCompare(b.e.author_name || b.e.author_email, LANG));
  const menu = openMenu(anchor, t('senders'), list.map(({e, o}) => ({icon: 'unsubscribe', label: e.author_name || e.author_email, hint: '…', run: async () => {
    const r = await headsOf(e.link);
    if (r?.unsubscribe) {
      askUnsubscribe(e, o, r.unsubscribe);
    }
  }})), t('unsubscribeSenders'));
  menu.classList.add('long');
  const items = [...menu.querySelectorAll('[role="menuitem"]')];
  let next = 0;
  const work = async () => {
    while (next < list.length && menu.isConnected) {
      const i = next++;
      const u = (await headsOf(list[i].e.link))?.unsubscribe;
      items[i].querySelector('.hint').textContent = howTo(u);
      items[i].setAttribute('aria-disabled', String(!wayOf(u)));
    }
  };
  [0, 1, 2].forEach(work);
};

// what the reader does less often: the mail service's own page, unread and labels, unsubscribing
// and the sender's other mail, spam (not first, where the focus lands), and the keys. The header
// asked on opening the mail gets a moment to come, so Unsubscribe shows where it can.
const moreBtn = (e, o) => menuBtn('more', t('moreActions'), '', async anchor => {
  const gm = !serviceOf(o);
  const r = gm ? await Promise.race([headsOf(e.link), new Promise(resolve => setTimeout(resolve, 400, headsKnown.get(e.link)))]) : null;
  if (!anchor.isConnected || state.reading?.e !== e) {
    return;
  }
  const u = r?.unsubscribe;
  const items = [
    {icon: 'open', label: openIn(o), key: 'O', run: ev => {
      closeMenu();
      openEntry(e, o, ev);
    }},
    gm && {icon: 'unread', label: t('markUnread'), key: 'U', run: () => markUnread(e, o)},
    gm && LABELS && {icon: 'label', label: t('labelAs'), key: 'L', run: () => labelMenu(anchor, e, o, 'label')},
    gm && LABELS && {icon: 'move', label: t('moveTo'), key: 'V', run: () => labelMenu(anchor, e, o, 'move')},
    'sep',
    wayOf(u) && {icon: 'unsubscribe', label: t('unsubscribe'), hint: howTo(u), run: () => askUnsubscribe(e, o, u)},
    e.author_email && {icon: 'archive', label: t('clearSender'), run: () => {
      closeMenu();
      clearSender(e);
    }},
    allowed('sp', o) && {icon: 'spam', label: t('spam'), key: '!', danger: true, run: () => {
      closeMenu();
      actFromReader('sp', e);
    }},
    'sep',
    {icon: 'keyboard', label: t('shortcuts'), key: '?', run: () => {
      closeMenu();
      openSheet();
    }}
  ].filter(Boolean);
  // a separator between two groups only
  openMenu(anchor, '', items.filter((it, i) => it !== 'sep' || (i > 0 && items[i - 1] !== 'sep')), t('moreActions'));
}, 'more-acts');

/* tooltips: a button's name and its key, a moment after the pointer or the keyboard comes to it */
const TIP_MS = 450;
let tipFor = null; // the element whose tooltip shows, or is about to
let tipTimer = 0;
// a tooltip just shown makes the next one come at once: the pointer going along a row of buttons
let tipWarm = 0;
const hideTip = () => {
  clearTimeout(tipTimer);
  if ($('tip').classList.contains('show')) {
    tipWarm = performance.now() + 600;
  }
  tipFor = null;
  $('tip').classList.remove('show');
};
// its button drawn again (render), or gone with its menu: the tooltip goes too
const tipGone = () => tipFor && !tipFor.isConnected && hideTip();
const showTip = el => {
  const label = el.dataset.tip;
  const key = el.dataset.key;
  // a button that says its own name in full has nothing to add
  if (!label || (!key && el.innerText.trim() === label)) {
    return;
  }
  $('tip').replaceChildren(h('span', {}, label), key ? h('kbd', {}, key) : '');
  $('tip').classList.add('show');
  place($('tip'), el, 'center', 6);
};
const wantTip = el => {
  if (el === tipFor) {
    return;
  }
  hideTip();
  if (!el || el.disabled) {
    return;
  }
  tipFor = el;
  tipTimer = setTimeout(() => tipFor === el && el.isConnected && showTip(el), performance.now() < tipWarm ? 0 : TIP_MS);
};
document.addEventListener('pointerover', ev => ev.pointerType !== 'touch' && wantTip(ev.target.closest?.('[data-tip]')));
// the pointer out of the panel
document.addEventListener('pointerout', ev => !ev.relatedTarget && hideTip());
// the keyboard's way to a button shows its tooltip too; the pointer's click does not
document.addEventListener('focusin', ev => {
  const el = ev.target.closest?.('[data-tip]');
  if (el?.matches(':focus-visible')) {
    wantTip(el);
  }
});
document.addEventListener('focusout', ev => ev.target === tipFor && !tipFor.matches(':hover') && hideTip());
// a click, a key, a scroll: the tooltip has said what it had to
for (const type of ['pointerdown', 'keydown', 'scroll', 'wheel']) {
  document.addEventListener(type, hideTip, {capture: true, passive: true});
}

/* ?: the keys there are, where the panel is now: the list's, or the open mail's and its mailbox's */
const isQuestion = ev => ev.key === '?' || (ev.code === 'Slash' && ev.shiftKey);
// a key as the tooltips and the menus write it, by its place on the keyboard, so any layout works
const pressed = ev => ev.code.startsWith('Key') ? ev.code.slice(3) : ev.code === 'Digit1' && ev.shiftKey ? '!' : isQuestion(ev) ? '?' :
  ev.code.startsWith('Digit') && !ev.shiftKey ? ev.code.slice(5) : ev.code === 'Delete' || ev.code === 'Backspace' ? 'Del' : ev.key;
// [what it does, [its keys, one of them each]]; a key the mailbox cannot use is not listed
const sheetRows = from => {
  const r = state.reading;
  const objs = view();
  const line = from?.closest?.('#list .row');
  const o = r?.o || (line && state.rows.get(line.dataset.link)?.o) || objs.find(x => x.xml.fullcount) || objs[0];
  const any = what => r ? can(r.o, what) : objs.some(x => can(x, what));
  // unread and labels are Gmail's: the open mail's, or any mailbox's of the list
  const gmailHere = r ? !serviceOf(r.o) : objs.some(x => !serviceOf(x));
  return [
    [t('nextMessage'), r ? ['J'] : ['J', '↓']],
    [t('prevMessage'), r ? ['K'] : ['K', '↑']],
    !r && [t('open'), ['Enter']],
    [t('markRead'), ['R']],
    any('archive') && [t('archive'), ['E']],
    [t('delete'), ['Del']],
    any('spam') && [t('spam'), ['!']],
    [t('remind'), ['B']],
    gmailHere && [t('markUnread'), ['U']],
    gmailHere && LABELS && [t('labelAs'), ['L']],
    gmailHere && LABELS && [t('moveTo'), ['V']],
    r && !serviceOf(r.o) && [t('star'), ['S']],
    o && [openIn(o), ['O']],
    [t('copyCode'), ['C']],
    r && showAI() && can(r.o, 'body') && !(aiOn() && state.ai.summary === 'off') && [t('summary'), ['I']],
    showAI() && (r ? can(r.o, 'body') && [t('keyAsk'), ['A']] : [t('assistant'), ['A']]),
    [t('undo'), ['Z']],
    !r && objs.some(x => !serviceOf(x)) && [t('search'), ['/']],
    !r && objs.length > 1 && [t('keyMove'), ['Alt+↑', 'Alt+↓']],
    r && [t('back'), ['Esc']],
    [t('shortcuts'), ['?']]
  ].filter(Boolean);
};
// the element that had the focus before; it has it again after
let sheetFrom = null;
const openSheet = () => {
  if ($('sheet')) {
    return;
  }
  closeMenu();
  hideTip();
  sheetFrom = document.activeElement;
  const keys = alts => alts.flatMap((alt, i) => [i > 0 && h('span', {}, '/'), ...alt.split('+').flatMap((k, j) => [j > 0 && '+', h('kbd', {}, k)])]).filter(Boolean);
  const box = h('div', {'class': 'sheet', 'role': 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sheet-title', 'tabIndex': -1},
    h('header', {class: 'sheet-head'}, h('h2', {id: 'sheet-title'}, t('shortcuts')), btn('close', t('close'), () => closeSheet(), '', 'Esc')),
    h('div', {}, sheetRows(sheetFrom).map(([label, alts]) => h('div', {class: 'sheet-row'}, h('span', {}, label), h('span', {class: 'keys'}, keys(alts))))));
  // a click beside it closes it
  const shade = h('div', {'class': 'sheet-shade', 'id': 'sheet', 'onclick': ev => ev.target === shade && closeSheet()}, box);
  document.body.append(shade);
  $('app').inert = true;
  box.focus();
};
const closeSheet = () => {
  $('sheet')?.remove();
  $('app').inert = false;
  (sheetFrom?.isConnected && sheetFrom !== document.body ? sheetFrom : state.reading ? $('reader') : null)?.focus({preventScroll: true});
  sheetFrom = null;
};

/* side panel: the deck stays open beside the page; Chrome opens it only from a click */
const openSide = () => chrome.sidePanel.open({windowId: state.windowId}).then(() => window.close(), () => toast(t('actionFailed'), true));

/* header */
// With no mailbox signed in, the tools for mail (the assistant, search, a new mail) wait for
// one; before the first list after a browser start they stand as they will (state.booting).
// Another account is added at the end of the list.
const renderBar = objs => {
  const total = objs.reduce((p, o) => p + o.xml.fullcount, 0);
  const busy = objs.filter(o => o.xml.fullcount).length;
  const mail = objs.length > 0 || state.booting;
  // all caught up: the bar says it in its one line, the list keeps its room for the mailboxes
  $('sub').replaceChildren(!objs.length ? '' :
    total ? (busy === 1 ? t('summaryOne', total) : t('summaryMany', total, busy)) : h('span', {class: 'ok'}, icon('done'), t('caughtUp')));
  $('tools').replaceChildren(...[
    mail && showAI() && btn('sparkle', t('assistant'), () => openAssist(), 'assist-btn', 'A'),
    btn('refresh', t('checkMail'), ev => {
      refreshing = true;
      ev.currentTarget.classList.add('spin');
      chrome.runtime.sendMessage({method: 'update', forced: true});
      setTimeout(stopSpin, 15000);
    }, refreshing ? 'refresh spin' : 'refresh'),
    (state.booting || objs.some(o => !serviceOf(o))) && btn('search', t('search'), openSearch, state.search ? 'on' : '', '/'),
    mail && btn('compose', t('compose') + (objs.length > 1 ? ': ' + composeFrom(objs).xml.title : ''),
      () => openUrl(composeUrl(composeFrom(objs)))),
    !SIDE && chrome.sidePanel && btn('side', t('sidePanel'), openSide),
    btn('tune', t('settings'), () => chrome.runtime.openOptionsPage())
  ].filter(Boolean));
};
const stopSpin = () => {
  refreshing = false;
  document.querySelector('.refresh')?.classList.remove('spin');
};

/* one chip per mailbox with mail; a click shows only that mailbox */
// the name before the @; where two mailboxes share it, the part after it tells them apart
const short = (o, all) => {
  const [name, domain = name] = o.xml.title.split('@');
  return all.some(x => x.xml.title !== o.xml.title && x.xml.title.split('@')[0] === name) ? domain : name;
};
const renderChips = objs => {
  const busy = objs.filter(o => o.xml.fullcount);
  if (!busy.some(o => o.xml.link === state.only)) {
    state.only = null;
  }
  const chip = (o, label, n) => h('button', {
    'class': 'chip' + ((o?.xml.link ?? null) === state.only ? ' on' : ''),
    'type': 'button',
    'aria-pressed': String((o?.xml.link ?? null) === state.only),
    'data-focus': 'chip:' + (o?.xml.link ?? ''),
    'style': o ? `--c:${o.color}` : '',
    'onclick': () => {
      state.only = o?.xml.link ?? null;
      render();
    }
  }, o && h('span', {class: 'dot'}), label, h('span', {class: 'count'}, n > 999 ? '999+' : n));
  // the list narrowed to the site's mail says so first; a click lets go
  const site = state.siteOnly && !state.search && h('button', {
    'class': 'chip on site-chip',
    'type': 'button',
    'aria-pressed': 'true',
    'aria-label': t('fromSite', state.site.domain),
    ...tipped(t('all'), 'Esc'),
    'data-focus': 'chip:site',
    'onclick': () => {
      state.siteOnly = false;
      render();
    }
  }, state.site.domain, icon('close'));
  paintChipsEdge.observed ||= ($('chips').addEventListener('scroll', paintChipsEdge, {passive: true}), true);
  // the kinds of mail first: the assistant's sorting before Gmail's categories, its offer after
  // them; then the site's mail and the searches saved in the settings
  const kinds = aiOn() ? [...sortChips(objs), ...categoryChips(objs)] : [...categoryChips(objs), ...sortChips(objs)];
  const sorts = [...kinds, site, ...savedChips(objs)].filter(Boolean);
  const boxes = busy.length < 2 || state.search ? [] : [
    chip(null, t('all'), busy.reduce((p, o) => p + o.xml.fullcount, 0)),
    ...busy.map(o => chip(o, short(o, busy) + (o.xml.label ? ` [${o.xml.label}]` : ''), o.xml.fullcount))
  ];
  // a hairline between the kinds of mail and the mailboxes
  $('chips').replaceChildren(...sorts, ...(sorts.length && boxes.length ? [h('span', {'class': 'chip-sep', 'aria-hidden': 'true'})] : []), ...boxes);
  fitChips();
  paintChipsEdge();
};
// The kinds of mail say their names while they fit the row (the mailboxes after them scroll);
// past that their chips say only their count, as in a narrow panel, the names in their tooltips
const fitChips = () => {
  const el = $('chips');
  el.classList.remove('tight');
  const kinds = [...el.children].filter(c => !c.matches('.chip-sep, .chip-sep ~ *'));
  const css = getComputedStyle(el);
  const width = kinds.reduce((w, c) => w + c.offsetWidth, parseFloat(css.paddingInlineStart) + parseFloat(css.paddingInlineEnd) +
    (kinds.length - 1) * (parseFloat(css.columnGap) || 0));
  if (width > el.clientWidth + 1 && kinds.some(c => c.matches('.sort-chip, .cat-chip'))) {
    el.classList.add('tight');
  }
};
// a side panel made wider or narrower
addEventListener('resize', () => {
  fitChips();
  paintChipsEdge();
});

// chips past the panel's edge fade out there, so the row says it scrolls
const paintChipsEdge = () => {
  const el = $('chips');
  const over = el.scrollWidth > el.clientWidth + 1;
  el.classList.toggle('overflow', over);
  el.classList.toggle('at-end', !over || Math.abs(el.scrollLeft) + el.clientWidth >= el.scrollWidth - 2);
};

/* search: the list's own mail as one types, every Gmail mailbox at once (or the one the chips
   chose) on Enter. typed: the field's words; q: the words Gmail was asked for, results its answer */
const openSearch = () => {
  state.search = state.search || {typed: '', q: '', busy: false, results: null};
  $('search').hidden = false;
  render();
  $('search-input').focus();
};
// what one types narrows the list at once, from what it holds: nothing is asked of anyone. A
// search is asked for again only with Enter; words that differ from it leave its answer
const typeSearch = typed => {
  const s = state.search;
  if (!s || s.typed === typed) {
    return;
  }
  state.search = typed.trim() === s.q && !s.busy ? {...s, typed} : {typed, q: '', busy: false, results: null};
  if (state.search.results === null && s.q) {
    say('');
  }
  // words other than a saved search's let go of its chip
  if (s.saved && !state.search.saved) {
    renderChips(view());
  }
  renderList(view());
};
// a mail with every word typed in its sender, subject or preview; a Gmail operator counts for
// its value (from:anna is anna)
const matcher = typed => {
  const words = typed.toLowerCase().split(/\s+/).map(w => w.replace(/^[a-z_]+:/, '').replace(/^"|"$/g, '')).filter(Boolean);
  return e => {
    const hay = [e.author_name, e.author_email, e.title, e.summary].join(' ').toLowerCase();
    return words.every(w => hay.includes(w));
  };
};
const closeSearch = () => {
  const inside = $('search').contains(document.activeElement);
  state.search = null;
  $('search').hidden = true;
  $('search-input').value = '';
  say('');
  render();
  // the field goes; the focus goes back to the button that opened it
  if (inside) {
    $('tools').querySelector('[data-focus="search"]')?.focus();
  }
};
// what a screen reader says of the search; the list itself changes without a word
const say = text => {
  $('status').textContent = text;
};
// saved: a search saved in the settings (savedChips), which keeps to its own account if it names one
const runSearch = (q, saved = null) => {
  q = q.trim();
  if (!q) {
    return;
  }
  // a mailbox watched through labels is one account all the same; only Gmail can be searched,
  // so a chip of another service searches every Gmail account
  const gmails = view().filter(o => !serviceOf(o));
  const chosen = saved ? gmails.filter(o => o.xml.title === saved.account) : gmails.filter(o => o.xml.link === state.only);
  const accounts = (chosen.length || saved?.account ? chosen : gmails).filter((o, i, l) => l.findIndex(x => x.xml.title === o.xml.title) === i);
  const key = saved ? savedKey(saved) : null;
  const s = state.search = {typed: $('search-input').value, q, busy: true, results: null, saved: key};
  const show = results => {
    s.busy = false;
    s.results = results;
    results.flatMap(r => r.entries).filter(e => e.starred).forEach(e => state.starred.add(thread(e.link)));
    render();
    const n = results.reduce((p, r) => p + r.entries.length, 0);
    say(results.every(r => r.failed) ? t('searchFailed') : n ? t('found', n) : t('searchNone'));
  };
  // what a saved search found a moment ago, of these same accounts at their places, shows at once
  const kept = key && savedFound.get(key);
  const back = kept && Date.now() - kept.at < SAVED_MS ?
    kept.results.map(r => ({o: accounts.find(o => o.xml.title === r.account && o.xml.rootLink === r.rootLink), entries: r.entries, failed: false})) : [];
  if (back.length && back.length === accounts.length && back.every(r => r.o)) {
    show(back);
    return;
  }
  render();
  say(t('searching'));
  Promise.all(accounts.map(o => searchIn(o, q).then(entries => ({o, entries: entries || [], failed: !entries}))))
    .then(results => {
      if (state.search !== s) {
        return;
      }
      if (key && results.every(r => !r.failed)) {
        keepSaved(key, results);
      }
      show(results);
    });
};
/* searches saved in the settings: a chip each, which asks Gmail what the search finds */
// What one found shows again at once for a while, in this panel and the next; an action here
// forgets it (forgetExtra), since the mail it lists is not as it was
const SAVED = 'saved.cache';
const SAVED_MS = 2 * 60 * 1000;
// key -> {at, results: [{account, rootLink, entries}]}
const savedFound = new Map();
const savedKey = x => (x.account || '') + '|' + x.query.trim();
const keepSaved = (key, results) => {
  const now = Date.now();
  savedFound.set(key, {at: now, results: results.map(r => ({account: r.o.xml.title, rootLink: r.o.xml.rootLink, entries: r.entries}))});
  [...savedFound].filter(([, f]) => now - f.at >= SAVED_MS).forEach(([k]) => savedFound.delete(k));
  chrome.storage.session.set({[SAVED]: Object.fromEntries(savedFound)}).catch(() => {});
};
// the search field shows what is asked, for a look or a change; the chip keeps the focus
const runSaved = x => {
  $('search').hidden = false;
  $('search-input').value = x.query.trim();
  runSearch(x.query, x);
};
// After the kinds of mail: those with a Gmail account signed in to ask, the one shown pressed. A
// click asks Gmail, a second one (or Esc) goes back to the list; its tooltip says the search.
const savedChips = objs => {
  const gmails = new Set(objs.filter(o => !serviceOf(o)).map(o => o.xml.title));
  return state.saved.filter((x, i, all) => x.query.trim() && (!x.account || gmails.has(x.account)) && gmails.size > 0 &&
    all.findIndex(y => savedKey(y) === savedKey(x)) === i).map(x => {
    const on = state.search?.saved === savedKey(x);
    return h('button', {
      'class': 'chip saved-chip' + (on ? ' on' : ''),
      'type': 'button',
      'aria-pressed': String(on),
      'data-tip': x.query.trim() + (x.account ? ' · ' + x.account : ''),
      'data-focus': 'chip:saved:' + savedKey(x),
      'onclick': () => on ? closeSearch() : runSaved(x)
    }, icon('search'), h('span', {class: 'name'}, x.name.trim() || x.query.trim()));
  });
};
const note = text => h('div', {class: 'empty'}, h('p', {}, text));
// lines that stand for mail on its way
const skeleton = (rows = 3) => h('div', {'class': 'section skel', 'aria-hidden': 'true'},
  h('div', {class: 'skel-head'}, h('i'), h('i')),
  h('div', {class: 'cards'}, Array.from({length: rows}, () => h('div', {class: 'skel-row'}, h('i'), h('i'), h('i'), h('i')))));
const searchList = (objs, shown) => {
  const s = state.search;
  if (s.busy) {
    return [h('p', {class: 'search-note'}, t('searching')), skeleton(2)];
  }
  if (!s.results) {
    // the list's own mail, narrowed as one types; Enter (or this line) asks Gmail
    const typed = s.typed.trim();
    if (!typed) {
      return shown.map(o => section(o));
    }
    // drawn quietly: a line new to the list asks for neither its files nor its sender's logo
    quiet = true;
    const found = shown.map(o => section(o, matcher(typed))).filter(el => el.querySelector('.row'));
    quiet = false;
    return [
      // Gmail's own search, when a Gmail mailbox is signed in
      objs.some(o => !serviceOf(o)) && h('button', {'class': 'search-all', 'type': 'button', 'data-focus': 'search-all', 'onclick': () => runSearch(typed)},
        icon('search'), h('span', {}, t('searchGmailFor', typed)), h('kbd', {'aria-hidden': 'true'}, '↵')),
      ...(found.length ? found : [h('p', {class: 'search-note'}, t('noMatches'))])
    ].filter(Boolean);
  }
  if (s.results.every(r => r.failed)) {
    return [note(t('searchFailed'))];
  }
  // an account that did not answer keeps its line, saying so, with its way to Gmail's own search
  const results = s.results.map(r => ({...r, entries: r.entries.filter(e => !state.hidden.has(e.link))}))
    .filter(r => r.failed || r.entries.length);
  return [
    ...results.map(r => h('section', {'class': 'section', 'style': `--c:${r.o.color}`, 'data-scope': r.o.xml.title},
      h('header', {'class': 'section-head', 'data-tip': t('openInGmail'), 'onclick': () => openUrl(searchUrl(r.o, s.q))},
        mark(r.o.xml.title),
        h('span', {class: 'addr'}, r.o.xml.title),
        r.failed ? h('span', {class: 'none'}, t('searchFailed')) :
          h('span', {class: 'n found'}, h('span', {class: 'sr'}, t('found', r.entries.length)), h('span', {'aria-hidden': 'true'}, r.entries.length)),
        h('span', {class: 'grow'}),
        h('span', {class: 'head-acts'}, btn('open', t('openInGmail'), () => openUrl(searchUrl(r.o, s.q))))
      ),
      r.entries.length > 0 && h('div', {class: 'cards'}, r.entries.map(e => row(e, r.o)))
    )),
    results.every(r => r.failed) && note(t('searchNone'))
  ].filter(Boolean);
};

/* attachments: on a mail's line before it is opened, and over the message once it is */
// a file's kind by its ending, for the colour of its tag
const KINDS = [
  ['pdf', /^pdf$/], ['doc', /^(docx?|odt|rtf|pages|txt|md)$/], ['sheet', /^(xlsx?|xlsm|csv|ods|numbers|tsv)$/],
  ['slides', /^(pptx?|odp|key)$/], ['image', /^(jpe?g|png|gif|webp|heic|heif|svg|bmp|tiff?)$/],
  ['archive', /^(zip|rar|7z|tar|gz|tgz|bz2|xz)$/], ['calendar', /^(ics|vcs)$/], ['audio', /^(mp3|m4a|wav|ogg|flac|aac)$/],
  ['video', /^(mp4|mov|avi|mkv|webm)$/]
];
const extOf = name => (/\.([a-z0-9]{1,8})$/i.exec(name || '') || [])[1]?.toLowerCase() || '';
const kindOf = name => KINDS.find(([, re]) => re.test(extOf(name)))?.[0] || 'file';
// the pictures a signature carries along (image001.png, Outlook-abc.png) are no files to show
const INLINE = /^(image\d{3}|outlook-[\w-]+|logo|banner|spacer|icon)\.(png|jpe?g|gif)$/i;
const realFiles = list => (list || []).filter(f => f.name && !INLINE.test(f.name));
const fileChip = (f, big = false) => h('button', {
  'class': 'file-chip' + (big ? ' big' : ''),
  'type': 'button',
  // its whole name, when the chip has cut it short
  'data-tip': f.name,
  'aria-label': t('openFile') + ': ' + f.name,
  'data-kind': kindOf(f.name),
  // a file is not the mail: a click on it opens the file alone
  'onclick': ev => {
    ev.stopPropagation();
    openUrl(f.view || f.download);
  }
}, h('span', {class: 'kind', 'aria-hidden': 'true'}, extOf(f.name) ? extOf(f.name).slice(0, 4).toUpperCase() : icon('attach')),
h('span', {class: 'name'}, f.name));
// the line's files: two of them and how many more
const rowFiles = list => {
  const shown = realFiles(list);
  return shown.length > 0 && h('div', {'class': 'row-files', 'data-tip': shown.map(f => f.name).join('\n')},
    h('span', {class: 'clip', role: 'img', 'aria-label': t('attachments', shown.length)}, icon('attach')),
    shown.slice(0, 2).map(f => fileChip(f)),
    shown.length > 2 && h('span', {class: 'more-files'}, '+' + (shown.length - 2)));
};
// the files of the open thread, from the chips its messages carry
const filesIn = node => [...node.querySelectorAll('.files a.file')].map(a => ({
  name: a.textContent.replace(/^📎\s*/u, '').trim(),
  view: a.href,
  download: a.parentElement?.querySelector(':scope > .download')?.href || ''
}));
const paintReaderFiles = list => {
  const el = $('reader-files');
  const shown = realFiles(list);
  el.hidden = shown.length === 0;
  el.replaceChildren(...(shown.length ? [
    h('span', {'class': 'files-head', 'role': 'img', 'aria-label': t('attachments', shown.length)}, icon('attach')),
    ...shown.map(f => h('span', {class: 'file-pair'}, fileChip(f, true),
      f.view && f.download && btn('download', t('download') + ': ' + f.name, () => openUrl(f.download), 'file-dl')))
  ] : []));
};
const fileKey = e => e.link.replace('http://', 'https://') + '#' + (e.modified || '');
// A Gmail line asks for its files once; they come onto the line as they are known. What the
// session knew already (gmail.filesNow) is on the line from its first frame.
const filesFor = (e, o) => {
  if (serviceOf(o) || state.files.has(fileKey(e))) {
    return state.files.get(fileKey(e));
  }
  const known = gmail.filesNow(e.link, e.modified);
  if (known || quiet) {
    if (known) {
      state.files.set(fileKey(e), known);
    }
    return known;
  }
  state.files.set(fileKey(e), undefined);
  gmail.files(e.link, e.modified).then(list => {
    state.files.set(fileKey(e), list);
    paintFiles(e.link);
  }, () => state.files.delete(fileKey(e)));
  return undefined;
};
const paintFiles = link => {
  const el = rowOf(link);
  const r = state.rows.get(link);
  if (!el || !r) {
    return;
  }
  const made = rowFiles(state.files.get(fileKey(r.e)));
  const old = el.querySelector('.row-files');
  if (old) {
    old.replaceWith(made || '');
  }
  else if (made) {
    // files learnt of after the line was drawn come in rather than pop
    made.classList.add('enter');
    el.querySelector('.snippet').after(made);
  }
};

/* list */
// a mail pointed at, or reached with the keys, is likely the next one opened: its
// print view comes meanwhile, so the reader shows it at once
let prefetchTimer;
const bodyOf = (e, o) => serviceOf(o) ? gmail.serviceBody(e.link, e.modified) : gmail.body(e.link, true, e.modified);
// Gmail's print view leaves a mail unread; another service may count a fetched mail as read,
// so its mail is fetched on the click only
const prefetch = (e, o) => {
  clearTimeout(prefetchTimer);
  if (!serviceOf(o)) {
    prefetchTimer = setTimeout(() => bodyOf(e, o).catch(() => {}), 120);
  }
};
const row = (e, o) => {
  state.rows.set(e.link, {e, o});
  const code = codeOf(e.title + ' ' + e.summary);
  return h('article', {
    'class': 'row' + (e.unread === false ? ' seen' : ''),
    'tabIndex': 0,
    'data-link': e.link,
    // a mail folding away after its action takes no second click
    'onclick': ev => state.hidden.has(e.link) ? null : ev.metaKey || ev.ctrlKey || !can(o, 'body') ? openEntry(e, o, ev) : read(e, o),
    'onauxclick': ev => ev.button === 1 && openEntry(e, o, ev),
    'onmouseenter': () => prefetch(e, o),
    'onmouseleave': () => clearTimeout(prefetchTimer),
    'onfocus': () => prefetch(e, o)
  },
  avatar(e, o),
  h('span', {class: 'from'}, e.author_name),
  h('time', {class: 'when', dateTime: e.modified, title: fullDate(e.modified)}, when(e.modified)),
  h('span', {class: 'subject'},
    replyMark(e, o),
    state.starred.has(thread(e.link)) && h('span', {class: 'starred', title: t('starred')}, icon('star')),
    // before the subject: a long one ends in an ellipsis, the code must not
    code && codePill(code),
    e.title || t('noSubject')),
  h('span', {class: 'snippet'}, e.summary),
  rowFiles(filesFor(e, o)),
  h('div', {class: 'acts'},
    ['rd', 'rc_^i', 'tr'].filter(cmd => cmd !== 'rc_^i' || can(o, 'archive'))
      .map(cmd => btn(ACTIONS[cmd].icon, ACTIONS[cmd].title, () => act(cmd, [e.link]), ACTIONS[cmd].danger ? 'danger' : '', ACTIONS[cmd].key)),
    remindBtn([e.link]),
    btn('open', openIn(o), ev => openEntry(e, o, ev), '', 'O')
  ));
};
// every signed-in mailbox gets its line, with its unread mail under it; keep(e, o), when given,
// narrows it to that mail, all of it at once (the site's, the mail waiting for a reply)
const section = (o, keep) => {
  // the mail past the feed's 20, from the search; what was acted on here leaves the count as well
  const all = state.extra.get(accountName(o)) || [];
  const extra = all.filter(e => !state.hidden.has(e.link));
  const open = Boolean(keep) || state.expanded.has(accountName(o));
  const entries = (open ? [...o.xml.entries, ...extra] : o.xml.entries).filter(e => !keep || keep(e, o));
  const n = keep ? entries.length : Math.max(0, o.xml.fullcount - (all.length - extra.length));
  const links = entries.map(e => e.link);
  const rest = n - entries.length;
  return h('section', {'class': 'section' + (n ? '' : ' idle'), 'style': `--c:${o.color}`, 'data-key': accountName(o)},
    h('header', {'class': 'section-head', 'data-tip': openInbox(o), 'draggable': true, 'onclick': () => openUrl(o.xml.link)},
      h('span', {class: 'grip', ...tipped(t('drag'), 'Alt+↑/↓')}, icon('grip')),
      mark(o.xml.title),
      h('span', {class: 'addr'}, accountName(o)),
      n ? h('span', {class: 'n'}, n > 999 ? '999+' : n) : h('span', {class: 'none'}, t('noNewMail')),
      copyBtn(o.xml.title),
      h('span', {class: 'grow'}),
      // over the end of the line, with the pointer or the keys: at rest the address has its room
      h('span', {class: 'head-acts'},
        entries.length > 0 && btn('readAll', t('markAllRead'), () => act('rd', links)),
        entries.length > 0 && can(o, 'archive') && btn('archive', t('archiveAll'), () => act('rc_^i', links)),
        !serviceOf(o) && btn('meet', t('newMeeting'), () => openUrl(meetUrl(o)), 'meet'),
        btn('open', openInbox(o), () => openUrl(o.xml.link)))
    ),
    entries.length > 0 && h('div', {class: 'cards'}, entries.map(e => row(e, o)),
      !open && extra.length > 0 ? h('button', {class: 'more', type: 'button', onclick: () => {
        state.expanded.add(accountName(o));
        // the button goes; the first mail it brought takes the focus
        state.focus = extra[0].link;
        render();
      }}, t('showMore', Math.min(extra.length, rest))) :
        rest > 0 && h('button', {class: 'more', type: 'button', onclick: () => openUrl(o.xml.link)},
          serviceOf(o) ? t('moreIn', rest, serviceOf(o).name) : t('moreInGmail', rest)))
  );
};
const signIn = () => h('div', {class: 'empty'},
  h('span', {class: 'badge mail'}, icon('mail')),
  h('h3', {}, t('signInTitle')),
  h('p', {}, t('signInText')),
  h('button', {class: 'primary-btn cta', type: 'button', onclick: () => openUrl(ADD_ACCOUNT)}, t('signIn')),
  h('button', {class: 'text-btn quiet', type: 'button', onclick: openServices}, t('otherServices'))
);
// The toolbar button not pinned: a line under the list says what pinning it gives, until closed.
// Chrome says whether it is pinned (chrome.action.getUserSettings), and when that changes.
const PIN_HINT = 'pinHint.dismissed';
const pinHint = () => state.unpinned && h('div', {class: 'pin-hint'}, icon('pushpin'), h('span', {}, t('pinHint')),
  btn('close', t('close'), () => {
    state.unpinned = false;
    chrome.storage.local.set({[PIN_HINT]: true});
    render();
  }));
const pinned = async () => {
  const [settings, prefs] = await Promise.all([chrome.action?.getUserSettings?.(), chrome.storage.local.get(PIN_HINT)]).catch(() => []);
  const unpinned = settings?.isOnToolbar === false && prefs?.[PIN_HINT] !== true;
  if (unpinned !== state.unpinned) {
    state.unpinned = unpinned;
    render();
  }
};
chrome.action?.onUserSettingsChanged?.addListener(pinned);
// A rating, asked for once the panel has been in use: two weeks since it was first opened, on ten
// days of them. Rate and × end it for good; Later asks once more, three months on. The same line
// for everyone, with nothing offered for it: the store allows nothing else.
const RATE = 'rate';
const RATE_URL = 'https://chromewebstore.google.com/detail/mail-deck/hjlkjemogfgkpbbnogihekjcdmafecff/reviews';
const DAY_MS = 24 * 60 * 60 * 1000;
const rateDue = (r, now = Date.now()) => Boolean(r) && !r.done && r.days >= 10 && now - r.first >= 14 * DAY_MS &&
  (!r.later || now - r.later >= 90 * DAY_MS);
// a day the panel was opened on, counted once; nothing before what was counted so far is read
let rateRead = false;
const countDay = () => {
  const d = new Date();
  const day = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const r = state.rate || {};
  if (rateRead && r.day !== day) {
    state.rate = {...r, first: Number(r.first) || Date.now(), days: (Number(r.days) || 0) + 1, day};
    chrome.storage.local.set({[RATE]: state.rate});
  }
};
const rated = values => {
  state.rate = {...state.rate, ...values};
  chrome.storage.local.set({[RATE]: state.rate});
  render();
};
const rateLine = () => rateDue(state.rate) && h('div', {class: 'rate-ask'}, icon('star'), h('span', {class: 'rate-text'}, t('rateAsk')),
  h('span', {class: 'rate-acts'},
    h('button', {'class': 'text-btn', 'type': 'button', 'data-focus': 'rate', 'onclick': () => {
      rated({done: true});
      chrome.tabs.create({url: RATE_URL});
      if (!SIDE) {
        window.close();
      }
    }}, t('rateGo')),
    // the second Later is the last
    h('button', {'class': 'text-btn quiet', 'type': 'button', 'data-focus': 'rate-later', 'onclick': () => rated(state.rate.later ? {done: true} : {later: Date.now()})},
      t('rateLater')),
    btn('close', t('rateNever'), () => rated({done: true}))));
// under the list: another Google account, and the way to the keys
const listFoot = () => h('div', {class: 'list-foot'},
  h('button', {'class': 'text-btn', 'type': 'button', 'data-focus': 'add-account', 'onclick': () => openUrl(ADD_ACCOUNT)}, icon('plus'), t('addAccount')),
  h('button', {'class': 'text-btn keys-btn', 'type': 'button', 'aria-label': t('shortcuts'), 'aria-keyshortcuts': '?', 'data-focus': 'keys', 'onclick': () => openSheet()},
    h('kbd', {'aria-hidden': 'true'}, '?'), h('span', {'aria-hidden': 'true'}, t('shortcuts'))));
const openServices = () => {
  chrome.tabs.create({url: chrome.runtime.getURL('/data/settings/index.html#services')});
  if (!SIDE) {
    window.close();
  }
};
// every mailbox is empty: a way into each of them (the bar above says there is no unread mail)
const caughtUp = objs => h('div', {class: 'caught-up'},
  h('div', {class: 'accounts'}, objs.map(o => h('div', {
    'class': 'acc',
    'style': `--c:${o.color}`,
    'data-key': accountName(o),
    'draggable': true,
    'tabIndex': 0,
    'onclick': () => openUrl(o.xml.link)
  },
    h('span', {class: 'grip', ...tipped(t('drag'), 'Alt+↑/↓')}, icon('grip')),
    mark(o.xml.title),
    h('span', {class: 'addr'}, accountName(o)),
    copyBtn(o.xml.title),
    !serviceOf(o) && btn('meet', t('newMeeting'), () => openUrl(meetUrl(o)), 'meet'),
    h('button', {class: 'go', type: 'button'}, t('open'), icon('open'))
  )))
);
// addresses seen here before that are not signed in now: a click signs one back in
const forget = email => chrome.storage.local.get({accounts: {}}, prefs => {
  prefs.accounts[email] = {...prefs.accounts[email], signedOutHidden: true};
  chrome.storage.local.set({accounts: prefs.accounts});
});
const signedOut = () => {
  const now = new Set(state.objs.map(o => o.xml.title));
  const list = Object.entries(state.accounts)
    .filter(([email, meta]) => email.includes('@') && !now.has(email) && meta?.signedOutHidden !== true)
    .map(([email]) => email);
  return list.length === 0 ? null : h('section', {class: 'section away'},
    h('header', {class: 'section-head plain'}, h('span', {class: 'addr'}, t('signedOut'))),
    h('div', {class: 'accounts'}, list.map(email => h('div', {class: 'acc', onclick: () => openUrl(signInUrl(email))},
      mark(email),
      h('span', {class: 'addr'}, email),
      h('button', {class: 'go', type: 'button'}, t('signInAgain'), icon('open')),
      btn('close', t('forget'), () => forget(email), 'forget')
    )))
  );
};
/* mail from this site: the page the panel opened over, its mail first, its code ready */
// webmail itself: the section would only repeat the list
const WEBMAIL = /^(mail|webmail|inbox|e\.mail|octavius\.mail)\.|^outlook\.(live|office|office365)\.com$/;
// a brand of this kind names no one: store.com is not store.de
const GENERIC = new Set(['mail', 'email', 'info', 'news', 'shop', 'store', 'online', 'app', 'apps', 'web', 'site', 'cloud', 'service',
  'services', 'support', 'account', 'accounts', 'secure', 'notify', 'notifications', 'login', 'auth', 'home', 'my', 'go', 'get']);
// mail sent for many sites at once: only the sender's name tells whose it is
const BULK = new Set(['sendgrid.net', 'mailchimpapp.net', 'amazonses.com', 'mailgun.org', 'sparkpostmail.com', 'mandrillapp.com', 'postmarkapp.com']);
// a code this young is the one the page waits for
const SITE_CODE_MS = 30 * 60 * 1000;
// the site of a page, {domain, brand}: web pages only, not webmail, not a mailbox of people
const siteOf = url => {
  let u;
  try {
    u = new URL(url);
  }
  catch (e) {
    return null;
  }
  const host = u.hostname.toLowerCase();
  if (!/^https?:$/.test(u.protocol) || WEBMAIL.test(host) || /^[\d.]+$|^\[/.test(host)) {
    return null;
  }
  const domain = registrable(host);
  return domain.includes('.') && !FREEMAIL.test(domain) ? {domain, brand: domain.split('.')[0]} : null;
};
// mail of the site: its own domain, the same brand under another ending (amazon.de on
// amazon.com), or a bulk sender in its name
const ofSite = (e, site) => {
  const d = senderDomain(e);
  if (!d.includes('.')) {
    return false;
  }
  if (d === site.domain) {
    return true;
  }
  const brand = site.brand;
  if (brand.length < 4 || GENERIC.has(brand)) {
    return false;
  }
  if (d.split('.')[0] === brand && !FREEMAIL.test(d)) {
    return true;
  }
  const name = (e.author_name || '').toLowerCase();
  return BULK.has(d) && name.split(/[^\p{L}\p{N}-]+/u).includes(brand);
};
// the site's mail among what the list shows, newest first: [{e, o}]
const siteMail = (site, objs) => {
  const seen = new Set();
  const found = [];
  for (const o of objs) {
    const extra = (state.extra.get(accountName(o)) || []).filter(e => !state.hidden.has(e.link));
    for (const e of [...o.xml.entries, ...extra]) {
      // a mailbox watched through labels lists a mail twice
      if (!seen.has(e.link) && ofSite(e, site)) {
        seen.add(e.link);
        found.push({e, o});
      }
    }
  }
  return found.sort((a, b) => (Date.parse(b.e.modified) || 0) - (Date.parse(a.e.modified) || 0));
};
// 482913 reads 482 913, set apart by a margin (index.css): it is copied as it came
const grouped = digits => (digits.length === 6 || digits.length === 7 ? [digits.slice(0, 3), digits.slice(3)] :
  digits.length === 8 ? [digits.slice(0, 4), digits.slice(4)] : [digits]).map(g => h('span', {}, g));
// a mail of the site: opens as its line in the list does
const pin = (e, o) => h('button', {
  'class': 'pin',
  'type': 'button',
  'style': `--c:${o.color}`,
  'title': e.title || t('noSubject'),
  'data-focus': 'pin:' + e.link,
  'onclick': ev => {
    if (ev.metaKey || ev.ctrlKey || !can(o, 'body')) {
      openEntry(e, o, ev);
      return;
    }
    read(e, o);
    // back from it, the focus comes back here
    state.reading.from = 'pin:' + e.link;
  },
  'onauxclick': ev => ev.button === 1 && openEntry(e, o, ev),
  'onmouseenter': () => prefetch(e, o),
  'onfocus': () => prefetch(e, o)
},
h('span', {class: 'dot'}),
h('span', {class: 'pin-from'}, e.author_name || e.author_email),
h('span', {class: 'pin-subject'}, e.title || t('noSubject')),
h('time', {class: 'when', dateTime: e.modified, title: fullDate(e.modified)}, when(e.modified)));
const siteBlock = (site, found) => {
  // the code of the newest mail young enough to be the one the page waits for, and how old it is
  const coded = found.map(({e}) => Date.now() - Date.parse(e.modified) < SITE_CODE_MS && {e, code: codeOf(e.title + ' ' + e.summary)})
    .find(x => x?.code);
  const code = coded?.code;
  // the site's logo, once its senders' pictures have shown it has one: Google is asked nothing new
  const logo = state.senderLogos && logos.get(site.domain) === true;
  return h('section', {'class': 'site', 'aria-label': t('fromSite', site.domain)},
    h('p', {class: 'site-head'},
      logo && h('img', {class: 'site-logo', alt: '', referrerPolicy: 'no-referrer', src: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(site.domain)}&sz=64`}),
      t('fromSite', site.domain)),
    code && h('button', {
      'class': 'site-code',
      'type': 'button',
      ...tipped(t('copyCode'), 'C'),
      'aria-label': t('copyCode') + ' ' + code.copy,
      'data-focus': 'site-code',
      'onclick': ev => copyCode(code, ev.currentTarget, t('codeCopied'))
    }, h('span', {class: 'digits'}, grouped(code.copy)), h('span', {'class': 'copy-pill', 'aria-hidden': 'true'}, icon('copy'), t('copyCode')),
    h('time', {class: 'when', dateTime: coded.e.modified}, when(coded.e.modified))),
    found.slice(0, 3).map(({e, o}) => pin(e, o)),
    found.length > 3 && h('button', {
      'class': 'site-more',
      'type': 'button',
      'data-focus': 'site-more',
      'onclick': () => {
        state.siteOnly = true;
        state.sortOnly = null;
        state.focus = FIRST;
        render();
      }
    }, t('siteMore', found.length - 3))
  );
};
// The block is the list's first child. Drawn alone (not with the whole list), a tab switch in
// the side panel or a code growing old redraws nothing else, and a list scrolled down keeps
// showing what it showed. Searching, and the list narrowed to the site, go without.
const paintSite = (objs = view(), alone = true) => {
  const list = $('list');
  const path = alone && focusPath();
  const old = list.querySelector(':scope > .site');
  const site = !state.search && !state.siteOnly ? state.site : null;
  const found = site ? siteMail(site, state.only ? objs.filter(o => o.xml.link === state.only) : objs) : [];
  const block = found.length ? siteBlock(site, found) : null;
  const before = alone && list.scrollTop > 0 ? old?.offsetHeight || 0 : null;
  if (old) {
    old.replaceWith(...[block].filter(Boolean));
  }
  else if (block) {
    list.prepend(block);
  }
  if (before !== null) {
    list.scrollTop += (block?.offsetHeight || 0) - before;
  }
  if (path && document.activeElement === document.body) {
    document.querySelector(path)?.focus({preventScroll: true});
  }
};
// the open page's site, read again when the tab changes; an address the panel may not read
// (another tab of the side panel, chrome://) shows nothing
const followTab = async () => {
  let url = '';
  try {
    const [tab] = await chrome.tabs.query(SIDE ? {active: true, currentWindow: true} : {active: true, lastFocusedWindow: true});
    url = tab?.url || '';
  }
  catch (e) {}
  const site = siteOf(url);
  if (site?.domain === state.site?.domain) {
    return;
  }
  state.site = site;
  if (state.siteOnly) {
    state.siteOnly = false;
    render();
  }
  else {
    paintSite();
  }
};
const renderList = objs => {
  const list = $('list');
  const top = list.scrollTop;
  // an action or its Undo names the line that takes the focus, and brings it into view; any
  // other drawing keeps the focused line where it is, scrolled to or not
  const wanted = state.focus;
  let focused = wanted || document.activeElement?.dataset?.link;
  // a line marked quietly stays so once drawn again
  let quietly = !wanted && Boolean(document.activeElement?.matches?.('.row:not(:focus-visible)'));
  state.focus = null;
  state.rows.clear();

  const shown = state.only ? objs.filter(o => o.xml.link === state.only) : objs;
  const keep = state.siteOnly ? e => ofSite(e, state.site) : state.sortOnly ? (e, o) => inKind(state.sortOnly, e, o) : null;
  list.ariaBusy = String(state.booting);
  list.replaceChildren(...(state.search ? searchList(objs, shown) : keep ? [
    state.sortOnly && sortBar(shown),
    ...shown.map(o => section(o, keep)).filter(s => s.querySelector('.row'))
  ].filter(Boolean) : state.booting ? [skeleton()] : [
    ...(!objs.length ? [signIn()] : objs.some(o => o.xml.fullcount) ? shown.map(o => section(o)) : [caughtUp(objs)]),
    !state.only && signedOut(),
    // one line of the kind at a time: pinning the button comes first
    objs.length > 0 && (pinHint() || rateLine()),
    objs.length > 0 && listFoot()
  ].filter(Boolean)));
  paintSite(objs, false);
  list.scrollTop = top;
  // The panel opens with its first mail under the keys, E, R or Delete act on it at once. It is
  // marked quietly (index.css), not with the keyboard's ring and the line's buttons
  if (firstFocus && list.querySelector('.row')) {
    firstFocus = false;
    if (!focused && !state.search && (!document.activeElement || document.activeElement === document.body)) {
      focused = FIRST;
      quietly = true;
    }
  }
  const el = focused === FIRST ? list.querySelector('.row, .acc') : focused && rowOf(focused);
  el?.focus(quietly ? {preventScroll: true, focusVisible: false} : {preventScroll: true});
  if (wanted) {
    el?.scrollIntoView({block: 'nearest'});
  }
};

/* the mailboxes change places by dragging their line */
{
  const list = $('list');
  const clear = () => list.querySelectorAll('.drop-before, .drop-after, .dragging')
    .forEach(el => el.classList.remove('drop-before', 'drop-after', 'dragging'));
  const over = ev => {
    const el = ev.target.closest?.('[data-key]');
    return el && state.drag && el.dataset.key !== state.drag ? el : null;
  };
  list.addEventListener('dragstart', ev => {
    const el = ev.target.closest?.('[data-key]');
    if (!el) {
      return;
    }
    state.drag = el.dataset.key;
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/plain', state.drag);
    el.classList.add('dragging');
  });
  list.addEventListener('dragover', ev => {
    const el = over(ev);
    if (!el) {
      return;
    }
    ev.preventDefault();
    const r = el.getBoundingClientRect();
    const before = ev.clientY < r.top + Math.min(r.height / 2, 24);
    if (!el.classList.contains(before ? 'drop-before' : 'drop-after')) {
      list.querySelectorAll('.drop-before, .drop-after').forEach(e => e.classList.remove('drop-before', 'drop-after'));
      el.classList.add(before ? 'drop-before' : 'drop-after');
    }
  });
  list.addEventListener('drop', ev => {
    const el = over(ev);
    if (!el) {
      return;
    }
    ev.preventDefault();
    const keys = view().map(accountName).filter(k => k !== state.drag);
    keys.splice(keys.indexOf(el.dataset.key) + (el.classList.contains('drop-after') ? 1 : 0), 0, state.drag);
    state.order = keys;
    chrome.storage.local.set({accountOrder: keys});
    clear();
    render();
  });
  list.addEventListener('dragend', () => {
    state.drag = null;
    clear();
  });
}

// where the focus is, said so that it outlives the list drawn again: a button by its name,
// inside its mail, its mailbox or its bar
const focusPath = () => {
  const el = document.activeElement;
  const name = el?.dataset?.focus;
  if (!name) {
    return null;
  }
  const what = `[data-focus="${CSS.escape(name)}"]`;
  const row = el.closest('.row[data-link]');
  const box = el.closest('[data-key], [data-scope]');
  const bar = el.closest('#tools, #chips, #list');
  return row ? `.row[data-link="${CSS.escape(row.dataset.link)}"] ${what}` :
    box ? `[${box.dataset.key ? 'data-key' : 'data-scope'}="${CSS.escape(box.dataset.key || box.dataset.scope)}"] ${what}` :
      bar ? `#${bar.id} ${what}` : null;
};
// the accounts as the list shows them, to tell a change from none: a mailbox's snapshot
// clock (its feed's modified) moves on without anything new to show; its mails' do not
const sig = objs => JSON.stringify(objs, function (k, v) {
  return k === 'modified' && Array.isArray(this.entries) ? undefined : v;
});
// the accounts last drawn; the same ones again need no drawing
let drawn = '';
const render = () => {
  const path = focusPath();
  const objs = view();
  drawn = sig(state.objs);
  // the list narrowed to the site lets go once none of the site's mail is left
  if (state.siteOnly && !(state.site && siteMail(state.site, objs).length)) {
    state.siteOnly = false;
  }
  // and so does the list narrowed to one kind of the assistant's sorting
  if (state.sortOnly && !sortCount(objs, state.sortOnly)) {
    state.sortOnly = null;
  }
  // the chips drop a choice whose mailbox has no mail left; the bar's compose follows the choice
  renderChips(objs);
  renderBar(objs);
  renderList(objs);
  // a button drawn again gets the focus back, unless a line took it
  if (path && (!document.activeElement || document.activeElement === document.body)) {
    document.querySelector(path)?.focus({preventScroll: true});
  }
  // a tooltip whose button was drawn again goes with it
  tipGone();
};
// What the panel knows of mail no longer listed goes (its files, the assistant's sorting): a side
// panel stays open for days. Mail listed again is asked about again.
const prune = () => {
  const mail = [
    ...state.objs.flatMap(o => [...o.xml.entries, ...state.extra.get(accountName(o)) || []].map(e => ({e, o}))),
    ...(state.search?.results || []).flatMap(r => r.entries.map(e => ({e, o: r.o})))
  ];
  const files = new Set(mail.map(({e}) => fileKey(e)));
  const ids = new Set(mail.map(({e, o}) => replyId(e, o)));
  [...state.files.keys()].filter(k => !files.has(k)).forEach(k => state.files.delete(k));
  [...state.replies.keys()].filter(k => !ids.has(k)).forEach(k => state.replies.delete(k));
  [...replySeen].filter(k => !ids.has(k)).forEach(k => replySeen.delete(k));
};
const update = objs => {
  // the background's first list takes the place of the lines that stood for it
  const booted = state.booting;
  state.booting = false;
  state.objs = objs || [];
  // the search's mail counts as listed too, the feed never lists it
  const listed = new Set([
    ...state.objs.flatMap(o => o.xml.entries.map(e => e.link)),
    ...[...state.extra.values()].flat().map(e => e.link),
    ...(state.search?.results || []).flatMap(r => r.entries.map(e => e.link))
  ]);
  for (const link of state.hidden) {
    if (!listed.has(link)) {
      state.hidden.delete(link);
    }
  }
  prune();
  // A check that found nothing new, every two minutes, leaves the list as it is: the focus,
  // the pointer's line and its pictures stay; only the times move on. Mail folding away
  // after its action draws the list itself once the fold is done.
  if (!booted && sig(state.objs) === drawn) {
    for (const el of $('list').querySelectorAll('time.when')) {
      el.textContent = when(el.dateTime);
    }
    // a code past its half hour leaves the site's block
    paintSite();
  }
  else if (performance.now() >= foldUntil) {
    render();
  }
  loadExtra();
  // new mail may wait for a reply; mail asked about before is not asked again
  scheduleReplies();
};

/* reader */
const frame = $('body');
const frameReady = new Promise(resolve => {
  const ready = () => {
    const doc = frame.contentDocument;
    // the message lines up with the header over it (22px). The dark theme inverts the frame:
    // this grey comes out as the card's own #1a1b1e. The thread's files stand over the message
    // (#reader-files): its own chips of them step aside meanwhile (paintFrameFiles)
    doc.head.append(h('style', {}, `
      body { font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; padding: 16px 22px 28px; color: #1b1f24; }
      body, td { font-size: 14px; }
      body.summary { color: #5f6772; }
      html.dark, html.dark body { background: #e3e4e7; }
      html.files-shown .files { display: none; }
      .note { margin-top: 16px; color: #5f6772; }
      .pictures { margin: 0 0 14px; }
      .pictures button { padding: 6px 12px; border: 1px solid #d6d9de; border-radius: 14px; background: #fff; color: #1b1f24; font: inherit; font-size: 13px; cursor: pointer; }
      .pictures button:hover { background: #f2f3f5; }
    `));
    resolve(doc);
  };
  if (frame.contentDocument?.readyState === 'complete' && frame.contentDocument.querySelector('base')) {
    ready();
  }
  else {
    frame.addEventListener('load', ready, {once: true});
  }
});
// The thread's files over the message stand for the message's own chips of them; while a card
// of the assistant has the header give way (index.css), the message shows them again
const paintFrameFiles = () => frame.contentDocument?.documentElement.classList.toggle('files-shown',
  !$('reader-files').hidden && $('ai-card').hidden && $('ai-tool').hidden);
{
  const watch = new MutationObserver(paintFrameFiles);
  ['reader-files', 'ai-card', 'ai-tool'].forEach(id => watch.observe($(id), {attributes: true, attributeFilter: ['hidden']}));
  frameReady.then(paintFrameFiles);
}
frameReady.then(doc => {
  const paint = () => doc.documentElement.classList.toggle('dark', dark.matches);
  paint();
  dark.addEventListener('change', paint);
});
// A message laid out wider than the panel, a newsletter of 600-700px say, is
// scaled down to fit, as Gmail does on a phone. Its width settles only once
// its images load, an older message opens or the side panel is resized.
const fit = doc => {
  for (const el of doc.querySelectorAll('.root')) {
    el.style.zoom = '';
    const room = el.parentElement.clientWidth;
    if (!room) {
      continue;
    }
    // a wide child may hide behind an overflow: hidden of the print view
    const left = el.getBoundingClientRect().left;
    let right = el.getBoundingClientRect().right;
    for (const c of el.querySelectorAll('table, img, div, pre')) {
      right = Math.max(right, c.getBoundingClientRect().right);
    }
    if (right - left > room + 1) {
      el.style.zoom = Math.max(0.4, room / (right - left)).toFixed(3);
    }
  }
};
frameReady.then(doc => {
  let raf;
  const refit = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => fit(doc));
  };
  doc.addEventListener('load', refit, true);
  doc.addEventListener('toggle', refit, true);
  doc.defaultView.addEventListener('resize', refit);
});

// the reader lies over the list: what is under it can be neither focused nor read out
const shade = on => {
  for (const el of [document.querySelector('.main > .bar'), $('search'), $('chips'), $('list')]) {
    el.inert = on;
  }
};
// the mail next to an open one in the list the reader came from, past the mail acted on here
// and the mail the panel cannot read
const besideOpen = (link, step) => {
  const rows = state.trail || state.rows;
  const keys = [...rows.keys()];
  const at = keys.indexOf(link);
  for (let i = at + step; at !== -1 && i >= 0 && i < keys.length; i += step) {
    const r = rows.get(keys[i]);
    if (!state.hidden.has(keys[i]) && can(r.o, 'body')) {
      return r;
    }
  }
  return null;
};
// J and K, and the reader's arrows
const stepReader = step => {
  const r = state.reading && besideOpen(state.reading.e.link, step);
  if (r) {
    read(r.e, r.o);
  }
};
// an action from the reader: back to the list, or on to the next mail when the settings say so,
// along the same mail as before (the assistant's, a search's), which back() lets go of
const actFromReader = (cmd, e, until) => {
  const next = state.autoAdvance ? besideOpen(e.link, 1) || besideOpen(e.link, -1) : null;
  const trail = state.trail;
  back();
  act(cmd, [e.link], until);
  if (next) {
    read(next.e, next.o, trail);
  }
};
// trail: the mail J and K walk, the list's when none is given
const read = async (e, o, trail) => {
  if (!state.reading) {
    state.trail = trail || new Map(state.rows);
  }
  // the summary of the mail before (J, K) stops with it
  state.reading?.ai.ctl?.abort();
  // the thread's text for a summary: the messages as the reader shows them, once it does
  let gotTexts;
  const texts = new Promise(resolve => gotTexts = resolve);
  // next: the line back() focuses should this mail's own leave the list meanwhile (read on open)
  const r = state.reading = {e, o, next: neighbour([e.link])?.dataset.link, code: codeOf(e.title + ' ' + e.summary), ai: {ctl: null}, texts};
  closeMenu();
  const walk = [...state.trail.keys()].filter(k => k === e.link || !state.hidden.has(k));
  // with several mailboxes the bar says which one the mail came to (in a narrow panel, the header)
  const several = view().length > 1;
  // Where it is first: back, the arrows (they stay put from one mail to the next), its place and
  // its mailbox. Then what is done with it, Reply by its name, and what is rarer under ⋯
  $('reader-bar').replaceChildren(...[
    btn('back', t('back'), back, '', 'Esc'),
    btn('up', t('prevMessage'), () => stepReader(-1), 'prev', 'K'),
    btn('down', t('nextMessage'), () => stepReader(1), 'next', 'J'),
    h('span', {class: 'pos'}, t('position', walk.indexOf(e.link) + 1, walk.length)),
    several && h('span', {class: 'box', style: `--c:${o.color}`}, h('span', {class: 'dot'}), h('span', {}, accountName(o))),
    h('span', {class: 'grow'}),
    ...['rd', 'rc_^i', 'tr'].filter(cmd => allowed(cmd, o)).map(cmd => btn(ACTIONS[cmd].icon, ACTIONS[cmd].title,
      () => actFromReader(cmd, e), ACTIONS[cmd].danger ? 'danger' : '', ACTIONS[cmd].key)),
    remindBtn([e.link]),
    h('span', {class: 'sep'}),
    !serviceOf(o) && btn('star', t('star'), () => star(e), 'star', 'S'),
    h('button', {'class': 'text-btn reply-btn', 'type': 'button', 'aria-label': t('reply'), 'data-tip': t('reply'), 'data-focus': 'reply',
      'onclick': () => openUrl(replyUrl(e, o))}, icon('reply'), h('span', {'aria-hidden': 'true'}, t('reply'))),
    moreBtn(e, o)
  ].filter(Boolean));
  $('reader-bar').querySelector('.prev').disabled = !besideOpen(e.link, -1);
  $('reader-bar').querySelector('.next').disabled = !besideOpen(e.link, 1);
  paintStar();
  $('reader').classList.toggle('one-box', !several);
  resetSummary(r);
  resetTool(r);
  paintStrip(r);
  $('reader-account').style.setProperty('--c', o.color);
  $('reader-account').lastChild.textContent = accountName(o);
  $('reader-subject').textContent = e.title || t('noSubject');
  if (state.reading.code) {
    $('reader-subject').append(' ', codePill(state.reading.code));
  }
  $('reader-avatar').replaceChildren(avatar(e, o));
  $('reader-name').textContent = e.author_name;
  $('reader-addr').replaceChildren(h('span', {}, e.author_email), copyBtn(e.author_email));
  $('reader-date').textContent = shortDate(e.modified);
  $('reader-date').dateTime = e.modified || '';
  $('reader-date').title = fullDate(e.modified);
  // what the sender's name and address tell at once; the message may tell more (paintNotes)
  r.warning = Sender.check({name: e.author_name, email: e.author_email, account: o.xml.title});
  r.trackers = [];
  paintNotes(r);
  // the files the line knew of show at once; the message's own replace them
  paintReaderFiles(state.files.get(fileKey(e)));
  $('app').classList.add('reading');
  shade(true);
  $('assist').inert = true;
  // the keys and a screen reader follow the reader
  $('reader').focus({preventScroll: true});

  // the mail's header, for Unsubscribe under ⋯
  if (!serviceOf(o)) {
    headsOf(e.link);
  }
  const doc = await frameReady;
  doc.querySelector('base').href = e.link;
  doc.body.className = 'summary';
  doc.body.textContent = e.summary;
  $('reader').classList.add('loading');
  let shown = false;
  try {
    const node = await bodyOf(e, o);
    if (state.reading?.e !== e) {
      return;
    }
    if (!node) {
      throw Error('empty');
    }
    doc.body.className = '';
    doc.body.replaceChildren(node);
    paintReaderFiles(filesIn(node));
    // a service's remote pictures, sounds and videos load only when asked for, and so do Gmail's
    // when the settings say so; a tracker never loads (gmail.js)
    if (gmail.render.held(doc.body) && (serviceOf(o) || state.askPictures)) {
      const bar = h('p', {class: 'pictures'}, h('button', {type: 'button', onclick: () => {
        bar.remove();
        gmail.render.show(doc.body);
      }}, t('showPictures')));
      doc.body.prepend(bar);
    }
    else {
      gmail.render.show(doc.body);
    }
    const about = gmail.render.about(node);
    r.trackers = about.trackers;
    r.warning ||= Sender.replyTo(about.senders, o.xml.title);
    paintNotes(r);
    fit(doc);
    shown = true;
    gotTexts(messagesOf(doc, e));
    findLanguage(r);
    // a code the snippet did not reach, from the newest message only: a thread of codes from one
    // sender would offer an older one
    if (!state.reading.code) {
      const last = [...doc.querySelectorAll('details.msg')].at(-1) || doc.body;
      state.reading.code = codeOf(e.title + ' ' + last.innerText.slice(0, 3000));
      if (state.reading.code) {
        $('reader-subject').append(' ', codePill(state.reading.code));
      }
    }
    // the mail J opens comes meanwhile
    const ahead = besideOpen(e.link, 1);
    if (ahead) {
      prefetch(ahead.e, ahead.o);
    }
  }
  catch (err) {
    if (state.reading?.e === e) {
      doc.body.append(h('p', {class: 'note'}, serviceOf(o) ? t('bodyFailedIn', serviceOf(o).name) : t('bodyFailed')));
    }
  }
  finally {
    $('reader').classList.remove('loading');
    // a body that did not load leaves the snippet to summarize
    gotTexts([{from: e.author_name || e.author_email || '', date: e.modified || '', text: e.summary || ''}]);
  }
  // a summary kept from before shows at once; a long thread may summarize itself
  if (shown && state.reading === r) {
    texts.then(m => autoSummary(r, m));
  }
  // the settings may ask for a mail read here to count as read, once it did show: one that
  // did not load stays unread. Gmail's print view has set the cookie by now
  if (shown && state.readOnOpen && e.unread !== false && !state.hidden.has(e.link)) {
    state.hidden.add(e.link);
    render();
    send({cmd: 'rd', links: [e.link]});
  }
};
// The reader's quiet lines under the sender: a warning when the sender is not who the name says
// (sender.js), and the trackers kept from loading (gmail.js). Each says more in its tooltip.
const NOTE_NAMES = 3;
// a domain or a name inside the sentence keeps its own direction (Hebrew, Arabic)
const isolate = text => '\u2068' + text + '\u2069';
const readerNote = (kind, name, text, tip) => h('p', {'class': 'reader-note ' + kind, 'tabIndex': 0, 'data-tip': tip},
  icon(name), h('span', {class: 'note-text'}, text), h('span', {class: 'sr'}, tip), h('span', {'class': 'note-info', 'aria-hidden': 'true'}, icon('info')));
const paintNotes = r => {
  const w = r.warning;
  const said = w && (w.rule === 'brand' ? t('warnBrand', isolate(w.brand), isolate(w.domain)) :
    w.rule === 'lookalike' ? t('warnLookalike', isolate(w.domain), isolate(w.like)) : t('warnReplyTo', isolate(w.replyTo), isolate(w.domain)));
  // the vendors and domains, the first few; the tooltip has them all
  const named = [...new Set(r.trackers.filter(Boolean))];
  const list = named.length ? ' · ' + new Intl.ListFormat(LANG, {type: 'unit', style: 'short'}).format(named.slice(0, NOTE_NAMES).map(isolate)) +
    (named.length > NOTE_NAMES ? ' +' + (named.length - NOTE_NAMES) : '') : '';
  const lines = [
    said && readerNote('warn', 'alert', said, t('warnTip')),
    r.trackers.length > 0 && readerNote('ok', 'shield', t('trackersBlocked', r.trackers.length) + list,
      t('trackersTip') + (named.length > NOTE_NAMES ? '\n' + named.join(', ') : ''))
  ].filter(Boolean);
  $('reader-notes').hidden = lines.length === 0;
  $('reader-notes').replaceChildren(...lines);
};
const back = () => {
  const r = state.reading;
  state.reading = null;
  state.trail = null;
  // a summary underway stops: no one waits for it any more
  r?.ai.ctl?.abort();
  $('ai-card').hidden = true;
  $('ai-tool').hidden = true;
  $('assist').inert = false;
  shade(assist.open);
  $('app').classList.remove('reading');
  // back to the assistant it came from: its mail keeps the focus
  if (r && assist.open) {
    ($('assist').querySelector(`[data-focus="${CSS.escape('ref:' + r.e.link)}"]`) || $('assist-input')).focus({preventScroll: true});
  }
  else if (r) {
    // the site's pin it opened from, its line, or the line next to it
    (r.from && $('list').querySelector(`[data-focus="${CSS.escape(r.from)}"]`) || rowOf(r.e.link) || (r.next && rowOf(r.next)) ||
      $('list').querySelector('.row, .acc'))?.focus({preventScroll: true});
  }
};

/* the assistant (Settings → AI): ai.js comes once the list is up, and only with an engine on */
let aiModule = null;
const loadAI = () => aiModule ||= self.AI ? Promise.resolve(self.AI) : new Promise(resolve => {
  const s = document.createElement('script');
  s.src = '/data/ai/ai.js';
  s.onload = () => resolve(self.AI || null);
  s.onerror = () => resolve(null);
  document.head.append(s);
});
const aiOn = () => state.ai.engine !== 'off';
// a summary is for mail the panel shows (not Proton's), with the feature on
const canSummarize = o => aiOn() && state.ai.summary !== 'off' && can(o, 'body');
// a thread this long summarizes itself, when the settings say so
const AUTO_CHARS = 1500;
// a summary is a mail's at a version: new mail in the thread makes another
const summaryKey = e => e.link + '#' + (e.modified || '');
// the summaries hidden here: a mail opened again keeps its summary hidden
const aiHidden = new Set();
const paintSummaryBtn = () => {
  const el = $('reader-ai').querySelector('.ai-btn');
  el?.setAttribute('aria-expanded', String(!$('ai-card').hidden));
  el?.classList.toggle('on', !$('ai-card').hidden);
};
// the thread as the reader shows it, oldest first: who (and the address, which tells the
// reader's own messages), when, what
const messagesOf = (doc, e) => {
  const cards = [...doc.querySelectorAll('details.msg')];
  const whole = () => [...doc.body.children].filter(c => !c.matches('.pictures')).map(c => c.innerText).join('\n').trim();
  return cards.length ? cards.map(d => ({
    from: d.querySelector(':scope > summary .who')?.textContent.trim() || '',
    email: d.querySelector(':scope > summary .who')?.dataset.email || '',
    date: d.querySelector(':scope > summary .date')?.textContent.trim() || '',
    text: [...d.children].filter(c => c.tagName !== 'SUMMARY').map(c => c.innerText).join('\n').trim()
  })) : [{from: e.author_name || e.author_email || '', email: e.author_email || '', date: e.modified || '', text: whole()}];
};
// The card, made once for each open mail, its lists filled as the summary streams in: the
// lines already there stay, the new ones come in
const resetSummary = r => {
  const card = $('ai-card');
  card.hidden = true;
  card.removeAttribute('aria-busy');
  $('reader').classList.toggle('no-ai', !canSummarize(r.o));
  const part = (cls, title) => h('div', {class: 'ai-part ' + cls, hidden: true}, h('h4', {}, title), h('ul', {}));
  card.replaceChildren(
    h('header', {class: 'ai-head'},
      h('span', {class: 'ai-mark'}, icon('sparkle')),
      h('h3', {id: 'ai-title'}, t('summary')),
      h('span', {class: 'ai-state'}),
      h('span', {class: 'grow'}),
      btn('copy', t('copySummary'), ev => copySummary(r, ev.currentTarget), 'ai-copy'),
      btn('refresh', t('regenerate'), () => runSummary(r, true), 'ai-again'),
      btn('close', t('hideSummary') + ' (I)', () => hideSummary(r), 'ai-hide')),
    h('div', {class: 'ai-wait', 'aria-hidden': 'true'}, h('span', {}), h('span', {}), h('span', {})),
    part('ai-points', t('summaryPoints')),
    part('ai-todo', t('summaryTodo')),
    part('ai-events', t('summaryEvents')),
    part('ai-facts', t('summaryFacts')),
    h('p', {class: 'ai-note', hidden: true}, t('summaryTruncated')),
    h('p', {class: 'ai-note ai-cut', hidden: true}, t('aiCut')),
    h('p', {class: 'ai-error', role: 'alert', hidden: true})
  );
  paintSummaryBtn();
};
// an event's moment as the panel writes dates: a day (all day), or a day and its hours
const eventWhen = ev => {
  if (ev.allDay || /^\d{4}-\d{2}-\d{2}$/.test(ev.start || '')) {
    const day = s => new Date(s + 'T00:00:00Z').toLocaleDateString(LANG, {timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short'});
    return ev.end && ev.end > ev.start ? day(ev.start) + ' – ' + day(ev.end) : day(ev.start);
  }
  const a = new Date(ev.start);
  const b = new Date(ev.end);
  if (isNaN(a)) {
    return '';
  }
  const at = a.toLocaleString(LANG, {weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'});
  if (isNaN(b) || b <= a) {
    return at;
  }
  return at + ' – ' + (b.toDateString() === a.toDateString() ? b.toLocaleTimeString(LANG, {hour: 'numeric', minute: '2-digit'}) :
    b.toLocaleString(LANG, {weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'}));
};
// a list in the card takes the summary's lines: the same stay, a changed one is redrawn, a new
// one comes in
const fill = (part, items, make) => {
  const ul = part.querySelector('ul');
  items.forEach((it, i) => {
    const v = JSON.stringify(it);
    const old = ul.children[i];
    if (old?.dataset.v === v) {
      return;
    }
    const li = make(it);
    li.dataset.v = v;
    if (old) {
      old.replaceWith(li);
    }
    else {
      li.classList.add('enter');
      ul.append(li);
    }
  });
  while (ul.children.length > items.length) {
    ul.lastChild.remove();
  }
  part.hidden = items.length === 0;
};
// the card as the summary stands: streaming (busy), done, or failed
const paintCard = (r, {summary: s, busy = false, error} = {}) => {
  const card = $('ai-card');
  if (state.reading !== r) {
    return;
  }
  const empty = !s || !(s.points.length || s.todo.length || s.events.length || s.facts?.length);
  card.setAttribute('aria-busy', String(busy));
  card.classList.toggle('busy', busy);
  card.querySelector('.ai-state').textContent = busy ? t('summarizing') : '';
  card.querySelector('.ai-wait').hidden = !(busy && empty);
  card.querySelector('.ai-copy').hidden = busy || empty || Boolean(error);
  card.querySelector('.ai-again').hidden = busy;
  // the Google account the mail came to: its calendar takes the event
  const account = serviceOf(r.o) ? undefined : r.o.xml.title;
  const line = text => h('li', {}, text);
  fill(card.querySelector('.ai-points'), s?.points || [], line);
  fill(card.querySelector('.ai-todo'), s?.todo || [], line);
  fill(card.querySelector('.ai-events'), s?.events || [], ev => h('li', {},
    h('span', {class: 'ai-when'}, eventWhen(ev)),
    h('span', {class: 'ai-what'}, ev.title),
    h('a', {
      'class': 'ai-cal',
      'href': self.AI?.calendarUrl(ev, {account}) || '#',
      'target': '_blank',
      'rel': 'noopener noreferrer',
      'aria-label': t('addToCalendar') + ': ' + ev.title
    }, icon('calendar'), t('addToCalendar'))));
  // what the reader may need to copy: an order number, an amount, a tracking number
  fill(card.querySelector('.ai-facts'), s?.facts || [], f => h('li', {},
    h('span', {class: 'ai-label'}, f.label),
    h('span', {class: 'ai-value'}, f.value),
    h('button', {class: 'icon-btn ai-copy-fact', type: 'button', title: t('copyText') + ': ' + f.value, 'aria-label': t('copyText') + ': ' + f.label,
      onclick: ev => copyFact(f.value, ev.currentTarget)}, icon('copy'))));
  card.querySelector('.ai-note').hidden = !s?.truncated;
  card.querySelector('.ai-cut').hidden = !s?.cut || busy;
  const err = card.querySelector('.ai-error');
  err.hidden = !error;
  err.replaceChildren(...(error ? [error.message || t('bodyFailed'), ' ',
    h('button', {type: 'button', class: 'ai-settings', onclick: openAISettings}, t('aiSettings'))] : []));
};
// Settings → AI, at an engine's key or sign-in when one is named
const openAISettings = engine => {
  chrome.tabs.create({url: chrome.runtime.getURL('/data/settings/index.html#ai' + (typeof engine === 'string' && engine !== 'off' ? '-' + engine : ''))});
  if (!SIDE) {
    window.close();
  }
};
// the summary of the open mail: one at a time, stopped by back, J, K, Hide and the panel closing
const runSummary = async (r, fresh = false) => {
  r.ai.ctl?.abort();
  const ctl = r.ai.ctl = new AbortController();
  $('ai-card').hidden = false;
  paintSummaryBtn();
  paintCard(r, {busy: true});
  try {
    const [AI, messages] = await Promise.all([loadAI(), r.texts]);
    if (ctl.signal.aborted) {
      return;
    }
    const s = await AI.summarize({key: summaryKey(r.e), fresh, signal: ctl.signal, subject: r.e.title || '', messages, reader: r.o.xml.title,
      onUpdate: p => !ctl.signal.aborted && paintCard(r, {summary: p, busy: true})});
    if (!ctl.signal.aborted) {
      paintCard(r, {summary: await summaryInUI(s)});
    }
  }
  catch (err) {
    if (ctl.signal.aborted) {
      return;
    }
    // stopped elsewhere: the engine changed in the settings
    if (err?.code === 'aborted') {
      $('ai-card').hidden = true;
      paintSummaryBtn();
      return;
    }
    paintCard(r, {error: err});
  }
};
const hideSummary = r => {
  const inside = $('ai-card').contains(document.activeElement);
  r.ai.ctl?.abort();
  aiHidden.add(summaryKey(r.e));
  $('ai-card').hidden = true;
  paintSummaryBtn();
  // the card's own Hide: the focus goes to the button that shows it again
  if (inside) {
    $('reader-ai').querySelector('.ai-btn')?.focus();
  }
};
// the button and I: the summary shows (kept, or asked for) or hides
const toggleSummary = () => {
  const r = state.reading;
  if (r && !aiOn()) {
    openTool(r, 'offer');
    return;
  }
  if (!r || !canSummarize(r.o)) {
    return;
  }
  if (!$('ai-card').hidden) {
    hideSummary(r);
    return;
  }
  aiHidden.delete(summaryKey(r.e));
  runSummary(r);
};
// once the mail shows: a summary kept from before shows at once, without a click; with the
// setting at "automatically", a long thread asks for one
const autoSummary = async (r, messages) => {
  if (!canSummarize(r.o) || aiHidden.has(summaryKey(r.e))) {
    return;
  }
  const AI = await loadAI();
  const hit = AI && await AI.cached(summaryKey(r.e)).catch(() => null);
  if (state.reading !== r || !$('ai-card').hidden) {
    return;
  }
  if (hit) {
    $('ai-card').hidden = false;
    paintSummaryBtn();
    paintCard(r, {summary: hit});
    // the built-in model's English, in the UI's language once Chrome's translator has it
    if (hit.lang) {
      const s = await summaryInUI(hit);
      if (state.reading === r && !$('ai-card').hidden && !r.ai.ctl) {
        paintCard(r, {summary: s});
      }
    }
  }
  else if (state.ai.summary === 'auto' && messages.reduce((n, m) => n + m.text.length, 0) > AUTO_CHARS) {
    runSummary(r);
  }
};
const copySummary = (r, el) => {
  const card = $('ai-card');
  const part = cls => {
    const p = card.querySelector('.' + cls);
    return p.hidden ? [] : [p.querySelector('h4').textContent, ...[...p.querySelectorAll('li')].map(li => '• ' +
      (cls === 'ai-events' ? li.querySelector('.ai-when').textContent + ' — ' + li.querySelector('.ai-what').textContent :
        cls === 'ai-facts' ? li.querySelector('.ai-label').textContent + ': ' + li.querySelector('.ai-value').textContent : li.textContent)), ''];
  };
  const text = [r.e.title || t('noSubject'), '', ...part('ai-points'), ...part('ai-todo'), ...part('ai-events'), ...part('ai-facts')].join('\n').trim();
  navigator.clipboard.writeText(text).then(() => {
    el.replaceChildren(icon('done'));
    el.classList.add('copied');
    setTimeout(() => {
      el.replaceChildren(icon('copy'));
      el.classList.remove('copied');
    }, 1200);
  }, () => toast(t('copyFailed'), true));
};
// a fact of the summary, copied as the mail writes it
const copyFact = (value, el) => navigator.clipboard.writeText(value).then(() => {
  el.replaceChildren(icon('done'));
  el.classList.add('copied');
  setTimeout(() => {
    el.replaceChildren(icon('copy'));
    el.classList.remove('copied');
  }, 1200);
}, () => toast(t('copyFailed'), true));
// What the built-in model wrote in English for a UI in another language, in that language by
// Chrome's own translator, on this computer, when it has the language ready: a download wants a
// click, which a summary that streamed in no longer has. Otherwise the English stays.
const inUI = async (texts, from = 'en') => {
  const T = self.Translator;
  if (!from || from === uiLang() || typeof T?.create !== 'function' || !texts.some(Boolean)) {
    return texts;
  }
  try {
    if (await T.availability({sourceLanguage: from, targetLanguage: uiLang()}) !== 'available') {
      return texts;
    }
    const tr = await T.create({sourceLanguage: from, targetLanguage: uiLang()});
    try {
      return await Promise.all(texts.map(s => s ? tr.translate(s) : s));
    }
    finally {
      tr.destroy?.();
    }
  }
  catch (e) {
    return texts;
  }
};
const summaryInUI = async s => {
  if (!s?.lang) {
    return s;
  }
  const texts = [...s.points, ...s.todo, ...s.events.map(e => e.title), ...(s.facts || []).map(f => f.label)];
  const out = await inUI(texts, s.lang);
  if (out === texts) {
    return s;
  }
  let i = 0;
  const next = () => out[i++];
  return {...s, points: s.points.map(next), todo: s.todo.map(next), events: s.events.map(e => ({...e, title: next()})),
    facts: (s.facts || []).map(f => ({...f, label: next()})), lang: uiLang()};
};

/* the reader's assistant: its buttons under the sender, and a card for a reply, a question or a translation */
const textBtn = (name, label, onclick, cls = '') => h('button', {class: 'ai-act ' + cls, type: 'button', 'data-focus': 'ai:' + name, onclick}, icon(name), h('span', {}, label));
// the buttons: the summary (I), a reply, a translation once the mail is in another language, a question
const paintStrip = r => {
  const el = $('reader-ai');
  const on = showAI() && can(r.o, 'body');
  el.hidden = !on;
  if (!on) {
    el.replaceChildren();
    return;
  }
  const summary = textBtn('sparkle', t('summary'), () => toggleSummary(), 'ai-btn');
  summary.title = t('summary') + ' (I)';
  summary.setAttribute('aria-controls', 'ai-card');
  summary.setAttribute('aria-expanded', String(!$('ai-card').hidden));
  summary.hidden = aiOn() && state.ai.summary === 'off';
  const from = r.lang && r.lang !== uiLang() ? langName(r.lang) : '';
  // a language not told yet (Chrome's detector may want a download, which a click allows) is
  // offered a translation all the same, by the browser or by the engine
  const offer = from || r.translated || (!r.lang && (aiOn() || typeof self.Translator?.create === 'function'));
  el.replaceChildren(...[
    summary,
    textBtn('reply', t('replyWithAI'), () => openTool(r, 'reply'), 'ai-reply'),
    offer && textBtn('translate', r.translated ? t('showOriginal') : from ? t('translateFrom', from) : t('translate'), () => toggleTranslate(r),
      'ai-translate' + (r.translated ? ' on' : '')),
    textBtn('ask', t('askAboutMail'), () => openTool(r, 'ask'), 'ai-ask')].filter(Boolean));
  paintSummaryBtn();
};
const resetTool = r => {
  r.tool?.ctl?.abort();
  r.tool = {mode: '', ctl: null, text: '', intent: '', chosen: '', change: '', how: '', again: '', before: '', notes: [], doubtful: [], error: null, busy: false};
  r.lang = '';
  r.translated = false;
  r.originals = null;
  $('ai-tool').hidden = true;
  $('ai-tool').replaceChildren();
};
const openTool = (r, mode) => {
  if (r.tool.mode === mode && !$('ai-tool').hidden) {
    closeTool(r);
    return;
  }
  r.tool.ctl?.abort();
  Object.assign(r.tool, {mode: aiOn() || mode === 'offer' ? mode : 'offer', ctl: null, text: '', chosen: '', change: '', how: '', before: '', notes: [],
    doubtful: [], error: null, busy: false});
  paintTool(r);
  $('ai-tool').querySelector('textarea, input')?.focus();
};
const closeTool = r => {
  r.tool.ctl?.abort();
  r.tool.mode = '';
  $('ai-tool').hidden = true;
  $('reader-ai').querySelector('.ai-act')?.focus();
};
const TOOLS = {offer: 'sparkle', reply: 'reply', ask: 'ask', translate: 'translate'};
// what a draft can be made, by its button: the engine keeps its facts and its "…" blanks
const REWRITES = [['shorter', 'rewriteShorter'], ['longer', 'rewriteLonger'], ['formal', 'rewriteFormal'], ['friendly', 'rewriteFriendly'],
  ['grammar', 'rewriteGrammar']];
// a reply's intents; Accept the time and Propose times leave the times to the reader ("…")
const INTENTS = ['intentYes', 'intentNo', 'intentMore', 'intentTimes', 'intentAccept', 'intentThanks'];
/*
 * The card of a reply, a question or a translation. A reply starts from an intent or the reader's
 * words; once there is a draft, those fold into one Rewrite… field with its buttons, and the
 * draft stays the reader's to change. While an answer streams, only its text changes (streamTool).
 */
const paintTool = r => {
  const card = $('ai-tool');
  if (state.reading !== r || !r.tool.mode) {
    return;
  }
  const {mode, busy, error, text} = r.tool;
  // a field being typed in keeps the focus through the card drawn again
  const typing = card.contains(document.activeElement) ? document.activeElement.dataset.role : '';
  card.hidden = false;
  card.setAttribute('aria-busy', String(busy));
  const title = {offer: t('assistant'), reply: t('replyWithAI'), ask: t('askAboutMail'), translate: t('translation')}[mode];
  const head = h('header', {class: 'ai-head'},
    h('span', {class: 'ai-mark'}, icon(TOOLS[mode])),
    h('h3', {}, title),
    h('span', {class: 'ai-state'}, busy ? t(mode === 'reply' ? 'writing' : mode === 'translate' ? 'translating' : 'answering') : ''),
    h('span', {class: 'grow'}),
    btn('close', t('close'), () => closeTool(r), 'ai-hide'));
  const fail = error && h('div', {class: 'ai-error', role: 'alert'}, h('p', {}, error.message || t('actionFailed')),
    h('div', {class: 'row-btns'}, ...errorActions(error, () => runTool(r, r.tool.again))));
  const notes = !busy && r.tool.notes.length > 0 && h('p', {class: 'ai-note'}, r.tool.notes.map(k => t(k)).join(' '));
  if (mode === 'offer') {
    card.replaceChildren(head, h('p', {class: 'offer'}, t('offerAI')), h('div', {class: 'row-btns'},
      h('button', {class: 'primary-btn', type: 'button', onclick: () => openAssist({setup: true})}, icon('sparkle'), t('turnOnAI'))));
    return;
  }
  if (mode === 'translate') {
    card.replaceChildren(...[head, text ? h('div', {class: 'answer translation'}, text) : busy && waitDots(), notes, fail].filter(Boolean));
    return;
  }
  const drafted = mode === 'reply' && Boolean(text);
  // the one field: what the reply should say, a question, or how to rewrite the draft
  const key = drafted ? 'change' : 'intent';
  const hint = drafted ? t('rewritePlaceholder') : mode === 'reply' ? t('replyIntentPlaceholder') : t('askMailPlaceholder');
  const go = () => {
    r.tool[key] = input.value;
    if (drafted) {
      input.value.trim() && runTool(r, input.value.trim());
    }
    else {
      r.tool.chosen = '';
      runTool(r);
    }
  };
  const input = h('textarea', {
    'class': 'tool-input',
    'rows': 1,
    'value': r.tool[key] || '',
    'placeholder': hint,
    'aria-label': hint,
    'data-role': key,
    'onkeydown': ev => {
      if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) {
        ev.preventDefault();
        if (!r.tool.busy) {
          go();
        }
      }
      // Esc leaves the field, not the mail
      else if (ev.key === 'Escape') {
        ev.preventDefault();
        ev.stopPropagation();
        closeTool(r);
      }
    },
    'oninput': () => {
      r.tool[key] = input.value;
    }
  });
  // in a narrow panel the button says it by its icon alone, and leaves the field its room
  const label = drafted ? t('rewrite') : mode === 'reply' ? t('writeReply') : t('ask');
  const field = h('div', {class: 'tool-ask'}, input, busy ?
    h('button', {class: 'text-btn', type: 'button', onclick: () => r.tool.ctl?.abort()}, icon('stop'), t('stop')) :
    h('button', {'class': 'primary-btn', 'type': 'button', 'title': label, 'aria-label': label, 'onclick': go},
      icon(drafted ? 'refresh' : mode === 'reply' ? 'compose' : 'send'), h('span', {class: 'go-label'}, label)));
  const chip = (label, on, onclick) => h('button', {class: 'suggestion' + (on ? ' on' : ''), type: 'button', disabled: busy,
    'aria-pressed': String(on), onclick}, label);
  const parts = [head];
  if (mode === 'reply' && !drafted) {
    parts.push(h('div', {class: 'intents'}, INTENTS.map(k => chip(t(k), r.tool.chosen === k, () => {
      Object.assign(r.tool, {chosen: k, intent: t(k)});
      runTool(r);
    }))), field, busy && waitDots());
  }
  else if (drafted) {
    const draft = h('textarea', {class: 'draft', rows: 8, value: text, 'aria-label': t('draft'), 'data-role': 'draft', readOnly: busy, oninput: () => {
      r.tool.text = draft.value;
    }});
    parts.push(draft,
      h('div', {class: 'rewrites', role: 'group', 'aria-label': t('rewrite')}, REWRITES.map(([how, k]) => chip(t(k), r.tool.how === how, () => runTool(r, how)))),
      field,
      !busy && h('div', {class: 'row-btns'},
        h('button', {class: 'primary-btn', type: 'button', onclick: () => replyWith(r)}, icon('open'), serviceOf(r.o) ? t('openIn', serviceOf(r.o).name) : t('openInGmail')),
        h('button', {class: 'text-btn', type: 'button', onclick: ev => copyText(r.tool.text, ev.currentTarget)}, icon('copy'), t('copyText')),
        r.tool.before && h('button', {class: 'text-btn', type: 'button', onclick: () => {
          Object.assign(r.tool, {text: r.tool.before, before: ''});
          paintTool(r);
        }}, icon('back'), t('undo'))));
  }
  else {
    parts.push(field, text ? h('div', {class: 'answer'}, ...richText(text, null, null, r.tool.doubtful)) : busy && waitDots());
  }
  parts.push(notes, fail);
  card.replaceChildren(...parts.filter(Boolean));
  if (typing) {
    card.querySelector(`[data-role="${typing}"]`)?.focus();
  }
};
// A stream's text where it shows, the rest of the card as it is: the draft's scroll, a caret and
// a field being typed in stay where they are. Before the first words, the card is drawn.
const streamTool = (r, text) => {
  r.tool.text = text;
  const card = $('ai-tool');
  const draft = card.querySelector('.draft');
  const answer = card.querySelector('.answer');
  if (r.tool.mode === 'reply' && draft && text) {
    const end = draft.scrollHeight - draft.scrollTop - draft.clientHeight < 24;
    draft.value = text;
    if (end) {
      draft.scrollTop = draft.scrollHeight;
    }
  }
  else if (r.tool.mode !== 'reply' && answer) {
    answer.replaceChildren(...(r.tool.mode === 'translate' ? [text] : richText(text)));
  }
  else {
    paintTool(r);
  }
};
const waitDots = () => h('div', {class: 'ai-wait', 'aria-hidden': 'true'}, h('span', {}), h('span', {}), h('span', {}));
// the reply opens in the mail service with the text in place: Gmail's compose window takes it;
// another service's opens with the text in the clipboard
const replyWith = r => {
  const subject = /^re:/i.test(r.e.title || '') ? r.e.title : 'Re: ' + (r.e.title || '');
  if (serviceOf(r.o)) {
    navigator.clipboard.writeText(r.tool.text || '').catch(() => {});
    toast(t('draftCopied'));
    openUrl(replyUrl(r.e, r.o));
    return;
  }
  openUrl(composeWith(r.o, {to: r.e.author_email || '', subject, body: r.tool.text || ''}));
};
// how: a reply's draft rewritten (a button's word, or the reader's own), instead of a new one
const runTool = async (r, how = '') => {
  r.tool.ctl?.abort();
  const ctl = r.tool.ctl = new AbortController();
  const {mode} = r.tool;
  const rewriting = mode === 'reply' && Boolean(how) && Boolean(String(r.tool.text || '').trim());
  // a rewrite streams over the draft; the draft before it comes back if it fails or is stopped
  const before = r.tool.text;
  // how: the rewrite underway, its button pressed; again: what Try again asks once more
  Object.assign(r.tool, {busy: true, error: null, notes: [], doubtful: [], how: rewriting ? how : '', again: how});
  if (!rewriting) {
    r.tool.text = '';
  }
  paintTool(r);
  const live = () => !ctl.signal.aborted && state.reading === r && r.tool.mode === mode;
  const onUpdate = text => live() && streamTool(r, text);
  let done = false;
  try {
    const [AI, messages] = await Promise.all([loadAI(), r.texts]);
    if (!AI || !live()) {
      return;
    }
    const subject = r.e.title || '';
    const reader = r.o.xml.title;
    if (rewriting) {
      const x = await AI.rewrite({text: before, how, lang: r.lang, signal: ctl.signal, onUpdate});
      Object.assign(r.tool, {text: x.text, before, change: '', notes: x.cut ? ['aiCut'] : []});
    }
    else if (mode === 'reply') {
      const d = await AI.draft({subject, messages, intent: r.tool.intent, reader, lang: r.lang, signal: ctl.signal, onUpdate});
      Object.assign(r.tool, {text: d.text, before: '', notes: d.cut ? ['aiCut'] : []});
    }
    else if (mode === 'ask') {
      if (!String(r.tool.intent || '').trim()) {
        return;
      }
      // the thread read newest first, its newest messages whole
      const a = await AI.answer({question: r.tool.intent, thread: {subject, messages, reader}, signal: ctl.signal, onUpdate});
      const [text] = a.notFound ? [t('notInThread')] : await inUI([a.text], a.lang);
      Object.assign(r.tool, {text, doubtful: a.lang ? [] : a.doubtful || [], notes: a.cut ? ['aiCut'] : []});
    }
    else if (mode === 'translate') {
      const x = await AI.translate({subject, messages, signal: ctl.signal, onUpdate});
      Object.assign(r.tool, {text: x.text, notes: [x.truncated && 'translatedStart', x.cut && 'aiCut'].filter(Boolean)});
    }
    done = true;
  }
  catch (err) {
    if (live() && err?.code !== 'aborted') {
      r.tool.error = {code: err?.code || '', message: err?.message || t('actionFailed')};
    }
  }
  finally {
    if (r.tool.ctl === ctl) {
      if (rewriting && !done) {
        r.tool.text = before;
      }
      r.tool.how = '';
      r.tool.ctl = null;
      r.tool.busy = false;
      paintTool(r);
    }
  }
};

/* translation: Chrome's own translator, on this computer and free, before any engine */
const uiLang = () => LANG.split('-')[0].toLowerCase();
const langName = code => {
  try {
    return new Intl.DisplayNames([LANG], {type: 'language'}).of(code) || code;
  }
  catch (e) {
    return code;
  }
};
// click: from a click, which lets Chrome download its detector first
const detectLang = async (text, click = false) => {
  const LD = self.LanguageDetector;
  if (typeof LD?.create !== 'function' || !text.trim()) {
    return '';
  }
  try {
    const a = typeof LD.availability === 'function' ? await LD.availability() : 'available';
    if (a === 'unavailable' || (a !== 'available' && !click)) {
      return '';
    }
    const d = await LD.create();
    try {
      const [best] = await d.detect(text.slice(0, 2000));
      return best && best.confidence >= 0.6 && best.detectedLanguage !== 'und' ? best.detectedLanguage.split('-')[0].toLowerCase() : '';
    }
    finally {
      d.destroy?.();
    }
  }
  catch (e) {
    return '';
  }
};
const browserTranslates = async from => {
  const T = self.Translator;
  if (typeof T?.availability !== 'function' || !from || from === uiLang()) {
    return false;
  }
  try {
    return await T.availability({sourceLanguage: from, targetLanguage: uiLang()}) !== 'unavailable';
  }
  catch (e) {
    return false;
  }
};
// the open mail's language, from its newest message: a Translate button when it is not the UI's
const findLanguage = async r => {
  const messages = await r.texts;
  const lang = await detectLang(messages.at(-1)?.text || '');
  if (state.reading === r && lang) {
    r.lang = lang;
    r.browser = await browserTranslates(lang);
    if (state.reading === r) {
      paintStrip(r);
    }
  }
};
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'KBD', 'SAMP']);
// the message's own text translated where it stands, a few pieces at a time; Show original puts it back
const toggleTranslate = async r => {
  if (r.translated) {
    for (const [n, text] of r.originals || []) {
      n.nodeValue = text;
    }
    r.originals = null;
    r.translated = false;
    paintStrip(r);
    return;
  }
  // a language not told yet: told now, from the click
  if (!r.lang) {
    const messages = await r.texts;
    r.lang = await detectLang(messages.at(-1)?.text || '', true);
    r.browser = r.lang ? await browserTranslates(r.lang) : false;
    if (state.reading !== r) {
      return;
    }
    if (r.lang === uiLang()) {
      toast(t('sameLanguage', langName(r.lang)));
      paintStrip(r);
      return;
    }
  }
  if (!r.browser) {
    // no translator in this browser for this language: the engine's, as a card
    openTool(r, 'translate');
    if (aiOn() && r.tool.mode === 'translate') {
      runTool(r);
    }
    return;
  }
  const el = $('reader-ai').querySelector('.ai-translate span');
  r.tool.ctl?.abort();
  const ctl = new AbortController();
  r.translating = ctl;
  let translator;
  try {
    // made in the click: a language pack that needs a download needs one
    translator = await self.Translator.create({sourceLanguage: r.lang, targetLanguage: uiLang(), signal: ctl.signal, monitor(m) {
      m.addEventListener('downloadprogress', e => el && (el.textContent = t('downloading', Math.round((e.total > 1 ? e.loaded / e.total : e.loaded) * 100))));
    }});
    if (el) {
      el.textContent = t('translating');
    }
    const doc = await frameReady;
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => !SKIP.has(n.parentElement?.tagName) && /\p{L}{2}/u.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      nodes.push(n);
    }
    r.originals = new Map();
    r.translated = true;
    let i = 0;
    const work = async () => {
      while (i < nodes.length && !ctl.signal.aborted && state.reading === r) {
        const n = nodes[i++];
        const text = n.nodeValue;
        try {
          const out = await translator.translate(text.trim(), {signal: ctl.signal});
          if (state.reading === r && r.originals) {
            r.originals.set(n, text);
            n.nodeValue = text.match(/^\s*/)[0] + out + text.match(/\s*$/)[0];
          }
        }
        catch (e) {}
      }
    };
    await Promise.all([work(), work(), work()]);
  }
  catch (err) {
    if (state.reading === r && !ctl.signal.aborted) {
      toast(t('translateFailed'), true);
      r.translated = Boolean(r.originals?.size);
    }
  }
  finally {
    translator?.destroy?.();
    if (state.reading === r) {
      paintStrip(r);
    }
  }
};

/* waiting for your reply: the assistant reads who, what and the preview of unread mail */
// once the list has shown, never at each check: only mail not asked about yet is sent
const REPLY_WAIT = 800;
let replyTimer = 0;
let replyCtl = null;
let replyAgain = false;
const replySeen = new Set();
// a mail asked about: its mailbox, its thread, its version
const replyId = (e, o) => o.xml.title + '|' + thread(e.link) + '|' + (e.modified || '');
const replyOf = (e, o) => state.replies.get(replyId(e, o));
// the mail the list shows, with what Gmail's search added past the feed's 20
const shownMail = objs => objs.flatMap(o => [...o.xml.entries, ...(state.extra.get(accountName(o)) || [])
  .filter(e => !state.hidden.has(e.link))].map(e => ({e, o})));
// the kinds the assistant sorts unread mail into, each a chip that narrows the list to it
const SORTS = {
  reply: {icon: 'reply', has: v => v?.reply === true},
  important: {icon: 'flag', has: v => v?.important === true},
  bulk: {icon: 'bulk', has: v => v?.bulk === true}
};
// the mail of one of the list's views: a kind of the assistant's sorting, or one of Gmail's categories
const inKind = (kind, e, o) => SORTS[kind] ? SORTS[kind].has(replyOf(e, o)) : inCategory(kind, e, o);
const kindIcon = kind => (SORTS[kind] || CATEGORIES[kind]).icon;
const sortCount = (objs, kind) => shownMail(objs).filter(({e, o}) => inKind(kind, e, o)).length;
const replyCount = objs => sortCount(objs, 'reply');
const replyMark = (e, o) => {
  const v = replyOf(e, o);
  return v?.reply === true && h('span', {'class': 'reply-mark', 'role': 'img', 'title': t('replyWhy', v.why), 'aria-label': t('replyWhy', v.why)}, icon('reply'));
};
// first among the chips, one for each kind with mail in it: a click narrows the list to that
// mail. An error with nothing found puts its dot on the first one, which then opens the AI
// settings. With the assistant off, one chip offers it.
const sortChips = objs => {
  if (state.search) {
    return [];
  }
  if (!aiOn()) {
    return showAI() && objs.some(o => o.xml.fullcount) ? [h('button', {
      'class': 'chip ai-offer',
      'type': 'button',
      'data-focus': 'chip:ai',
      'onclick': () => openAssist({setup: true})
    }, icon('sparkle'), t('sortOffer'))] : [];
  }
  if (!state.ai.reply) {
    return [];
  }
  const err = state.replyError;
  const chips = Object.keys(SORTS).map(kind => ({kind, n: sortCount(objs, kind)})).filter(({n}) => n > 0);
  if (!chips.length && err) {
    chips.push({kind: 'reply', n: 0});
  }
  // each says its name and count; a narrow panel shows only the count (index.css), the name
  // staying in its tooltip
  return chips.map(({kind, n}, i) => {
    const dot = err && i === 0;
    const label = t(kind + 'Chip', n);
    return h('button', {
      'class': 'chip sort-chip ' + kind + '-chip' + (state.sortOnly === kind ? ' on' : ''),
      'type': 'button',
      'aria-pressed': String(state.sortOnly === kind),
      'aria-label': label + (dot ? ' · ' + err.message : ''),
      'data-tip': dot ? err.message : label + ' — ' + t(kind + 'Tip'),
      'data-focus': 'chip:' + kind,
      'onclick': () => {
        if (!n) {
          openAISettings();
          return;
        }
        state.sortOnly = state.sortOnly === kind ? null : kind;
        state.siteOnly = false;
        state.focus = FIRST;
        render();
      }
    }, icon(SORTS[kind].icon), h('span', {class: 'full'}, label), h('span', {class: 'short count'}, n),
    dot && h('span', {class: 'err-dot', 'aria-hidden': 'true'}));
  });
};
// One chip for each of Gmail's categories with unread mail in it, as the sorting's chips are: a
// click narrows the list to that mail, with all of it read or archived at once (sortBar)
const categoryChips = objs => state.search ? [] : shownCategories().map(kind => ({kind, n: sortCount(objs, kind)})).filter(({n}) => n > 0)
  .map(({kind, n}) => {
    const label = t(kind + 'Chip', n);
    return h('button', {
      'class': 'chip cat-chip ' + kind + '-chip' + (state.sortOnly === kind ? ' on' : ''),
      'type': 'button',
      'aria-pressed': String(state.sortOnly === kind),
      'aria-label': label,
      'data-tip': label + ' — ' + t('categoryTip'),
      'data-focus': 'chip:' + kind,
      'onclick': () => {
        state.sortOnly = state.sortOnly === kind ? null : kind;
        state.siteOnly = false;
        state.focus = FIRST;
        render();
      }
    }, icon(CATEGORIES[kind].icon), h('span', {class: 'full'}, label), h('span', {class: 'short count'}, n));
  });
// over the list narrowed to one kind: how much, and the mail all read or archived at once
const sortBar = objs => {
  const mail = shownMail(objs).filter(({e, o}) => inKind(state.sortOnly, e, o));
  const links = mail.map(({e}) => e.link);
  const archivable = mail.filter(({o}) => can(o, 'archive')).map(({e}) => e.link);
  // what it is, and how many as a count of its own; a screen reader hears the sentence
  return h('div', {class: 'sort-bar'},
    h('span', {class: 'sort-what'}, icon(kindIcon(state.sortOnly)), h('span', {'class': 'sr'}, t(state.sortOnly + 'Shown', mail.length)),
      h('span', {'class': 'label', 'aria-hidden': 'true'}, t(state.sortOnly + 'List')), h('span', {'class': 'n', 'aria-hidden': 'true'}, mail.length)),
    h('span', {class: 'grow'}),
    // a narrow panel shows their icons alone (index.css), their names in the tooltips
    links.length > 0 && h('button', {'class': 'text-btn', 'type': 'button', 'aria-label': t('markAllRead'), 'data-tip': t('markAllRead'),
      'data-focus': 'sort:read', 'onclick': () => act('rd', links)}, icon('readAll'), h('span', {class: 'btn-label'}, t('markAllRead'))),
    archivable.length > 0 && h('button', {'class': 'text-btn', 'type': 'button', 'aria-label': t('archiveAll'), 'data-tip': t('archiveAll'),
      'data-focus': 'sort:archive', 'onclick': () => act('rc_^i', archivable)}, icon('archive'), h('span', {class: 'btn-label'}, t('archiveAll'))),
    // Newsletters: each sender, with how to unsubscribe from it (Gmail's mail)
    state.sortOnly === 'bulk' && mail.some(({o}) => !serviceOf(o)) && menuBtn('unsubscribe', t('unsubscribeSenders'), '',
      anchor => sendersMenu(anchor, mail), 'senders-btn'));
};
// the answers on the lines as they are, and on the chip: the list is not drawn again for them
const paintReplies = () => {
  const path = focusPath();
  renderChips(view());
  for (const el of $('list').querySelectorAll('.row')) {
    const r = state.rows.get(el.dataset.link);
    const mark = r && replyMark(r.e, r.o);
    const old = el.querySelector('.reply-mark');
    if (mark && !old) {
      el.querySelector('.subject').prepend(mark);
    }
    else if (!mark && old) {
      old.remove();
    }
  }
  if (path && document.activeElement === document.body) {
    document.querySelector(path)?.focus({preventScroll: true});
  }
};
// Gmail's own sorting: its unread promotions, social and forum mail of the last two weeks is
// bulk with no model asked (unless a person wrote it, ai.js decides). One search an account.
const BULK_QUERY = 'is:unread newer_than:14d (category:promotions OR category:social OR category:forums)';
const bulkOf = async items => {
  const accounts = new Set(items.map(it => it.account));
  const gmails = view().filter(o => !serviceOf(o) && accounts.has(o.xml.title)).filter((o, i, l) => l.findIndex(x => x.xml.title === o.xml.title) === i);
  const found = await Promise.all(gmails.map(o => searchIn(o, BULK_QUERY).then(list => (list || []).map(e => o.xml.title + '|' + thread(e.link)))));
  const known = new Set(found.flat());
  return items.filter(it => known.has(it.account + '|' + it.thread)).map(it => it.id);
};
// the sorting underway, for the assistant to wait for
let replyRun = null;
const runReplies = async () => {
  if (replyCtl) {
    replyAgain = true;
    return;
  }
  const items = shownMail(view()).filter(({e, o}) => e.unread !== false && !replySeen.has(replyId(e, o))).map(({e, o}) => ({
    id: replyId(e, o), from: e.author_name || '', email: e.author_email || '', subject: e.title || '', snippet: e.summary || '',
    date: e.modified || '', account: o.xml.title, thread: thread(e.link)
  }));
  if (items.length === 0) {
    return;
  }
  // asked once a panel: a failure is not asked again until new mail comes
  items.forEach(it => replySeen.add(it.id));
  const AI = await loadAI();
  if (!AI || !aiOn()) {
    return;
  }
  const ctl = replyCtl = new AbortController();
  let finish;
  replyRun = new Promise(resolve => finish = resolve);
  const accounts = [...new Set([...state.objs.map(o => o.xml.title), ...Object.keys(state.accounts)])].filter(a => a.includes('@'));
  // the chips fill in as the answers come, a request at a time
  const onBatch = found => {
    if (!ctl.signal.aborted) {
      found.forEach((v, id) => state.replies.set(id, v));
      paintReplies();
    }
  };
  try {
    const found = await AI.needsReply({items, accounts, signal: ctl.signal, onBatch, bulkOf});
    found.forEach((v, id) => state.replies.set(id, v));
    state.replyError = null;
  }
  catch (err) {
    if (ctl.signal.aborted || err?.code === 'aborted') {
      return;
    }
    err?.results?.forEach?.((v, id) => state.replies.set(id, v));
    state.replyError = err;
  }
  finally {
    if (replyCtl === ctl) {
      replyCtl = null;
    }
    replyRun = null;
    finish();
  }
  paintReplies();
  if (replyAgain) {
    replyAgain = false;
    scheduleReplies();
  }
};
// the sorting as far as it goes now: mail not asked about yet is asked about, and waited for
// (one underway first, then what came meanwhile)
const sorted = async () => {
  for (let i = 0; i < 2; i += 1) {
    clearTimeout(replyTimer);
    const p = runReplies();
    await (replyRun || p);
  }
};
const scheduleReplies = () => {
  if (aiOn() && state.ai.reply && state.ai.ok) {
    clearTimeout(replyTimer);
    replyTimer = setTimeout(runReplies, REPLY_WAIT);
  }
};
// after the list's first frame: the assistant's state, then the mail waiting for a reply
const startAI = async () => {
  const AI = aiOn() && await loadAI();
  if (!AI || !aiOn()) {
    return;
  }
  try {
    state.ai.ok = (await AI.state()).ok === true;
  }
  catch (e) {
    state.ai.ok = false;
  }
  // the AI's Newsletters chip stands for Gmail's promotions and social once it works
  renderChips(view());
  scheduleReplies();
  paintAssist();
  if (state.ai.ok) {
    runPending();
  }
};
// another engine, key or feature in the settings: what ran for the old ones stops and goes
const aiChanged = () => {
  state.ai.ok = false;
  replyCtl?.abort();
  replyCtl = null;
  clearTimeout(replyTimer);
  replySeen.clear();
  state.replies.clear();
  state.replyError = null;
  state.sortOnly = null;
  assist.ctl?.abort();
  if (state.reading) {
    state.reading.ai.ctl?.abort();
    resetSummary(state.reading);
    closeTool(state.reading);
    paintStrip(state.reading);
  }
  render();
  paintAssist();
  startAI();
};
// a panel closing stops what it asked for
addEventListener('pagehide', () => {
  state.reading?.ai.ctl?.abort();
  state.reading?.tool?.ctl?.abort();
  replyCtl?.abort();
  assist.ctl?.abort();
});

/* the assistant: ask the mail anything, find it, sum up what is unread, write a new mail */
// The assistant's buttons show with an engine on and, unless the settings say not to, without
// one too: they then offer to turn it on.
const showAI = () => aiOn() || state.ai.buttons !== false;
// the conversation stays for the browser session, so a popup that closed shows it again
const TURNS = 'assist.turns';
const TURNS_MAX = 8;
// What an answer reads of the mail found: the first few whole, the rest by their preview; what
// sums up the unread mail. The built-in model has room for less.
const readWhole = () => state.ai.engine === 'builtin' ? 2 : 5;
const briefMax = () => state.ai.engine === 'builtin' ? 25 : 60;
const FOUND_MAX = 30;
const READ_MS = 8000;
// keys: the setup's row of key providers opened (true) or closed by the reader, null as it starts
const assist = {turns: [], ctl: null, open: false, loaded: null, setup: false, keys: null, local: '', warmed: false};
const USAGE = 'https://chatgpt.com/settings/usage';
// The engines that take the user's own key, by the names people know them by (and the maker's,
// where it adds something), in the order the setup shows them
const KEYED = [
  {engine: 'anthropic', name: 'Claude', full: 'Anthropic Claude'},
  {engine: 'openai', name: 'OpenAI'},
  {engine: 'gemini', name: 'Gemini', full: 'Google Gemini'},
  {engine: 'xai', name: 'Grok', full: 'xAI Grok'},
  {engine: 'deepseek', name: 'DeepSeek'},
  {engine: 'mistral', name: 'Mistral', full: 'Mistral AI'},
  {engine: 'qwen', name: 'Qwen', full: 'Alibaba Qwen'},
  {engine: 'kimi', name: 'Kimi', full: 'Moonshot Kimi'},
  {engine: 'zai', name: 'Z.ai', full: 'Z.ai GLM'},
  {engine: 'groq', name: 'Groq'},
  {engine: 'openrouter', name: 'OpenRouter'},
  {engine: 'yandex', name: 'YandexGPT', full: 'Yandex AI Studio'}
];
// Every engine the assistant runs on, as ai.js names them: what else Settings → AI holds is off.
// The panel knows them before ai.js is loaded, which it is only for an engine that is on.
const ENGINES = ['builtin', 'chatgpt', 'local', ...KEYED.map(k => k.engine)];
// the ways to turn the assistant on, as the setup offers them: the keys are one choice, which
// opens the row of their providers
const CHOICES = [
  {engine: 'builtin', name: 'engineBuiltin', note: 'engineBuiltinNote'},
  {engine: 'chatgpt', name: 'engineChatGPT', note: 'engineChatGPTNote'},
  {engine: 'key', name: 'engineKey', note: 'engineKeyNote'},
  {engine: 'local', name: 'engineServer', note: 'engineServerNote'}
];
// The suggestions; those whose plan is known need no model to plan them: what is important, who
// waits for a reply (the sorting knows, with no model at all), this week's mail with files
const SUGGEST = [
  {key: 'suggestBrief', plan: {action: 'brief'}},
  {key: 'suggestReply', plan: {action: 'replies'}},
  {key: 'suggestFind'},
  {key: 'suggestFiles', plan: {action: 'find', query: 'has:attachment newer_than:7d', words: []}},
  {key: 'suggestWrite'}
];

// a found mail as the conversation keeps it, and back as the reader takes it
const refOf = (e, o) => ({link: e.link, title: e.title || '', from: e.author_name || e.author_email || '', email: e.author_email || '',
  date: e.modified || '', snippet: e.summary || '', unread: e.unread !== false, account: o.xml.title, box: o.xml.link});
const entryOf = m => ({link: m.link, title: m.title, summary: m.snippet, author_name: m.from, author_email: m.email,
  modified: m.date, unread: m.unread, id: m.link});
// A found mail's mailbox, by its address first: Gmail numbers its accounts (/u/N) in the order
// they were signed in, so a conversation kept from before may hold the number of another account
// now. A mail whose account is gone has none.
const hashOf = link => String(link || '').replace(/^[^#]*/, '');
const boxOf = m => {
  const objs = view();
  const mine = m.account ? objs.filter(o => o.xml.title === m.account) : objs.filter(o => o.xml.link === m.box);
  return mine.find(o => o.xml.link === m.box) || mine.find(o => hashOf(o.xml.link) === hashOf(m.box)) || mine[0];
};
// the found mail with its mailbox, its link carrying the account's number as it is now
const here = m => {
  const o = boxOf(m);
  return o ? {m: serviceOf(o) ? m : {...m, link: m.link.replace(/\/u\/\d+(?=[/?#]|$)/, '/u/' + userOf(o.xml.link))}, o} : null;
};
// a search as the reader reads it: a moment of after: or before: as its day
const shownQuery = q => String(q || '').replace(/\b(after|before):(\d{9,11})\b/g, (all, k, s) => {
  const d = new Date(Number(s) * 1000);
  return `${k}:${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
});

const saveTurns = () => chrome.storage.session.set({[TURNS]: assist.turns.slice(-TURNS_MAX).map(t => ({...t, live: undefined}))}).catch(() => {});
const loadTurns = () => assist.loaded ||= chrome.storage.session.get(TURNS).then(prefs => {
  // a request the closed panel left underway has stopped with it
  assist.turns = (prefs[TURNS] || []).map(t => ['plan', 'search', 'read', 'write', 'answer'].includes(t.status) ? {...t, status: 'stopped'} : t);
}, () => {});

// question: put in the field, and asked at once with run
const openAssist = async ({question = '', setup = false, run: now = false} = {}) => {
  closeMenu();
  if (state.reading) {
    back();
  }
  if (state.search) {
    closeSearch();
  }
  assist.open = true;
  assist.setup = setup;
  assist.keys = null;
  $('app').classList.add('assisting');
  shade(true);
  const input = $('assist-input');
  if (question) {
    input.value = question;
  }
  input.focus();
  await loadTurns();
  paintAssist();
  sizeInput();
  if (aiOn()) {
    // what the first request needs, made ready while the reader types: the built-in model's sessions
    loadAI().then(AI => {
      if (AI?.warm && !assist.warmed && aiOn()) {
        assist.warmed = true;
        AI.warm(['plan', 'answer']);
      }
    });
  }
  if (now && question) {
    ask(question);
  }
};
const closeAssist = () => {
  assist.open = false;
  $('app').classList.remove('assisting');
  shade(false);
  $('tools').querySelector('[data-focus="sparkle"]')?.focus();
};
const sizeInput = () => {
  const input = $('assist-input');
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 140) + 'px';
};

// What the engine says of itself: "ChatGPT plan · gpt-6.1", "Chrome · on this computer",
// "qwen3:8b · on this computer" for a server here, "Anthropic · Claude Haiku 5.5". A model named
// after its provider says it once: "Gemini 3.8 Flash", not "Gemini · Gemini 3.8 Flash".
const engineLabel = async () => {
  const AI = aiOn() && await loadAI();
  if (!AI) {
    return '';
  }
  try {
    const d = await AI.describe?.();
    if (d) {
      const model = String(d.model || '');
      const provider = String(d.provider || '');
      if (d.local || d.engine === 'local') {
        return t('engineLocal', d.engine === 'builtin' ? provider : model || provider);
      }
      // a plan with no model picked yet says the plan alone
      if (d.plan) {
        return t('enginePlan', provider, model).replace(/\s*·\s*$/, '');
      }
      return provider && model.toLowerCase().startsWith(provider.toLowerCase()) ? model : [provider, model].filter(Boolean).join(' · ');
    }
  }
  catch (e) {}
  return '';
};
const paintAssistBar = () => {
  const label = h('span', {class: 'engine'});
  engineLabel().then(text => label.textContent = text);
  $('assist-bar').replaceChildren(...[
    btn('back', t('back') + ' (Esc)', closeAssist),
    h('h2', {class: 'assist-title'}, icon('sparkle'), t('assistant')),
    label,
    h('span', {class: 'grow'}),
    assist.turns.length > 0 && btn('trash', t('clearChat'), () => {
      assist.ctl?.abort();
      assist.turns = [];
      saveTurns();
      paintAssist();
      $('assist-input').focus();
    }, 'clear'),
    btn('tune', t('aiSettings'), () => openAISettings())
  ].filter(Boolean));
};
const paintAssist = () => {
  if (!assist.open) {
    return;
  }
  paintAssistBar();
  const body = $('assist-body');
  const ready = aiOn() && state.ai.ok;
  body.replaceChildren(
    ...(!aiOn() || assist.setup ? [setupCard()] : !ready ? [problemCard()] : []),
    ...(ready && !assist.turns.length ? [welcome()] : []),
    ...assist.turns.map(turnEl)
  );
  $('assist-send').disabled = false;
  paintSend();
  body.scrollTop = body.scrollHeight;
};
const paintSend = () => {
  const running = Boolean(assist.ctl);
  const el = $('assist-send');
  el.replaceChildren(icon(running ? 'stop' : 'send'));
  el.title = running ? t('stop') : t('send') + ' (Enter)';
  el.setAttribute('aria-label', el.title);
  el.classList.toggle('stop', running);
};
const welcome = () => h('div', {class: 'welcome'},
  h('p', {class: 'hello'}, t('assistHello')),
  h('div', {class: 'suggest'}, SUGGEST.map(({key, plan}) => h('button', {
    'class': 'suggestion',
    'type': 'button',
    'onclick': () => {
      // "write an email…" waits for the rest of the request
      if (key === 'suggestWrite') {
        $('assist-input').value = t('suggestWritePrefix') + ' ';
        sizeInput();
        $('assist-input').focus();
        return;
      }
      ask(t(key), plan && {...plan, title: t(key)});
    }
  }, t(key)))));

// Turning the assistant on: the built-in model right here, the others in Settings → AI, where
// a key is pasted or ChatGPT signs in. The request typed meanwhile waits for it.
const setupCard = () => {
  // the module is ready for a click on the built-in model, whose download must start in it
  if (self.LanguageModel) {
    loadAI();
  }
  // the engine that is on, marked where the setup shows it again; its key's row starts open
  const on = aiOn() ? state.ai.engine : '';
  const open = assist.keys ?? KEYED.some(k => k.engine === on);
  const current = engine => engine === on ? {'aria-current': 'true'} : {};
  const keys = h('div', {class: 'keys', id: 'setup-keys', role: 'group', 'aria-label': t('engineKey'), hidden: !open}, KEYED.map(k => h('button', {
    'class': 'key-tile',
    'type': 'button',
    'data-engine': k.engine,
    ...k.full ? {'title': k.full, 'aria-label': k.full} : {},
    ...current(k.engine),
    'onclick': () => choose(k.engine)
  }, k.name)));
  // the keys open and close in place, the focus staying on their choice
  const toggle = ev => {
    assist.keys = keys.hidden;
    keys.hidden = !keys.hidden;
    ev.currentTarget.setAttribute('aria-expanded', String(!keys.hidden));
  };
  const card = h('div', {class: 'setup'},
    h('span', {class: 'setup-mark'}, icon('sparkle')),
    h('h3', {}, t('setupTitle')),
    h('p', {class: 'setup-lede'}, t('setupLede')),
    h('div', {class: 'choices'}, CHOICES.filter(c => c.engine !== 'builtin' || self.LanguageModel).flatMap(c => c.engine === 'key' ? [h('button', {
      'class': 'choice',
      'type': 'button',
      'data-engine': c.engine,
      'aria-expanded': String(open),
      'aria-controls': 'setup-keys',
      'onclick': toggle
    }, h('span', {class: 'choice-name'}, t(c.name)), h('span', {class: 'choice-note'}, t(c.note)), icon('down')), keys] : h('button', {
      'class': 'choice',
      'type': 'button',
      'data-engine': c.engine,
      ...current(c.engine),
      'onclick': ev => choose(c.engine, ev.currentTarget)
    }, h('span', {class: 'choice-name'}, t(c.name)), h('span', {class: 'choice-note'}, t(c.note)), icon('open')))),
    h('p', {class: 'setup-foot'}, t('setupPrivacy')),
    aiOn() && h('button', {class: 'text-btn', type: 'button', onclick: () => {
      assist.setup = false;
      paintAssist();
    }}, t('back')));
  return card;
};
const choose = (engine, el) => {
  rememberPending();
  if (engine !== 'builtin') {
    openAISettings(engine);
    return;
  }
  // Chrome downloads its model for a click: asked at once, before anything is awaited
  const AI = self.AI;
  const note = el.querySelector('.choice-note') || {};
  chrome.storage.local.set({'ai.engine': 'builtin'});
  if (!AI) {
    loadAI();
    return;
  }
  note.textContent = t('downloading', 0);
  AI.builtin.download(p => note.textContent = t('downloading', Math.round(p * 100)))
    .then(() => {
      assist.setup = false;
      startAI();
    }, err => note.textContent = err?.message || t('actionFailed'));
};
// what keeps an engine that is on from answering, and the way to put it right
const PROBLEMS = {'no-key': 'aiNoKey', 'no-access': 'aiNoAccess', 'signed-out': 'aiSignedOut', 'no-plan': 'aiNoPlan', 'limit': 'aiLimit',
  'downloadable': 'aiDownload', 'downloading': 'aiDownloading', 'old-chrome': 'aiOldChrome', 'unavailable': 'aiUnavailable'};
const problemCard = () => {
  const card = h('div', {class: 'setup problem'}, h('p', {}, t('checkingAI')));
  loadAI().then(AI => AI?.state()).then(st => {
    if (!st || st.ok) {
      // ready after all: the settings changed, or the state was not asked yet
      if (st?.ok && !state.ai.ok) {
        state.ai.ok = true;
        paintAssist();
        runPending();
      }
      return;
    }
    const download = state.ai.engine === 'builtin' && ['downloadable', 'downloading'].includes(st.reason);
    card.replaceChildren(...[
      h('span', {class: 'setup-mark'}, icon('sparkle')),
      h('p', {}, t(PROBLEMS[st.reason] || 'aiUnavailable')),
      h('div', {class: 'row-btns'},
        download ? h('button', {class: 'primary-btn', type: 'button', onclick: () => choose('builtin', card)}, t('downloadModel')) :
          st.reason === 'limit' ? h('button', {class: 'primary-btn', type: 'button', onclick: manageUsage}, t('manageUsage')) :
            h('button', {class: 'primary-btn', type: 'button', onclick: () => openAISettings(state.ai.engine)}, t('fixInSettings')),
        h('button', {class: 'text-btn', type: 'button', onclick: () => {
          assist.setup = true;
          paintAssist();
        }}, t('chooseEngine'))),
      download && h('p', {class: 'choice-note'})].filter(Boolean));
  });
  return card;
};
// a request typed before the assistant was on runs once it is
const PENDING = 'assist.pending';
const rememberPending = () => {
  const q = $('assist-input').value.trim();
  if (q) {
    chrome.storage.session.set({[PENDING]: q}).catch(() => {});
  }
};
const runPending = async () => {
  const {[PENDING]: q} = await chrome.storage.session.get(PENDING).catch(() => ({}));
  if (q && aiOn() && state.ai.ok) {
    chrome.storage.session.remove(PENDING);
    if (!assist.open) {
      await openAssist();
    }
    ask(q);
  }
};

// one turn: what was asked, and what came of it
const turnEl = turn => h('article', {class: 'turn', 'data-id': turn.id},
  h('p', {class: 'q'}, turn.q),
  h('div', {class: 'a'},
    turn.title && h('p', {class: 'what'}, turn.title),
    statusEl(turn),
    turn.broader && turn.status !== 'search' && h('p', {class: 'broader'}, icon('search'), t('searchedBroader', shownQuery(turn.broader))),
    turn.text && answerEl(turn),
    turn.email && emailEl(turn),
    turn.mail?.length > 0 && foundEl(turn),
    turn.status === 'done' && turn.empty && emptyEl(turn),
    turn.error && errorEl(turn),
    turn.status === 'stopped' && h('button', {class: 'text-btn', type: 'button', onclick: () => run(turn)}, icon('refresh'), t('askAgain'))));
const STATUS = {plan: 'thinking', search: 'searchingMail', read: 'readingMail', write: 'writing', answer: 'answering'};
const statusEl = turn => STATUS[turn.status] && h('p', {class: 'status', role: 'status'},
  h('span', {class: 'dots', 'aria-hidden': 'true'}, h('span', {}), h('span', {}), h('span', {})),
  turn.status === 'search' && (turn.searched || turn.query) ? t('searchingFor', shownQuery(turn.searched || turn.query)) : t(STATUS[turn.status]));
// the answer: its lines that start with "- " a list, each [n] the mail it cites, which a click opens
const cited = (text, mail, open) => String(text).split(/(\[\d{1,3}\])/).map(part => {
  const n = /^\[(\d{1,3})\]$/.exec(part)?.[1];
  const m = n && mail?.[n - 1];
  return !n ? part : m && open ? h('button', {class: 'cite', type: 'button', title: m.from + ' — ' + (m.title || t('noSubject')),
    onclick: () => open(m)}, n) : h('span', {class: 'cite'}, n);
});
// a line's sentences, those whose numbers no mail has (doubtful) shown as unchecked
const sentences = (line, mail, open, doubtful) => {
  if (!doubtful?.length) {
    return cited(line, mail, open);
  }
  const doubt = new Set(doubtful.map(s => s.trim()));
  return line.split(/(?<=[.!?。！？])\s+(?=\S)/).flatMap((s, i) => [i ? ' ' : '',
    doubt.has(s.trim()) ? h('span', {class: 'doubt', title: t('unverified')}, ...cited(s, mail, open)) : cited(s, mail, open)].flat());
};
const richText = (text, mail, open, doubtful) => {
  const out = [];
  let list = null;
  for (const line of String(text).split('\n')) {
    const item = /^\s*[-•*]\s+(.*)$/.exec(line);
    if (item) {
      list = list || out[out.push(h('ul', {})) - 1];
      list.append(h('li', {}, ...sentences(item[1], mail, open, doubtful)));
    }
    else if (line.trim()) {
      list = null;
      out.push(h('p', {}, ...sentences(line, mail, open, doubtful)));
    }
    else {
      list = null;
    }
  }
  return out;
};
const answerEl = turn => h('div', {class: 'answer'}, ...richText(turn.text, turn.mail, m => openRef(turn, m), turn.doubtful));
// what can be done with the mail found, from a click only, with the list's own Undo: mark it read
// and archive it, and delete it or be reminded of it when that is what the request asked
const ACTS = {
  read: {cmd: 'rd', icon: 'readAll', label: 'markAllRead', has: ({m}) => m.unread},
  archive: {cmd: 'rc_^i', icon: 'archive', label: 'archiveAll', has: ({o}) => can(o, 'archive')},
  delete: {cmd: 'tr', icon: 'trash', label: 'deleteAll', has: () => true},
  later: {cmd: 'remind', icon: 'clock', label: 'remind', has: () => true}
};
// the turn drawn again while what was done to its mail may still be undone
const followActs = turn => {
  const sig = () => turn.mail.map(m => state.hidden.has(here(m)?.m.link)).join();
  let last = sig();
  let ticks = 0;
  const tick = () => {
    const now = sig();
    if (now !== last) {
      last = now;
      paintTurn(turn);
    }
    if ((ticks += 1) < 60 && assist.turns.includes(turn)) {
      setTimeout(tick, 250);
    }
  };
  setTimeout(tick, 250);
};
const actsEl = turn => {
  const mail = turn.mail.map(here).filter(x => x && !state.hidden.has(x.m.link));
  const kinds = ['read', 'archive', 'delete', 'later'].filter(k => k === turn.op || (['read', 'archive'].includes(k) && turn.action === 'find'));
  // the one the request asked first
  kinds.sort((a, b) => (b === turn.op) - (a === turn.op));
  const buttons = kinds.map(k => {
    const links = mail.filter(ACTS[k].has).map(x => x.m.link);
    return links.length > 0 && h('button', {
      'class': (k === turn.op ? 'primary-btn' : 'text-btn') + (k === 'delete' ? ' danger' : ''),
      'type': 'button',
      'data-focus': 'act:' + turn.id + ':' + k,
      'onclick': ev => {
        if (k === 'later') {
          // the reminder names each mail by its line, which the list may not have
          mail.filter(x => links.includes(x.m.link) && !state.rows.has(x.m.link)).forEach(x => state.rows.set(x.m.link, {e: entryOf(x.m), o: x.o}));
          remindMenu(ev.currentTarget, links);
        }
        else {
          act(ACTS[k].cmd, links);
          paintTurn(turn);
        }
        followActs(turn);
      }
    }, icon(ACTS[k].icon), t(ACTS[k].label), h('span', {class: 'count'}, links.length));
  }).filter(Boolean);
  return buttons.length > 0 && h('div', {class: 'found-acts'}, ...buttons);
};
const foundEl = turn => {
  const cited = new Set(turn.cites || []);
  const list = h('div', {class: 'found-list'}, turn.mail.map((m, i) => h('button', {
    'class': 'ref' + (cited.has(i + 1) ? ' cited' : '') + (m.unread ? '' : ' seen') + (state.hidden.has(here(m)?.m.link) ? ' done' : ''),
    'type': 'button',
    'data-focus': 'ref:' + m.link,
    'onclick': () => openRef(turn, m)
  },
  h('span', {class: 'n'}, i + 1),
  h('span', {class: 'ref-from'}, m.from),
  h('span', {class: 'ref-when'}, when(m.date)),
  h('span', {class: 'ref-subject'}, m.title || t('noSubject')),
  // who waits for a reply says why; other mail, its preview
  m.why ? h('span', {class: 'ref-snippet ref-why'}, icon('reply'), m.why) : h('span', {class: 'ref-snippet'}, m.snippet))));
  // an answer shows its sources folded; a search shows what it found
  const open = turn.action !== 'answer' && turn.action !== 'brief';
  const query = turn.searched || turn.query;
  return h('div', {class: 'found-wrap'},
    h('details', {class: 'found', open},
      h('summary', {}, icon('down'), t(turn.action === 'brief' ? 'readUnread' : turn.action === 'replies' ? 'replyShown' : 'foundMail', turn.mail.length)),
      list,
      query && h('button', {class: 'text-btn', type: 'button', onclick: () => searchGmail(query)}, icon('open'), t('searchInGmail'))),
    actsEl(turn));
};
// Gmail's own search of the first Gmail mailbox, with this query
const searchGmail = q => {
  const o = view().find(x => !serviceOf(x));
  o && openUrl(searchUrl(o, q));
};
// the search, in the panel's own search field, to change and search again
const editSearch = q => {
  closeAssist();
  openSearch();
  const input = $('search-input');
  input.value = q;
  input.setSelectionRange(q.length, q.length);
};
// No mail: the search as planned, the way to change it, and Gmail's own search. Gmail that did
// not answer at all is said so, with its sign-in, instead of "nothing found".
const emptyEl = turn => {
  const query = turn.query;
  const first = view().find(o => !serviceOf(o));
  return h('div', {class: 'found-empty', ...(turn.failed ? {role: 'alert'} : {})},
    h('p', {}, turn.failed ? t('searchFailed') : turn.action === 'brief' ? t('nothingUnread') : turn.action === 'replies' ? t('nobodyWaits') : t('nothingFound')),
    query && !turn.failed && h('p', {class: 'found-query'}, shownQuery(query)),
    h('div', {class: 'row-btns'}, ...(turn.failed ? [
      first && h('button', {class: 'primary-btn', type: 'button', onclick: () => openUrl(signInUrl(first.xml.title))}, icon('open'), t('signInAgain')),
      h('button', {class: 'text-btn', type: 'button', onclick: () => run(turn)}, icon('refresh'), t('tryAgain'))
    ] : query ? [
      h('button', {class: 'text-btn', type: 'button', onclick: () => editSearch(shownQuery(query))}, icon('search'), t('editSearch')),
      first && h('button', {class: 'text-btn', type: 'button', onclick: () => searchGmail(query)}, icon('open'), t('searchInGmail'))
    ] : []).filter(Boolean)));
};
// a new mail: who, what and the text, all to change before it opens in the mail service
const emailEl = turn => {
  const e = turn.email;
  const gmails = view().filter(o => !serviceOf(o)).filter((o, i, l) => l.findIndex(x => x.xml.title === o.xml.title) === i);
  const from = gmails.find(o => o.xml.title === e.from) || composeFrom(gmails.length ? gmails : view());
  const keep = (field, el) => el.addEventListener('input', () => {
    e[field] = el.value;
    saveTurns();
  });
  const to = h('input', {type: 'email', value: e.to || '', placeholder: t('toPlaceholder'), 'aria-label': t('toLabel')});
  const subject = h('input', {type: 'text', value: e.subject || '', 'aria-label': t('subject')});
  const text = h('textarea', {value: e.body || '', rows: 8, 'aria-label': t('emailBody')});
  [['to', to], ['subject', subject], ['body', text]].forEach(([f, el]) => keep(f, el));
  const busy = turn.status === 'write';
  return h('div', {class: 'email' + (busy ? ' busy' : '')},
    gmails.length > 1 && h('label', {class: 'field'}, h('span', {}, t('from')),
      h('select', {onchange: ev => {
        e.from = ev.target.value;
        saveTurns();
      }}, gmails.map(o => h('option', {value: o.xml.title, selected: o === from}, o.xml.title)))),
    h('label', {class: 'field'}, h('span', {}, t('toLabel')), to),
    h('label', {class: 'field'}, h('span', {}, t('subject')), subject),
    text,
    !busy && h('div', {class: 'row-btns'},
      h('button', {class: 'primary-btn', type: 'button', onclick: () => sendEmail(e, from)}, icon('open'), serviceOf(from) ? t('openIn', serviceOf(from).name) : t('openInGmail')),
      h('button', {class: 'text-btn', type: 'button', onclick: ev => copyText(e.body, ev.currentTarget)}, icon('copy'), t('copyText')),
      h('button', {class: 'text-btn', type: 'button', onclick: () => run(turn)}, icon('refresh'), t('regenerate'))));
};
// Gmail's compose window takes the address, the subject and the text; another service's takes
// what it can, the text then waiting in the clipboard
const composeWith = (o, {to = '', subject = '', body = ''}) => {
  const s = serviceOf(o);
  if (s) {
    return s.compose(to, subject) || composeUrl(o);
  }
  return `https://mail.google.com/mail/u/${userOf(o.xml.link)}/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
const sendEmail = (e, o) => {
  if (serviceOf(o)) {
    navigator.clipboard.writeText(e.body || '').catch(() => {});
  }
  openUrl(composeWith(o, e));
};
const copyText = (text, el) => navigator.clipboard.writeText(text || '').then(() => {
  el.classList.add('copied');
  el.firstChild?.replaceWith(icon('done'));
  setTimeout(() => {
    el.classList.remove('copied');
    el.firstChild?.replaceWith(icon('copy'));
  }, 1200);
}, () => toast(t('copyFailed'), true));
const errorEl = turn => h('div', {class: 'ai-error', role: 'alert'},
  h('p', {}, turn.error.message || t('actionFailed')),
  h('div', {class: 'row-btns'}, ...errorActions(turn.error, () => run(turn))));
// ChatGPT's usage page; the pause after the limit lets go, so the next request tries again
const manageUsage = () => {
  self.AI?.chatgpt?.resume?.();
  openUrl(self.AI?.chatgpt?.usage || USAGE);
};
// what an error lets the user do about it
const errorActions = (err, again) => [
  err.code === 'limit' && h('button', {class: 'primary-btn', type: 'button', onclick: manageUsage}, t('manageUsage')),
  ['auth', 'no-access', 'signed-out', 'model', 'no-plan', 'unavailable', 'quota'].includes(err.code) &&
    h('button', {class: err.code === 'limit' ? 'text-btn' : 'primary-btn', type: 'button', onclick: () => openAISettings(state.ai.engine)}, t('aiSettings')),
  !['auth', 'no-access', 'signed-out', 'no-plan', 'limit'].includes(err.code) &&
    h('button', {class: 'text-btn', type: 'button', onclick: again}, icon('refresh'), t('tryAgain'))
].filter(Boolean);

// a mail the assistant found, opened in the reader; J and K walk the ones it found
const openRef = (turn, m) => {
  const at = here(m);
  if (!at) {
    toast(t('mailGone'), true);
    return;
  }
  const trail = new Map(turn.mail.map(here).filter(Boolean).map(x => [x.m.link, {e: entryOf(x.m), o: x.o}]));
  const {e} = trail.get(at.m.link);
  if (!can(at.o, 'body')) {
    openEntry(e, at.o);
    return;
  }
  read(e, at.o, trail);
};

// Every Gmail account searched at once, and the other services' unread mail by its words: the
// mail found, newest first; failed when no Gmail account answered at all
const searchAll = async (query, words, signal) => {
  const objs = view();
  const gmails = objs.filter(o => !serviceOf(o)).filter((o, i, l) => l.findIndex(x => x.xml.title === o.xml.title) === i);
  const answers = await Promise.all(gmails.map(o => searchIn(o, query).then(list => ({o, list}))));
  if (signal.aborted) {
    return {found: [], failed: false};
  }
  const found = answers.flatMap(({o, list}) => (list || []).map(e => ({e, o})));
  const needles = words.map(w => w.toLowerCase()).filter(w => w.length > 1);
  const other = needles.length ? shownMail(objs.filter(o => serviceOf(o))).filter(({e}) => {
    const hay = [e.author_name, e.author_email, e.title, e.summary].join(' ').toLowerCase();
    return needles.some(w => hay.includes(w));
  }) : [];
  const seen = new Set();
  return {
    found: [...found, ...other].filter(({e, o}) => {
      const k = o.xml.title + '|' + thread(e.link);
      return !seen.has(k) && seen.add(k);
    }).sort((a, b) => (Date.parse(b.e.modified) || 0) - (Date.parse(a.e.modified) || 0)).slice(0, FOUND_MAX),
    failed: gmails.length > 0 && answers.every(a => !a.list) && !other.length
  };
};
// A found Gmail thread's text for an answer: its last three messages, the newest first, each
// with who and when (the HTML, which ai.js reads as text with its lines)
const threadText = node => {
  const cards = [...node.querySelectorAll?.('details.msg') || []];
  if (!cards.length) {
    return node.innerHTML ?? String(node.textContent || '');
  }
  return cards.slice(-3).reverse().map((d, i) => {
    const who = d.querySelector(':scope > summary .who')?.textContent.trim() || '';
    const date = d.querySelector(':scope > summary .date')?.textContent.trim() || '';
    return `<p>[${i ? 'An earlier message' : 'The newest message'}${who ? ', from ' + who : ''}${date ? ', ' + date : ''}]</p>` +
      [...d.children].filter(c => c.tagName !== 'SUMMARY').map(c => c.innerHTML).join('<br>');
  }).join('<hr>');
};
// The text of the found mail for an answer: up to the first `upTo` whole (kept in `whole` for a
// second answer), the rest by their preview. A mail of another service is never fetched: that
// might count it as read.
const textsOf = (refs, signal, upTo, whole = new Map()) => Promise.all(refs.map(async (m, i) => {
  const at = here(m);
  let text = whole.get(m.link) || m.snippet;
  if (i < upTo && at && !serviceOf(at.o) && !whole.has(m.link) && !signal.aborted) {
    try {
      const node = await Promise.race([gmail.body(at.m.link, true, m.date), new Promise((_, no) => setTimeout(no, READ_MS))]);
      text = (node && threadText(node)) || text;
      whole.set(m.link, text);
    }
    catch (e) {}
  }
  return {from: m.from + (m.email && m.email !== m.from ? ` <${m.email}>` : ''), date: m.date, subject: m.title, text,
    ...(m.flags ? {flags: m.flags} : {})};
}));
// how the sorting saw a mail, for the brief: "waits for your reply (asks for the file) | important"
const flagsOf = (e, o) => {
  const v = replyOf(e, o);
  return v ? [v.reply && 'waits for your reply' + (v.why ? ` (${v.why})` : ''), v.important && 'important', v.bulk && 'newsletter or promotion']
    .filter(Boolean).join(' | ') : '';
};

const paintTurn = turn => {
  const el = $('assist-body').querySelector(`.turn[data-id="${CSS.escape(turn.id)}"]`);
  if (!el) {
    paintAssist();
    return;
  }
  // a field being typed in keeps its caret
  if (el.contains(document.activeElement) && document.activeElement.matches('input, textarea, select')) {
    return;
  }
  const body = $('assist-body');
  const bottom = body.scrollHeight - body.scrollTop - body.clientHeight < 40;
  const focus = el.contains(document.activeElement) ? document.activeElement.dataset.focus : '';
  el.replaceWith(turnEl(turn));
  if (focus) {
    body.querySelector(`[data-focus="${CSS.escape(focus)}"]`)?.focus({preventScroll: true});
  }
  if (bottom) {
    body.scrollTop = body.scrollHeight;
  }
};
// plan: what a suggestion already knows, which needs no model to plan it
const ask = (question, plan = null) => {
  question = String(question || '').trim();
  if (!question) {
    return;
  }
  if (!aiOn() || !state.ai.ok) {
    $('assist-input').value = question;
    rememberPending();
    assist.setup = !aiOn();
    paintAssist();
    return;
  }
  const turn = {id: Math.random().toString(36).slice(2), q: question, status: 'plan', title: '', action: '', query: '', terms: '', since: '', until: '',
    words: [], op: '', text: '', cites: [], doubtful: [], mail: [], email: null, error: null, ...plan};
  assist.turns.push(turn);
  assist.turns = assist.turns.slice(-TURNS_MAX);
  $('assist-input').value = '';
  sizeInput();
  paintAssist();
  run(turn);
};
// what the next request is told of a turn: what was asked and searched, and how much was found
const previousOf = turn => turn && turn.status === 'done' && turn.action ? {q: turn.q, action: turn.action === 'replies' ? 'find' : turn.action,
  query: turn.query, terms: turn.terms, since: turn.since, until: turn.until, title: turn.title, found: turn.mail?.length || 0} : null;
/*
 * A turn, run or run again. The plan (or the one a suggestion carries) says what to do: find
 * mail, broadening the search step by step while it finds nothing; answer from it, reading more of
 * it once when the first answer says the mail does not tell; sum up the unread mail; list who
 * waits for a reply, as the sorting has it; or write a new mail. A request about the mail found
 * before ("summarize them", "archive these") uses that mail and searches nothing.
 */
// each turn's run underway: one run again replaces it
const runs = new WeakMap();
const run = async turn => {
  assist.ctl?.abort();
  const ctl = assist.ctl = new AbortController();
  runs.set(turn, ctl);
  const {signal} = ctl;
  Object.assign(turn, {status: 'plan', text: '', cites: [], doubtful: [], error: null, reading: 0, empty: false, failed: false, broader: '', searched: ''});
  if (turn.action !== 'write') {
    turn.email = null;
  }
  paintTurn(turn);
  paintSend();
  const live = () => !signal.aborted && assist.turns.includes(turn);
  const before = assist.turns[assist.turns.indexOf(turn) - 1];
  try {
    const AI = await loadAI();
    if (!AI) {
      throw Error(t('actionFailed'));
    }
    if (!turn.action) {
      const subjects = shownMail(view()).map(({e}) => e.title || '');
      const plan = await AI.plan({request: turn.q, previous: previousOf(before), subjects, signal});
      Object.assign(turn, {action: plan.action, scope: plan.scope || 'new', query: plan.query || '', terms: plan.terms || '', since: plan.since || '',
        until: plan.until || '', words: plan.words || [], op: plan.op || '', title: plan.title || ''});
    }
    if (!live()) {
      return;
    }
    // who waits for a reply, with no sorting to tell: what is new and important instead
    if (turn.action === 'replies' && !state.ai.reply) {
      turn.action = 'brief';
    }
    if (turn.action === 'write') {
      turn.status = 'write';
      turn.email = {to: '', subject: '', body: '', from: turn.email?.from || ''};
      paintTurn(turn);
      const from = turn.email.from;
      const e = await AI.compose({request: turn.q, signal, onUpdate: x => {
        turn.email = {...x, from};
        paintTurn(turn);
      }});
      turn.email = {to: e.to, subject: e.subject, body: e.body, from};
    }
    else {
      const newest = (a, b) => (Date.parse(b.e.modified) || 0) - (Date.parse(a.e.modified) || 0);
      let refs;
      if (turn.scope === 'previous' && before?.mail?.length) {
        refs = before.mail.map(m => ({...m}));
        Object.assign(turn, {query: before.query, terms: before.terms, since: before.since, until: before.until});
      }
      else if (turn.action === 'replies') {
        turn.status = 'read';
        paintTurn(turn);
        await sorted();
        refs = shownMail(view()).filter(({e, o}) => SORTS.reply.has(replyOf(e, o))).sort(newest).map(({e, o}) => ({...refOf(e, o), why: replyOf(e, o).why}));
        if (!refs.length && state.replyError) {
          throw state.replyError;
        }
      }
      else if (turn.action === 'brief') {
        refs = shownMail(view()).filter(({e}) => e.unread !== false).sort(newest).slice(0, briefMax())
          .map(({e, o}) => ({...refOf(e, o), flags: flagsOf(e, o)}));
      }
      else {
        // the planned search, then broader ones while nothing is found
        turn.status = 'search';
        const ladder = turn.query ? AI.broaden?.(turn.query, turn.words) || [turn.query] : [];
        let got = {found: [], failed: false};
        for (const q of ladder) {
          turn.searched = q;
          paintTurn(turn);
          got = await searchAll(q, turn.words, signal);
          if (!live() || got.failed || got.found.length) {
            break;
          }
        }
        turn.broader = got.found.length && turn.searched !== ladder[0] ? turn.searched : '';
        turn.failed = got.failed;
        refs = got.found.map(({e, o}) => refOf(e, o));
      }
      if (!live()) {
        return;
      }
      turn.mail = refs;
      turn.empty = !refs.length;
      // nothing to read from, or a list to see: no request for it
      if (refs.length && ['answer', 'brief'].includes(turn.action)) {
        turn.status = 'read';
        paintTurn(turn);
        const texts = new Map();
        const whole = turn.action === 'brief' ? 0 : readWhole();
        const history = before?.text && ['answer', 'brief'].includes(before.action) ? {q: before.q, a: before.text} : null;
        const answer = async upTo => {
          const mail = await textsOf(refs, signal, upTo, texts);
          if (!live()) {
            return null;
          }
          turn.status = 'answer';
          paintTurn(turn);
          return AI.answer({question: turn.q, mail, words: turn.words, history, signal, onUpdate: text => {
            turn.text = text;
            paintTurn(turn);
          }});
        };
        let a = await answer(whole);
        // the mail read whole did not tell: the next few read whole too, and asked once more
        if (a?.notFound && whole && refs.length > whole) {
          turn.status = 'read';
          paintTurn(turn);
          a = await answer(whole * 2);
        }
        if (!a || !live()) {
          return;
        }
        const [text] = a.notFound ? [t('notInMail')] : await inUI([a.text], a.lang);
        Object.assign(turn, {text, cites: a.notFound ? [] : a.cites, doubtful: a.notFound || a.lang ? [] : a.doubtful || [],
          notFound: Boolean(a.notFound)});
      }
    }
    turn.status = 'done';
  }
  catch (err) {
    if (!live() || err?.code === 'aborted') {
      if (assist.turns.includes(turn) && turn.status !== 'done') {
        turn.status = 'stopped';
      }
    }
    else {
      turn.status = 'error';
      turn.error = {code: err?.code || '', message: err?.message || t('actionFailed')};
    }
  }
  finally {
    if (assist.ctl === ctl) {
      assist.ctl = null;
    }
    // stopped while it read or searched, which do not stop for the signal; unless run again since
    if (runs.get(turn) === ctl && STATUS[turn.status]) {
      turn.status = 'stopped';
    }
    saveTurns();
    if (assist.turns.includes(turn)) {
      paintTurn(turn);
    }
    paintSend();
  }
};

/* keyboard: layout independent, so it works with the Russian layout too */
// Alt+↑/↓ moves the mailbox of the focused line, the keyboard's way to drag it
const moveMailbox = (key, step) => {
  const keys = view().map(accountName);
  const i = keys.indexOf(key);
  const j = i + step;
  if (i === -1 || j < 0 || j >= keys.length) {
    return;
  }
  [keys[i], keys[j]] = [keys[j], keys[i]];
  state.order = keys;
  chrome.storage.local.set({accountOrder: keys});
  const focused = document.activeElement;
  render();
  // the same line keeps the focus after the list is drawn again
  (focused?.dataset.link ? $('list').querySelector(`.row[data-link="${CSS.escape(focused.dataset.link)}"]`) :
    $('list').querySelector(`.acc[data-key="${CSS.escape(key)}"]`))?.focus();
};
const onKey = ev => {
  // the keys' sheet over the panel: Esc or ? closes it, Tab stays in it, the rest waits
  if ($('sheet')) {
    if (ev.code === 'Escape' || isQuestion(ev)) {
      ev.preventDefault();
      closeSheet();
    }
    // Tab goes round what it has (the keys' close button, a dialog's field and buttons)
    else if (ev.code === 'Tab') {
      ev.preventDefault();
      const all = [...$('sheet').querySelectorAll('button, input')].filter(el => !el.disabled);
      all[(all.indexOf(document.activeElement) + (ev.shiftKey ? -1 : 1) + all.length) % all.length]?.focus();
    }
    return;
  }
  if (ev.altKey && !ev.metaKey && !ev.ctrlKey && (ev.code === 'ArrowUp' || ev.code === 'ArrowDown') && !state.reading) {
    const key = document.activeElement?.closest?.('[data-key]')?.dataset.key;
    if (key) {
      ev.preventDefault();
      moveMailbox(key, ev.code === 'ArrowUp' ? -1 : 1);
    }
    return;
  }
  if (ev.metaKey || ev.ctrlKey || ev.altKey) {
    return;
  }
  // a mailbox line of the caught-up list opens with Enter like a click
  if (ev.code === 'Enter' && document.activeElement?.classList.contains('acc')) {
    document.activeElement.click();
    ev.preventDefault();
    return;
  }
  // the search field takes its keys; Esc there is the field's own
  if (ev.target.closest?.('input, textarea')) {
    return;
  }
  const menu = $('menu');
  if (menu) {
    const items = [...menu.querySelectorAll('[role="menuitem"]:not([hidden])')];
    const i = items.indexOf(document.activeElement);
    // an item's own key: 1-4 for the times, ! and O under ⋯
    const keyed = items.find(b => b.dataset.key === pressed(ev));
    // the labels' field: what is typed on an item goes there, and ↑ from the first item too
    const field = menu.querySelector('.menu-filter input');
    if (ev.code === 'Escape') {
      closeMenu(true);
    }
    else if (field && (ev.key.length === 1 || (ev.code === 'ArrowUp' && i <= 0))) {
      field.focus();
      if (ev.key.length === 1) {
        return;
      }
    }
    else if (items.length && (ev.code === 'ArrowDown' || ev.code === 'KeyJ')) {
      items[Math.min(items.length - 1, i + 1)].focus();
    }
    else if (items.length && (ev.code === 'ArrowUp' || ev.code === 'KeyK')) {
      items[Math.max(0, i - 1)].focus();
    }
    else if (keyed) {
      keyed.click();
    }
    else {
      return;
    }
    ev.preventDefault();
    return;
  }
  const rowEl = document.activeElement?.closest?.('.row');
  const target = state.reading || (rowEl && state.rows.get(rowEl.dataset.link));
  const move = step => {
    const rows = [...document.querySelectorAll('.row')];
    const next = rows[Math.min(rows.length - 1, Math.max(0, rows.indexOf(rowEl) + step))];
    next?.focus();
    next?.scrollIntoView({block: 'nearest'});
  };
  const run = cmd => {
    if (target && allowed(cmd, target.o)) {
      if (state.reading) {
        actFromReader(cmd, target.e);
      }
      else {
        act(cmd, [target.e.link]);
      }
    }
  };

  if (ev.code === 'Escape' && state.reading) {
    back();
  }
  else if (ev.code === 'Escape' && assist.open) {
    closeAssist();
  }
  else if (ev.code === 'Escape' && state.search) {
    closeSearch();
  }
  else if (ev.code === 'Escape' && (state.siteOnly || state.sortOnly)) {
    state.siteOnly = false;
    state.sortOnly = null;
    state.focus = FIRST;
    render();
  }
  // the summary of the open mail
  else if (ev.code === 'KeyI' && state.reading && showAI() && can(state.reading.o, 'body') && !(aiOn() && state.ai.summary === 'off')) {
    toggleSummary();
  }
  // the assistant; in the reader, a question about the open mail
  else if (ev.code === 'KeyA' && showAI()) {
    if (state.reading) {
      can(state.reading.o, 'body') && openTool(state.reading, 'ask');
    }
    else if (!assist.open) {
      openAssist();
    }
    else {
      return;
    }
  }
  else if (ev.code === 'KeyZ' && state.pending) {
    undo();
  }
  else if (ev.code === 'KeyS' && state.reading) {
    $('reader-bar').querySelector('.star')?.click();
  }
  else if (ev.code === 'KeyB' && target) {
    const anchor = (state.reading ? $('reader-bar') : rowEl).querySelector('.remind');
    remindMenu(anchor, [target.e.link]);
  }
  // Gmail's own keys: U marks unread, L labels, V moves to a label
  else if (ev.code === 'KeyU' && target && !serviceOf(target.o)) {
    markUnread(target.e, target.o);
  }
  else if ((ev.code === 'KeyL' || ev.code === 'KeyV') && target && !serviceOf(target.o) && LABELS) {
    const anchor = state.reading ? $('reader-bar').querySelector('.more-acts') : rowEl.querySelector('.remind');
    labelMenu(anchor, target.e, target.o, ev.code === 'KeyV' ? 'move' : 'label');
  }
  else if (isQuestion(ev)) {
    openSheet();
  }
  else if (ev.code === 'Slash' && !state.reading) {
    openSearch();
  }
  // The one-time code of the open mail, or of the focused line; a line without one leaves C to
  // the code of the site's block. The reader, over the block, copies its mail's code only.
  else if (ev.code === 'KeyC' && (target || !state.reading)) {
    const code = state.reading ? state.reading.code : target && codeOf(target.e.title + ' ' + target.e.summary);
    const site = !state.reading && $('list').querySelector(':scope > .site .site-code');
    if (code) {
      copyCode(code, (state.reading ? $('reader-subject') : rowEl).querySelector('.code'));
    }
    else if (site) {
      site.click();
    }
    else {
      return;
    }
  }
  // in the reader J and K go to the next and the previous mail; the arrows scroll the message
  else if (state.reading && (ev.code === 'KeyJ' || ev.code === 'KeyK')) {
    stepReader(ev.code === 'KeyJ' ? 1 : -1);
  }
  else if (state.reading && ['ArrowDown', 'ArrowUp', 'Enter'].includes(ev.code)) {
    return;
  }
  else if (ev.code === 'ArrowDown' || ev.code === 'KeyJ') {
    move(1);
  }
  else if (ev.code === 'ArrowUp' || ev.code === 'KeyK') {
    move(-1);
  }
  else if (ev.code === 'Enter' && rowEl && rowEl === document.activeElement) {
    // as a click: a mail the panel cannot read opens on its site
    if (can(target.o, 'body')) {
      read(target.e, target.o);
    }
    else {
      openEntry(target.e, target.o, ev);
    }
  }
  else if (ev.code === 'KeyO' && target) {
    openEntry(target.e, target.o, ev);
  }
  else if (ev.code === 'KeyE') {
    run('rc_^i');
  }
  else if (ev.code === 'KeyR') {
    run('rd');
  }
  else if (ev.code === 'Delete' || ev.code === 'Backspace' || (ev.code === 'Digit3' && ev.shiftKey)) {
    run('tr');
  }
  else if (ev.code === 'Digit1' && ev.shiftKey) {
    run('sp');
  }
  else {
    return;
  }
  ev.preventDefault();
};
document.addEventListener('keydown', onKey);
// a click into the message moves the focus into its frame; the keys have to work there too
frameReady.then(doc => doc.addEventListener('keydown', onKey));

/* search field: built once, so typing survives every render */
{
  const input = $('search-input');
  input.placeholder = t('searchPlaceholder');
  $('search').prepend(icon('search'));
  // the words typed, asked of the assistant instead: a question, or a search in plain words
  const askAI = h('button', {'class': 'ask-ai', 'type': 'button', 'data-focus': 'askAI', 'data-tip': t('askAITip'), 'onclick': () => openAssist({question: input.value.trim(), run: true})},
    icon('sparkle'), t('askAI'));
  $('search').append(askAI, btn('close', t('closeSearch'), closeSearch, '', 'Esc'));
  $('search').addEventListener('submit', ev => {
    ev.preventDefault();
    runSearch(input.value);
  });
  // each word typed narrows the list (typeSearch); IME text counts once it is written
  input.addEventListener('input', ev => !ev.isComposing && typeSearch(input.value));
  input.addEventListener('compositionend', () => typeSearch(input.value));
  input.addEventListener('keydown', ev => {
    if (ev.code === 'Escape') {
      ev.preventDefault();
      closeSearch();
    }
    // down from the field into what it found
    else if (ev.code === 'ArrowDown' && !ev.isComposing) {
      const first = $('list').querySelector('.search-all, .row');
      if (first) {
        ev.preventDefault();
        first.focus();
      }
    }
  });
}

/* the assistant's field: Enter asks, Shift+Enter starts a new line, Esc goes back */
{
  const input = $('assist-input');
  input.placeholder = t('assistPlaceholder');
  input.addEventListener('input', sizeInput);
  input.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) {
      ev.preventDefault();
      if (!assist.ctl) {
        ask(input.value);
      }
    }
    else if (ev.key === 'Escape') {
      ev.preventDefault();
      closeAssist();
    }
  });
  $('assist-ask').addEventListener('submit', ev => {
    ev.preventDefault();
    if (assist.ctl) {
      assist.ctl.abort();
    }
    else {
      ask(input.value);
    }
  });
}

/* background */
chrome.runtime.onMessage.addListener(request => {
  // an update without data is a page asking the background for a check, not a list
  if ((request.method === 'update' || request.method === 'update-reset' || request.method === 'update-date') && Array.isArray(request.data)) {
    stopSpin();
    update(request.data);
  }
  else if (request.method === 'close-popup' && !SIDE) {
    window.close();
  }
});

document.documentElement.lang = LANG;
document.documentElement.dir = chrome.i18n.getMessage('@@bidi_dir') || 'ltr';
document.documentElement.classList.toggle('side', SIDE);
for (const el of document.querySelectorAll('[data-i18n]')) {
  el.textContent = t(el.dataset.i18n);
}
for (const el of document.querySelectorAll('[data-i18n-label]')) {
  el.setAttribute(el.tagName === 'IFRAME' ? 'title' : 'aria-label', t(el.dataset.i18nLabel));
}

/* settings the panel follows: text size, read on open, the addresses seen so far, their order */
const prefsChanged = prefs => {
  if ('panelScale' in prefs) {
    const scale = Number(prefs.panelScale) || 1;
    document.documentElement.style.zoom = scale === 1 ? '' : scale;
    document.documentElement.style.setProperty('--zoom', scale);
  }
  if ('readOnOpen' in prefs) {
    state.readOnOpen = prefs.readOnOpen === true;
  }
  if ('accounts' in prefs) {
    state.accounts = prefs.accounts || {};
  }
  if ('accountOrder' in prefs) {
    state.order = prefs.accountOrder || [];
  }
  if ('senderLogos' in prefs) {
    state.senderLogos = prefs.senderLogos !== false;
  }
  if ('askPictures' in prefs) {
    state.askPictures = prefs.askPictures === true;
  }
  if ('avatars' in prefs) {
    state.avatars = prefs.avatars || {};
  }
  if ('autoAdvance' in prefs) {
    state.autoAdvance = prefs.autoAdvance === true;
  }
  if ('badge.count' in prefs) {
    state.badgeNew = prefs['badge.count'] === 'new';
  }
  if ('ai.engine' in prefs) {
    state.ai.engine = ENGINES.includes(prefs['ai.engine']) ? prefs['ai.engine'] : 'off';
  }
  if ('labels.beta' in prefs) {
    LABELS = prefs['labels.beta'] === true;
  }
  if ('ai.buttons' in prefs) {
    state.ai.buttons = prefs['ai.buttons'] !== false;
  }
  if ('ai.summary' in prefs) {
    state.ai.summary = ['off', 'click', 'auto'].includes(prefs['ai.summary']) ? prefs['ai.summary'] : 'click';
  }
  if ('ai.reply' in prefs) {
    state.ai.reply = prefs['ai.reply'] !== false;
  }
  if ('gmailCategories' in prefs) {
    state.categories = prefs.gmailCategories !== false;
  }
  if ('savedSearches' in prefs) {
    state.saved = (Array.isArray(prefs.savedSearches) ? prefs.savedSearches : []).filter(x => typeof x?.query === 'string')
      .map(x => ({name: typeof x.name === 'string' ? x.name : '', query: x.query, account: typeof x.account === 'string' ? x.account : ''}));
  }
  if (RATE in prefs) {
    state.rate = prefs[RATE] && typeof prefs[RATE] === 'object' ? prefs[RATE] : null;
    rateRead = true;
  }
};
// what the panel reads of Settings → AI (the keys stay with ai.js)
const AI_PREFS = {'ai.engine': 'off', 'ai.summary': 'click', 'ai.reply': true, 'ai.buttons': true};
// what changes the assistant: the engine, the features, an engine's own key, model or sign-in
// (ai.<engine>.…); not what it keeps (ai.replies, ai.summaries)
const AI_CHANGES = new RegExp(`^ai\\.((engine|summary|reply|buttons)$|(${ENGINES.join('|')})\\.)`);
// With the toolbar count at "mail since the panel was last opened", opening the panel starts it
// again, and so does a side panel coming back into view. Never a list update: the background
// sends one for the very redraw this asks for.
const markSeen = () => {
  if (state.badgeNew && document.visibilityState === 'visible') {
    chrome.storage.local.set({'badge.seen': Date.now()});
  }
};
document.addEventListener('visibilitychange', markSeen);
// a side panel stays open for days: each day it is looked at counts
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && countDay());
chrome.storage.onChanged.addListener((ps, area) => {
  const changed = Object.fromEntries(['panelScale', 'readOnOpen', 'accounts', 'accountOrder', 'senderLogos', 'askPictures', 'avatars', 'autoAdvance', 'badge.count',
    'gmailCategories', 'savedSearches', RATE].filter(k => area === 'local' && ps[k]).map(k => [k, ps[k].newValue]));
  if (Object.keys(changed).length) {
    prefsChanged(changed);
    render();
    if ('gmailCategories' in changed) {
      loadCategories();
    }
  }
  // the assistant's engine, key, model or features
  if (area === 'local' && Object.keys(ps).some(k => AI_CHANGES.test(k))) {
    prefsChanged(Object.fromEntries(Object.keys(AI_PREFS).filter(k => k in ps).map(k => [k, ps[k].newValue])));
    aiChanged();
  }
  // the background's first answer from Gmail: its list follows at once, unless no one is signed in
  if (area === 'session' && ps['accounts.count'] && state.booting) {
    setTimeout(endBoot, 1500);
  }
});
chrome.windows?.getCurrent().then(w => state.windowId = w.id);
// the page the panel opened over, and in the side panel each page after it: another tab, or
// another address in the same one
if (chrome.tabs?.query) {
  const ours = windowId => !state.windowId || windowId === state.windowId;
  chrome.tabs.onActivated?.addListener(info => ours(info.windowId) && followTab());
  chrome.tabs.onUpdated?.addListener((id, change, tab) => tab?.active && ours(tab.windowId) && (change.url || change.status === 'complete') && followTab());
  followTab();
}

// After a browser start the background may not have read the mail yet: until it has (its first
// list, or its first answer from Gmail with no one signed in), lines stand for the mail, never
// "Sign in" to someone signed in. Long enough without an answer, the panel shows what it has.
const BOOT_MS = 10000;
const endBoot = () => {
  if (state.booting) {
    state.booting = false;
    render();
  }
};
Promise.all([
  chrome.storage.local.get({panelScale: 1, readOnOpen: false, accounts: {}, accountOrder: [], senderLogos: true, askPictures: false, avatars: {}, 'labels.beta': false,
    autoAdvance: false, 'badge.count': 'all', [Remind.KEY]: [], ...AI_PREFS, gmailCategories: true, savedSearches: [], [RATE]: null}),
  // no default for the accounts: none at all is not the same as none read yet
  chrome.storage.session.get(['cached-objects', 'accounts.count', Resolved.KEY, 'logos', SAVED]),
  // the files the session knows, for the first lines to show theirs
  gmail.filesLoad()
]).then(([local, session]) => {
  prefsChanged(local);
  markSeen();
  countDay();
  Object.entries(session.logos || {}).forEach(([domain, has]) => logos.set(domain, has));
  Object.entries(session[SAVED] || {}).forEach(([key, found]) => savedFound.set(key, found));
  const cached = session['cached-objects'];
  // (an update from the background may have come first: drawn says the list was drawn)
  if (cached === undefined && session['accounts.count'] === undefined && drawn === '' && Object.keys(state.accounts).some(a => a.includes('@'))) {
    state.booting = true;
    render();
    setTimeout(endBoot, BOOT_MS);
  }
  else {
    // the background hides the mail waiting for its reminder at the next check; until then this does
    update(Resolved.apply(Resolved.apply(cached || [], session[Resolved.KEY] || []), Remind.waiting(local[Remind.KEY])));
  }
  // whether the toolbar button is pinned, once the list is up
  pinned();
  // the assistant, once the list is on screen: a frame drawn, then the next task
  if (aiOn()) {
    requestAnimationFrame(() => setTimeout(startAI));
  }
});
