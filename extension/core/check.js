/* global log, button, context, Feed, repeater, sound, toast, Resolved, Remind, Quiet, Services */

if (typeof importScripts !== 'undefined') {
  self.importScripts('/core/utils/feed.js');
  self.importScripts('/core/utils/resolved.js');
  self.importScripts('/core/utils/remind.js');
  self.importScripts('/core/utils/quiet.js');
  self.importScripts('/core/utils/code.js');
}

{
  const helper = {
    id(href) {
      const m = href.match(/u\/(?<n>\d+)/);
      if (m) {
        return Number(m.groups.n);
      }
    },
    base(href) {
      return /[^?]*/.exec(href)[0].split('/h')[0].replace(/\/$/, '');
    },
    thread(href) {
      const m = href.match(/message_id=(?<thread>[^&]+)/);
      if (m) {
        return m.groups.thread;
      }
    },
    /*
     * The thread of a link, no matter how it is printed. A label feed prints
     * its entries as <account>/?shva=1#label/<label>/<thread>, so the last part
     * of the hash is the thread and not the first one.
     */
    threadId(href) {
      const m = /[?&]message_id=([^&#]*)/.exec(href);
      if (m && m[1]) {
        return m[1];
      }
      const hash = /#([^#]*)$/.exec(href);
      return hash ? decodeURIComponent(hash[1].split('/').pop() || '') : '';
    },
    /*
     * Date.parse() returns NaN for anything it cannot read and throws only for
     * symbols; the type check plus the try/catch makes a malformed clock
     * impossible to turn into anything but NaN, whatever session storage holds.
     */
    time(value) {
      if (typeof value !== 'string' || value === '') {
        return NaN;
      }
      try {
        return Date.parse(value);
      }
      catch (e) {
        return NaN;
      }
    }
  };

  const isPrivate = false;
  // a forced check shows the loading icon until a check publishes its result
  let loading = false;
  // A feed that did not answer this time (a timeout, an outage of Gmail's) shows its last answer
  // this long: its account stays in the panel and the badge, and its resolved mail stays hidden.
  const STALE = 10 * 60 * 1000;
  // A check no feed answered comes again this soon, then waits for the regular period: a laptop
  // just awake meets a network that is not up yet, and the next check is minutes away.
  const RETRY = [5000, 15000, 30000];
  let retries = 0;
  // Gmail's clock minus this computer's, as the last check found it: a feed's times are Gmail's
  const SKEW = 'clock.skew';

  const read = (prefs, type = 'local') => chrome.storage[type].get(prefs);

  // what the number on the toolbar icon counts: the inboxes switched on and not left out of the count
  const counted = o => o.meta?.ignored !== true && o.meta?.uncounted !== true;
  // the number on the icon: every unread mail, or with "badge.count" at "new" only the mail that came
  // after the panel was last opened (a feed lists 20 mails at most, plenty for "new")
  const shown = async (objs, count) => {
    const prefs = await read({
      'badge.count': 'all',
      'badge.seen': 0
    });
    if (prefs['badge.count'] !== 'new') {
      return count;
    }
    // the panel was opened by this computer's clock, the mail came by Gmail's
    const {[SKEW]: skew = 0} = await read({[SKEW]: 0}, 'session');
    const seen = prefs['badge.seen'] + (Number(skew) || 0);
    return objs.filter(counted).reduce((p, o) => p + o.xml.entries.filter(e => helper.time(e.modified) > seen).length, 0);
  };

  const notify = async (text, title, click = {}, buttons = []) => {
    title = title || chrome.i18n.getMessage('gmail');

    const p2 = await read({
      'silent': false
    }, 'session');
    if (p2.silent) {
      log('[feed]', 'notification is silent', text, title);
      return;
    }
    const p1 = await read({
      'notificationTime': 10, // seconds
      'notification.state.active': true,
      'notification.state.idle': true,
      'notification.state.locked': true
    }, 'local');

    if (
      p1['notification.state.active'] === false ||
      p1['notification.state.idle'] === false ||
      p1['notification.state.locked'] === false
    ) {
      const state = await chrome.idle.queryState(5 * 60);
      if (p1['notification.state.' + state] === false) {
        log('[feed]', 'notification is aborted', text, title);
        return;
      }
    }

    let isArray = Array.isArray(text);
    if (isArray && text.length === 1) {
      isArray = false;
      text = text[0];
    }
    // Users on Mac OS X only see the first item.
    if (isArray && navigator.platform.includes('Mac')) {
      isArray = false;
      text = text.join('\n\n');
    }

    const when = Date.now() + p1.notificationTime * 1000;
    const options = {
      type: isArray ? 'list' : 'basic',
      iconUrl: '/data/icons/notification/48.png',
      title,
      message: isArray ? '' : text,
      priority: 2,
      eventTime: when,
      items: isArray ? text.map(message => {
        const tmp = message.split('\n');
        return {
          title: (tmp[1] || '').replace('Title: ', ''),
          message: tmp[0].replace('From: ', '')
        };
      }) : [],
      requireInteraction: click ? true : false,
      buttons: buttons.map(b => ({
        title: b.title,
        iconUrl: b.iconUrl
      }))

    };
    if (navigator.userAgent.includes('Firefox')) {
      delete options.requireInteraction;
      delete options.buttons;
    }
    // if (config.notification.actions === false) {
    //   delete options.buttons;
    // }

    const id = 'action.' + Math.random();
    chrome.storage.session.set({
      [id]: {
        buttons: (buttons || []).map(o => o.action),
        click
      }
    });
    // Chrome fires an alarm at most once in 30 seconds (unpacked extensions aside), so the
    // timer clears the notification on time while the worker is awake; the alarm stays for a
    // worker that is gone by then
    chrome.alarms.create('clear.notification.' + id, {
      when
    });
    setTimeout(clear, p1.notificationTime * 1000, id);
    chrome.notifications.create(id, options);
  };
  const clear = id => {
    chrome.notifications.clear(id);
    chrome.storage.session.remove(id);
    chrome.alarms.clear('clear.notification.' + id);
  };
  chrome.notifications.onClicked.addListener(id => {
    chrome.notifications.clear(id);
    sound.stop();
    if (id.startsWith('action.')) {
      chrome.alarms.clear('clear.notification.' + id);
      chrome.storage.session.get(id, prefs => {
        chrome.storage.session.remove(id);
        if (!prefs[id]) {
          return;
        }
        const {click} = prefs[id];
        if (click.cmd === 'open') {
          const {links} = click;
          // use open to open the first link and use chrome.tabs.create for the rest
          self.openLink(links[0]);
          links.slice(1).forEach(url => chrome.tabs.create({
            url,
            active: false
          }));
          // every mail of the report is open now
          self.checkEmails.opened(links);
        }
        else {
          console.error('No action', click);
        }
      });
    }
  });
  chrome.alarms.onAlarm.addListener(o => {
    if (o.name.startsWith('clear.notification.')) {
      const id = o.name.slice(19);
      chrome.notifications.clear(id);
      chrome.storage.session.remove(id);
    }
  });
  /*
   * A notification the settings repeat ("notify.repeat", minutes) comes back with its sound
   * while some of its mail is unread: not read, archived, deleted, put off or gone from the
   * feed. Quiet hours hold it back without ending it; switching it or notifications off ends it.
   */
  chrome.alarms.onAlarm.addListener(async o => {
    if (o.name !== 'repeat.notify') {
      return;
    }
    const {'repeat.report': r} = await read({
      'repeat.report': null
    }, 'session');
    const prefs = await read({
      'notify.repeat': 0,
      'notification': true,
      'alert': true,
      'quiet.hours': false,
      'quiet.from': '22:00',
      'quiet.to': '08:00',
      'quiet.weekend': false
    });
    const stop = () => chrome.storage.session.remove('repeat.report');
    if (!r || !(prefs['notify.repeat'] > 0) || !prefs.notification) {
      return stop();
    }
    const listed = new Map((await self.checkEmails.visible())
      .filter(c => c.meta?.ignored !== true && c.meta?.quiet !== true)
      .flatMap(c => c.xml.entries).map(e => [e.link, e]));
    const keep = r.links.map((link, i) => i).filter(i => listed.has(r.links[i]));
    if (keep.length === 0) {
      return stop();
    }
    if (Quiet.hours(prefs) === false) {
      // a combined notification is one text for all its mail
      const pick = list => list.length === r.links.length ? keep.map(i => list[i]) : list;
      const links = keep.map(i => r.links[i]);
      await notify(pick(r.text), r.title, {...r.click, links: pick(r.click.links)},
        r.buttons.map(b => ({...b, action: {...b.action, links}})));
      if (prefs.alert) {
        sound.play(links.map(link => listed.get(link))).catch(e => toast(e.message));
      }
    }
    chrome.alarms.create('repeat.notify', {
      when: Date.now() + prefs['notify.repeat'] * 60000
    });
  });
  if (chrome.notifications.onButtonClicked) {
    chrome.notifications.onButtonClicked.addListener((id, index) => {
      sound.stop();

      chrome.alarms.clear('clear.notification.' + id);
      chrome.storage.session.get(id, prefs => {
        chrome.storage.session.remove(id);
        chrome.notifications.clear(id);

        const request = prefs[id]?.buttons?.[index];
        if (!request) {
          return;
        }
        // links might be from different accounts; the mail of the other services is one
        // request, which they split by mailbox themselves
        const bases = {};
        for (const link of request.links) {
          const base = Services.of(link) ? 'services' : helper.base(link);
          bases[base] = bases[base] || [];
          bases[base].push(link);
        }
        const requests = Object.values(bases).map(links => ({
          ...request,
          links
        }));
        // dispatch
        chrome.storage.local.get({
          doReadOnArchive: true
        }, prefs => {
          requests.forEach(r => r.prefs = prefs);
          Promise.all(requests.map(request => Services.dispatch(request))).then(async arr => {
            const errors = arr.filter(o => o !== true);
            if (errors.length) {
              console.error(errors);
              toast(errors.map(e => e.message).join('\n\n'));
            }
            // every button of a notification reduces the count, so the panel and
            // the badge can be updated without waiting for the next check; an action
            // done in some accounts and not in others reduces it by what is done
            const done = requests.flatMap((request, i) => arr[i] === true ? request.links :
              Array.isArray(arr[i]?.failed) ? request.links.filter(link => !arr[i].failed.includes(link)) : []);
            if (done.length) {
              await Resolved.record(done);
              await self.checkEmails.refresh();
            }
          }).finally(() => repeater.reset('action.command', 500));
        });
      });
    });
  }

  const shorten = (str = '', truncate) => {
    if (str.length < truncate) {
      return str;
    }
    return str.substr(0, truncate / 2) + '...' + str.substr(str.length - truncate / 2);
  };

  const attach = () => chrome.action.setPopup({
    popup: '/data/panel/index.html'
  });
  const detach = () => {
    chrome.action.setPopup({
      popup: ''
    });
    chrome.runtime.sendMessage({
      method: 'close-popup'
    }, () => chrome.runtime.lastError);
  };
  chrome.storage.onChanged.addListener(ps => {
    if (ps.oldFashion) {
      self.checkEmails.visible().then(objs => {
        const numberOfAccounts = objs.map(o => o.xml ? o.xml.title : null)
          .filter((o, i, a) => o && a.indexOf(o) === i).length;
        const hasUnread = objs.map(o => o.xml ? o.xml.fullcount : 0)
          .reduce((p, c) => p + c, 0);

        if (numberOfAccounts === 1 && ps.oldFashion.newValue === 1) {
          detach();
        }
        else if (hasUnread) {
          attach();
        }
      });
    }
  });

  /*
   * The labels an account watches are kept by its address ('labels': address -> 'inbox, work'),
   * since its place in the browser (/mail/u/<n>) moves when an account before it signs out.
   * Up to 1.5 they were kept by that place ('feeds_<n>'); such a setting still applies to the
   * account at its place until a check has seen who is there, and then moves to its address.
   */
  const LEGACY = [...Array(10).keys()].map(n => 'feeds_' + n);
  const labelsOf = (prefs, address, n) => address !== undefined && typeof prefs.labels?.[address] === 'string' ?
    prefs.labels[address] : prefs['feeds_' + n] || '';
  // the feeds of the account at /u/<n>: the labels it watches, or its inbox when none are set
  const feedsAt = (n, labels) => {
    const base = `https://mail.google.com/mail/u/${n}/feed/atom`;
    const list = labels.split(/\s*,\s*/).filter(Boolean);
    // only feeds without '/inbox' show the right full-count
    return list.length ? list.map(l => l === 'inbox' ? base : base + '/' + encodeURIComponent(l)) : [base];
  };
  // Each of the 10 accounts Google lets a profile sign in to is checked, with the labels of the
  // account the last check found at its place (planned: n -> those labels)
  const buildFeeds = (prefs, slots, planned) => {
    const feeds = [];
    for (let i = 0; i < 10; i += 1) {
      planned[i] = labelsOf(prefs, slots[i], i);
      feeds.push(...feedsAt(i, planned[i]));
    }
    if (prefs.feeds_custom) {
      feeds.push(...prefs.feeds_custom.split(/\s*,\s*/g));
    }
    return feeds.filter((feed, index) => feed && feeds.indexOf(feed) === index).sort();
  };
  // the address of the Gmail account at each place, as the given accounts tell it
  const slotsOf = objs => {
    const slots = {};
    for (const o of objs || []) {
      const n = o.xml?.service ? undefined : helper.id(o.xml?.rootLink || '');
      if (n !== undefined && o.xml.title) {
        slots[n] = o.xml.title;
      }
    }
    return slots;
  };
  // the labels as the check moved them from the places to the addresses: that write asks for no
  // check of its own, the settings page's does
  let moved = '';
  chrome.storage.onChanged.addListener((ps, area) => {
    if (area === 'local' && ps.labels && JSON.stringify(ps.labels.newValue || {}) !== moved) {
      repeater.reset('change.of.feeds');
    }
  });

  /*
   * The accounts of the last check as the feeds told them, resolved and reminded mail
   * included: hiding is applied on the way out (visible, refresh, the panel), so mail an
   * Undo or a failed action brings back is there to show again.
   */
  self.checkEmails = {
    getCached() {
      if (self.checkEmails.cached) {
        return Promise.resolve(self.checkEmails.cached);
      }
      return read({
        'cached-objects': []
      }, 'session').then(prefs => prefs['cached-objects']);
    }
  };
  /*
   * The mail waiting for its reminder, as the feeds list it now: a reminder names its account,
   * and the same thread of that account counts wherever the account is in the browser, though
   * the link it was set with names the place (/u/<n>) it had then.
   */
  const waiting = (list, objs) => {
    const due = Remind.waiting(list);
    const named = due.filter(r => r.account).map(r => r.account + ' ' + helper.threadId(r.link));
    if (named.length === 0) {
      return due;
    }
    const moved = (objs || []).filter(o => !o.xml.service).flatMap(o => o.xml.entries
      .filter(e => named.includes(o.xml.title + ' ' + helper.threadId(e.link))).map(e => ({link: e.link})));
    return [...due, ...moved];
  };
  // a link of a Gmail account at the place the account is at now (/u/<n>), when it is signed in
  self.checkEmails.relink = async (link, account) => {
    const n = account && Object.entries(slotsOf(await self.checkEmails.getCached())).find(([, a]) => a === account)?.[0];
    return n === undefined || typeof link !== 'string' || !link.startsWith('https://mail.google.com/') ? link :
      link.replace(/\/mail\/u\/\d+/, '/mail/u/' + n);
  };
  // the accounts as the panel and the badge show them: without the resolved mail and the
  // mail waiting for its reminder
  self.checkEmails.visible = async () => {
    const objs = await self.checkEmails.getCached();
    return Resolved.apply(Resolved.apply(objs, await Resolved.read()), waiting(await Remind.read(), objs));
  };
  // Show the accounts as they are now: the badge, the panel and, when nothing
  // is left to read, the panel itself. The given objects are expected to be
  // already filtered by Resolved.apply(); the cache keeps the unfiltered ones.
  self.checkEmails.publish = async objs => {
    loading = false;
    const active = objs.filter(c => c.meta?.ignored !== true);
    const count = objs.filter(counted).reduce((p, c) => p + c.xml.fullcount, 0);
    // read before anything is drawn, so two publishes in a row draw in their order
    const badge = count ? await shown(objs, count) : 0;

    chrome.storage.session.set({count});
    if (count) {
      button.icon = 'red';
      button.badge = badge;
    }
    else {
      button.icon = 'gray';
      button.badge = 0;
    }
    chrome.runtime.sendMessage({
      method: 'update',
      data: objs
    }, () => chrome.runtime.lastError);

    const {oldFashion} = await chrome.storage.local.get({
      oldFashion: 0
    });
    const singleAccount = oldFashion === 2 ||
      (oldFashion === 1 && active.map(o => o.xml.rootLink).filter((s, i, l) => l.indexOf(s) === i).length === 1);

    // the panel stays even with nothing unread: it lists the accounts
    if (singleAccount) {
      detach();
    }
    else {
      attach();
    }
    return count;
  };
  // Apply the resolved entries to the cached accounts and publish the result,
  // so the panel and the badge do not wait for the next check
  self.checkEmails.refresh = async () => self.checkEmails.publish(await self.checkEmails.visible());
  // opening the panel, or switching what the count shows, draws the number again; switching to
  // "new" counts from now on
  chrome.storage.onChanged.addListener(async (ps, area) => {
    if (area !== 'local' || !(ps['badge.seen'] || ps['badge.count'])) {
      return;
    }
    if (ps['badge.count']?.newValue === 'new' && !ps['badge.seen']) {
      // its own change draws the number
      chrome.storage.local.set({'badge.seen': Date.now()});
      return;
    }
    // signed out: the blue icon stays
    if ((await self.checkEmails.getCached()).length) {
      self.checkEmails.refresh();
    }
  });
  /*
   * The listed entries that are the given mail: the same link, or the same thread of the same
   * account however it is printed (Gmail's search, the reader, a notification, the assistant
   * print a thread otherwise than its feed). The account is the address a link names, or the
   * one at the place (/u/<n>) it names.
   */
  self.checkEmails.same = async links => {
    links = (typeof links === 'string' ? [links] : links || []).filter(l => typeof l === 'string');
    if (links.length === 0) {
      return [];
    }
    const objs = await self.checkEmails.getCached();
    const slots = slotsOf(objs);
    const wanted = links.map(link => {
      const named = /[?&]account_id=([^&#]+)/.exec(link);
      const n = helper.id(link);
      return {
        link,
        account: named ? decodeURIComponent(named[1]) : n === undefined ? undefined : slots[n],
        thread: helper.threadId(link)
      };
    });
    const done = new Set();
    for (const o of objs) {
      for (const e of o.xml.entries) {
        const thread = helper.threadId(e.link);
        if (wanted.some(w => w.link === e.link ||
          (!o.xml.service && w.account !== undefined && w.account === o.xml.title && w.thread !== '' && w.thread === thread))) {
          done.add(e.link);
        }
      }
    }
    return [...done];
  };
  /*
   * Opening a mail marks it as read in Gmail, so it has to leave the panel and
   * the badge. The feed cannot report it yet, therefore the link is stored like
   * a resolved one and is forgotten as soon as the feed agrees.
   * Only a listed entry counts: the link of the account, a mailto or a link of
   * the mail body is not a mail the user has read.
   */
  self.checkEmails.opened = async links => {
    const done = await self.checkEmails.same(links);
    if (done.length === 0) {
      return;
    }
    // Gmail marks a mail read by itself when it is opened in a tab, which takes
    // longer to reach the feed than an action sent to the server
    await Resolved.record(done, 20000);
    return self.checkEmails.refresh();
  };
  /*
   * A check that no Gmail feed answered met a network that is down (offline, a laptop just
   * awake, a timeout), not accounts that are signed out: the badge, the panel and the
   * resolved mail stay as they are, and no sign-in tab opens. A forced check shows the last
   * state again, which also ends its loading icon.
   */
  const keep = async forced => {
    log('[feed]', 'no answer from the network, the last state stays');
    if (retries < RETRY.length) {
      repeater.reset('network.retry', RETRY[retries]);
      retries += 1;
    }
    if (!forced && !loading) {
      return;
    }
    if ((await self.checkEmails.getCached()).length) {
      await self.checkEmails.refresh();
    }
    else {
      loading = false;
      button.icon = 'blue';
      button.badge = 0;
      chrome.storage.session.set({count: -1});
    }
  };
  self.checkEmails.execute = async forced => {
    if (navigator.onLine === false) {
      return keep(forced);
    }
    // a newer check takes over at once, even from one still reading its settings
    self.checkEmails.controller?.abort();
    const controller = self.checkEmails.controller = new AbortController();
    const signal = controller.signal;

    if (forced) {
      loading = true;
      button.icon = 'load';
      button.badge = 0;
      // do not use -1; if the user is logged out, the loading need to be stopped
      chrome.storage.session.set({count: 0});
    }
    const prefs = await read({
      'url': 'https://mail.google.com/mail/u/0',
      'labels': {},
      ...Object.fromEntries(LEGACY.map(k => [k, ''])),
      'feeds_custom': '',
      'timeout': 9000,
      'alphabetic': false,
      'notificationTruncate': 70,
      'combined': navigator.userAgent.includes('Firefox'),
      'maxReport': 3,
      'oldFashion': 0,
      'notification': true,
      'notification.buttons.markasread': true,
      'notification.buttons.archive': true,
      'notification.buttons.trash': false,
      'alert': true,
      'notificationFormat': chrome.i18n.getMessage('notification'),
      'notify.never': '',
      'notify.only': '',
      'notify.repeat': 0, // minutes; 0: a notification is not repeated
      'quiet.hours': false,
      'quiet.from': '22:00',
      'quiet.to': '08:00',
      'quiet.weekend': false,
      'accounts': {}
    });
    if (signal.aborted) {
      return log('[feed]', 'skipped');
    }

    const services = Services.collect(signal, prefs.timeout).catch(e => {
      log('[services]', 'error', e);
      return [];
    });

    // the labels of each place, as the feeds are planned
    const planned = {};
    const fdsr = buildFeeds(prefs, slotsOf(await self.checkEmails.getCached()), planned); // requested feeds
    if (signal.aborted) {
      return log('[feed]', 'skipped');
    }
    // do not reduce the feed list from cookies. It is not reliable
    const feeds = fdsr.map(feed => new Feed(feed, prefs.timeout, isPrivate));

    // the settings of an account, made when it is seen for the first time; a mailbox of another
    // service remembers which, so it can be signed in to again once it is signed out
    const meta = r => {
      const {title, service} = r.xml;
      if (!title) {
        return;
      }
      r.meta = prefs.accounts[title];
      if (!r.meta || (service && r.meta.service !== service)) {
        r.meta = prefs.accounts[title] = service ? {...r.meta, service} : r.meta || {};
        chrome.storage.local.set({
          accounts: prefs.accounts
        });
      }
    };

    try {
      const objs = [];
      let mn = -1; // keep track of the last logged-out account
      let top = -1; // the last signed-in account
      // a feed that answered at all, signed in or not; a signed-out account answers too
      let answered = false;
      // the feeds that did not answer (a timeout, an error), for their last answer
      const failed = [];
      // the places a feed answered at with its mail
      const fine = new Set();
      const uids = new Set();
      // The accounts signed in at the last check, and the one after them, which
      // tells a newly added account, are fetched all at once; the walk below
      // still meets them in order. Past them it fetches one by one as before.
      const {'accounts.count': known = 0} = await chrome.storage.session.get('accounts.count');
      const early = new Map(feeds.filter(feed => helper.id(feed.href) <= known).map(feed => [feed,
        feed.execute(signal).catch(e => signal.aborted === false && log('[feed]', 'error', e))]));
      for (const feed of feeds) {
        if (mn !== -1) {
          if (helper.id(feed.href) >= mn) { // belongs to a logged-out account
            continue;
          }
        }

        let r;
        if (early.has(feed)) {
          r = await early.get(feed);
          answered = answered || Boolean(r);
          // fetched out of order: a feed that repeats an earlier one is a logged-out account
          const uid = r?.xml?.id;
          if (uid && uids.has(uid)) {
            const n = helper.id(feed.href);
            mn = mn === -1 ? n : Math.min(mn, n);
            r = {network: true, notAuthorized: true, signedOut: true, xml: null, newIDs: []};
          }
          else if (uid) {
            uids.add(uid);
          }
        }
        else {
          r = await feed.execute(signal, uid => { // do not check logged-out feeds
            if (uid) {
              if (uids.has(uid)) { // this is a logged-out account
                const n = helper.id(feed.href);
                mn = mn === -1 ? n : Math.min(mn, n);

                return true;
              }
              uids.add(uid);
            }
          }).catch(e => signal.aborted === false && log('[feed]', 'error', e));
          answered = answered || Boolean(r);
        }
        if (signal.aborted) {
          return log('[feed]', 'skipped');
        }
        if (!r) {
          failed.push(feed);
          continue;
        }
        // Past the accounts signed in (Gmail sent the feed to the first account), or nobody signed
        // in at all: the walk ends. One account that needs its password again is left out alone,
        // the accounts after it are still there.
        const n = helper.id(feed.href);
        if (mn === -1 && (r.signedOut || (r.notAuthorized && n === 0 && !fine.has(0)))) {
          mn = n;
        }

        if (r && r.xml) {
          // only add logged-in accounts
          if (r.network && !r.notAuthorized && r.xml && r.xml.entries) {
            meta(r);
            objs.push(r);
            fine.add(n);
            top = Math.max(top, n ?? -1);
          }
        }
      }
      const boxes = await services;
      if (signal.aborted) {
        return log('[feed]', 'skipped');
      }
      // every Gmail feed failed (a fetch error, an error of Gmail's, the timeout): the network,
      // not a sign-out
      if (!answered) {
        return keep(forced);
      }
      retries = 0;
      // An account found at another place than the last check thought (one before it signed out,
      // the browser has just started) is asked again for its own labels; a feed of them asked
      // already stands.
      const found = slotsOf(objs);
      const again = Object.entries(found).filter(([n, address]) => labelsOf(prefs, address, n) !== planned[n]);
      if (again.length) {
        const answers = await Promise.all(again.map(([n, address]) => Promise.all(feedsAt(n, labelsOf(prefs, address, n)).map(href => {
          const feed = new Feed(href, prefs.timeout, isPrivate);
          const asked = objs.find(o => o.href === href);
          if (asked) {
            return [feed, asked];
          }
          return feed.execute(signal).then(r => [feed, r], e => {
            if (!signal.aborted) {
              log('[feed]', 'error', e);
            }
            return [feed];
          });
        }))));
        if (signal.aborted) {
          return log('[feed]', 'skipped');
        }
        for (const [i, [n]] of again.entries()) {
          const here = o => helper.id(o.href || '') === Number(n);
          // the ones that stand come back below, in the order of the new plan
          objs.splice(0, objs.length, ...objs.filter(o => !here(o)));
          failed.splice(0, failed.length, ...failed.filter(feed => !here(feed)));
          for (const [feed, r] of answers[i]) {
            if (r?.xml && r.network && !r.notAuthorized && r.xml.entries) {
              meta(r);
              objs.push(r);
            }
            else if (!r) {
              failed.push(feed);
            }
          }
        }
      }
      // a label setting of a place goes to the address of the account found there
      const legacy = LEGACY.filter((k, n) => prefs[k] && found[n] !== undefined);
      if (legacy.length) {
        // into the labels as they are stored now: the settings page may have saved meanwhile
        chrome.storage.local.get({labels: {}}).then(({labels}) => {
          for (const k of legacy) {
            const address = found[LEGACY.indexOf(k)];
            if (typeof labels[address] !== 'string') {
              labels[address] = prefs[k];
            }
          }
          moved = JSON.stringify(labels);
          return chrome.storage.local.set({labels});
        }).then(() => chrome.storage.local.remove(legacy)).catch(e => log('[feed]', 'labels', e));
      }
      // Gmail's clock against this one, from the feed that came the quickest: the time a feed
      // took to come only makes the difference look smaller
      const skews = objs.map(r => helper.time(r.xml.modified) - r.at).filter(Number.isFinite);
      const skew = skews.length ? Math.max(...skews) : Number((await read({[SKEW]: 0}, 'session'))[SKEW]) || 0;
      if (skews.length) {
        chrome.storage.session.set({[SKEW]: skew});
      }
      // a feed that did not answer shows what it said last, for a while, unless its account has
      // moved meanwhile: another account answers at its place, or it answers at another place
      if (failed.length) {
        const last = await self.checkEmails.getCached();
        for (const feed of failed) {
          const old = last.find(o => o.href === feed.href);
          const n = helper.id(feed.href);
          if (!old || !(Date.now() + skew - helper.time(old.xml.modified) < STALE) || (mn !== -1 && n >= mn) ||
            objs.some(o => (helper.id(o.href || '') === n && o.xml.title !== old.xml.title) ||
              (o.xml.title === old.xml.title && o.xml.label === old.xml.label))) {
            continue;
          }
          log('[feed]', 'no answer, the last one stays', feed.href);
          const r = {network: true, notAuthorized: false, href: feed.href, xml: old.xml, newIDs: [], commit() {}};
          meta(r);
          objs.push(r);
          top = Math.max(top, n ?? -1);
        }
      }
      for (const r of boxes) {
        meta(r);
        objs.push(r);
      }

      log('[feed]', 'forced', forced, 'objects', objs);
      chrome.storage.session.set({
        'accounts.count': top + 1
      });

      const isAuthorized = objs.length !== 0 && objs.some(c => !c.notAuthorized && c.network);
      const count = await new Promise(resolve => chrome.storage.session.get({
        count: -1
      }, prefs => resolve(prefs.count)));

      if (!isAuthorized) {
        loading = false;
        if (count !== -1) {
          button.icon = 'blue';
          button.badge = 0;
          chrome.storage.session.set({count: -1});
          chrome.storage.session.set({
            'cached-objects': [],
            [Resolved.KEY]: []
          });
          if (self.checkEmails.cached) {
            self.checkEmails.cached.length = 0;
          }
          context.accounts('logged.out');
        }
        if (forced) {
          self.openLink(prefs.url);
          toast(chrome.i18n.getMessage('log_into_your_account'));
        }
        button.label = chrome.i18n.getMessage('gmail');
        detach();

        log('[feed]', 'ignore checking', 'unauthorized');
        return;
      }
      // Sorting accounts
      objs.sort((a, b) => {
        if (!prefs.alphabetic && Boolean(a.xml.service) !== Boolean(b.xml.service)) {
          return a.xml.service ? 1 : -1;
        }
        const var1 = prefs.alphabetic ? a.xml.title : a.xml.link;
        const var2 = prefs.alphabetic ? b.xml.title : b.xml.link;
        if (var1 > var2) {
          return 1;
        }
        if (var1 < var2) {
          return -1;
        }
        return 0;
      });
      // simplified version of objs for storing and sending between contexts
      const simple = objs.map(o => {
        const xml = {
          ...o.xml
        };
        delete xml.parent;
        return {
          // the feed it came from: its last answer stands in for one that does not come
          ...(o.href ? {href: o.href} : {}),
          newIDs: o.newIDs,
          meta: o.meta,
          xml
        };
      });
      // what the badge, the panel and the notifications take: mail waiting for its
      // reminder stays out like a resolved one
      const cachedObjs = Resolved.apply(Resolved.apply(simple, await Resolved.prune(objs)),
        waiting(await Remind.read(), simple));
      if (signal.aborted) {
        return log('[feed]', 'skipped');
      }

      // the cache keeps the mail as the feeds told it (see getCached)
      self.checkEmails.cached = simple;
      chrome.storage.session.set({
        'cached-objects': simple
      });

      // save new emails
      for (const o of objs) {
        o.commit();
      }

      // New total count number
      const anyNewEmails = cachedObjs.filter(c => c.meta.ignored !== true).some(c => c.newIDs.length !== 0);
      let newCount = 0;
      for (const obj of cachedObjs) {
        if (!counted(obj)) {
          continue;
        }
        newCount += obj.xml.fullcount;
      }

      if (!anyNewEmails && !forced && count === newCount) {
        // Updating panel if it is open
        chrome.runtime.sendMessage({
          method: 'update-date',
          data: cachedObjs
        }, () => {
          if (chrome.runtime.lastError) {
            return;
          }
          // maybe the current email is marked as read but still count is 20 (max value for non inbox labels)
          chrome.runtime.sendMessage({
            method: 'validate-current',
            data: cachedObjs
          });
        });
        // a forced check that a newer one took over left its loading icon
        if (loading) {
          self.checkEmails.publish(cachedObjs);
        }
        // we could have a new account with no new emails; the menu lists accounts, not
        // the label feeds of one
        const accounts = new Set(objs.map(o => o.xml?.rootLink?.replace(/\?.*/, '')).filter(Boolean));
        chrome.storage.session.get({
          'accounts.keys': []
        }, prefs => {
          if (prefs['accounts.keys'].length !== accounts.size) {
            context.accounts('mismatch');
          }
        });

        return; // Everything is clear
      }
      //
      chrome.storage.session.set({count: newCount});
      //
      context.accounts('new.email');
      // Preparing the report
      const reportArray = [];
      // an entry must not be modified, it is shared with the cached objects
      const parents = new Map();
      // a quiet mailbox and the mail the word lists leave out still count, they only make no noise
      const loud = o => o.meta.ignored !== true && o.meta.quiet !== true;
      // the new mail that may make a noise, each once: a mail in two watched labels of one
      // account is listed by both feeds. Mail that is not new stays quiet, a forced check too.
      const fresh = (() => {
        const told = new Set();
        const list = [];
        for (const o of cachedObjs) {
          if (!loud(o) || !o.xml || !o.xml.entries) {
            continue;
          }
          for (const e of o.xml.entries) {
            const key = o.xml.rootLink + ' ' + e.id;
            if (o.newIDs.includes(e.id) && !told.has(key) && Quiet.wanted(e, prefs)) {
              told.add(key);
              list.push([e, o]);
            }
          }
        }
        return list;
      })();
      for (const [e, o] of fresh) {
        parents.set(e, o);
        reportArray.push(e);
      }
      // keep recent ones
      reportArray.sort((a, b) => {
        return (new Date(b.modified)).getTime() - (new Date(a.modified)).getTime();
      });
      reportArray.splice(prefs.maxReport, reportArray.length);
      // the inbox each mail came to: [account] in the text, and the title of a notification
      // about one inbox
      const inboxOf = e => parents.get(e)?.xml.title || '';
      const inboxes = [...new Set(reportArray.map(inboxOf))];
      const inboxTitle = inboxes.length === 1 ? inboxes[0] : '';

      let report = reportArray.map(e => prefs.notificationFormat
        .replace('[author_name]', e.author_name)
        .replace('[author_email]', e.author_email)
        .replace('[summary]', shorten(e.summary, prefs.notificationTruncate))
        .replace('[title]', shorten(e.title, prefs.notificationTruncate))
        // a function, so a $ in the address is taken as it is
        .replace('[account]', () => inboxOf(e))
        .replace(/\[break\]/g, '\n'));
      if (prefs.combined) {
        report = [report.join('\n\n')];
      }
      // Preparing the tooltip
      button.label = chrome.i18n.getMessage('gmail') + '\n\n' +
        cachedObjs.filter(c => c.meta.ignored !== true).reduce((p, c) => {
          return p +=
            c.xml.title +
            (c.xml.label ? ' [' + c.xml.label + ']' : '') +
            ' (' + c.xml.fullcount + ')\n';
        }, '').replace(/\n$/, '');
      //
      // nothing new, forced or not: the badge and the panel only
      if (!anyNewEmails) {
        self.checkEmails.publish(cachedObjs);
      }
      else {
        loading = false;
        // new mail only in inboxes left out of the count: the icon does not blink for it
        button.icon = cachedObjs.some(c => counted(c) && c.newIDs.length) ? 'new' : newCount ? 'red' : 'gray';
        // not awaited: from the commit above to the notification nothing may wait
        shown(cachedObjs, newCount).then(n => button.badge = n);
        chrome.storage.session.set({count: newCount});
        const singleAccount = prefs.oldFashion === 1 ?
          cachedObjs.filter(c => c.meta.ignored !== true)
            .map(o => o.xml.rootLink).filter((s, i, l) => l.indexOf(s) === i).length === 1 :
          prefs.oldFashion === 2;
        if (singleAccount) {
          detach();
        }
        else {
          attach();
        }

        // quiet hours, or nothing left that may make a noise: the badge alone tells
        const hushed = Quiet.hours(prefs) || reportArray.length === 0;
        if (hushed) {
          log('[feed]', 'notification and sound are held back', reportArray.length);
        }

        if (prefs.notification && !hushed) {
          const buttons = [];
          if (prefs['notification.buttons.markasread']) {
            buttons.push({
              title: chrome.i18n.getMessage('opt_btnRead'),
              iconUrl: '/data/images/read.png',
              action: {
                links: reportArray.map(o => o.link),
                cmd: 'rd'
              }
            });
          }
          // a service without an archive (Yandex, Mail.ru) gets no archive button
          if (prefs['notification.buttons.archive'] && reportArray.every(e => Services.of(e.link)?.can.archive !== false)) {
            buttons.push({
              title: chrome.i18n.getMessage('opt_btnArchive'),
              iconUrl: '/data/images/archive.png',
              action: {
                links: reportArray.map(o => o.link),
                cmd: 'rc_^i'
              }
            });
          }
          if (prefs['notification.buttons.trash']) {
            buttons.push({
              title: chrome.i18n.getMessage('opt_btnDelete'),
              iconUrl: '/data/images/trash.png',
              action: {
                links: reportArray.map(o => o.link),
                cmd: 'tr'
              }
            });
          }

          // convert links
          const links = [];
          for (const o of reportArray) {
            try {
              const account = parents.get(o);
              const base = helper.base(o.link);
              const thread = helper.thread(o.link);

              if (thread && account.xml.link.indexOf('#') === -1) {
                links.push(base + '/?shva=1#inbox/' + thread);
              }
              else if (thread) {
                links.push(account.xml.link + '/' + thread);
              }
              else {
                links.push(o.link);
              }
            }
            catch (e) {
              console.error(e);
              links.push(o.link);
            }
          }
          notify(report, inboxTitle, {
            cmd: 'open',
            links
          }, buttons.slice(0, 2));
          // the same notification comes back every few minutes while its mail stays unread
          if (prefs['notify.repeat'] > 0) {
            chrome.storage.session.set({
              'repeat.report': {
                links: reportArray.map(e => e.link),
                text: report,
                title: inboxTitle,
                click: {cmd: 'open', links},
                buttons: buttons.slice(0, 2)
              }
            });
            chrome.alarms.create('repeat.notify', {
              when: Date.now() + prefs['notify.repeat'] * 60000
            });
          }
          else {
            chrome.alarms.clear('repeat.notify');
            chrome.storage.session.remove('repeat.report');
          }
        }
        if (prefs.alert && !hushed) {
          // new entries only, each once
          sound.play(fresh.map(([e]) => e)).catch(e => toast(e.message));
        }
        chrome.runtime.sendMessage({
          method: 'update-reset',
          data: cachedObjs
        }, () => chrome.runtime.lastError);
      }
    }
    catch (e) {
      console.error(e);
    }
  };
}

