'use strict';
// How the settings page looks and moves: the hero and what it says needs a look, the rail with
// its search and the section in view, More options, the save state, word lists as chips, the
// quiet hours' day, the notification text's preview, the dialogs. The settings themselves, their
// storage and their checks stay in index.js, loaded before: this file reads its state (prefs, the
// AI's, the inboxes') and changes a setting only through the page's own fields and their change
// event. index.js calls UI.start() once the settings are on the page; until then every hook it
// calls does nothing, so the page's parts also run on their own (tools/test/settings.test.js).
const UI = (() => {
  // the panel's icons (data/panel/index.js), 24 by 24 and drawn with a 1.8 stroke, and this page's own
  const ICONS = {
    mail: ['M4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11A1.5 1.5 0 0 1 4.5 5Z', 'M3.5 7l8.5 6 8.5-6'],
    sparkle: ['M11 3.5l1.9 4.6 4.6 1.9-4.6 1.9L11 16.5l-1.9-4.6L4.5 10l4.6-1.9Z', 'M18.5 14.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9Z'],
    spark: ['M12 3.5l2.1 5.4 5.4 2.1-5.4 2.1L12 18.5l-2.1-5.4L4.5 11l5.4-2.1Z'],
    side: ['M4.5 4h15A1.5 1.5 0 0 1 21 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-13A1.5 1.5 0 0 1 4.5 4Z', 'M15 4v16'],
    open: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
    search: ['M10.5 17a6.5 6.5 0 1 0 0-13a6.5 6.5 0 0 0 0 13Z', 'M15.5 15.5L20 20'],
    done: ['M4 12.5l5 5L20 6.5'],
    close: ['M6.5 6.5l11 11', 'M17.5 6.5l-11 11'],
    down: ['M6 9l6 6 6-6'],
    copy: ['M11 9h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z', 'M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3'],
    shield: ['M12 3l8 3.5v5.5c0 4.5-3.4 7.7-8 9-4.6-1.3-8-4.5-8-9V6.5Z'],
    download: ['M12 4v11', 'M7.5 10.5L12 15l4.5-4.5', 'M5 19.5h14'],
    upload: ['M12 15V4', 'M7.5 8.5L12 4l4.5 4.5', 'M5 19.5h14'],
    bell: ['M6 10a6 6 0 0 1 12 0c0 4.6 1.6 6.1 2 6.5H4c.4-.4 2-1.9 2-6.5Z', 'M10 19.5a2 2 0 0 0 4 0'],
    volume: ['M4 9.5h3.5L12 5.5v13l-4.5-4H4Z', 'M15.5 9a4 4 0 0 1 0 6', 'M18 6.5a7.5 7.5 0 0 1 0 11'],
    moon: ['M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z'],
    badge: ['M13 4.5H6A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h12a1.5 1.5 0 0 0 1.5-1.5v-7', 'M18 8.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5Z'],
    cloud: ['M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.1 4.75 4.75 0 0 0 7 18.5Z'],
    help: ['M12 20.5a8.5 8.5 0 1 0 0-17a8.5 8.5 0 0 0 0 17Z', 'M9.8 9.3a2.3 2.3 0 1 1 3.1 2.1c-.5.2-.9.7-.9 1.2v.6', 'M12 16.2v.1'],
    key: ['M14.5 14a5 5 0 1 0-4.6-3L3.5 17.4v3.1h3v-2h2v-2h2l1.3-1.3A5 5 0 0 0 14.5 14Z', 'M16 8h.01'],
    chip: ['M8 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z', 'M10 10h4v4h-4Z', 'M9.5 3v3M14.5 3v3M9.5 18v3M14.5 18v3M3 9.5h3M3 14.5h3M18 9.5h3M18 14.5h3'],
    off: ['M12 20.5a8.5 8.5 0 1 0 0-17a8.5 8.5 0 0 0 0 17Z', 'M6 6l12 12'],
    alert: ['M10.3 4.6a2 2 0 0 1 3.4 0l7.4 12.9a2 2 0 0 1-1.7 3H4.6a2 2 0 0 1-1.7-3Z', 'M12 10v4', 'M12 17v.1'],
    eye: ['M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z', 'M12 14.75a2.75 2.75 0 1 0 0-5.5a2.75 2.75 0 0 0 0 5.5Z'],
    eyeOff: ['M3.5 3.5l17 17', 'M10.6 5.6c.5-.07.9-.1 1.4-.1 6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4', 'M6.5 6.9C3.9 8.6 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.8 0 3.3-.6 4.6-1.4', 'M9.9 10a2.75 2.75 0 0 0 3.9 3.9'],
    play: ['M8 5.5v13l10.5-6.5Z'],
    pause: ['M9 6v12', 'M15 6v12'],
    plus: ['M12 5.5v13', 'M5.5 12h13'],
    dash: ['M7 12h10'],
    info: ['M12 20.5a8.5 8.5 0 1 0 0-17a8.5 8.5 0 0 0 0 17Z', 'M12 11v5', 'M12 8v.1'],
    pin: ['M9.5 3.5h5l-.8 6 3.3 3.5H7l3.3-3.5Z', 'M12 13v7.5'],
    refresh: ['M20 12a8 8 0 1 1-2.34-5.66', 'M20 4v5h-5']
  };
  const NS = 'http://www.w3.org/2000/svg';
  const icon = (name, className = '') => {
    if (typeof document.createElementNS !== 'function') {
      return h('span', {className});
    }
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    if (className) {
      svg.setAttribute('class', className);
    }
    for (const d of ICONS[name] || []) {
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d);
      svg.append(path);
    }
    return svg;
  };
  // <i data-icon="name"> in the page becomes its picture, keeping its class
  const icons = () => document.querySelectorAll('i[data-icon]').forEach(i => i.replaceWith(icon(i.dataset.icon, i.className)));

  // what this browser remembers of the page (open sections, a dismissed hint): a convenience that
  // may be missing, never a setting
  const remember = {
    get: key => {
      try {
        return localStorage.getItem(key);
      }
      catch (e) {
        return null;
      }
    },
    set: (key, value) => {
      try {
        if (value === null) {
          localStorage.removeItem(key);
        }
        else {
          localStorage.setItem(key, value);
        }
      }
      catch (e) {}
    }
  };
  const media = query => typeof matchMedia === 'function' && matchMedia(query).matches;
  const smooth = () => media('(prefers-reduced-motion: reduce)') ? 'auto' : 'smooth';
  const narrow = () => media('(max-width: 999px)');
  let started = false;

  /* the save state: idle, saving, saved (in Chrome sync too), or what went wrong */
  let saveTimer;
  let slowTimer;
  let liveTimer;
  let pending = 0;
  const setSave = (state, text) => {
    $('save-state').dataset.state = state;
    $('save-text').textContent = text;
    // a screen reader hears where it ends up, not every step on the way
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => {
      $('save-live').textContent = state === 'saved' || state === 'error' ? text : '';
    }, 600);
  };
  const idle = () => setSave('idle', t('savedHint'));
  // a save underway; "Saving…" shows only when it takes a moment, then "Saved" for 2.5 s
  const saved = promise => {
    pending += 1;
    clearTimeout(saveTimer);
    clearTimeout(slowTimer);
    slowTimer = setTimeout(() => pending && setSave('saving', t('saving')), 150);
    return Promise.resolve(promise).then(() => {
      pending -= 1;
      if (pending === 0) {
        clearTimeout(slowTimer);
        setSave('saved', prefs['sync.settings'] ? t('savedSync') : t('saved'));
        saveTimer = setTimeout(idle, 2500);
      }
    }, e => {
      pending -= 1;
      clearTimeout(slowTimer);
      setSave('error', t('saveFailed', e?.message || String(e)));
      saveTimer = setTimeout(idle, 8000);
    });
  };

  /* More options: the rest of a section, shown in place; which are open is remembered here */
  const MORE = 'more';
  const sections = () => [...document.querySelectorAll('main > section')];
  // the ids of the sections left open; the Essentials / Everything switch of before becomes all
  // of them open for Everything, once
  const openList = () => {
    let list = null;
    try {
      list = JSON.parse(remember.get(MORE));
    }
    catch (e) {}
    if (!Array.isArray(list)) {
      list = remember.get('scope') === 'all' ? sections().map(s => s.id) : [];
      remember.set(MORE, JSON.stringify(list));
      remember.set('scope', null);
    }
    return list.filter(id => typeof id === 'string');
  };
  // how many settings wait under More options: each row the page shows (the AI's go while it is
  // off), and each kind of an inbox's own
  const moreCount = section => section.querySelectorAll('.row.adv:not([hidden])').length +
    new Set([...section.querySelectorAll('[data-adv]')].map(el => el.dataset.adv)).size;
  const paintMore = section => {
    const button = section.querySelector('.more');
    if (!button) {
      return;
    }
    const n = moreCount(section);
    button.hidden = n === 0;
    button.setAttribute('aria-expanded', String(section.dataset.more === 'open'));
    const count = button.querySelector('.n');
    if (count) {
      count.textContent = n ? new Intl.NumberFormat(uiLang()).format(n) : '';
    }
  };
  // keep: remembered for the next visit (a click), or for this one only (a link, a search result)
  const setMore = (section, open, keep = true) => {
    if (!section) {
      return;
    }
    const was = section.dataset.more === 'open';
    section.dataset.more = open ? 'open' : 'closed';
    paintMore(section);
    if (keep) {
      const list = new Set(openList());
      if (open) {
        list.add(section.id);
      }
      else {
        list.delete(section.id);
      }
      remember.set(MORE, JSON.stringify([...list]));
    }
    if (open && !was && started) {
      flash([...section.querySelectorAll('.row.adv, [data-adv]')]);
    }
  };
  // a moment of the accent on what was just shown
  const flash = els => {
    if (media('(prefers-reduced-motion: reduce)')) {
      return;
    }
    for (const el of els) {
      el.classList.remove('flash');
      // a reflow between restarts the animation
      void el.offsetWidth;
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 900);
    }
  };
  // a link to a setting under a section's More options opens them, for this visit
  const reveal = el => {
    const section = el?.closest?.('main > section');
    if (section && el.closest('.adv') && section.dataset.more !== 'open') {
      setMore(section, true, false);
    }
    return section || null;
  };
  const startMore = () => {
    const open = new Set(openList());
    for (const section of sections()) {
      section.dataset.more = open.has(section.id) ? 'open' : 'closed';
      paintMore(section);
      const button = section.querySelector('.more');
      if (button) {
        button.onclick = () => {
          const opening = section.dataset.more !== 'open';
          // what had the focus may be about to go out of sight: it moves to the button
          if (!opening && document.activeElement?.closest?.('.adv')) {
            button.focus();
          }
          setMore(section, opening);
        };
      }
    }
  };

  /* search: rows by their words, without case or accents; the words found are marked */
  const fold = text => String(text).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  // where a folded query is in a text, as [start, end] of the text itself
  const marks = (text, q) => {
    if (!q) {
      return [];
    }
    let flat = '';
    const from = [];
    const to = [];
    for (let i = 0; i < text.length;) {
      const ch = String.fromCodePoint(text.codePointAt(i));
      for (const c of fold(ch)) {
        flat += c;
        from.push(i);
        to.push(i + ch.length);
      }
      i += ch.length;
    }
    const found = [];
    for (let at = flat.indexOf(q); at !== -1; at = flat.indexOf(q, at + q.length)) {
      found.push([from[at], to[at + q.length - 1]]);
    }
    return found;
  };
  // the words of a row a search looks at: its label, its description, its chips
  const PARTS = 'b, small, .chip > span';
  const partsOf = unit => [...unit.querySelectorAll(PARTS)].filter(el => !el.hidden);
  const hit = (el, q) => fold(el?.textContent || '').includes(q);
  let query = '';
  // how well each row shown matches: 2 by its section's or group's title or its own label, 1 by
  // the words under it; Enter goes to the best one first
  let ranks = new Map();
  const search = text => {
    query = String(text || '').trim();
    const q = fold(query);
    if (q) {
      document.body.dataset.search = 'on';
    }
    else {
      delete document.body.dataset.search;
    }
    const found = [];
    ranks = new Map();
    let any = false;
    const missed = new Set();
    for (const section of sections()) {
      const all = hit(section.querySelector('h2'), q);
      if (all) {
        found.push(section.querySelector('h2'));
      }
      let seen = false;
      const cards = new Map();
      const groups = new Map();
      for (const unit of section.querySelectorAll('.row, .engines')) {
        const card = unit.closest('.card');
        const group = unit.closest('.group');
        if (!cards.has(card)) {
          cards.set(card, false);
        }
        if (group && !groups.has(group)) {
          groups.set(group, false);
          if (q && hit(group.querySelector('h3'), q)) {
            found.push(group.querySelector('h3'));
          }
        }
        // what the page hides for now (another engine's rows, a row a switch leaves out) stays hidden
        if (unit.closest('[hidden]')) {
          delete unit.dataset.miss;
          continue;
        }
        const parts = unit.matches?.('.engines') ? [...unit.querySelectorAll('b, small')] : partsOf(unit);
        const words = parts.filter(el => hit(el, q));
        const titled = all || (group && hit(group.querySelector('h3'), q));
        const shown = !q || titled || words.length > 0;
        found.push(...words);
        if (q && shown) {
          ranks.set(unit, titled || words.some(el => el.tagName === 'B') ? 2 : 1);
        }
        if (shown) {
          delete unit.dataset.miss;
          cards.set(card, true);
          if (group) {
            groups.set(group, true);
          }
          seen = true;
        }
        else {
          unit.dataset.miss = '';
        }
      }
      for (const [el, shown] of [...cards, ...groups]) {
        if (!el) {
          continue;
        }
        if (shown || !q) {
          delete el.dataset.miss;
        }
        else {
          el.dataset.miss = '';
        }
      }
      if (seen || !q) {
        delete section.dataset.miss;
        any = true;
      }
      else {
        section.dataset.miss = '';
        missed.add(section.id);
      }
    }
    for (const a of document.querySelectorAll('#nav a')) {
      if (missed.has(a.hash.slice(1))) {
        a.dataset.missSection = '';
      }
      else {
        delete a.dataset.missSection;
      }
    }
    $('no-match').hidden = !q || any;
    $('no-match-text').textContent = q && !any ? t('noMatch', query) : '';
    highlight(found, q);
    return {any, missed: [...missed]};
  };
  // the words found, marked with the Custom Highlight API: nothing in the page is rewritten
  const highlight = (els, q) => {
    if (typeof CSS === 'undefined' || !CSS.highlights || typeof Highlight !== 'function') {
      return;
    }
    const ranges = [];
    for (const el of new Set(els)) {
      const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let node = walk.nextNode(); node; node = walk.nextNode()) {
        for (const [start, end] of marks(node.data, q)) {
          const range = document.createRange();
          range.setStart(node, start);
          range.setEnd(node, end);
          ranges.push(range);
        }
      }
    }
    if (ranges.length) {
      CSS.highlights.set('settings', new Highlight(...ranges));
    }
    else {
      CSS.highlights.delete('settings');
    }
  };
  // Enter: the setting found that matches best (then the first), its control focused
  const firstFound = () => {
    const units = [...ranks].filter(([unit]) => unit.dataset.miss === undefined && !unit.closest('[hidden]'));
    const best = units.find(([, rank]) => rank === 2) || units[0];
    if (!best) {
      return null;
    }
    const unit = best[0];
    // the engine picked; a row's own control (an inbox's switch, not its first chip); else the first one in it
    return unit.matches('.engines') ? unit.querySelector('input:checked') :
      unit.querySelector(':scope > input, :scope > select, :scope > .segmented input:checked, :scope > .tokens input, :scope > button') ||
      unit.querySelector('input:not([hidden]), select, textarea:not([hidden]), button, a[href]');
  };
  const clearSearch = () => {
    $('search').value = '';
    search('');
  };
  const startSearch = () => {
    const field = $('search');
    field.oninput = () => {
      search(field.value);
      // the results start at the top of the page, the rail on the first section found
      if ($('main').getBoundingClientRect().top < 0) {
        scrollTo({top: 0});
      }
      const first = sections().find(s => s.dataset.miss === undefined);
      if (first) {
        setCurrent(first.id);
      }
    };
    field.onkeydown = ev => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        const el = firstFound();
        if (el) {
          el.focus();
          el.scrollIntoView({block: 'center', behavior: smooth()});
        }
      }
      else if (ev.key === 'Escape') {
        if (field.value) {
          ev.preventDefault();
          clearSearch();
        }
        else {
          field.blur();
        }
      }
    };
    $('search-clear').onclick = () => {
      clearSearch();
      field.focus();
    };
    // "/" anywhere but in a field goes to the search
    document.addEventListener('keydown', ev => {
      const el = document.activeElement;
      const typing = el?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName || '');
      if (ev.key === '/' && !typing && !ev.metaKey && !ev.ctrlKey && !ev.altKey && !document.querySelector('dialog[open]')) {
        ev.preventDefault();
        field.focus();
        field.select();
      }
    });
  };

  /* the rail: the section in view is the lifted one; a click scrolls there without a new hash */
  const setCurrent = id => {
    for (const a of document.querySelectorAll('#nav a')) {
      if (a.hash === '#' + id) {
        if (a.getAttribute('aria-current') !== 'location') {
          a.setAttribute('aria-current', 'location');
          // the bar of a narrow page keeps its pill in sight
          if (narrow()) {
            a.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: smooth()});
          }
        }
      }
      else {
        a.removeAttribute('aria-current');
      }
    }
  };
  // a click on the rail picks its section for as long as the page scrolls there: a short one
  // never reaches the line the reading is followed by
  let held = 0;
  const startRail = () => {
    $('nav').onclick = ev => {
      const a = ev.target.closest('a');
      const section = a && $(a.hash.slice(1));
      if (!section) {
        return;
      }
      ev.preventDefault();
      if (section.dataset.miss !== undefined) {
        clearSearch();
      }
      setCurrent(section.id);
      held = Date.now() + 1000;
      history.replaceState(null, '', a.hash);
      section.scrollIntoView({block: 'start', behavior: smooth()});
      // the focus follows, to the section's title, without a second scroll
      const title = section.querySelector('h2');
      title.tabIndex = -1;
      title.focus({preventScroll: true});
    };
    const list = sections();
    if (list.length === 0) {
      return;
    }
    setCurrent(list[0].id);
    // the section being read: the last whose top is above a line at 30% of the window, so a short
    // one and the gap after it count as it; at the end of the page, the last
    const pick = () => {
      if (Date.now() < held) {
        return;
      }
      const shown = list.filter(s => s.dataset.miss === undefined);
      const end = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
      const line = innerHeight * .3;
      const current = end ? shown.at(-1) : shown.filter(s => s.getBoundingClientRect().top <= line).at(-1) || shown[0];
      if (current) {
        setCurrent(current.id);
      }
    };
    // looked at as sections cross a band at 30-40% of the window, and once a frame while it scrolls
    if (typeof IntersectionObserver === 'function') {
      const spy = new IntersectionObserver(pick, {rootMargin: '-30% 0px -60% 0px'});
      list.forEach(s => spy.observe(s));
    }
    let frame = 0;
    addEventListener('scroll', () => {
      frame ||= requestAnimationFrame(() => {
        frame = 0;
        pick();
      });
    }, {passive: true});
  };

  /* the hero: how many inboxes, what needs a look, the AI, quiet hours, a pause */
  const clock = hhmm => {
    const m = Quiet.minutes(hhmm);
    if (isNaN(m)) {
      return hhmm;
    }
    return new Intl.DateTimeFormat(uiLang(), {hour: 'numeric', minute: '2-digit'}).format(new Date(2000, 0, 1, Math.floor(m / 60), m % 60));
  };
  const weekendDays = () => Quiet.weekend(self.navigator?.language || uiLang());
  // the AI as the hero tells it: the model or the engine, or that it needs setting up
  const aiState = () => {
    const engine = prefs['ai.engine'];
    if (!AI_ENGINES.includes(engine) || engine === 'off') {
      return {text: t('aiOffChip'), dot: 'off', href: '#ai'};
    }
    const setup = {text: t('aiSetup'), tone: 'warn', dot: 'warn', href: '#ai-' + engine};
    const model = () => {
      const id = prefs[aiModelKey(engine)];
      const list = aiLists[engine];
      return (Array.isArray(list) && list.find(m => m.id === id)?.name) || id;
    };
    if (engine === 'builtin') {
      return ['unavailable', 'old-chrome', 'downloadable'].includes(builtinShown) ? setup : {text: t('aiBuiltin'), icon: 'sparkle', href: '#ai'};
    }
    if (engine === 'chatgpt') {
      return aiAccount?.plan && aiAccess.chatgpt && !aiAccount.limit ? {text: model() || t('aiPlan'), icon: 'sparkle', href: '#ai'} : setup;
    }
    return aiKeyOf(engine) && aiAccess[engine] ? {text: model() || AI_PROVIDERS[engine].name, icon: 'sparkle', href: '#ai'} : setup;
  };
  // the link of a chip goes there even when it is the address already
  const go = hash => {
    history.replaceState(null, '', hash);
    followHash();
    followSection();
  };
  const chip = ({text, count, icon: name, dot, tone, href, onclick, label}) => {
    const el = h(href ? 'a' : 'button', {className: 'chip-s' + (tone ? ' ' + tone : '')});
    if (href) {
      el.href = href;
      el.onclick = ev => {
        ev.preventDefault();
        go(href);
      };
    }
    else {
      el.type = 'button';
      el.onclick = onclick;
    }
    if (label) {
      el.title = label;
      el.setAttribute('aria-label', label);
    }
    el.append(dot ? h('span', {className: 'dot' + (dot === true ? '' : ' ' + dot)}) : icon(name), h('span', {textContent: text}));
    if (count !== undefined) {
      el.append(h('b', {textContent: new Intl.NumberFormat(uiLang()).format(count)}));
    }
    // a chip that does something rather than goes somewhere says so at its end
    if (onclick) {
      el.append(icon('play', 'act'));
    }
    return el;
  };
  let paused = null;
  const readPause = async () => {
    const {silent} = await chrome.storage.session.get({silent: false}).catch(() => ({}));
    if (!silent) {
      paused = null;
      return;
    }
    const alarm = await Promise.resolve(chrome.alarms?.get('resume.alarm')).catch(() => null);
    paused = {until: alarm?.scheduledTime || 0};
  };
  // notifications back on, as the toolbar menu's own Resume does (core/context.js)
  const resume = () => {
    chrome.alarms?.clear('resume.alarm');
    return chrome.storage.session.set({silent: false});
  };
  let statusTimer;
  const status = () => {
    if (!started) {
      return;
    }
    clearTimeout(statusTimer);
    statusTimer = setTimeout(paintStatus, 30);
  };
  const paintStatus = () => {
    const chips = [];
    const attn = new Set();
    // the inboxes, once the page has read them
    if (shownShape !== null) {
      const shown = [...accountRows.values()].filter(r => r.toggle.checked).length;
      if (accountRows.size === 0) {
        chips.push(chip({text: t('noInboxesTitle'), dot: 'warn', tone: 'warn', href: '#accounts'}));
        attn.add('accounts');
      }
      else {
        chips.push(chip({text: t('inboxes'), count: shown, dot: true, href: '#accounts'}));
      }
    }
    for (const row of serviceRows.values()) {
      if (!row.note.hidden) {
        chips.push(chip({text: t('needsAccess', row.service.name), dot: 'warn', tone: 'warn', href: '#services'}));
        attn.add('accounts');
      }
    }
    const ai = aiState();
    chips.push(chip(ai));
    if (ai.tone === 'warn') {
      attn.add('ai');
    }
    if (prefs['quiet.hours'] && prefs['quiet.from'] !== prefs['quiet.to']) {
      const now = Quiet.hours(prefs, new Date(), weekendDays());
      chips.push(chip({text: now ? t('quietNow') : t('quietChip', clock(prefs['quiet.from']), clock(prefs['quiet.to'])), icon: 'moon', href: '#quiet'}));
    }
    if (paused) {
      const until = paused.until > Date.now() ? new Intl.DateTimeFormat(uiLang(), {hour: 'numeric', minute: '2-digit'}).format(paused.until) : '';
      chips.push(chip({text: until ? t('pausedUntil', until) : t('paused'), icon: 'pause', label: t('resume'), onclick: () => resume().then(status)}));
    }
    $('status').replaceChildren(...chips);
    // the inboxes drawn since: their own settings under More options count too
    sections().forEach(paintMore);
    for (const a of document.querySelectorAll('#nav a')) {
      if (attn.has(a.hash.slice(1))) {
        a.dataset.attn = '';
      }
      else {
        delete a.dataset.attn;
      }
    }
  };

  /* an inbox's picture: Google's, or its first letter on the panel's colour; a service's initial on it */
  const avatar = (name, color, url, service) => {
    const el = h('span', {className: 'avatar', textContent: (name[0] || '?').toUpperCase()});
    el.style.setProperty('--c', color);
    el.setAttribute('aria-hidden', 'true');
    if (typeof url === 'string' && url.startsWith('https://lh3.googleusercontent.com/')) {
      const img = h('img', {alt: '', referrerPolicy: 'no-referrer', decoding: 'async'});
      img.onload = () => el.classList.add('pic');
      img.onerror = () => img.remove();
      img.src = url;
      el.append(img);
    }
    if (service) {
      el.append(h('span', {className: 'svc', textContent: service.name[0]}));
    }
    return el;
  };

  /* a word list as chips */
  // Enter adds what is typed, a paste of several lines (labels: commas too) adds each one, and
  // Backspace in the empty field takes the last one off. It writes the field it stands for (the
  // textarea's lines, the labels' commas) and fires its change, so the page saves it as before;
  // keep: words the field holds without showing them (Primary, which has a chip of its own).
  const tokenField = (field, {commas = false, keep = [], label = '', placeholder = ''} = {}) => {
    const box = h('div', {className: 'tokens'});
    const input = h('input', {type: 'text', spellcheck: false, autocomplete: 'off'});
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('aria-label', label);
    const split = text => String(text || '').split(commas ? /[\n,]/ : /\n/).map(s => s.trim()).filter(Boolean);
    const list = () => split(field.value).filter(w => !keep.includes(w));
    const write = words => {
      const kept = split(field.value).filter(w => keep.includes(w));
      field.value = [...kept, ...words].filter((w, i, all) => all.indexOf(w) === i).join(commas ? ', ' : '\n');
      field.dispatchEvent(new Event('change', {bubbles: true}));
      paint();
    };
    const add = () => {
      const words = split(input.value);
      input.value = '';
      if (words.length) {
        write([...list(), ...words]);
      }
      return words.length > 0;
    };
    const paint = () => {
      const words = list();
      box.replaceChildren(...words.map((word, i) => {
        const remove = h('button', {type: 'button', className: 'icon-btn', title: t('removeToken', word)}, icon('close'));
        remove.setAttribute('aria-label', t('removeToken', word));
        remove.disabled = input.disabled;
        remove.onclick = ev => {
          ev.stopPropagation();
          write(words.filter((w, k) => k !== i));
          // the focus stays in the list: on the next word's button, or the field
          const buttons = box.querySelectorAll('.token button');
          (buttons[Math.min(i, buttons.length - 1)] || input).focus?.();
        };
        return h('span', {className: 'token'}, h('span', {textContent: word, title: word}), remove);
      }), input);
      input.placeholder = typeof placeholder === 'function' ? placeholder(words) : placeholder;
    };
    input.onkeydown = ev => {
      if (ev.key === 'Enter' || (commas && ev.key === ',')) {
        if (ev.key === ',' || input.value.trim()) {
          ev.preventDefault();
          add();
        }
      }
      else if (ev.key === 'Backspace' && !input.value && list().length) {
        ev.preventDefault();
        write(list().slice(0, -1));
      }
    };
    input.onpaste = ev => {
      const text = ev.clipboardData?.getData('text') || '';
      if ((commas ? /[\n,]/ : /\n/).test(text)) {
        ev.preventDefault();
        input.value += text;
        add();
      }
    };
    // what is typed is kept when the field is left
    input.onblur = () => {
      add();
    };
    box.onclick = ev => {
      if (ev.target === box) {
        input.focus();
      }
    };
    paint();
    return {box, input, paint};
  };

  /* quiet hours: the day as a bar, and the line that says when it is quiet */
  const DAY = 1440;
  const percent = m => Math.round(m / DAY * 10000) / 100;
  // the quiet part of the day in per cent of it: one span, or two when it crosses midnight
  const quietSpans = (from, to) => {
    const a = Quiet.minutes(from);
    const b = Quiet.minutes(to);
    if (isNaN(a) || isNaN(b) || a === b) {
      return [];
    }
    return a < b ? [{start: percent(a), size: percent(b - a)}] :
      [{start: 0, size: percent(b)}, {start: percent(a), size: percent(DAY - a)}].filter(s => s.size > 0);
  };
  // drawn with inset-inline-start, so a right-to-left page mirrors it: midnight on the right
  const paintDay = (now = new Date()) => {
    const tick = $('quiet-tick');
    const spans = quietSpans(prefs['quiet.from'], prefs['quiet.to']).map(s => {
      const el = h('span', {className: 'span'});
      el.style.insetInlineStart = s.start + '%';
      el.style.width = s.size + '%';
      return el;
    });
    tick.style.insetInlineStart = percent(now.getHours() * 60 + now.getMinutes()) + '%';
    $('quiet-track').replaceChildren(...spans, tick);
    // under the switch: quiet now and until when, or when it starts
    let line = '';
    if (prefs['quiet.hours']) {
      const weekend = weekendDays();
      if (prefs['quiet.weekend'] && weekend.includes(now.getDay() || 7)) {
        line = t('quietWeekendNow');
      }
      else if (Quiet.hours(prefs, now, weekend)) {
        line = t('quietUntil', clock(prefs['quiet.to']));
      }
      else if (spans.length) {
        line = t('quietNext', clock(prefs['quiet.from']));
      }
    }
    $('quiet-now').textContent = line;
    $('quiet-now').hidden = !line;
    return spans;
  };
  // the weekend's days by name, as the region counts them
  const paintWeekend = () => {
    const lang = uiLang();
    let names = '';
    try {
      const days = weekendDays().map(n => new Intl.DateTimeFormat(lang, {weekday: 'long'}).format(new Date(2024, 0, n)));
      names = new Intl.ListFormat(lang, {type: 'conjunction'}).format(days);
    }
    catch (e) {}
    $('quiet-weekend-text').textContent = names ? t('quietWeekendText', names.charAt(0).toLocaleUpperCase(lang) + names.slice(1)) : '';
  };
  const quiet = () => {
    if (started) {
      paintDay();
      status();
    }
  };

  /* the notification's text: fields put in at the cursor, and a sample mail as it would read */
  const FIELDS = [['author_name', 'tokenName'], ['author_email', 'tokenEmail'], ['title', 'tokenTitle'], ['summary', 'tokenSummary'],
    ['account', 'tokenAccount'], ['break', 'tokenBreak']];
  const formatField = () => document.querySelector('textarea[data-key="notificationFormat"]');
  // as core/check.js shortens the subject and the text
  const shorten = (text, n) => text.length < n ? text : text.substr(0, n / 2) + '...' + text.substr(text.length - n / 2);
  const preview = () => {
    const area = formatField();
    const n = Number(prefs.notificationTruncate) || 70;
    const account = [...accountRows.keys()][0] || 'you@gmail.com';
    const body = String(area.value || '')
      .replace('[author_name]', t('sampleName'))
      .replace('[author_email]', 'maria.lopez@example.com')
      .replace('[summary]', shorten(t('sampleSummary'), n))
      .replace('[title]', shorten(t('sampleSubject'), n))
      .replace('[account]', () => account)
      .replace(/\[break\]/g, '\n');
    $('preview-title').textContent = account;
    $('preview-body').textContent = body.trim();
    $('format-preview').hidden = false;
  };
  const startFormat = () => {
    const area = formatField();
    $('format-tokens').replaceChildren(...FIELDS.map(([field, name]) => {
      const button = h('button', {type: 'button', className: 'btn sm', title: `[${field}]`}, icon('plus'), h('span', {textContent: t(name)}));
      button.onclick = () => {
        const start = area.selectionStart ?? area.value.length;
        const end = area.selectionEnd ?? start;
        area.setRangeText(`[${field}]`, start, end, 'end');
        area.focus();
        area.dispatchEvent(new Event('change', {bubbles: true}));
        preview();
      };
      return button;
    }));
    area.addEventListener('input', preview);
    document.querySelector('select[data-key="notificationTruncate"]')?.addEventListener('change', () => setTimeout(preview));
    preview();
  };

  /* a question before what cannot be undone, in the page's own dialog */
  const ask = (text, {title = '', yes = '', danger = false} = {}) => {
    const dialog = $('ask');
    if (typeof dialog.showModal !== 'function') {
      return Promise.resolve(self.confirm(text));
    }
    $('ask-title').textContent = title;
    $('ask-title').hidden = !title;
    $('ask-text').textContent = text;
    $('ask-yes').textContent = yes || t('aiGotIt');
    $('ask-yes').className = 'btn ' + (danger ? 'danger solid' : 'primary');
    const back = document.activeElement;
    return new Promise(resolve => {
      dialog.onclose = () => {
        resolve(dialog.returnValue === 'yes');
        back?.focus?.();
      };
      $('ask-yes').onclick = () => dialog.close('yes');
      $('ask-no').onclick = () => dialog.close('no');
      dialog.returnValue = '';
      dialog.showModal();
      // the safe answer has the focus
      $('ask-no').focus();
    });
  };

  /* the pin hint: once, while Mail Deck is not on the toolbar */
  const startPin = async () => {
    if (remember.get('pinHint') || !chrome.action?.getUserSettings) {
      return;
    }
    const settings = await chrome.action.getUserSettings().catch(() => null);
    if (settings?.isOnToolbar === false) {
      $('pin').hidden = false;
      $('pin-ok').onclick = () => {
        $('pin').hidden = true;
        remember.set('pinHint', 'seen');
      };
    }
  };

  const start = () => {
    started = true;
    icons();
    const version = chrome.runtime.getManifest().version;
    $('version').textContent = version;
    $('help-version').textContent = version;
    // the text sizes as the language writes a per cent
    const pc = new Intl.NumberFormat(uiLang(), {style: 'percent'});
    document.querySelectorAll('input[name="panelScale"] + span').forEach(span => {
      span.textContent = pc.format(Number(span.previousElementSibling.value));
    });
    const hours = new Intl.NumberFormat(uiLang(), {minimumIntegerDigits: 2});
    document.querySelectorAll('#quiet-hours span').forEach((span, i) => span.textContent = hours.format(i * 6));
    // the volume's track filled up to its thumb
    const volume = document.querySelector('input[data-key="soundVolume"]');
    const fill = () => volume.style.setProperty('--v', volume.value);
    volume.addEventListener('input', fill);
    fill();
    // a textarea's lines as chips
    for (const area of document.querySelectorAll('textarea[data-tokens]')) {
      const words = tokenField(area, {label: $(area.getAttribute('aria-labelledby'))?.textContent, placeholder: t('addWord')});
      words.input.setAttribute('aria-describedby', area.getAttribute('aria-describedby'));
      area.hidden = true;
      area.after(words.box);
    }
    startMore();
    startSearch();
    startRail();
    startFormat();
    paintWeekend();
    paintDay();
    // the tick at now moves with the clock
    setInterval(paintDay, 60000);
    // a new engine: its part fades in
    $('ai-detail').parentElement.querySelector('.engines').addEventListener('change', () => {
      const detail = $('ai-detail');
      detail.classList.remove('swap');
      void detail.offsetWidth;
      detail.classList.add('swap');
    });
    startPin();
    readPause().then(status);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'session' && 'silent' in changes) {
        readPause().then(status);
      }
    });
    status();
    // from the next frames on, what More options shows rises into place; what is open now just is
    setTimeout(() => document.body.dataset.ready = '', 200);
  };

  return {ICONS, icon, avatar, saved, setMore, reveal, openList, moreCount, fold, marks, search, clearSearch, status, tokenField,
    quietSpans, paintDay, quiet, preview, confirm: ask, start};
})();
self.UI = UI;
