/* global log, checkEmails */
const repeater = {
  reason: '',
  // a forced reason was asked for since the last check: the next check is a forced one
  forced: false
};
{
  // Chrome fires an alarm at most once in 30 seconds unless the extension is unpacked, however
  // soon it is set. A check asked for sooner runs from a timer while the worker is awake; the
  // alarm, set a moment after the timer, stays for a worker that is gone by then.
  const SOON = 30000;
  const FORCED = ['user.request', 'options.changes', 'change.of.feeds', 'popup.forced'];
  let soon = null; // the timer of a sooner check: {timer, at}

  // one check at a time: a timer and its alarm run it once, and a check started while another
  // one runs takes over from it (core/check.js)
  repeater.fire = () => {
    if (soon) {
      clearTimeout(soon.timer);
      soon = null;
    }
    const forced = repeater.forced;
    repeater.forced = false;
    repeater.build('fired', 'alarm.fired'); // the next regular check, counted from now
    checkEmails.execute(forced);
  };

  repeater.build = (type = 'normal', reason, delay) => {
    if (FORCED.includes(reason)) {
      repeater.forced = true;
    }
    return chrome.storage.local.get({
      'period': 120, // seconds
      'initialPeriod': 3 // seconds
    }, async prefs => {
      repeater.reason = reason;

      if (isNaN(delay)) {
        if (type === 'normal') {
          // 0 is "right away"
          delay = (prefs.initialPeriod ?? 3) * 1000 || 100;
        }
        else if (type === 'fired') {
          delay = prefs.period * 1000;
        }
        else {
          delay = 100;
        }
      }

      const now = Date.now();
      const when = now + delay;
      // a check that comes sooner serves this one as well
      if (type !== 'fired') {
        if (soon && soon.at <= when) {
          return log('[repeater]', 'ignored', when - soon.at);
        }
        const next = await chrome.alarms.get('repeater');
        if (next) {
          if (next.scheduledTime > now) {
            if ((when - next.scheduledTime) > 0) {
              return log('[repeater]', 'ignored', when - next.scheduledTime);
            }
          }
        }
      }
      log('[repeater]', `Reason: "${reason}"`, `Type: "${type}"`, `Delay: ${(delay / 1000).toFixed(2)}s`);
      let at = when;
      if (type !== 'fired' && delay < SOON) {
        if (soon) {
          clearTimeout(soon.timer);
        }
        soon = {
          at: when,
          timer: setTimeout(repeater.fire, delay)
        };
        at = when + 1000;
      }
      chrome.alarms.create('repeater', {
        when: at,
        periodInMinutes: prefs.period / 60
      });
    });
  };
}

repeater.reset = (reason, delay) => repeater.build('now', reason, delay);

/* alarm */
chrome.alarms.onAlarm.addListener(o => {
  if (o.name === 'repeater') {
    repeater.fire();
  }
});
/* startup */
{
  const once = () => {
    if (once.done) {
      return;
    }
    once.done = true;
    repeater.build('normal', 'startup');
  };
  chrome.runtime.onStartup.addListener(once);
  chrome.runtime.onInstalled.addListener(once);
}

/* idle */
{
  // Registered at once: the event that wakes a stopped worker reaches only the listeners its
  // first run registers, so the setting is read when the event comes, not before.
  chrome.idle.onStateChanged.addListener(async name => {
    if (name === 'active') {
      const prefs = await chrome.storage.local.get({
        'idle.watch': true
      });
      if (prefs['idle.watch']) {
        repeater.reset('exit.idle');
      }
    }
  });

  {
    const once = () => {
      if (once.done) {
        return;
      }
      once.done = true;

      chrome.storage.local.get({
        'idle-detection': 5 // minutes
      }, prefs => {
        chrome.idle.setDetectionInterval(prefs['idle-detection'] * 60);
      });
    };
    chrome.runtime.onStartup.addListener(once);
    chrome.runtime.onInstalled.addListener(once);
  }
}

/* pref changes */
chrome.storage.onChanged.addListener(prefs => {
  // a label setting of a place (feeds_<n>) the check has moved to its account's address goes
  // without a check of its own; the address's labels ask for one (core/check.js)
  if (prefs.minimal || prefs.services ||
    Object.keys(prefs).some(key => key.startsWith('feeds_') && prefs[key].newValue !== undefined)
  ) {
    repeater.reset('change.of.feeds');
  }
  if (prefs.clrPattern || prefs.badge) {
    repeater.reset('options.changes');
  }
  if (prefs.period) {
    repeater.reset('period.changed');
  }
  if (prefs.oldFashion) {
    repeater.reset('options.changes');
  }
  if (prefs.accounts) {
    repeater.reset('change.of.ignored.list');
  }
});
