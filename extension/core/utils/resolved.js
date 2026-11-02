// An action resolves mails before the feed is able to report it. The links are
// kept in the session storage and are hidden from the panel, the badge and the
// context menus until the feed agrees that they are gone.
// This file is loaded by the background (importScripts) and by the panel
// (script tag), so it must not rely on anything else.
const Resolved = {
  // [{link, at}], where `at` is the deadline: the action plus its grace period, by the clock of
  // the mail's feed (Gmail's for Gmail's mail)
  KEY: 'resolved.links',
  // Gmail's clock minus this computer's, as the last check found it (core/check.js)
  SKEW: 'clock.skew',
  // a mailbox archived at once with what Gmail's search adds, in every account
  LIMIT: 1000
};
// The background's writes, one after the other: an action, its Undo and a check may come at
// the same moment, and each reads the list before it writes it.
Resolved.queue = Promise.resolve();
Resolved.serial = fn => Resolved.queue = Resolved.queue.then(fn, fn);
// Date.parse() returns NaN for anything it cannot read and throws only for
// symbols; a clock that cannot be read must not become a comparison, so a NaN
// keeps the entry hidden.
Resolved.time = value => {
  if (typeof value !== 'string' || value === '') {
    return NaN;
  }
  try {
    return Date.parse(value);
  }
  catch (e) {
    return NaN;
  }
};
Resolved.write = list => {
  list = list.slice(-Resolved.LIMIT);

  return chrome.storage.session.set({
    [Resolved.KEY]: list
  }).then(() => list, () => list);
};
Resolved.read = () => chrome.storage.session.get({
  [Resolved.KEY]: []
}).then(prefs => prefs[Resolved.KEY] || []);
/*
 * Remember the links an action has resolved. The feed carries its own clock and
 * it can be regenerated a moment after the action, so the deadline is pushed
 * forward by the grace period: the feed has to prove it moved on before a link
 * can be dropped. Opening a mail takes longer to reach the feed than an action
 * sent to the server, hence the larger grace its caller asks for.
 */
Resolved.record = (links, grace = 10000) => {
  const done = typeof links === 'string' ? [links] : links || [];
  if (done.length === 0) {
    return Promise.resolve();
  }
  return Resolved.serial(() => Promise.all([Resolved.read(), chrome.storage.session.get({[Resolved.SKEW]: 0})]).then(([list, prefs]) => {
    // Gmail's feed tells its time by Gmail's clock; another service's mailbox by this computer's
    const skew = Number(prefs[Resolved.SKEW]) || 0;
    const at = link => Date.now() + grace + (link.startsWith('https://mail.google.com/') ? skew : 0);
    const known = new Set(list.map(o => o.link));
    let changed = false;
    for (const link of done) {
      // the first action wins; it is the oldest one the feed has to catch up with
      if (known.has(link) === false) {
        known.add(link);
        list.push({
          link,
          at: at(link)
        });
        changed = true;
      }
    }
    return changed ? Resolved.write(list) : list;
  }));
};
// An action undone or failed: its links show again.
Resolved.forget = links => Resolved.serial(() => Resolved.read().then(list => {
  const gone = new Set(typeof links === 'string' ? [links] : links || []);
  const keep = list.filter(o => gone.has(o.link) === false);
  return keep.length === list.length ? list : Resolved.write(keep);
}));
// Forget the links the feed does not report anymore, and the ones of a mailbox
// which has been regenerated after the grace of the action while still listing
// them.
Resolved.prune = objs => {
  const modified = new Map();
  for (const o of objs || []) {
    const time = Resolved.time(o.xml.modified);
    for (const e of o.xml.entries) {
      modified.set(e.link, time);
    }
  }
  return Resolved.serial(() => Resolved.read().then(list => {
    const keep = list.filter(({link, at}) => {
      if (modified.has(link) === false) {
        return false;
      }
      return modified.get(link) > at ? false : true;
    });
    return keep.length === list.length ? keep : Resolved.write(keep);
  }));
};
// Hide the resolved entries and return new objects, so the caller decides what
// to do with the result and nothing is written back into the feed cache.
// Running it twice removes nothing the second time, so it does not lower the
// full count twice either.
Resolved.apply = (objs, list) => {
  const done = new Set((list || []).map(o => o.link));
  if (done.size === 0) {
    return objs || [];
  }
  return (objs || []).map(o => {
    const entries = o.xml.entries.filter(e => done.has(e.link) === false);
    const hidden = o.xml.entries.length - entries.length;
    if (hidden === 0) {
      return o;
    }
    const visible = new Set(entries.map(e => e.id));
    return {
      ...o,
      // we already know about it, it must not be reported as new again
      newIDs: (o.newIDs || []).filter(id => visible.has(id)),
      xml: {
        ...o.xml,
        fullcount: Math.max(0, o.xml.fullcount - hidden),
        entries
      }
    };
  });
};
