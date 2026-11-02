// Mail the user asked to be reminded of later. Until its time comes it stays out
// of the panel and the badge the way a resolved one does; then the background
// raises a notification and lets it back in. The list lives in the local
// storage, so a reminder outlives the browser session. Gmail never hears of it.
// This file is loaded by the background (importScripts) and by the panel
// (script tag), so it must not rely on anything else.
const Remind = {
  // [{link, open, until, title, from, account}]; open is the address Gmail shows the thread at,
  // account the mailbox's address (its place in the browser, /u/<n>, may move meanwhile)
  KEY: 'remind.links'
};
Remind.read = () => chrome.storage.local.get({
  [Remind.KEY]: []
}).then(prefs => prefs[Remind.KEY] || []);
Remind.write = list => chrome.storage.local.set({
  [Remind.KEY]: list
}).then(() => list);
Remind.add = (items, until) => Remind.read().then(list => {
  const links = new Set(items.map(o => o.link));
  return Remind.write([...list.filter(o => links.has(o.link) === false), ...items.map(o => ({...o, until}))]);
});
Remind.remove = links => Remind.read().then(list => {
  const gone = new Set(links);
  return Remind.write(list.filter(o => gone.has(o.link) === false));
});
// the reminders still waiting, in the shape Resolved.apply() hides
Remind.waiting = (list, now = Date.now()) => (list || []).filter(o => o.until > now);
// the times the panel offers, each with the moment it stands for
Remind.times = (now = new Date()) => {
  const at = (days, hour) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d.getTime();
  };
  const times = [{key: 'remindHour', until: now.getTime() + 3600000}];
  if (now.getHours() < 17) {
    times.push({key: 'remindEvening', until: at(0, 18)});
  }
  times.push({key: 'remindTomorrow', until: at(1, 9)});
  // next Monday, a week ahead when today is Monday
  times.push({key: 'remindWeek', until: at((8 - now.getDay()) % 7 || 7, 9)});
  return times;
};
