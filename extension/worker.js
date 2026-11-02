/* global checkEmails, repeater, sound, offscreen, Resolved, Services */

if (typeof importScripts !== 'undefined') {
  self.importScripts('/core/utils/log.js');
  self.importScripts('/core/open.js');
  self.importScripts('/core/offscreen.js');
  self.importScripts('/core/services/yahoo.js');
  self.importScripts('/core/services/aol.js');
  self.importScripts('/core/services/proton.js');
  self.importScripts('/core/services/yandex.js');
  self.importScripts('/core/services/mailru.js');
  self.importScripts('/core/services.js');
  self.importScripts('/core/context.js');
  self.importScripts('/core/button.js');
  self.importScripts('/core/sound.js');
  self.importScripts('/core/check.js');
  self.importScripts('/core/repeater.js');
  self.importScripts('/core/watch.js');
  self.importScripts('/core/remind.js');
  self.importScripts('/core/avatars.js');
}

const toast = (message = 'Unknown Error') => chrome.notifications.create({
  type: 'basic',
  iconUrl: '/data/icons/notification/48.png',
  title: chrome.i18n.getMessage('gmail'),
  message
}, id => setTimeout(chrome.notifications.clear, 5000, id));

const onClicked = link => {
  if (link) {
    self.openLink(link);
    return;
  }
  chrome.storage.local.get({
    'url': 'https://mail.google.com/mail/u/0/',
    'smartOpen': true
  }, async prefs => {
    if (prefs.smartOpen) {
      try {
        // the mail the panel and the badge show: not the resolved or the reminded one
        const objs = await checkEmails.visible();
        if (objs && objs.length) {
          // Selected account
          const unreadEntries = [].concat([], ...objs.map(obj => obj.xml.entries));
          // selecting the correct account
          if (unreadEntries.length) {
            // newest first
            const newestEntry = unreadEntries.sort((p, c) => new Date(c.modified) - new Date(p.modified))[0];
            if (newestEntry) {
              self.checkEmails.opened(newestEntry.link);
              return self.openLink(newestEntry.link);
            }
          }
          try {
            const link = objs[0].xml.entries[0].link;
            self.checkEmails.opened(link);
            return self.openLink(link);
          }
          catch (e) {}
        }
      }
      catch (e) {}
    }
    return self.openLink(prefs.url);
  });
};

// a new user meets the welcome page: the inboxes found, the icon pinned, the panel tried; it
// links the website. An update opens nothing.
chrome.runtime.onInstalled.addListener(({reason}) => {
  if (reason === 'install') {
    chrome.tabs.create({
      url: '/data/welcome/index.html'
    });
  }
});

/*
 * Up to 1.3.3 the notification text of a few locales was broken (placeholders translated,
 * English labels), and the settings stored it as if the user had typed it. On the update the
 * stored copy of that old default goes, so the corrected default of the locale applies; a text
 * the user changed stays.
 */
{
  const OLD = {
    el: 'Από: [author_email] [break] Τίτλος: [τίτλος] [break] Περίληψη: [περίληψη]',
    he: 'התקבל מ: [שם הכותב][break]כותרת: [כותרת][break]תקציר: [תקציר]',
    ar: 'From: [author_email][break]Title: [title][break]Summary: [summary]',
    tr: 'From: [author_email][break]Title: [title][break]Summary: [summary]',
    uk: 'From: [author_email][break]Title: [title][break]Summary: [summary]',
    ja: 'From: [author_email][break] 件名: [title][break] Summary: [summary]'
  };
  chrome.runtime.onInstalled.addListener(async ({reason}) => {
    if (reason !== 'update') {
      return;
    }
    const lang = String(chrome.i18n.getUILanguage?.() || '').toLowerCase().split(/[-_]/)[0];
    // Chrome has called Hebrew both he and iw
    const old = OLD[lang === 'iw' ? 'he' : lang];
    if (!old) {
      return;
    }
    const {notificationFormat} = await chrome.storage.local.get('notificationFormat');
    if (notificationFormat === old) {
      await chrome.storage.local.remove('notificationFormat');
    }
  });
}

// user interactions
chrome.action.onClicked.addListener(() => onClicked());

// messaging
// a closed panel has closed its port too; answering it then throws, and what
// comes after the answer would never run
const reply = (response, value) => {
  try {
    response(value);
  }
  catch (e) {}
};
/* actions */
// the links an action takes out of the badge and the panel: its own, and the feed's of the same
// mail, which a search, the reader or the assistant print otherwise
const hidden = async links => [...new Set([...links, ...await self.checkEmails.same(links)])];
// An action as Gmail or a service takes it. Mail of several accounts may be done in some and
// not in others: only what failed shows again, and the answer names it (failed).
const perform = async ({cmd, links}, response) => {
  const prefs = await chrome.storage.local.get({
    doReadOnArchive: true
  });
  const e = await Services.dispatch({cmd, links, prefs}).catch(e => ({message: e?.message || String(e)}));
  const failed = e === true ? [] : Array.isArray(e?.failed) ? links.filter(link => e.failed.includes(link)) : links;
  const done = links.filter(link => !failed.includes(link));
  try {
    // the feed cannot report it yet; store the links and let the panel and the badge hide them
    // until it does. A star and a label change no count; mail marked unread counts again, even
    // when the panel read it on opening and hid it.
    if (done.length && cmd === 'ur') {
      await Resolved.forget(await hidden(done));
    }
    else if (done.length && cmd !== 'st' && cmd !== 'xst' && !cmd.startsWith('ac_')) {
      await Resolved.record(await hidden(done));
    }
    if (failed.length) {
      console.error(e);
      await Resolved.forget(await hidden(failed));
      // Gmail asks to confirm the sign-in first: its page opens in a tab
      if (e?.details?.links?.length) {
        self.openLink(e.details.links[0]);
        toast(chrome.i18n.getMessage('msg_6'));
      }
      else {
        toast(e?.message || 'Unknown Error - 1');
      }
    }
    await self.checkEmails.refresh();
  }
  catch (err) {
    console.error(err);
  }
  finally {
    reply(response, failed.length ? {message: e?.message || 'Unknown Error - 1', failed} : undefined);
    repeater.reset('popup.action', 500);
  }
};
/*
 * The panel's Undo window: the mail leaves the badge at once and reaches Gmail once the window
 * is over, whether the panel is still open or not. Each action waiting is in the local storage
 * as well ({id, cmd, links, due}), so one the browser quits, crashes or updates the extension in
 * the middle of still goes when the worker starts again; an Undo takes it out.
 */
const PENDING = 'actions.pending';
// id -> {request, response, timer, stored}; stored: known from the storage alone, after a restart
const later = new Map();
const waiting = {
  queue: Promise.resolve(),
  // the list changed by fn, one change after the other
  change(fn) {
    return waiting.queue = waiting.queue.then(async () => {
      const {[PENDING]: list = []} = await chrome.storage.local.get(PENDING);
      const [next, out] = fn(Array.isArray(list) ? list : []);
      if (next) {
        await chrome.storage.local.set({[PENDING]: next});
        // the alarm wakes a worker gone meanwhile, which then runs what is due
        if (next.length) {
          chrome.alarms.create(PENDING, {when: Math.min(...next.map(o => o.due)) + 1000});
        }
        else {
          chrome.alarms.clear(PENDING);
        }
      }
      return out;
    }).catch(e => console.error(e));
  },
  add: o => waiting.change(list => [[...list.filter(x => x.id !== o.id), o]]),
  // the action taken out of the list, if it was still there
  take: id => waiting.change(list => {
    const o = list.find(x => x.id === id);
    return o ? [list.filter(x => x !== o), o] : [null, undefined];
  })
};
const go = async id => {
  const o = later.get(id);
  later.delete(id);
  const kept = await waiting.take(id);
  // one known from the storage alone runs only while the storage has it: an Undo may have come first
  if (kept || (o && !o.stored)) {
    perform(kept || o.request, o?.response);
  }
};
const schedule = (o, response, stored = false) => later.set(o.id, {
  request: o,
  response,
  stored,
  timer: setTimeout(go, Math.max(0, o.due - Date.now()), o.id)
});
// a worker that starts finds what an earlier one left waiting; what is overdue goes after a
// moment, for the network of a browser just started
waiting.change(list => [null, list]).then(list => {
  for (const o of list || []) {
    if (!later.has(o.id) && o.id && Array.isArray(o.links)) {
      Resolved.record(o.links, Math.max(0, o.due - Date.now()) + 10000);
      schedule({...o, due: Math.max(o.due, Date.now() + 3000)}, undefined, true);
    }
  }
});

/*
 * Unsubscribing from a Gmail mail: what its header says (the offscreen document reads it), and
 * the one-click request of RFC 8058, sent from here so a panel that closes does not stop it. The
 * address is the header's own, read again here, never one a message names. The request carries
 * nothing of the browser (no cookies, no referrer); its answer cannot be read (no-cors), so it is
 * "sent", not "done". It needs no permission for the sender's host.
 */
const unsubs = new Map();
const headersOf = link => {
  const kept = unsubs.get(link);
  if (kept && Date.now() - kept.at < 10 * 60 * 1000) {
    return kept.p;
  }
  const p = offscreen.command({cmd: 'gmail.headers', request: {link}}).then(r => {
    if (!r || r.message) {
      throw Error(r?.message || 'No answer');
    }
    return r;
  });
  unsubs.set(link, {at: Date.now(), p});
  p.catch(() => unsubs.get(link)?.p === p && unsubs.delete(link));
  if (unsubs.size > 100) {
    unsubs.delete(unsubs.keys().next().value);
  }
  return p;
};
const unsubscribe = async link => {
  const {unsubscribe: u} = await headersOf(link);
  if (!u?.post || !/^https:\/\//i.test(u.post)) {
    throw Error('No one-click unsubscribe');
  }
  await fetch(u.post, {
    method: 'POST',
    mode: 'no-cors',
    credentials: 'omit',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    cache: 'no-store',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: 'List-Unsubscribe=One-Click',
    signal: AbortSignal.timeout(15000)
  });
  return {sent: true};
};

chrome.runtime.onMessage.addListener((request, sender, response) => {
  const method = request.method;

  if (method === 'update' && request.forced) {
    repeater.reset('popup.forced');
  }
  else if (method === 'update') {
    repeater.reset('popup', 500);
  }
  else if (method === 'open') {
    const url = request.url;
    if (typeof url === 'string') {
      self.openLink(url);
    }
    else if (url.button === 2 || !url.link) {
      return;
    }
    else {
      // opening a mail marks it as read
      if (url.isPrivate !== true) {
        self.checkEmails.opened(url.link);
      }
      if (url.button === 1 || (url.button === 0 && (url.ctrlKey || url.metaKey))) {
        self.openLink(url.link, true, null, url.isPrivate);
      }
      else {
        self.openLink(url.link, null, null, url.isPrivate);
      }
    }
  }
  else if (method === 'test-play') {
    sound.play().catch(e => toast(e.message));
  }
  else if (method === 'gmail.action.cancel') {
    const o = later.get(request.id);
    if (o) {
      clearTimeout(o.timer);
      later.delete(request.id);
    }
    waiting.take(request.id).then(async kept => {
      const links = o?.request.links || kept?.links;
      if (links) {
        await Resolved.forget(await hidden(links));
        await self.checkEmails.refresh();
      }
    });
    // the panel still waits for an answer to the action itself
    reply(o?.response);
  }
  else if (method === 'gmail.action') {
    const {cmd, links} = request;
    if (!Array.isArray(links) || links.length === 0) {
      reply(response);
      return;
    }
    if (request.delay) {
      const o = {id: String(request.id || Math.random()), cmd, links, due: Date.now() + request.delay};
      hidden(links).then(all => Resolved.record(all, request.delay + 10000)).then(() => self.checkEmails.refresh());
      waiting.add(o);
      schedule(o, response);
    }
    else {
      perform({cmd, links}, response);
    }
    return true;
  }
  else if (method === 'gmail.search') {
    offscreen.command({
      cmd: 'gmail.search',
      request
    }).then(r => {
      if (!r) {
        reply(response);
        console.error('Empty response from offscreen');
      }
      else if (r.message) {
        // Gmail asks to confirm the sign-in first: its page opens in a tab
        if (r.details && r.details.links && r.details.links.length) {
          self.openLink(r.details.links[0]);
          toast(chrome.i18n.getMessage('msg_6'));
        }
        reply(response);
        console.error(r);
      }
      else {
        reply(response, r.entries);
      }
    });
    return true;
  }
  // a Gmail mail's Message-ID and how it is unsubscribed from ({unsubscribe: null} without a way)
  else if (method === 'gmail.headers') {
    headersOf(request.link).then(r => reply(response, r), e => reply(response, {message: e.message}));
    return true;
  }
  else if (method === 'gmail.unsubscribe') {
    unsubscribe(request.link).then(r => reply(response, r), e => reply(response, {message: e?.message || String(e)}));
    return true;
  }
  // a mail of another service, for the panel's reader
  else if (method === 'services.body') {
    Services.body(request.link).then(r => reply(response, r));
    return true;
  }
  else if (method === 'services.check') {
    Services.check(request.id).then(r => reply(response, r));
    return true;
  }
  else if (method === 'stop-sound') {
    sound.stop();
  }
  // an account's ID key for the offscreen document, kept per address for the session
  // one Gmail refused: the next action fetches the account's page again
  else if (method === 'ik-forget') {
    chrome.storage.session.get('iks').then(({iks = {}}) => {
      if (request.n in iks) {
        delete iks[request.n];
        chrome.storage.session.set({iks});
      }
    });
  }
  else if (method === 'ik-get' || method === 'ik-set') {
    checkEmails.getCached().then(async objs => {
      const title = (objs || []).find(o => (o.xml.rootLink.match(/u\/(\d+)/) || [])[1] === String(request.n))?.xml.title;
      const {iks = {}} = await chrome.storage.session.get('iks');
      if (method === 'ik-get') {
        reply(response, title && iks[request.n]?.title === title ? iks[request.n].ik : null);
      }
      else if (title && request.ik) {
        iks[request.n] = {title, ik: request.ik};
        chrome.storage.session.set({iks});
        reply(response);
      }
      else {
        reply(response);
      }
    });
    return true;
  }
  else if (method === 'get-at') {
    chrome.cookies.get({name: 'GMAIL_AT', url: 'https://mail.google.com/mail/u/' + request.n}, o => {
      response(o?.value);
    });
    return true;
  }
});
