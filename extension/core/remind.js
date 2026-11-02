/* global Remind, repeater */

// core/check.js loads core/utils/remind.js; it hides the waiting mail.
// One alarm for the earliest reminder; when it rings, the due mail gets its
// notification and a check brings it back to the panel and the badge.
// The list is written here alone, one change after the other: the panel asks
// (remind.add, remind.remove), and a reminder that rings takes its mail out, so
// a reminder set at that moment is not lost.
{
  let queue = Promise.resolve();
  const serial = fn => queue = queue.then(fn, fn);
  const schedule = async () => {
    const list = await Remind.read();
    if (list.length) {
      chrome.alarms.create('remind', {
        when: Math.max(Date.now() + 1000, Math.min(...list.map(o => o.until)))
      });
    }
    else {
      chrome.alarms.clear('remind');
    }
  };
  // A reminder closed without a click leaves what its click would have opened in the session
  // storage; the ones off the screen for a day go before new ones come.
  const prune = async () => {
    const shown = await new Promise(resolve => chrome.notifications.getAll(o => resolve(o || {})));
    const all = await chrome.storage.session.get(null);
    const gone = Object.keys(all).filter(key => key.startsWith('remind.') && !(key in shown) &&
      !(Date.now() - all[key]?.at < 24 * 3600 * 1000));
    if (gone.length) {
      await chrome.storage.session.remove(gone);
    }
  };
  const ring = () => serial(async () => {
    const list = await Remind.read();
    const due = list.filter(o => o.until <= Date.now());
    if (due.length) {
      await prune().catch(() => {});
      await Remind.write(Remind.waiting(list));
      for (const o of due) {
        const id = 'remind.' + Math.random();
        // the account's place in the browser (/u/<n>) as it is now, not when it was set
        const [link, open] = await Promise.all([o.link, o.open || o.link].map(l => self.checkEmails.relink(l, o.account)));
        chrome.storage.session.set({
          [id]: {link, open, at: Date.now()}
        });
        chrome.notifications.create(id, {
          type: 'basic',
          iconUrl: '/data/icons/notification/48.png',
          title: chrome.i18n.getMessage('panel_reminderTitle'),
          message: [o.title, o.from].filter(Boolean).join('\n'),
          priority: 2,
          requireInteraction: true
        });
      }
      repeater.reset('remind', 500);
    }
    schedule();
  });

  chrome.alarms.onAlarm.addListener(o => {
    if (o.name === 'remind') {
      ring();
    }
  });
  chrome.notifications.onClicked.addListener(id => {
    if (id.startsWith('remind.')) {
      chrome.storage.session.get(id, prefs => {
        chrome.storage.session.remove(id);
        if (prefs[id]) {
          self.openLink(prefs[id].open);
          self.checkEmails.opened(prefs[id].link);
        }
      });
    }
  });
  chrome.runtime.onMessage.addListener((request, sender, response) => {
    // a panel closed meanwhile has closed its port too
    const answer = ok => {
      try {
        response(ok);
      }
      catch (e) {}
    };
    if (request.method === 'remind.add' && Array.isArray(request.items)) {
      serial(() => Remind.add(request.items, request.until)).then(() => answer(true), () => answer(false));
      return true;
    }
    if (request.method === 'remind.remove' && Array.isArray(request.links)) {
      serial(() => Remind.remove(request.links)).then(() => answer(true), () => answer(false));
      return true;
    }
  });
  // the list changed: the badge and the alarm follow it
  chrome.storage.onChanged.addListener((ps, area) => {
    if (area === 'local' && ps[Remind.KEY]) {
      schedule();
      self.checkEmails.refresh();
    }
  });
  schedule();
}
