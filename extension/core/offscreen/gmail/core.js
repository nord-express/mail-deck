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
    else if (cmd.startsWith('rc_')) { // add or remove labels
      // action.labels = cmd.slice(3);
    }
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
