// chrome.* for the welcome page under test. The query sets the scene:
//   ?accounts=some|none|many  what the session cache holds (some: two Gmail inboxes)
//   ?pin=event|poll|none      Chrome tells the pin and says when it changes (130+); tells it only
//                             when asked (91-129); cannot tell. &pinned=1 starts pinned.
//   ?side=0                   no chrome.sidePanel        ?perm=denied  notifications turned off
//   ?shortcut=none            no shortcut for the panel  ?edge=1       Microsoft Edge
// It records what the page sends (__sent), opens (__tabs), shows (__notes) and asks of the side
// panel (__side); __fire.message(), .storage() and .settings() play the background and Chrome.
(() => {
  const q = new URLSearchParams(location.search);
  const lang = q.get('lang') || 'en';
  const load = p => { const x = new XMLHttpRequest(); x.open('GET', p, false); x.send(); return JSON.parse(x.responseText); };
  const msgs = Object.assign(load('/_locales/en/messages.json'), lang === 'en' ? {} : load('/_locales/' + lang + '/messages.json'));
  const manifest = load('/manifest.json');
  const acc = (u, email, n) => ({meta: {}, newIDs: [], xml: {title: email, link: `https://mail.google.com/mail/u/${u}/#inbox`, rootLink: `https://mail.google.com/mail/u/${u}`, fullcount: n, entries: []}});
  const SOME = [acc(0, 'alex.morgan@gmail.com', 4), acc(1, 'alex@copperfield-studio.com', 0)];
  window.__accounts = {
    some: SOME,
    // a label feed of the first account comes as its own object, and one more account
    many: [...SOME, {...acc(0, 'alex.morgan@gmail.com', 2), xml: {...acc(0, 'alex.morgan@gmail.com', 2).xml, label: 'work'}}, acc(2, 'alex.family@gmail.com', 1)],
    none: []
  };
  const session = {'cached-objects': window.__accounts[q.get('accounts') || 'some'] || []};
  window.__sent = [];
  window.__tabs = [];
  window.__notes = [];
  window.__side = [];
  window.__contexts = [];
  window.__perm = q.get('perm') || 'granted';
  window.__pinned = q.get('pinned') === '1';
  const listeners = {message: [], storage: [], settings: []};
  window.__fire = {
    message: m => listeners.message.forEach(f => f(m, {})),
    storage: (changes, area = 'session') => listeners.storage.forEach(f => f(changes, area)),
    settings: change => listeners.settings.forEach(f => f(change))
  };
  // Edge says so in its brands
  if (q.get('edge') === '1') {
    Object.defineProperty(navigator, 'userAgentData', {configurable: true, value: {brands: [{brand: 'Microsoft Edge', version: '142'}]}});
  }
  const later = (cb, v) => {
    setTimeout(() => cb && cb(v), 5);
    return new Promise(r => setTimeout(() => r(v), 5));
  };
  const pin = q.get('pin') || 'event';
  window.chrome = {
    i18n: {
      getUILanguage: () => lang,
      getMessage: (k, subs = []) => {
        if (k === '@@bidi_dir') {
          return ['ar', 'he'].includes(lang) ? 'rtl' : 'ltr';
        }
        const m = msgs[k];
        return m ? m.message.replace(/\$(\d)/g, (_, i) => subs[i - 1] ?? '') : '';
      }
    },
    runtime: {
      lastError: undefined,
      getManifest: () => manifest,
      getURL: p => location.origin + p,
      sendMessage: (m, cb) => {
        window.__sent.push(m);
        return later(cb);
      },
      onMessage: {addListener: f => listeners.message.push(f)},
      getContexts: async ({contextTypes}) => window.__contexts.filter(c => contextTypes.includes(c.contextType))
    },
    storage: {
      session: {get: async defaults => Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, k in session ? session[k] : v]))},
      onChanged: {addListener: f => listeners.storage.push(f)}
    },
    action: pin === 'none' ? {} : {
      getUserSettings: () => Promise.resolve({isOnToolbar: window.__pinned}),
      ...(pin === 'event' ? {onUserSettingsChanged: {addListener: f => listeners.settings.push(f)}} : {})
    },
    ...(q.get('side') === '0' ? {} : {sidePanel: {open: o => {
      window.__side.push(o);
      return Promise.resolve();
    }}}),
    windows: {getCurrent: () => Promise.resolve({id: 1})},
    tabs: {create: o => {
      window.__tabs.push(o.url);
      return Promise.resolve({id: 9});
    }},
    commands: {getAll: () => Promise.resolve([{name: '_execute_action', shortcut: q.get('shortcut') === 'none' ? '' : 'Alt+Shift+M'}])},
    notifications: {
      clear: (id, cb) => later(cb, true),
      create: (id, o, cb) => {
        window.__notes.push({id, ...o});
        return later(cb, id);
      },
      getPermissionLevel: cb => later(cb, window.__perm)
    }
  };
})();
