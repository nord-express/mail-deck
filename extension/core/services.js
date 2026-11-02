/* global log, offscreen */
// The mail services besides Gmail (core/services/*.js). A service is checked once the user
// turned it on in the settings and Chrome granted its hosts; its mailboxes then join the
// Gmail accounts as the same objects, so the badge, the panel and the notifications take
// them as they are. Everything a service is asked runs here, in the background.

{
  // local: the ids of the services turned on
  const KEY = 'services';
  // session: link -> {id, email, ref, at}, what an action or the reader needs of a listed mail
  const REFS = 'services.refs';
  // session: id -> {at, boxes}, the last answer of each service, for a check it fails
  const LAST = 'services.last';
  // a failed check shows the last answer this long, then the mailboxes go
  const STALE = 30 * 60 * 1000;
  // what an action or the reader waits for a service
  const WAIT = 15000;
  // the threads of one Gmail request: a larger action goes in parts, one after the other
  const CHUNK = 100;
  // the session rules that set a service's own Origin start here
  const RULE = 1000;

  const all = () => Object.values(self.MailServices || {});
  // the service a link belongs to
  const of = link => typeof link === 'string' ? all().find(s => s.hosts.some(h => link.startsWith(h))) : undefined;

  // the services turned on whose hosts Chrome still grants
  const enabled = async () => {
    const {[KEY]: ids = []} = await chrome.storage.local.get(KEY);
    const on = all().filter(s => ids.includes(s.id));
    const granted = await Promise.all(on.map(s => chrome.permissions.contains({origins: s.origins}).catch(() => false)));
    return on.filter((s, i) => granted[i]);
  };

  // what a rule does, to tell whether the session still has it
  const sig = r => JSON.stringify([r.id, r.condition?.urlFilter, r.condition?.initiatorDomains, r.condition?.tabIds,
    r.condition?.resourceTypes, (r.action?.requestHeaders || []).map(h => [h.header, h.operation, h.value])]);

  // Some services answer only requests that carry their own Origin. The rules touch nothing
  // but this extension's own requests.
  const rules = async () => {
    const dnr = chrome.declarativeNetRequest;
    if (!dnr?.updateSessionRules) {
      return;
    }
    const addRules = (await enabled()).flatMap(s => s.rewrite || []).map((r, i) => ({
      id: RULE + i,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [
          {header: 'origin', operation: 'set', value: r.origin},
          {header: 'referer', operation: 'set', value: r.origin + '/'}
        ]
      },
      condition: {
        urlFilter: r.urlFilter,
        initiatorDomains: [chrome.runtime.id],
        tabIds: [chrome.tabs.TAB_ID_NONE],
        resourceTypes: ['xmlhttprequest']
      }
    }));
    const old = (await dnr.getSessionRules()).filter(r => r.id >= RULE).sort((a, b) => a.id - b.id);
    // session rules outlive the worker but not the browser or an update: a worker that starts
    // finds them in place and leaves them
    if (old.length === addRules.length && old.every((r, i) => sig(r) === sig(addRules[i]))) {
      return;
    }
    await dnr.updateSessionRules({
      removeRuleIds: old.map(r => r.id),
      addRules
    });
  };
  let ready = rules().catch(e => log('[services]', 'rules', e));
  const sync = () => ready = ready.then(rules).catch(e => log('[services]', 'rules', e));
  chrome.storage.onChanged.addListener((ps, area) => area === 'local' && ps[KEY] && sync());
  chrome.permissions.onAdded?.addListener(sync);
  chrome.permissions.onRemoved?.addListener(sync);

  // a mailbox as the check builds a Gmail one (core/utils/feed.js), new mail told the same way
  const box = async (s, b, now, threatAsNew, known) => {
    const email = String(b.email || '').toLowerCase();
    const entries = (b.entries || []).slice(0, 20).map(e => ({
      ...e,
      title: e.title || '',
      summary: e.summary || '',
      author_name: e.author_name || e.author_email || '',
      author_email: e.author_email || ''
    }));
    const key = 'ids.account.' + email;
    const seen = known[key] || [];
    const newIDs = [];
    const oldIDs = [];
    for (const {id, modified} of entries) {
      if (now - Date.parse(modified) > threatAsNew * 60000 || seen.includes(id)) {
        oldIDs.push(id);
      }
      else {
        newIDs.push(id);
      }
    }
    return {
      network: true,
      notAuthorized: false,
      xml: {
        id: s.id + ':' + email,
        title: email,
        label: '',
        service: s.id,
        fullcount: Math.max(Number(b.unread) || 0, entries.length),
        modified: new Date(now).toISOString(),
        rootLink: b.inbox,
        link: b.inbox,
        authorized: true,
        entries
      },
      newIDs,
      commit() {
        if (newIDs.length) {
          chrome.storage.local.set({[key]: [...oldIDs, ...newIDs]});
        }
      }
    };
  };

  /*
   * The mailboxes of every service turned on, asked all at once and never for longer than
   * timeout. A service that fails keeps its last answer for a while, so a moment of a bad
   * network does not take its mailboxes out of the panel and put them back.
   */
  const collect = async (signal, timeout) => {
    const on = await enabled();
    if (on.length === 0) {
      return [];
    }
    await ready;
    const {[LAST]: last = {}, [REFS]: refs = {}} = await chrome.storage.session.get([LAST, REFS]);
    // aborted meanwhile: its 'abort' event has passed and would not reach the services
    if (signal.aborted) {
      return [];
    }
    const answers = await Promise.all(on.map(async s => {
      const controller = new AbortController();
      const stop = () => controller.abort();
      const timer = setTimeout(stop, timeout);
      signal.addEventListener('abort', stop);
      try {
        const boxes = (await s.collect({signal: controller.signal})).filter(b => b?.email && b.inbox);
        last[s.id] = {at: Date.now(), boxes};
        return [s, boxes, true];
      }
      catch (e) {
        if (!signal.aborted) {
          log('[services]', s.id, e?.message || e);
        }
        const old = last[s.id];
        return [s, old && Date.now() - old.at < STALE ? old.boxes : [], false];
      }
      finally {
        clearTimeout(timer);
        signal.removeEventListener('abort', stop);
      }
    }));
    if (signal.aborted) {
      return [];
    }
    const now = Date.now();
    const emails = answers.flatMap(([, boxes]) => boxes.map(b => 'ids.account.' + String(b.email).toLowerCase()));
    const known = await chrome.storage.local.get({...Object.fromEntries(emails.map(k => [k, []])), threatAsNew: 10});
    const objs = [];
    for (const [s, boxes, fresh] of answers) {
      for (const b of boxes) {
        const o = await box(s, b, now, known.threatAsNew, known);
        // an old answer has told its new mail already
        if (!fresh) {
          o.newIDs = [];
        }
        objs.push(o);
        for (const e of o.xml.entries) {
          refs[e.link] = {id: s.id, email: o.xml.title, ref: e.ref, at: now};
        }
      }
    }
    // a mail acted on a while ago is still undone or still waits for its Undo: an hour is plenty
    for (const [link, r] of Object.entries(refs)) {
      if (now - r.at > 3600000) {
        delete refs[link];
      }
    }
    chrome.storage.session.set({[LAST]: last, [REFS]: refs});
    return objs;
  };

  const lookup = async links => {
    const {[REFS]: refs = {}} = await chrome.storage.session.get(REFS);
    return links.map(link => refs[link]);
  };
  // an error, with the links it leaves undone (failed) when that is not all of them
  const fail = (s, e, failed) => ({message: (s ? s.name + ': ' : '') + (e?.message || String(e)), ...(failed ? {failed} : {})});

  // the links of one request may come from several mailboxes: each gets one call
  const action = async request => {
    const groups = new Map();
    const found = await lookup(request.links);
    for (const [i, r] of found.entries()) {
      if (!r || !self.MailServices[r.id]) {
        return fail(of(request.links[0]), chrome.i18n.getMessage('panel_actionFailed') || 'Unknown mail');
      }
      const key = r.id + ' ' + r.email;
      if (!groups.has(key)) {
        groups.set(key, {s: self.MailServices[r.id], email: r.email, refs: [], links: []});
      }
      groups.get(key).refs.push(r.ref);
      groups.get(key).links.push(request.links[i]);
    }
    // nothing is sent while one of the mailboxes cannot take the command
    const unable = [...groups.values()].find(({s}) =>
      (request.cmd === 'rc_^i' && !s.can?.archive) || (request.cmd === 'sp' && !s.can?.spam));
    if (unable) {
      return fail(unable.s, 'not supported');
    }
    // the mailboxes are asked at once, so one that fails does not keep the others from theirs
    const results = await Promise.all([...groups.values()].map(async ({s, email, refs}) => {
      try {
        await s.action({cmd: request.cmd, email, refs, prefs: request.prefs || {}, signal: AbortSignal.timeout(WAIT)});
        return true;
      }
      catch (e) {
        return fail(s, e);
      }
    }));
    const failed = [...groups.values()].filter((g, i) => results[i] !== true).flatMap(g => g.links);
    return failed.length ? {...results.find(r => r !== true), failed} : true;
  };
  // one Gmail account's mail, in parts: a part that fails leaves it and the ones after it undone
  const gmail = async (request, links) => {
    for (let i = 0; i < links.length; i += CHUNK) {
      const r = await offscreen.command({cmd: 'gmail.action', request: {...request, links: links.slice(i, i + CHUNK)}});
      if (r !== true) {
        return {...(r || {message: 'No answer'}), failed: links.slice(i)};
      }
    }
    return true;
  };

  self.Services = {
    KEY,
    all,
    of,
    enabled,
    collect,
    action,
    /*
     * Gmail's links go to the offscreen document, a service's to the service. True when all of
     * it is done; else the first error, with the links left undone (failed): mail of the other
     * accounts may be done, and stays so.
     */
    async dispatch(request) {
      const mine = request.links.filter(link => of(link));
      // Gmail takes one account's mail a request (its mail/u/N), so mail of several goes in one each
      const accounts = new Map();
      for (const link of request.links.filter(link => !of(link))) {
        const n = (link.match(/u\/(\d+)/) || [])[1] || '0';
        accounts.set(n, [...accounts.get(n) || [], link]);
      }
      // every account and service at once
      const parts = await Promise.all([[mine, mine.length && action({...request, links: mine})],
        ...[...accounts.values()].map(links => [links, gmail(request, links)])].map(async ([links, p]) =>
        [links, p ? await p.catch(e => fail(null, e)) : true]));
      const failed = parts.flatMap(([links, r]) => r === true ? [] : Array.isArray(r?.failed) ? r.failed : links);
      return failed.length ? {...parts.find(([, r]) => r !== true)[1], failed} : true;
    },
    // the settings' diagnostics: what the service answers now, read only
    async check(id) {
      const s = self.MailServices?.[id];
      if (!s) {
        return fail(null, 'Unknown service');
      }
      await ready;
      try {
        const boxes = await s.collect({signal: AbortSignal.timeout(WAIT)});
        return {boxes: boxes.map(b => ({email: b.email, unread: Number(b.unread) || 0}))};
      }
      catch (e) {
        return fail(s, e);
      }
    },
    // the messages of a listed mail for the panel's reader, oldest first
    async body(link) {
      const [r] = await lookup([link]);
      const s = r && self.MailServices[r.id];
      if (!s?.can?.body) {
        return fail(s, 'No body');
      }
      try {
        return {messages: await s.body({email: r.email, ref: r.ref, signal: AbortSignal.timeout(WAIT)})};
      }
      catch (e) {
        return fail(s, e);
      }
    }
  };
}
