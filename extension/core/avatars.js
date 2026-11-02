/* global checkEmails */

// The picture of each signed-in account, for the panel's mailbox lines. Gmail's
// own page carries it in the Google bar: an lh3.googleusercontent.com address
// next to the account's address. It is looked up once a week per account (once
// a day while none is found) and kept in the local storage; without one the
// panel keeps the coloured dot.
{
  const KEY = 'avatars';
  const DAY = 24 * 3600 * 1000;

  // the picture nearest to the account's address in the page, asked for at 64px
  const find = (html, email) => {
    const text = html.replace(/\\u003d/gi, '=').replace(/\\u0026/gi, '&').replace(/\\\//g, '/');
    const found = [...text.matchAll(/https:\/\/lh3\.googleusercontent\.com\/(?:ogw|a)\/[\w-]+(?:=[\w-]+)?/g)];
    if (found.length === 0) {
      return '';
    }
    const at = text.indexOf(email);
    const best = at === -1 ? found[0] : found.reduce((p, m) => Math.abs(m.index - at) < Math.abs(p.index - at) ? m : p);
    const [base, size = 's32-c'] = best[0].split('=');
    return base + '=' + size.replace(/^s\d+/, 's64');
  };

  let busy = false;
  const refresh = async () => {
    if (busy) {
      return;
    }
    busy = true;
    try {
      const objs = await checkEmails.getCached();
      const {[KEY]: avatars = {}} = await chrome.storage.local.get(KEY);
      const now = Date.now();
      // one look per account, however many label feeds it has
      const due = [...new Map((objs || []).map(o => [o.xml.title, o])).values()].filter(o => {
        const a = avatars[o.xml.title];
        // Gmail's page has the picture; a mailbox of another service has none to find
        return o.xml.title.includes('@') && !o.xml.service && (!a || now - a.at > (a.url ? 7 * DAY : DAY));
      });
      for (const o of due) {
        const n = (o.xml.rootLink.match(/u\/(\d+)/) || [])[1];
        if (n === undefined) {
          continue;
        }
        const html = await fetch(`https://mail.google.com/mail/u/${n}/`, {
          credentials: 'include',
          // a page that never comes would keep the next look from ever starting
          signal: AbortSignal.timeout(15000)
        }).then(r => r.ok ? r.text() : '', () => '');
        avatars[o.xml.title] = {url: find(html, o.xml.title), at: now};
      }
      if (due.length) {
        await chrome.storage.local.set({[KEY]: avatars});
      }
    }
    finally {
      busy = false;
    }
  };

  // after a check has published the accounts, a while later, so it never slows the check
  let timer;
  chrome.storage.onChanged.addListener((ps, area) => {
    if (area === 'session' && ps['cached-objects']) {
      clearTimeout(timer);
      timer = setTimeout(refresh, 5000);
    }
  });
}
