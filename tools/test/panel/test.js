// Runs in the panel page next to stub.js; ?scenario= picks what to do. It reports
// what it saw to /__result, and panel.test.js decides what passes.
(async () => {
  const scenario = new URLSearchParams(location.search).get('scenario');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const key = (target, code, extra = {}) => target.dispatchEvent(new KeyboardEvent('keydown', {code, bubbles: true, cancelable: true, ...extra}));
  const sent = method => window.__sent.filter(m => m.method === method);
  const rows = () => document.querySelectorAll('#list .row').length;
  const out = {};
  const report = () => fetch('/__result?scenario=' + scenario, {method: 'POST', body: JSON.stringify(out)});
  // what the stub's mail has loaded so far, by name (panel.test.js counts it)
  const pixels = prefix => fetch('/__pixels?prefix=' + encodeURIComponent(prefix), {cache: 'no-store'}).then(r => r.json());
  // a button's name, as its label says it (the tooltip shows the same)
  const label = b => b?.getAttribute('aria-label') || '';
  // the keys' sheet (?): what each of its lines says, then closed again with Esc
  const sheet = async () => {
    key(document, 'Slash', {shiftKey: true, key: '?'});
    await wait(30);
    const rows = [...document.querySelectorAll('#sheet .sheet-row')].map(r => [r.firstChild.textContent, r.querySelector('.keys').textContent]);
    key(document, 'Escape');
    await wait(30);
    return rows;
  };
  const until = async (test, ms = 3000) => {
    for (const end = Date.now() + ms; Date.now() < end; await wait(25)) {
      if (test()) {
        return true;
      }
    }
    return false;
  };
  try {
    await until(() => rows() > 0 || document.querySelector('#list .acc'));
    await wait(200);

    if (scenario === 'main') {
      // the toolbar count shows all unread mail: opening the panel marks no time for it
      out.noSeen = !window.__set.some(o => 'badge.seen' in o);
      // the feed's 20, then the search's extra mail behind "show more"
      out.rowsBefore = rows();
      const more = document.querySelector('#list .section .more');
      out.moreShown = Boolean(more);
      more?.click();
      await wait(50);
      out.rowsAfterMore = rows();
      out.starred = document.querySelectorAll('#list .row .starred').length;
      out.signedOut = [...document.querySelectorAll('#list .away .acc')].map(e => e.textContent);

      // an action goes to the background at once with its Undo window; Z cancels that same one
      const before = rows();
      document.querySelector('#list .row').focus();
      key(document, 'KeyE');
      await wait(250);
      const action = sent('gmail.action').at(-1);
      out.action = action && {cmd: action.cmd, delay: action.delay, id: Boolean(action.id)};
      out.rowsAfterAction = before - rows();
      key(document, 'KeyZ');
      await wait(100);
      const cancel = sent('gmail.action.cancel').at(-1);
      out.cancelSameId = Boolean(cancel && action && cancel.id === action.id);
      out.rowsAfterUndo = rows() === before;

      // remind me later: B opens the times, the first one writes the reminder
      document.querySelector('#list .row').focus();
      key(document, 'KeyB');
      await wait(50);
      const items = [...document.querySelectorAll('#menu button')];
      out.menuItems = items.length;
      items[0]?.click();
      await wait(250);
      // the background writes it, with the account it belongs to
      const asked = sent('remind.add').at(-1);
      out.reminder = asked?.items?.[0] ? [...Object.keys(asked.items[0]), ...asked.until ? ['until'] : []].sort() : null;
      out.reminderAccount = asked?.items?.[0]?.account;
      key(document, 'KeyZ');
      await wait(100);

      // drag the second mailbox above the first: the order is saved, every mailbox keeps its colour
      const colours = () => Object.fromEntries([...document.querySelectorAll('#list .section[data-key]')]
        .map(s => [s.dataset.key, s.style.getPropertyValue('--c')]));
      const coloursBefore = colours();
      const secs = [...document.querySelectorAll('#list .section[data-key]')];
      const dt = new DataTransfer();
      const r = secs[0].getBoundingClientRect();
      (secs[1].querySelector('[draggable="true"]') || secs[1]).dispatchEvent(new DragEvent('dragstart', {bubbles: true, dataTransfer: dt}));
      secs[0].dispatchEvent(new DragEvent('dragover', {bubbles: true, cancelable: true, dataTransfer: dt, clientY: r.top + 5}));
      secs[0].dispatchEvent(new DragEvent('drop', {bubbles: true, cancelable: true, dataTransfer: dt, clientY: r.top + 5}));
      await wait(100);
      out.orderBefore = secs.map(s => s.dataset.key);
      out.orderAfter = [...document.querySelectorAll('#list .section[data-key]')].map(s => s.dataset.key);
      out.orderSaved = window.__set.find(o => o.accountOrder)?.accountOrder || null;
      out.coloursKept = JSON.stringify(colours()) === JSON.stringify(Object.fromEntries(Object.keys(colours()).map(k => [k, coloursBefore[k]])));

      // the reader: the whole thread, a chip for the attachment, Google's redirect taken off
      document.querySelector('#list .row').click();
      const doc = document.getElementById('body').contentDocument;
      await until(() => doc.querySelector('.thread'));
      const msgs = [...doc.querySelectorAll('details.msg')];
      out.thread = {
        messages: msgs.length,
        lastOpen: msgs.at(-1)?.open === true,
        olderClosed: msgs.slice(0, -1).every(d => !d.open),
        to: Boolean(doc.querySelector('details[open] .to')?.textContent.trim()),
        chips: [...doc.querySelectorAll('.files a')].filter(a => a.getAttribute('href').includes('view=att')).length,
        attTableGone: !doc.querySelector('table.att'),
        redirectUnwrapped: [...doc.querySelectorAll('a')].some(a => a.getAttribute('href') === 'https://figma.com/file/x'),
        linksExternal: doc.querySelectorAll('a[href]').length >= 3 && [...doc.querySelectorAll('a[href]')]
          .every(a => a.getAttribute('target') === '_blank' && a.getAttribute('rel') === 'noopener noreferrer' && !a.hasAttribute('ping'))
      };
      out.reading = document.getElementById('app').classList.contains('reading');
      // a sender with a logo shows the logo alone, in the open mail as in the list: no letter over it
      {
        const sizes = ['#list .row .avatar', '#reader-avatar .avatar'].map(q => {
          const el = document.querySelector(q);
          const had = el.classList.contains('logo');
          el.classList.add('logo');
          const size = getComputedStyle(el).fontSize;
          el.classList.toggle('logo', had);
          return size;
        });
        out.logoLetter = sizes;
      }
      // the mail's frame runs nothing of the mail's: a handler written into it, a script: link
      {
        const probe = doc.createElement('div');
        probe.innerHTML = '<img src="/__no-such-picture" onerror="parent.__mailRan = \'handler\'">' +
          '<a id="probe-js" href="javascript:parent.__mailRan = \'link\'">x</a><a id="probe-mail" href="mailto:anna@figma.com">m</a>';
        doc.body.append(probe);
        const click = (a, init = {}) => a.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true, view: doc.defaultView, button: 0, ...init}));
        const opened = () => (window.__tabsOpened || []).length;
        // a link opens a tab from the panel, in front; Ctrl+click and the middle button behind
        const link = [...doc.querySelectorAll('a')].find(a => a.getAttribute('href') === 'https://figma.com/file/x');
        const before = opened();
        const kept = !click(link);
        await wait(50);
        click(link, {ctrlKey: true});
        await wait(50);
        link.dispatchEvent(new MouseEvent('auxclick', {bubbles: true, cancelable: true, view: doc.defaultView, button: 1}));
        await wait(50);
        const tabs = (window.__tabsOpened || []).slice(before);
        const n = opened();
        click(doc.getElementById('probe-js'));
        await wait(50);
        const jsOpened = opened() - n;
        click(doc.getElementById('probe-mail'));
        await wait(150);
        out.frame = {
          sandbox: document.getElementById('body').getAttribute('sandbox'),
          ran: window.__mailRan || '',
          kept,
          tabs: tabs.map(o => [o.url, o.active, o.index]),
          jsOpened,
          mailto: (window.__tabsOpened || []).at(-1)?.url,
          stayed: doc === document.getElementById('body').contentDocument && doc.location.pathname.endsWith('/body/index.html')
        };
        probe.remove();
      }
      // the keys work from inside the message too
      key(doc.body, 'Escape');
      await wait(100);
      out.escInFrameBack = !document.getElementById('app').classList.contains('reading');

      // search every mailbox
      key(document, 'Slash');
      await wait(50);
      out.searchFocused = document.activeElement?.id === 'search-input';
      document.getElementById('search-input').value = 'invoice';
      document.getElementById('search').requestSubmit();
      await until(() => document.querySelector('#list .row.seen'));
      out.searchSections = document.querySelectorAll('#list .section').length;
      out.searchSeen = document.querySelectorAll('#list .row.seen').length;
      out.searchCalls = sent('gmail.search').filter(m => m.query === 'invoice').length;
    }

    if (scenario === 'speed') {
      // the first panel asks; a second one finds the answers in the session and asks nothing
      await until(() => chrome.storage.session.area['extra.cache']);
      out.firstOpenSearches = sent('gmail.search').length;
      out.cached = Object.keys(chrome.storage.session.area['extra.cache'] || {}).length;
      extraFound.clear();
      extraSaved = null;
      state.extra.clear();
      const asked = sent('gmail.search').length;
      await loadExtra();
      out.secondOpenSearches = sent('gmail.search').length - asked;
      out.extraBack = [...state.extra.values()].flat().length;

      // pointing at a mail fetches it; opening it then needs no second request
      // (the other lines' print views come too, for their files: only this one's are counted)
      const row = document.querySelector('#list .row');
      const printsOf = () => window.__printed.filter(u => u.endsWith('=' + gmail.get.id(row.dataset.link))).length;
      row.dispatchEvent(new MouseEvent('mouseenter'));
      await until(() => printsOf() > 0, 1500);
      out.printsAfterHover = printsOf();
      // it is built ahead of the click, yet its pictures wait for the reader
      await wait(400);
      out.picturesAfterHover = (await pixels('speed-gmail'))['speed-gmail'] || 0;
      row.click();
      const doc = document.getElementById('body').contentDocument;
      await until(() => doc.querySelector('.thread'));
      out.printsAfterOpen = printsOf();
      for (const end = Date.now() + 2000; Date.now() < end && !out.picturesAfterOpen; await wait(50)) {
        out.picturesAfterOpen = (await pixels('speed-gmail'))['speed-gmail'] || 0;
      }
      out.keptForSession = (chrome.storage.session.area['print.index'] || []).length;

      // an action makes the kept answers old
      const archive = [...document.querySelectorAll('#reader-bar button')].find(b => label(b) === t('archive'));
      archive?.click();
      await wait(100);
      out.cacheDroppedAfterAction = !('extra.cache' in chrome.storage.session.area);
      // without auto-advance, the action took the reader back to the list
      out.backAfterAction = !document.getElementById('app').classList.contains('reading');
    }

    if (scenario === 'services') {
      const head = name => [...document.querySelectorAll('#list .section')].find(el => el.textContent.includes(name));
      out.meet = ['evgeny@example.com', 'ev@yahoo.com', 'ev@proton.me'].map(n => Boolean(head(n)?.querySelector('.section-head [class*="meet"], .section-head button[title*="Meet"]')));
      // sender logos come from Google: a Gmail mailbox's senders only
      out.logos = ['evgeny@example.com', 'ev@yahoo.com'].map(n => head(n)?.querySelectorAll('.row .avatar img').length);
      // the search knows of more unread mail than the feed counts (one inbox, one mail): no "Show 0 more"
      out.moreButtons = [...document.querySelectorAll('#list .more')].map(b => b.textContent);
      const yahooRow = head('ev@yahoo.com').querySelector('.row');
      out.openTitle = [...yahooRow.querySelectorAll('button')].map(label).find(t => t.includes('Yahoo')) || '';
      out.signedOut = [...document.querySelectorAll('#list .away .acc')].map(e => e.textContent);
      document.querySelector('#list .away .acc')?.click();
      await wait(50);
      out.signInOpened = sent('open').at(-1)?.url;

      // a Yahoo mail reads in the panel, with the service's markup made harmless
      yahooRow.click();
      const doc = document.getElementById('body').contentDocument;
      await until(() => doc.querySelector('.root'));
      await wait(100);
      out.bodyAsked = sent('services.body').at(-1)?.link;
      out.messages = doc.querySelectorAll('details.msg').length;
      out.safeText = doc.getElementById('safe')?.textContent || '';
      out.dangerous = doc.body.querySelectorAll('script, style, iframe, form, input, [onerror]').length + doc.body.querySelectorAll('a[href^="javascript"]').length;
      out.relative = doc.querySelector('a[href*="rel"]')?.getAttribute('href') || '';
      out.ran = window.__ran === 1;
      // remote pictures wait for the button
      out.heldBefore = doc.body.querySelectorAll('img[data-held]').length;
      out.loadedBefore = doc.body.querySelectorAll('img[src^="http"]').length;
      // and so does whatever else of the mail could load: an SVG image, a video and its poster,
      // a style's URL()
      out.heldOther = ['video[data-held]', 'video[data-held-poster]', 'svg [data-held-href]'].map(s => doc.body.querySelectorAll(s).length);
      await wait(400);
      out.pixelsBefore = await pixels('services-svc-');
      const top = doc.getElementById('top');
      out.links = {target: top?.getAttribute('target'), rel: top?.getAttribute('rel'), ping: top?.hasAttribute('ping'), editable: doc.getElementById('editable')?.hasAttribute('contenteditable')};
      doc.querySelector('.pictures button')?.click();
      out.loadedAfter = doc.body.querySelectorAll('img[src^="https://mail.yahoo.com/"]').length;
      out.barGone = !doc.querySelector('.pictures');
      for (const end = Date.now() + 2000; Date.now() < end; await wait(50)) {
        out.pixelsAfter = await pixels('services-svc-');
        if (out.pixelsAfter['services-svc-svg'] && out.pixelsAfter['services-svc-poster']) {
          break;
        }
      }
      await wait(200);
      out.pixelsAfter = await pixels('services-svc-');
      out.serviceTrackers = document.querySelector('#reader-notes .ok .note-text')?.textContent.replace(/[\u2068\u2069]/g, '');

      // a link of the mail opens through the panel's chrome.tabs (the frame has no script of its
      // own), never over the panel or in the reader
      const tabsBefore = (window.__tabsOpened || []).length;
      const windowsBefore = (window.__windowsCreated || []).length;
      const click = (el, o = {}) => el.dispatchEvent(new MouseEvent(o.type || 'click', {bubbles: true, cancelable: true, button: 0, ...o}));
      top?.click();
      click(top, {ctrlKey: true});
      click(top, {type: 'auxclick', button: 1});
      click(top, {shiftKey: true});
      doc.getElementById('hash')?.click();
      doc.getElementById('data')?.click();
      await wait(300);
      out.opened = (window.__tabsOpened || []).slice(tabsBefore).map(o => [o.url, o.active, o.index]);
      out.windowOpened = (window.__windowsCreated || []).slice(windowsBefore);
      out.panelStayed = location.pathname.endsWith('/__panel.html');
      out.pingAfterClicks = (await pixels('services-svc-ping'))['services-svc-ping'] || 0;
      out.star = Boolean(document.querySelector('#reader-bar .star'));
      // the keys' sheet lists only what the mailbox can do
      const keys = (await sheet()).map(([, k]) => k);
      out.noStarHint = keys.includes('R') && !keys.includes('S') && !document.getElementById('sheet') && document.getElementById('app').classList.contains('reading');
      key(document, 'Escape');
      await wait(50);

      // a Proton mail opens on Proton's site: the panel cannot read it
      const opens = sent('open').length;
      head('ev@proton.me').querySelector('.row').click();
      await wait(50);
      out.protonReader = document.getElementById('app').classList.contains('reading');
      out.protonOpened = sent('open').length === opens + 1 && sent('open').at(-1).url?.link;
      // and so does Enter on it, as a click does
      head('ev@proton.me').querySelector('.row').focus();
      key(document, 'Enter');
      await wait(50);
      out.protonEnterReader = document.getElementById('app').classList.contains('reading');
      out.protonEnterOpened = sent('open').length === opens + 2 && sent('open').at(-1).url?.link;
      // pointing at a service mail fetches nothing: a service may count a fetched mail as read
      const asked = sent('services.body').length;
      head('ev@yahoo.com').querySelectorAll('.row')[1].dispatchEvent(new MouseEvent('mouseenter'));
      await wait(250);
      out.hoverFetched = sent('services.body').length - asked;

      // search asks Gmail only
      key(document, 'Slash');
      await wait(50);
      document.getElementById('search-input').value = 'invoice';
      document.getElementById('search').requestSubmit();
      await wait(150);
      out.searchUrls = sent('gmail.search').filter(m => m.query === 'invoice').map(m => m.url);

      // the Yahoo chip chosen: Yahoo cannot be searched, so Gmail is, instead of a failure
      key(document.getElementById('search-input'), 'Escape');
      await wait(50);
      [...document.querySelectorAll('#chips .chip')].find(c => c.textContent.startsWith('yahoo.com'))?.click();
      await wait(50);
      out.yahooChosen = state.only === 'https://mail.yahoo.com/n/folders/1';
      key(document, 'Slash');
      await wait(50);
      document.getElementById('search-input').value = 'receipt';
      document.getElementById('search').requestSubmit();
      await wait(150);
      out.chipSearchUrls = sent('gmail.search').filter(m => m.query === 'receipt').map(m => m.url);
      out.chipSearchFailed = document.getElementById('list').textContent.includes(t('searchFailed'));
    }

    if (scenario === 'keys') {
      // the focus, the keys and the reader. a1 a2 (and a3-a5 behind "show more") are evgeny's,
      // b1 is the only mail of work@
      const $ = id => document.getElementById(id);
      const rowOf = id => [...document.querySelectorAll('#list .row')].find(r => r.dataset.link.includes('message_id=' + id + '&'));
      const doc = $('body').contentDocument;
      const reading = () => $('app').classList.contains('reading');
      // what has the focus: a mail by its id, a button by its name
      const focus = () => {
        const el = document.activeElement;
        return el?.dataset?.link ? 'row:' + el.dataset.link.match(/message_id=([^&]*)/)[1] : el?.dataset?.focus || el?.id || el?.tagName;
      };
      const actions = (cmd, id) => sent('gmail.action').filter(a => a.cmd === cmd && a.links.some(l => l.includes('message_id=' + id + '&')));
      await until(() => [...state.extra.values()].flat().length >= 3);

      // read on open: a mail whose body did not load stays unread and listed
      state.readOnOpen = true;
      window.__printStatus = 500;
      rowOf('b1')?.click();
      await until(() => doc.querySelector('.note'));
      await wait(50);
      out.failedMarked = actions('rd', 'b1').length;
      out.failedListed = Boolean(rowOf('b1'));
      key(document, 'Escape');
      await wait(50);
      window.__printStatus = 0;
      // one that did is marked read and leaves; back from it, the next mail takes the focus
      rowOf('a2')?.focus();
      key(document, 'Enter');
      await until(() => doc.querySelector('.thread'));
      await wait(50);
      out.readMarked = actions('rd', 'a2').length;
      key(document, 'Escape');
      await wait(50);
      out.focusAfterReadOnOpen = focus();
      state.readOnOpen = false;

      // the reader takes the focus; what lies under it can be neither focused nor read out
      rowOf('a1')?.focus();
      key(document, 'Enter');
      await wait(50);
      out.readerFocused = document.activeElement === $('reader');
      out.underInert = [document.querySelector('.main > .bar'), $('chips'), $('list')].every(el => el.inert);
      key(document, 'Escape');
      await wait(50);
      out.backFocus = focus();
      out.underBack = !$('list').inert;

      // E twice, or a double click, while the mail folds away: one action, and its Undo cancels it
      rowOf('a1')?.focus();
      key(document, 'KeyE');
      await wait(60);
      key(document, 'KeyE');
      await wait(250);
      out.doubleKey = actions('rc_^i', 'a1').map(a => a.id);
      key(document, 'KeyZ');
      await wait(100);
      out.doubleKeyUndone = sent('gmail.action.cancel').at(-1)?.id === out.doubleKey[0] && Boolean(rowOf('a1'));
      const trash = rowOf('b1')?.querySelector('.acts .danger');
      trash?.click();
      await wait(60);
      trash?.click();
      rowOf('b1')?.click();
      await wait(250);
      out.doubleClick = actions('tr', 'b1').length;
      out.foldClickReads = reading();
      key(document, 'KeyZ');
      await wait(100);

      // the only mail of a mailbox archived: the focus goes to the mail before it
      rowOf('b1')?.focus();
      key(document, 'KeyE');
      await wait(300);
      out.focusAfterLast = focus();
      key(document, 'KeyZ');
      await wait(100);
      out.focusAfterUndo = focus();

      // a chip, and "show more", keep the keys where they were
      // (the mailboxes' chips: Gmail's categories and the assistant's offer stand before them)
      const chips = () => [...document.querySelectorAll('#chips .chip:not(.ai-offer, .cat-chip)')];
      chips()[1]?.focus();
      chips()[1]?.click();
      await wait(50);
      out.focusAfterChip = focus() === chips()[1]?.dataset.focus && chips()[1].classList.contains('on');
      chips()[0]?.click();
      await wait(50);
      const more = document.querySelector('#list .more');
      more?.focus();
      more?.click();
      await wait(50);
      out.focusAfterMore = focus();

      // a check, every two minutes: a toolbar button keeps the focus, a scrolled list its place,
      // and with nothing new the list is not drawn again, yet its times move on
      const copy = () => JSON.parse(JSON.stringify(state.objs));
      const changed = () => {
        const objs = copy();
        objs[0].xml.entries[0].summary += ' ';
        return objs;
      };
      [...$('tools').querySelectorAll('.icon-btn')].find(b => label(b).startsWith(t('compose'))).focus();
      update(changed());
      out.toolKept = focus();
      const list = $('list');
      list.style.cssText = 'max-height: 160px; flex: none';
      rowOf('a1')?.focus();
      list.scrollTop = list.scrollHeight;
      const scrolled = list.scrollTop;
      update(changed());
      out.scrollKept = scrolled > 0 && list.scrollTop === scrolled;
      list.style.cssText = '';
      const line = rowOf('a1');
      line && (line.querySelector('time.when').textContent = 'stale');
      const same = copy();
      same.forEach(o => o.xml.modified = new Date().toISOString());
      update(same);
      out.sameNotDrawn = rowOf('a1') === line;
      out.timesMoved = Boolean(line) && line.querySelector('time.when').textContent !== 'stale';
      update(changed());
      out.changeDrawn = rowOf('a1') !== line;
      // the background's answer to an action comes while the mail folds: the fold goes on
      const full = copy();
      const folding = rowOf('a1');
      folding?.focus();
      key(document, 'KeyE');
      await wait(20);
      const after = copy();
      after[0].xml.entries = after[0].xml.entries.filter(e => !e.link.includes('message_id=a1&'));
      update(after);
      out.foldGoesOn = Boolean(folding?.isConnected);
      await wait(300);
      out.foldDone = Boolean(folding) && !folding.isConnected && !rowOf('a1');
      key(document, 'KeyZ');
      await wait(50);
      update(full);
      await wait(50);

      // remind me later: its focused time shows, Esc gives the focus back, Tab out closes it
      const menuItems = () => [...document.querySelectorAll('#menu button')];
      rowOf('a1')?.focus();
      key(document, 'KeyB');
      await wait(50);
      const clock = rowOf('a1')?.querySelector('.remind');
      out.menuExpanded = Boolean(clock) && clock.getAttribute('aria-haspopup') === 'menu' && clock.getAttribute('aria-expanded') === 'true';
      key(document.activeElement, 'ArrowDown');
      await wait(30);
      out.menuRing = menuItems()[1] && getComputedStyle(menuItems()[1]).outlineStyle;
      key(document.activeElement, 'Escape');
      await wait(30);
      out.menuEsc = !$('menu') && focus() === 'row:a1' && clock?.getAttribute('aria-expanded') === 'false';
      key(document, 'KeyB');
      await wait(30);
      rowOf('b1')?.focus();
      await wait(30);
      out.menuTabOut = !$('menu') && focus() === 'row:b1';
      // a larger text size: the menu still opens at its clock, inside the window
      prefsChanged({panelScale: 1.25});
      await wait(50);
      rowOf('a1')?.focus();
      key(document, 'KeyB');
      await wait(50);
      const a = rowOf('a1')?.querySelector('.remind')?.getBoundingClientRect() || {};
      const m = $('menu')?.getBoundingClientRect() || {};
      out.zoomMenu = {alignedRight: Math.abs(m.right - a.right) <= 2, inside: m.left >= 0 && m.right <= innerWidth && m.top >= 0 && m.bottom <= innerHeight,
        atClock: m.top >= a.bottom - 1 || m.bottom <= a.top + 1};
      key(document.activeElement, 'Escape');
      prefsChanged({panelScale: 1});
      await wait(50);

      // names and subjects keep their own direction: a Hebrew subject in the English panel,
      // an English one in the Hebrew panel, each with its "?" at its end and on the panel's side
      const sides = (id, title) => {
        const e = state.objs[0].xml.entries.find(x => x.link.includes('message_id=' + id + '&'));
        e.title = title;
        render();
        const el = rowOf(id).querySelector('.subject');
        const text = [...el.childNodes].find(n => n.nodeType === 3);
        const at = i => {
          const r = document.createRange();
          r.setStart(text, i);
          r.setEnd(text, i + 1);
          return r.getBoundingClientRect().left;
        };
        const box = el.getBoundingClientRect();
        return {first: at(0), mark: at(text.data.indexOf('?')), left: box.left, right: box.right};
      };
      const he = sides('a1', 'שלום, מה נשמע?');
      document.documentElement.dir = 'rtl';
      const en = sides('a1', 'Re: Meeting at 10:00?');
      document.documentElement.dir = 'ltr';
      out.bidi = {hebrewInLtr: he.mark < he.first && he.mark - he.left < 20, englishInRtl: en.mark > en.first && en.right - en.mark < 20};

      // search: an account that did not answer says so, the others show what they found
      window.__searchFails = m => m.url.endsWith('/u/0') && !m.query.includes('is:unread');
      key(document, 'Slash');
      await wait(50);
      $('search-input').value = 'invoice';
      $('search').requestSubmit();
      await until(() => !state.search?.busy);
      await wait(50);
      // a failure in words, what was found as a count (its words for a screen reader)
      out.searchLines = [...document.querySelectorAll('#list .section-head')].map(h => h.querySelector('.addr')?.textContent + ': ' + h.querySelector('.none, .n.found .sr')?.textContent);
      out.searchFailedLine = out.searchLines.includes('evgeny@example.com: ' + t('searchFailed'));
      out.searchFoundLine = out.searchLines.includes('old@example.org: ' + t('found', 2));
      out.searchSaid = $('status')?.textContent === t('found', 2);
      window.__searchFails = null;
      key($('search-input'), 'Escape');
      await wait(50);
      out.focusAfterSearch = focus();
    }

    if (scenario === 'files') {
      // each line's files come from its print view, read ahead a few at a time
      await until(() => document.querySelector('#list .row .row-files'));
      const first = document.querySelector('#list .row');
      const printsOf = () => window.__printed.filter(u => u.endsWith('=' + gmail.get.id(first.dataset.link))).length;
      out.lineFiles = [...first.querySelectorAll('.row-files .file-chip .name')].map(n => n.textContent);
      out.kind = first.querySelector('.file-chip')?.dataset.kind;
      await until(() => [...document.querySelectorAll('#list .row')].every(r => r.querySelector('.row-files')));
      out.everyLine = [...document.querySelectorAll('#list .row')].every(r => r.querySelector('.row-files'));
      out.onePrintEach = window.__prints === document.querySelectorAll('#list .row').length;
      // a click on a file opens the file alone, not the mail
      first.querySelector('.file-chip').click();
      await wait(50);
      out.fileOpened = sent('open').at(-1)?.url || '';
      out.readingAfterFile = document.getElementById('app').classList.contains('reading');
      // the open mail shows its files over the message: from the line at once, then from the
      // message itself, with no second request for it
      const before = printsOf();
      first.click();
      out.stripAtOnce = !document.getElementById('reader-files').hidden;
      const doc = document.getElementById('body').contentDocument;
      await until(() => doc.querySelector('.thread'));
      out.stripFiles = [...document.querySelectorAll('#reader-files .file-chip .name')].map(n => n.textContent);
      out.download = label(document.querySelector('#reader-files .file-dl'));
      // the files over the message stand for its own chips of them, which step aside
      out.frameChipsHidden = doc.documentElement.classList.contains('files-shown') && getComputedStyle(doc.querySelector('.files')).display === 'none';
      out.noSecondPrint = printsOf() === before;
      // written once the answers of a moment are in
      await until(() => Object.keys(chrome.storage.session.area['files.index'] || {}).length);
      out.kept = Object.keys(chrome.storage.session.area['files.index'] || {}).length;
    }

    if (scenario === 'codes') {
      // a one-time code shows on its line; a click copies its digits and opens, reads or deletes nothing
      const list = () => [...document.querySelectorAll('#list .row')];
      out.pills = list().map(r => r.querySelector('.code')?.textContent || '');
      const before = rows();
      list()[0].querySelector('.code')?.click();
      await wait(50);
      out.copied = window.__copied;
      out.copiedShown = Boolean(list()[0].querySelector('.code.copied'));
      out.opened = document.getElementById('app').classList.contains('reading');
      out.actions = sent('gmail.action').length + sent('open').length;
      out.rowsKept = rows() === before;
      // C on a focused line copies its code; on a line without one, nothing
      window.__copied = null;
      list()[1].focus();
      key(document, 'KeyC');
      await wait(50);
      out.copiedByKey = window.__copied;
      window.__copied = null;
      list()[2].focus();
      key(document, 'KeyC');
      await wait(50);
      out.copiedNone = window.__copied;
      // the reader shows it too, and C copies it there
      list()[3].click();
      await wait(150);
      out.readerPill = document.querySelector('#reader-subject .code')?.textContent || '';
      key(document, 'KeyC');
      await wait(50);
      out.copiedInReader = window.__copied;
      out.actionsAfter = sent('gmail.action').length;
    }

    if (scenario === 'advance') {
      // J and K in the reader; with auto-advance an action opens the next mail. The list:
      // a1 a2 (evgeny's), b1 (work's)
      const $ = id => document.getElementById(id);
      const subject = () => $('reader-subject').firstChild?.textContent;
      document.querySelector('#list .row').click();
      await wait(150);
      out.first = subject();
      out.prevDisabledAtFirst = $('reader-bar').querySelector('.prev')?.disabled;
      key(document, 'KeyJ');
      await wait(150);
      out.afterJ = subject();
      key(document, 'KeyK');
      await wait(150);
      out.afterK = subject();
      key(document, 'KeyE');
      await wait(300);
      out.stillReading = $('app').classList.contains('reading');
      out.afterE = subject();
      out.archived = sent('gmail.action').at(-1)?.links?.[0] || '';
      out.posAfterE = $('reader-bar').querySelector('.pos')?.textContent;
      // the arrow does what J does; at the last mail J stays
      $('reader-bar').querySelector('.next')?.click();
      await wait(150);
      out.atLast = subject();
      key(document, 'KeyJ');
      await wait(150);
      out.pastLast = subject();
      out.nextDisabled = $('reader-bar').querySelector('.next')?.disabled;
      // K passes over the archived mail
      key(document, 'KeyK');
      await wait(150);
      key(document, 'KeyK');
      await wait(150);
      out.topAfterArchive = subject();
    }

    if (scenario === 'readnext') {
      // read on open takes the open mail out of the list; J still knows where it was
      const doc = document.getElementById('body').contentDocument;
      document.querySelector('#list .row').click();
      await until(() => doc.querySelector('.thread'));
      await wait(150);
      out.marked = sent('gmail.action').filter(a => a.cmd === 'rd').length;
      out.listedAfterRead = [...document.querySelectorAll('#list .row')].some(r => r.dataset.link.includes('message_id=a1&'));
      key(document, 'KeyJ');
      await wait(150);
      out.afterJ = document.getElementById('reader-subject').firstChild?.textContent;
    }

    if (scenario === 'seen') {
      // the toolbar count at "mail since the panel was last opened": opening the panel marks the
      // time; a list update, which the background sends for that very mark, does not
      out.seen = window.__set.some(o => 'badge.seen' in o);
      window.__set = [];
      update(JSON.parse(JSON.stringify(state.objs)));
      await wait(100);
      out.seenOnUpdate = window.__set.some(o => 'badge.seen' in o);
    }

    if (scenario === 'site') {
      // mail from the site of the page the panel opened over (?url=https://github.com/login)
      const $ = id => document.getElementById(id);
      const block = () => $('list').querySelector(':scope > .site');
      const id = link => link.match(/message_id=([^&]*)/)[1];
      const pins = () => [...(block()?.querySelectorAll('.pin') || [])].map(p => id(p.dataset.focus));
      const goTo = async url => {
        window.__tabUrl = url;
        window.__tabEvents.updated?.(7, {url, status: 'complete'}, {id: 7, active: true, windowId: 1});
        await wait(80);
      };
      await until(() => block());
      out.first = $('list').firstElementChild === block();
      out.head = block().querySelector('.site-head').textContent === t('fromSite', 'github.com');
      // newest first, three of the five, the bulk sender's and the other mailbox's among them
      out.pins = pins();
      out.more = block().querySelector('.site-more')?.textContent === t('siteMore', 2);
      out.pinsNamed = [...block().querySelectorAll('.pin')].every(p => p.tagName === 'BUTTON' && p.textContent.trim() && p.title);
      out.noRows = block().querySelectorAll('.row, [data-link]').length === 0;
      // the code, large and grouped; a click copies its digits, says so, and leaves the mail as it was
      const code = block().querySelector('.site-code');
      // in groups set apart by a margin: what is copied has no space in it
      out.codeShown = [...code?.querySelector('.digits').children || []].map(g => g.textContent).join(' ') === '482 913';
      const acted = window.__sent.filter(m => m.method === 'gmail.action').length;
      code?.click();
      await wait(50);
      out.codeCopied = window.__copied === '482913' && $('toast').textContent === t('codeCopied');
      // C copies it: with no line focused, and from a line without a code of its own
      window.__copied = null;
      document.activeElement.blur();
      key(document, 'KeyC');
      await wait(30);
      out.keyNoFocus = window.__copied === '482913';
      window.__copied = null;
      [...document.querySelectorAll('#list .row')].find(r => id(r.dataset.link) === 'f1').focus();
      key(document, 'KeyC');
      await wait(30);
      out.keyPlainLine = window.__copied === '482913';
      // a line with its own code keeps C for it
      window.__copied = null;
      [...document.querySelectorAll('#list .row')].find(r => id(r.dataset.link) === 'f2').focus();
      key(document, 'KeyC');
      await wait(30);
      out.keyOwnCode = window.__copied === '7310';
      // and typing in the search copies nothing
      window.__copied = null;
      key(document, 'Slash');
      await wait(30);
      key($('search-input'), 'KeyC');
      await wait(30);
      out.keyInSearch = window.__copied === null && !block();
      key($('search-input'), 'Escape');
      await wait(50);
      out.backAfterSearch = Boolean(block());
      out.noAction = window.__sent.filter(m => m.method === 'gmail.action').length === acted;

      // a pin opens its mail in the reader; back, the pin has the focus again
      block().querySelector('.pin').click();
      await wait(50);
      out.pinReads = state.reading && id(state.reading.e.link) === 'g1';
      key(document, 'Escape');
      await wait(50);
      out.pinFocusBack = document.activeElement?.dataset?.focus === block()?.querySelector('.pin').dataset.focus;

      // "2 more" narrows the list to the site's mail, in its mailboxes; Esc lets go
      block().querySelector('.site-more').click();
      await wait(50);
      out.narrowed = [...document.querySelectorAll('#list .row')].map(r => id(r.dataset.link)).sort();
      out.narrowChip = $('chips').querySelector('.site-chip')?.textContent === 'github.com' && !block();
      key(document, 'Escape');
      await wait(50);
      out.letGo = Boolean(block()) && !$('chips').querySelector('.site-chip') && document.querySelectorAll('#list .row').length === 10;

      // the side panel follows its tab: chrome://, Gmail itself and a site without mail show nothing;
      // another ending of the brand does (its code too old to show); a generic brand does not
      await goTo('chrome://extensions/');
      out.chromePage = !block();
      await goTo('https://github.com/settings/keys');
      out.backOnGithub = Boolean(block());
      await goTo('https://mail.google.com/mail/u/0/#inbox');
      out.gmailHost = !block();
      await goTo('https://www.amazon.co.uk/gp/your-account');
      out.amazon = {pins: pins(), code: Boolean(block()?.querySelector('.site-code')), head: block()?.querySelector('.site-head').textContent === t('fromSite', 'amazon.co.uk')};
      await goTo('https://www.store.com/checkout');
      out.generic = !block();
      await goTo('https://example.org/');
      out.noMatch = !block();
      window.__tabUrl = 'https://github.com/';
      window.__tabEvents.activated?.({tabId: 7, windowId: 1});
      await wait(80);
      out.onActivated = Boolean(block());

      // the keys of a site: endings, webmail, people's own mail
      const of = url => siteOf(url)?.domain ?? null;
      out.sites = ['https://www.bbc.co.uk/news', 'https://www.bmw.de/', 'https://shop.example.com.br/x', 'https://e.mail.ru/inbox',
        'https://outlook.live.com/mail/', 'http://192.168.1.1/', 'https://gmail.com/', 'file:///tmp/x.html'].map(of);
      const brand = (email, url) => siteOf(url) ? ofSite({author_email: email}, siteOf(url)) : null;
      out.brands = [brand('service@paypal.de', 'https://www.paypal.com/signin'), brand('news@apps.de', 'https://apps.com/'),
        brand('hi@mail.de', 'https://mail-shop.com/'), brand('x@gmail.com', 'https://gmail.co.uk/')];

      // what it costs, from data in memory: nine mailboxes of twenty
      const many = Array.from({length: 9}, (_, i) => ({...state.objs[0], xml: {...state.objs[0].xml, link: 'm' + i,
        entries: Array.from({length: 20}, (_, j) => ({...state.objs[0].xml.entries[j % 9], link: `l${i}-${j}`}))}}));
      const t0 = performance.now();
      for (let i = 0; i < 20; i += 1) {
        siteMail(state.site, many);
      }
      out.ms = (performance.now() - t0) / 20;
    }

    if (scenario.startsWith('ai')) {
      // the assistant, with self.AI stubbed (stub.js, ?ai=on|off) or the real ai.js (?ai=real)
      const $ = id => document.getElementById(id);
      const id = link => link.match(/message_id=([^&]*)/)[1];
      const rowOf = x => [...document.querySelectorAll('#list .row')].find(r => id(r.dataset.link) === x);
      const ai = window.__ai;
      const calls = fn => (ai?.calls || []).filter(c => c.fn === fn);
      const card = () => $('ai-card');
      const shown = el => Boolean(el) && !el.hidden && getComputedStyle(el).display !== 'none';
      const items = cls => [...card().querySelectorAll(`.${cls} li`)].map(li => li.textContent);
      const keyOf = x => {
        const e = state.objs.flatMap(o => o.xml.entries).find(e => id(e.link) === x);
        return e.link + '#' + e.modified;
      };
      const open = async x => {
        rowOf(x).click();
        await wait(60);
      };
      const done = () => until(() => card().getAttribute('aria-busy') === 'false');
      const msg = code => chrome.i18n.getMessage('ai_err_' + code.replace(/-/g, '_'));

      if (scenario === 'ai') {
        // nothing of the assistant before the list is on screen; waiting for a reply 800 ms later
        await until(() => $('chips').querySelector('.reply-chip'));
        out.afterPaint = ai.calls[0]?.t > window.__firstRow;
        out.times = {firstRow: window.__firstRow, firstCall: ai.calls[0], script: window.__aiScriptAt};
        out.replyWaited = calls('needsReply')[0]?.t - window.__firstRow >= 750;
        out.chip = $('chips').firstElementChild?.classList.contains('reply-chip') && $('chips').querySelector('.reply-chip').getAttribute('aria-label') === t('replyChip', 2);
        out.asked = {calls: calls('needsReply').length, n: calls('needsReply')[0]?.n, own: calls('needsReply')[0]?.accounts.includes('work@arbitron.example')};
        // Gmail's categories name the digest bulk before any model is asked
        out.knownBulk = calls('needsReply')[0]?.known.length === 1 && calls('needsReply')[0].known[0].includes('|a4|') &&
          calls('needsReply')[0].threads.every(Boolean) && sent('gmail.search').some(m => m.query.includes('category:promotions'));
        out.marks = [...document.querySelectorAll('#list .row')].filter(r => r.querySelector('.reply-mark'))
          .map(r => id(r.dataset.link) + ':' + r.querySelector('.reply-mark').title);
        // the chip narrows the list to that mail; Esc lets go
        $('chips').querySelector('.reply-chip').click();
        await wait(50);
        out.narrowed = [...document.querySelectorAll('#list .row')].map(r => id(r.dataset.link));
        key(document, 'Escape');
        await wait(50);
        out.letGo = !$('chips').querySelector('.reply-chip.on') && document.querySelectorAll('#list .row').length === 3;
        // a check with nothing new asks nothing; new mail is asked about, alone
        const copy = () => JSON.parse(JSON.stringify(state.objs));
        update(copy());
        await wait(1000);
        out.quietCheck = calls('needsReply').length === 1;
        const more = copy();
        more[1].xml.entries.unshift({...more[1].xml.entries[0], link: more[1].xml.entries[0].link.replace('message_id=b1&', 'message_id=n1&'),
          id: 'tag:n1', author_name: 'Lena', author_email: 'lena@example.net', title: 'Quick question', summary: 'Can you send it today?', modified: new Date().toISOString()});
        more[1].xml.fullcount += 1;
        update(more);
        await until(() => calls('needsReply').length === 2, 2000);
        await wait(50);
        out.newMail = calls('needsReply')[1]?.n === 1 && $('chips').querySelector('.reply-chip').getAttribute('aria-label') === t('replyChip', 3);

        // the summary: a button and I, nothing asked before
        await open('a1');
        out.button = shown($('reader-ai').querySelector('.ai-btn')) && !shown(card()) && calls('summarize').length === 0;
        key(document, 'KeyI');
        await wait(10);
        out.waiting = shown(card()) && shown(card().querySelector('.ai-wait')) && card().getAttribute('aria-busy') === 'true';
        await until(() => items('ai-points').length > 0);
        out.streams = items('ai-points').length < 3 && card().getAttribute('aria-busy') === 'true' && !shown(card().querySelector('.ai-wait'));
        await done();
        const asked = calls('summarize')[0];
        out.summary = {points: items('ai-points').length, todo: items('ai-todo').length, events: items('ai-events').length,
          facts: items('ai-facts').length, key: asked?.key === keyOf('a1'), messages: asked?.messages, fresh: asked?.fresh,
          reader: asked?.reader, emails: asked?.emails.join()};
        // the card open, the message keeps room under it, and the header steps back
        out.room = {body: Math.round(document.querySelector('.reader-body').getBoundingClientRect().height),
          files: getComputedStyle($('reader-files')).display, inside: card().getBoundingClientRect().bottom <= document.querySelector('.reader-card').getBoundingClientRect().bottom};
        // a fact copies its value alone
        card().querySelectorAll('.ai-copy-fact')[1].click();
        await wait(30);
        out.factCopied = window.__copied === '4815-1623' && card().querySelectorAll('.ai-facts .ai-label')[1].textContent === 'Order';
        const links = [...card().querySelectorAll('.ai-cal')];
        out.calendar = links.length === 2 && links.every(a => a.href.includes('authuser=evgeny%40example.com') && a.target === '_blank' &&
          a.textContent === t('addToCalendar')) && links[0].getAttribute('aria-label') === t('addToCalendar') + ': Design review';
        card().querySelector('.ai-copy').click();
        await wait(30);
        out.copied = String(window.__copied).includes('Anna sent the final mockups') && String(window.__copied).includes(t('summaryTodo')) &&
          String(window.__copied).includes(t('summaryFacts') + '\n• File: Макеты-v3.pdf\n• Order: 4815-1623');
        // Hide; I again shows it from the session's summaries; Regenerate asks anew
        card().querySelector('.ai-hide').click();
        await wait(30);
        out.hidden = !shown(card()) && $('reader-ai').querySelector('.ai-btn').getAttribute('aria-expanded') === 'false';
        key(document, 'KeyI');
        await wait(30);
        out.again = shown(card()) && items('ai-points').length === 3 && card().getAttribute('aria-busy') === 'false';
        card().querySelector('.ai-again').click();
        await wait(10);
        out.regenerating = card().getAttribute('aria-busy') === 'true' && calls('summarize').at(-1).fresh === true;
        await done();
        key(document, 'Escape');
        await wait(50);
        out.backHides = !shown(card());
        // opened again, the summary is there without a click
        await open('a1');
        await until(() => shown(card()), 1000);
        out.keptShown = shown(card()) && items('ai-points').length === 3;
        key(document, 'Escape');
        await wait(50);

        // back, and J, stop a summary underway; nothing goes wrong unseen
        await open('b1');
        key(document, 'KeyI');
        await until(() => items('ai-points').length > 0);
        key(document, 'Escape');
        await wait(50);
        out.backStops = calls('aborted').some(c => c.key === keyOf('b1')) && !shown(card());
        await open('a2');
        key(document, 'KeyI');
        await until(() => items('ai-points').length > 0);
        key(document, 'KeyJ');
        await wait(80);
        out.jStops = calls('aborted').some(c => c.key === keyOf('a2')) && id(state.reading.e.link) !== 'a2' && !shown(card());

        // every error says what it is, with the way to the AI settings
        const codes = ['auth', 'quota', 'rate', 'network', 'model', 'refusal', 'too-long', 'unavailable', 'bad-output', 'server', 'no-access'];
        out.errors = [];
        for (const code of codes) {
          ai.fail = code;
          if (shown(card())) {
            card().querySelector('.ai-again').click();
          }
          else {
            key(document, 'KeyI');
          }
          await until(() => shown(card().querySelector('.ai-error')) && card().getAttribute('aria-busy') === 'false');
          const el = card().querySelector('.ai-error');
          out.errors.push(el.textContent.startsWith(msg(code)) && Boolean(el.querySelector('.ai-settings')) ? 'ok' : code + ': ' + el.textContent);
        }
        ai.fail = null;
        card().querySelector('.ai-settings').click();
        out.settings = (window.__tabsCreated || []).at(-1)?.endsWith('/data/settings/index.html#ai');
        // a thread cut to its latest messages says so
        ai.truncated = true;
        card().querySelector('.ai-again').click();
        await done();
        out.truncated = shown(card().querySelector('.ai-note')) && card().querySelector('.ai-note').textContent === t('summaryTruncated') &&
          !shown(card().querySelector('.ai-error'));
        ai.truncated = false;
        key(document, 'Escape');
        await wait(50);
        // no summary where the panel shows no mail (Proton)
        out.proton = !canSummarize({xml: {service: 'proton'}}) && canSummarize({xml: {}});

        // waiting for a reply fails: a dot on the chip says why, what was found stays
        ai.replyFail = 'quota';
        const later = JSON.parse(JSON.stringify(state.objs));
        later[0].xml.entries.unshift({...later[0].xml.entries[0], link: later[0].xml.entries[0].link.replace('message_id=a1&', 'message_id=n2&'),
          id: 'tag:n2', author_name: 'Oleg', author_email: 'oleg@example.net', title: 'Lunch?', summary: 'Are you free on Friday?', modified: new Date().toISOString()});
        update(later);
        await until(() => $('chips').querySelector('.reply-chip .err-dot'), 2500);
        const chip = $('chips').querySelector('.reply-chip');
        out.errorDot = Boolean(chip?.querySelector('.err-dot')) && chip.dataset.tip === msg('quota') && chip.getAttribute('aria-label') === t('replyChip', 4) + ' · ' + msg('quota');
        out.consoleClean = window.__errors.length === 0 ? true : window.__errors;
      }

      if (scenario === 'aiauto') {
        // "automatically for long mail": a short thread waits for a click, a long one does not
        await open('a1');
        await wait(400);
        out.shortWaits = calls('summarize').length === 0 && !shown(card());
        key(document, 'Escape');
        await wait(50);
        window.__printLong = true;
        await open('b1');
        await until(() => calls('summarize').length > 0, 2000);
        out.longStarts = calls('summarize')[0]?.key === keyOf('b1') && calls('summarize')[0].chars > 1500 && shown(card());
        await done();
        out.longDone = items('ai-points').length === 3;
      }

      if (scenario === 'aiassist') {
        await until(() => state.ai.ok, 2000);
        // the header's button opens it, with its suggestions and the field focused
        $('tools').querySelector('.assist-btn').click();
        await until(() => $('app').classList.contains('assisting'));
        out.focused = document.activeElement?.id === 'assist-input';
        await until(() => document.querySelectorAll('#assist .suggestion').length);
        out.opened = out.focused && document.querySelectorAll('#assist .suggestion').length === 5;
        out.engine = await until(() => $('assist-bar').querySelector('.engine')?.textContent) && $('assist-bar').querySelector('.engine').textContent;
        // the sessions the first request needs, made ready as it opens
        out.warmed = calls('warm').length === 1 && calls('warm')[0].tasks.join() === 'plan,answer';
        const input = $('assist-input');
        const enter = () => input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', code: 'Enter', bubbles: true, cancelable: true}));
        const last = () => [...document.querySelectorAll('#assist .turn')].at(-1);
        const settled = () => until(() => !assist.ctl && last() && !last().querySelector('.status'), 3000);
        // who waits for a reply: the sorting knows, with no plan asked of the model
        await until(() => state.replies.size > 0, 2000);
        document.querySelectorAll('#assist .suggestion')[1].click();
        await settled();
        out.replies = {plans: calls('plan').length, refs: [...last().querySelectorAll('.ref-subject')].map(x => x.textContent),
          why: last().querySelector('.ref-why')?.textContent, title: last().querySelector('.what')?.textContent === t('suggestReply')};
        // find: every Gmail account searched with the planned query; what it found, listed, with what can be done with it
        input.value = 'find invoices';
        enter();
        await settled();
        out.findQuery = sent('gmail.search').filter(m => m.query === 'invoice').length;
        out.found = last().querySelectorAll('.ref').length;
        out.foundOpen = last().querySelector('.found')?.open;
        out.acts = [...last().querySelectorAll('.found-acts button')].map(b => b.className.split(' ')[0] + ':' + b.textContent);
        // "archive them": the mail found before, nothing searched, Archive all first; a click archives it, Z undoes it
        const searches = sent('gmail.search').length;
        input.value = 'archive them';
        enter();
        await settled();
        const prev = calls('plan').at(-1).previous;
        out.them = {searches: sent('gmail.search').length - searches, refs: last().querySelectorAll('.ref').length, prev: prev?.q + ':' + prev?.found,
          first: last().querySelector('.found-acts button')?.className + ':' + last().querySelector('.found-acts button .count')?.textContent};
        const actions = sent('gmail.action').length;
        last().querySelector('.found-acts .primary-btn').click();
        await wait(60);
        const archived = sent('gmail.action').at(-1);
        out.archived = sent('gmail.action').length === actions + 1 && archived.cmd === 'rc_^i' && archived.links.length === 4 && archived.delay === 5000 &&
          last().querySelectorAll('.ref.done').length === 4 && !last().querySelector('.found-acts .primary-btn') &&
          document.querySelector('#toast .undo') !== null;
        key(document, 'KeyZ');
        await until(() => !last().querySelector('.ref.done'), 1500);
        out.undone = sent('gmail.action.cancel').at(-1)?.id === archived.id && last().querySelectorAll('.ref.done').length === 0 &&
          Boolean(last().querySelector('.found-acts .primary-btn'));
        // nothing found, even more broadly: what was searched, Edit search and Gmail's own search
        input.value = 'find nothing';
        enter();
        await settled();
        out.nothing = {searched: sent('gmail.search').slice(-9).map(m => m.query).filter((q, i, l) => l.indexOf(q) === i),
          text: last().querySelector('.found-empty p')?.textContent, query: last().querySelector('.found-query')?.textContent,
          buttons: [...last().querySelectorAll('.found-empty button')].map(b => b.textContent)};
        last().querySelector('.found-empty button').click();
        await wait(50);
        out.edit = !$('app').classList.contains('assisting') && !$('search').hidden && $('search-input').value === 'subject:"zz nothing"' &&
          document.activeElement === $('search-input');
        closeSearch();
        $('tools').querySelector('.assist-btn').click();
        await until(() => $('app').classList.contains('assisting'));
        // Gmail that does not answer is no "nothing found"
        window.__searchFails = () => true;
        input.value = 'find invoices';
        enter();
        await settled();
        window.__searchFails = null;
        out.failed = last().querySelector('.found-empty[role="alert"] p')?.textContent === t('searchFailed') &&
          last().querySelector('.found-empty .primary-btn')?.textContent === t('signInAgain') && !last().querySelector('.found-query');
        // a mail kept from before the accounts moved: it opens in its own account, under the number Gmail gives it now
        const moved = {...[...assist.turns].reverse().find(x => x.mail?.length).mail.find(m => m.account === 'evgeny@example.com'),
          account: 'work@arbitron.example'};
        assist.turns.push({id: 'moved', q: 'moved', status: 'done', action: 'find', title: '', mail: [moved], cites: [], text: '', doubtful: []});
        paintAssist();
        document.querySelector('.turn[data-id="moved"] .ref').click();
        await until(() => $('app').classList.contains('reading'));
        out.moved = state.reading.o.xml.title === 'work@arbitron.example' && state.reading.e.link.includes('/u/1?') && moved.link.includes('/u/0?');
        key(document, 'Escape');
        await wait(50);
        assist.turns = assist.turns.filter(x => x.id !== 'moved');
        paintAssist();
        // a question: the first mail found read whole, an answer that cites it
        input.value = 'how much was the invoice?';
        enter();
        await settled();
        out.answer = last().querySelector('.answer')?.textContent;
        out.answerMail = calls('answer').at(-1)?.n;
        out.readWhole = calls('answer').at(-1)?.mail[0]?.text.length > 30;
        out.cite = Boolean(last().querySelector('button.cite'));
        // a sentence whose number no mail has shows as one to check
        out.doubt = last().querySelector('.answer .doubt')?.title === t('unverified') && last().querySelector('.answer .doubt').textContent === 'It was paid on 99999 1.';
        // its citation opens that mail in the reader; Esc comes back to the assistant
        last().querySelector('button.cite').click();
        await until(() => $('app').classList.contains('reading'));
        out.citeOpens = $('reader-subject').textContent.startsWith('Invoice #1042');
        key(document, 'Escape');
        await wait(50);
        out.backToAssist = $('app').classList.contains('assisting') && !$('app').classList.contains('reading');
        // a new mail: its fields to change, then Gmail's compose window with all of it
        input.value = 'write to Anna that the meeting moves to Friday';
        enter();
        await settled();
        const email = last().querySelector('.email');
        out.email = email && [email.querySelector('input[type=email]').value, email.querySelector('input[type=text]').value];
        const subject = email.querySelector('input[type=text]');
        subject.value = 'Встреча: пятница';
        subject.dispatchEvent(new Event('input'));
        [...email.querySelectorAll('.row-btns button')].find(b => b.textContent === t('openInGmail')).click();
        await wait(30);
        out.compose = sent('open').at(-1)?.url || '';
        // or sent from here, first in line: an address that is none is asked again, nothing goes
        const to = email.querySelector('input[type=email]');
        to.value = 'anna';
        to.dispatchEvent(new Event('input'));
        email.querySelector('.row-btns .primary-btn').click();
        await wait(30);
        out.badAddress = sent('gmail.send').length === 0 && $('toast').textContent === t('checkAddress') && document.activeElement === to;
        to.value = 'anna@figma.com';
        to.dispatchEvent(new Event('input'));
        last().querySelector('.email .row-btns .primary-btn').click();
        await until(() => last().querySelector('.sent-note'), 1000);
        const mail = sent('gmail.send').at(-1);
        out.newSent = mail && {delay: mail.delay, from: mail.mail.from, to: mail.mail.to, subject: mail.mail.subject, text: mail.mail.text.slice(0, 12), reply: mail.mail.reply,
          note: last().querySelector('.sent-note')?.textContent, buttons: last().querySelectorAll('.email .row-btns').length};
        // what is important: the unread mail read by its preview
        input.value = 'what is important?';
        enter();
        await settled();
        out.brief = calls('answer').at(-1)?.n;
        out.flags = calls('answer').at(-1)?.mail.some(m => /waits for your reply \(asks for the mockups\)/.test(m.flags));
        out.kept = (chrome.storage.session.area['assist.turns'] || []).length;
        // the emails do not say: said so, the mail found still listed
        input.value = 'unknown invoice?';
        enter();
        await settled();
        out.notFound = last().querySelector('.answer')?.textContent === t('notInMail') && last().querySelectorAll('.ref').length === 4;
        // stopped while it answers
        window.__ai.hold = true;
        input.value = 'how much was the invoice?';
        enter();
        await until(() => last().querySelector('.status') && assist.ctl, 2000);
        await until(() => calls('answer').length === 4, 2000);
        $('assist-send').click();
        await until(() => !assist.ctl, 2000);
        out.stopped = Boolean(last().querySelector('.text-btn')) && !last().querySelector('.status');
        window.__ai.hold = false;
        // a usage limit: Manage usage first
        window.__ai.planFail = 'limit';
        input.value = 'find invoices';
        enter();
        await settled();
        out.limit = last().querySelector('.ai-error .primary-btn')?.textContent === t('manageUsage');
        window.__ai.planFail = null;
        // Esc closes it
        input.focus();
        input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', code: 'Escape', bubbles: true, cancelable: true}));
        await wait(50);
        out.closed = !$('app').classList.contains('assisting');
      }

      if (scenario === 'aitools') {
        await until(() => state.ai.ok && $('chips').querySelector('.reply-chip'), 3000);
        // the sorting: a chip for each kind, the list narrowed with all of it read at once
        out.chips = [...$('chips').querySelectorAll('.sort-chip')].map(c => c.className.match(/\b(reply|important|bulk)-chip/)[1]);
        $('chips').querySelector('.important-chip')?.click();
        await wait(50);
        out.bar = $('list').querySelector('.sort-bar .sort-what .sr')?.textContent;
        out.barShown = [...$('list').querySelectorAll('.sort-bar .sort-what > span[aria-hidden]')].map(el => el.textContent);
        out.narrowed = document.querySelectorAll('#list .row').length;
        $('list').querySelector('.sort-bar .text-btn').click();
        await wait(50);
        out.readAll = sent('gmail.action').at(-1)?.cmd === 'rd' && sent('gmail.action').at(-1)?.links.length === out.narrowed;
        key(document, 'KeyZ');
        await wait(50);
        key(document, 'Escape');
        await wait(50);
        // the open mail's buttons: summary, reply, translation (the engine's, with no detector here), question
        await open('a1');
        out.strip = [...$('reader-ai').querySelectorAll('.ai-act')].filter(b => !b.hidden).map(b => b.dataset.focus);
        // a reply: an intent drafts it, marked as the one chosen; Gmail's compose window takes it
        $('reader-ai').querySelector('.ai-reply').click();
        out.intents = [...$('ai-tool').querySelectorAll('.intents .suggestion')].map(b => b.textContent);
        $('ai-tool').querySelector('.intents .suggestion').click();
        const chosen = $('ai-tool').querySelector('.intents .suggestion.on');
        out.chosen = chosen?.textContent === t('intentYes') && chosen.getAttribute('aria-pressed') === 'true' && $('ai-tool').querySelectorAll('.suggestion.on').length === 1;
        await until(() => $('ai-tool').querySelector('.draft') && $('ai-tool').getAttribute('aria-busy') === 'false');
        out.draft = $('ai-tool').querySelector('.draft').value;
        out.draftCall = calls('draft').at(-1);
        // with a draft, the intents and their field fold into one Rewrite… field with its buttons
        out.folded = !$('ai-tool').querySelector('.intents') && $('ai-tool').querySelectorAll('.rewrites .suggestion').length === 5 &&
          $('ai-tool').querySelector('.tool-input').placeholder === t('rewritePlaceholder');
        [...$('ai-tool').querySelectorAll('.row-btns button')].find(b => b.textContent === t('openInGmail')).click();
        await wait(30);
        out.replyUrl = sent('open').at(-1)?.url || '';
        // Send comes first, to the sender: an Undo takes it back while it waits, the draft as it was
        const sendBtn = $('ai-tool').querySelector('.row-btns .primary-btn');
        out.sendFirst = sendBtn?.textContent === t('send') && $('ai-tool').querySelector('.send-to bdi')?.textContent === 'anna@figma.com';
        window.__sendHold = true;
        sendBtn.click();
        await until(() => sent('gmail.send').length > (out.newSent ? 1 : 0), 1000);
        const held = sent('gmail.send').at(-1);
        out.replySend = {delay: held.delay, to: held.mail.to, subject: held.mail.subject.startsWith('Re: '), text: held.mail.text === out.draft, reply: held.mail.reply,
          link: held.mail.link === state.reading.e.link, waiting: $('ai-tool').querySelector('.row-btns .primary-btn')?.disabled};
        document.querySelector('#toast .undo').click();
        await wait(30);
        window.__sendHold = false;
        out.sendUndone = sent('gmail.send.cancel').length === 1 && !$('ai-tool').hidden && $('ai-tool').querySelector('.draft').value === out.draft &&
          !$('ai-tool').querySelector('.row-btns .primary-btn').disabled;
        // the reader's own change, rewritten Shorter: it streams into the same field, Undo brings the change back
        const draft = $('ai-tool').querySelector('.draft');
        draft.value = 'Привет, Аня! Спасибо большое, посмотрю всё до пятницы.';
        draft.dispatchEvent(new Event('input'));
        $('ai-tool').querySelector('.rewrites .suggestion').click();
        await until(() => $('ai-tool').getAttribute('aria-busy') === 'true' && $('ai-tool').querySelector('.draft').value, 1000);
        const streaming = $('ai-tool').querySelector('.draft');
        const partial = streaming.value;
        await until(() => streaming.value !== partial, 1000);
        out.inPlace = streaming.isConnected && streaming.readOnly && $('ai-tool').querySelector('.rewrites .suggestion.on')?.textContent === t('rewriteShorter');
        await until(() => $('ai-tool').getAttribute('aria-busy') === 'false', 2000);
        out.rewrite = {call: calls('rewrite').at(-1)?.how + ':' + calls('rewrite').at(-1)?.text, text: $('ai-tool').querySelector('.draft').value};
        [...$('ai-tool').querySelectorAll('.row-btns .text-btn')].find(b => b.textContent === t('undo')).click();
        out.undo = $('ai-tool').querySelector('.draft').value === 'Привет, Аня! Спасибо большое, посмотрю всё до пятницы.';
        // the reader's own words in the field: a rewrite of its own
        const field = $('ai-tool').querySelector('.tool-input');
        field.value = 'теплее';
        field.dispatchEvent(new Event('input'));
        field.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true}));
        await until(() => calls('rewrite').length === 2 && $('ai-tool').getAttribute('aria-busy') === 'false', 2000);
        out.ownWords = calls('rewrite').at(-1).how === 'теплее';
        // sent: said so, and the card closes; Gmail refusing it keeps the card and the draft
        window.__sendFails = true;
        $('ai-tool').querySelector('.row-btns .primary-btn').click();
        await until(() => $('toast').classList.contains('error'), 1000);
        out.sendFailed = $('toast').textContent === t('sendFailed') && !$('ai-tool').hidden && Boolean($('ai-tool').querySelector('.draft')?.value);
        window.__sendFails = false;
        $('ai-tool').querySelector('.row-btns .primary-btn').click();
        await until(() => $('ai-tool').hidden, 1000);
        out.replySent = $('toast').textContent === t('mailSent') && sent('gmail.send').at(-1).mail.text === $('ai-tool').querySelector('.draft')?.value;
        // a question about the mail: its messages, an answer
        $('reader-ai').querySelector('.ai-ask').click();
        const q = $('ai-tool').querySelector('.tool-input');
        out.askFocused = document.activeElement === q;
        q.value = 'Когда дедлайн?';
        q.dispatchEvent(new Event('input'));
        q.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true}));
        await until(() => $('ai-tool').querySelector('.answer') && $('ai-tool').getAttribute('aria-busy') === 'false');
        // the thread read newest first, with the reader named
        out.ask = calls('answer').at(-1)?.question === 'Когда дедлайн?' && calls('answer').at(-1)?.n === 3 &&
          calls('answer').at(-1).thread?.reader === 'evgeny@example.com' && calls('answer').at(-1).mail.length === 0 &&
          Boolean($('ai-tool').querySelector('.answer .doubt'));
        // Esc in its field closes the card, not the mail
        $('ai-tool').querySelector('.tool-input').dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true}));
        await wait(30);
        out.escCard = $('ai-tool').hidden && $('app').classList.contains('reading');
        // a translation by the engine, as a card
        $('reader-ai').querySelector('.ai-translate').click();
        await until(() => $('ai-tool').querySelector('.translation') && $('ai-tool').getAttribute('aria-busy') === 'false');
        out.translation = $('ai-tool').querySelector('.translation')?.textContent;
        // A asks about the open mail
        $('ai-tool').querySelector('.ai-hide').click();
        key(document, 'KeyA');
        await wait(30);
        out.keyA = !$('ai-tool').hidden && $('ai-tool').querySelector('.tool-input') === document.activeElement;
      }

      if (scenario === 'aioff' || scenario === 'ainone') {
        // the engine off: no ai.js and no call. Its buttons offer it (I too), unless the settings say not to
        await wait(1200);
        const offer = Boolean($('chips').querySelector('.ai-offer'));
        const header = Boolean($('tools').querySelector('.assist-btn'));
        await open('a1');
        key(document, 'KeyI');
        await wait(300);
        out.off = {calls: ai.calls.length, button: shown($('reader-ai').querySelector('.ai-btn')), card: shown(card()),
          offerCard: shown($('ai-tool')) && Boolean($('ai-tool').querySelector('.primary-btn')),
          chip: Boolean($('chips').querySelector('.reply-chip')), offer, header, script: Boolean(document.querySelector('script[src*="/ai/ai.js"]')),
          hint: (await sheet()).some(([, k]) => k === 'I')};
        out.firstRow = window.__firstRow;
        // Reply: one's own words, written and sent here with no assistant at all
        $('reader-bar').querySelector('.reply-btn').click();
        await wait(30);
        const draft = $('ai-tool').querySelector('.draft');
        out.write = {open: shown($('ai-tool')), title: $('ai-tool').querySelector('h3')?.textContent, to: $('ai-tool').querySelector('.send-to bdi')?.textContent,
          focused: document.activeElement === draft, placeholder: draft?.placeholder, opened: sent('open').length};
        draft.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', ctrlKey: true, bubbles: true, cancelable: true}));
        await wait(30);
        out.write.empty = sent('gmail.send').length === 0 && document.activeElement === draft;
        draft.value = 'Thanks, Anna! Friday works.';
        draft.dispatchEvent(new Event('input'));
        draft.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', ctrlKey: true, bubbles: true, cancelable: true}));
        await until(() => $('ai-tool').hidden, 1000);
        const mail = sent('gmail.send').at(-1)?.mail;
        out.write.sent = mail && {to: mail.to, text: mail.text, subject: mail.subject.startsWith('Re: '), reply: mail.reply === id(state.reading.e.link), calls: ai.calls.length};
      }

      if (scenario === 'aisetup') {
        // the engine off: the header's button opens the setup, its keys behind one choice
        await wait(300);
        $('tools').querySelector('.assist-btn').click();
        await until(() => $('assist-body').querySelector('.setup'));
        const setup = $('assist-body').querySelector('.setup');
        const keys = $('setup-keys');
        const toggle = setup.querySelector('.choice[data-engine="key"]');
        const opened = () => window.__tabsCreated?.at(-1)?.replace(/^.*\/data\/settings\/index\.html/, '');
        out.builtin = Boolean(self.LanguageModel);
        out.choices = [...setup.querySelectorAll('.choice')].map(c => c.dataset.engine);
        out.closed = keys.hidden && !shown(keys) && toggle.getAttribute('aria-expanded') === 'false' && toggle.getAttribute('aria-controls') === keys.id;
        toggle.focus();
        toggle.click();
        out.expanded = shown(keys) && toggle.getAttribute('aria-expanded') === 'true' && document.activeElement === toggle;
        out.tiles = [...keys.querySelectorAll('.key-tile')].map(b => b.dataset.engine);
        out.tileNames = [...keys.querySelectorAll('.key-tile')].map(b => b.getAttribute('aria-label') || b.textContent);
        out.group = keys.getAttribute('role') === 'group' && keys.getAttribute('aria-label') === toggle.querySelector('.choice-name').textContent;
        // a tile opens Settings at its provider; the server here at its own
        keys.querySelector('[data-engine="gemini"]').click();
        out.gemini = opened();
        setup.querySelector('.choice[data-engine="local"]').click();
        out.local = opened();
        // the row stays open through a repaint, and closes again in place
        paintAssist();
        const again = $('setup-keys');
        out.keptOpen = shown(again);
        $('assist-body').querySelector('.choice[data-engine="key"]').click();
        out.closedAgain = again.hidden && $('assist-body').querySelector('.choice[data-engine="key"]').getAttribute('aria-expanded') === 'false';
        // what Settings → AI writes: a new engine turns it on, an unknown one is off; a new
        // engine's key or model restarts it; what the assistant keeps does not
        const change = (k, v) => window.__storageChanged({[k]: {newValue: v}}, 'local');
        const restarts = k => {
          state.ai.ok = 'kept';
          change(k, 'x');
          return state.ai.ok === false;
        };
        out.engines = ['gemini', 'xai', 'deepseek', 'mistral', 'qwen', 'kimi', 'groq', 'openrouter', 'local', 'yandex', 'zai', 'nonsense'].map(e => {
          change('ai.engine', e);
          return state.ai.engine;
        });
        out.restarts = ['ai.gemini.key', 'ai.openrouter.model', 'ai.local.url', 'ai.yandex.folder', 'ai.chatgpt.auth', 'ai.replies', 'ai.summaries', 'ai.geminikey']
          .map(restarts);
        // with one on, the setup marks it where it shows it again, its keys open
        change('ai.engine', 'kimi');
        assist.setup = true;
        assist.keys = null;
        paintAssist();
        out.marked = [...$('assist-body').querySelectorAll('[aria-current="true"]')].map(b => b.dataset.engine);
        out.openForKey = shown($('setup-keys'));
        // what an engine says of itself
        out.labels = [];
        for (const d of [
          {engine: 'gemini', provider: 'Gemini', model: 'Gemini 3.8 Flash'},
          {engine: 'openrouter', provider: 'OpenRouter', model: 'Anthropic: Claude Sonnet 5'},
          {engine: 'deepseek', provider: 'DeepSeek', model: ''},
          {engine: 'local', provider: 'Ollama', model: 'qwen3:8b', local: true},
          {engine: 'local', provider: 'LM Studio', model: ''},
          {engine: 'builtin', provider: 'Chrome', model: 'Gemini Nano', local: true},
          {engine: 'chatgpt', provider: 'ChatGPT', model: '', plan: true}
        ]) {
          ai.describe = d;
          out.labels.push(await engineLabel());
        }
        out.consoleClean = window.__errors.length === 0 ? true : window.__errors;
      }

      if (scenario === 'aireal') {
        // the real ai.js, with no key: loaded after the list's first frame, its error in the card
        await until(() => self.AI, 3000);
        out.loadedAfter = window.__aiScriptAt > window.__firstRow;
        // every engine ai.js runs is one the panel knows before loading it (or it would say off),
        // and every engine the panel offers is one ai.js runs
        out.unknownEngines = (self.AI?.ENGINES || ['none']).filter(e => e !== 'off' && !ENGINES.includes(e));
        out.missingEngines = ENGINES.filter(e => !self.AI?.ENGINES?.includes(e));
        out.times = {script: window.__aiScriptAt};
        out.firstRow = window.__firstRow;
        await open('a1');
        key(document, 'KeyI');
        await until(() => shown(card().querySelector('.ai-error')), 3000);
        out.noKey = card().querySelector('.ai-error').textContent.startsWith(msg('auth'));
        await wait(1000);
        out.noChip = !$('chips').querySelector('.reply-chip');
        out.consoleClean = window.__errors.length === 0 ? true : window.__errors;
      }
    }

    if (scenario === 'privacy' || scenario === 'privacyask') {
      // the reader of a mail, its body shown and its lines said: what they say, without the
      // marks that keep a domain's direction
      const doc = document.getElementById('body').contentDocument;
      const rowFor = x => [...document.querySelectorAll('#list .row')].find(r => r.dataset.link.includes('message_id=' + x + '&'));
      const open = async x => {
        if (state.reading) {
          back();
        }
        rowFor(x).click();
        await until(() => doc.querySelector('.thread') && !document.getElementById('reader').classList.contains('loading'));
        await wait(100);
      };
      const lines = () => [...document.querySelectorAll('#reader-notes .reader-note')]
        .map(n => n.classList[1] + ':' + n.querySelector('.note-text').textContent.replace(/[⁨⁩]/g, ''));
      const mine = async () => Object.fromEntries(Object.entries(await pixels(scenario + '-')).map(([k, v]) => [k.slice(scenario.length + 1), v]));
      // pointed at first: built ahead of the click, it loads nothing
      rowFor('t1').dispatchEvent(new MouseEvent('mouseenter'));
      await wait(500);
      out.hover = await mine();
      await open('t1');
      out.trackerLine = lines();
      out.tip = document.querySelector('#reader-notes .ok')?.dataset.tip;
      out.focusable = document.querySelector('#reader-notes .ok')?.tabIndex === 0;
      out.blanks = [...doc.querySelectorAll('img')].filter(i => i.getAttribute('src')?.startsWith('data:')).length;
      out.named = [...doc.querySelectorAll('img[data-tracker]')].map(i => i.dataset.tracker);
      out.litmusGone = ![...doc.querySelectorAll('[style]')].some(n => n.getAttribute('style').includes('emltrk'));
      out.bar = Boolean(doc.querySelector('.pictures'));
      await wait(600);
      out.before = await mine();
      doc.querySelector('.pictures button')?.click();
      for (const end = Date.now() + 2000; Date.now() < end; await wait(50)) {
        out.after = await mine();
        if (out.after.pic && out.after.bg && out.after.css) {
          break;
        }
      }
      await wait(300);
      out.after = await mine();
      // the sender's lines: a brand's name from elsewhere, a lookalike, replies to a lookalike
      // of the reader's own domain (from the print view), and an ordinary mail
      await open('w1');
      out.brand = lines();
      out.warnTip = document.querySelector('#reader-notes .warn')?.dataset.tip;
      await open('w2');
      out.lookalike = lines();
      await open('w3');
      out.replyTo = lines();
      await open('n1');
      out.normal = lines();
      out.notesHidden = document.getElementById('reader-notes').hidden;
      out.consoleClean = window.__errors.length === 0 ? true : window.__errors;
    }

    if (scenario === 'reliable') {
      // a print view in no index (a panel closed between its writes), there when the panel opens
      chrome.storage.session.area['print:lost#v'] = {href: 'x', content: 'x'};
      const listed = () => [...document.querySelectorAll('#list .row')].map(r => gmail.get.id(r.dataset.link));
      // a mail archived from Gmail's search leaves the feed's list too: the same thread, printed otherwise
      document.getElementById('search').hidden = false;
      document.getElementById('search-input').value = 'mockups';
      document.getElementById('search').requestSubmit();
      await until(() => document.querySelector('#list .row'));
      out.searchFound = listed();
      document.querySelector('#list .row').focus();
      key(document, 'KeyE');
      await wait(300);
      key(document.getElementById('search-input'), 'Escape');
      await wait(100);
      out.afterSearchAction = listed();
      undo();
      await wait(250);
      out.afterUndo = listed();

      // an action over two accounts that one of them refuses: only that one's mail comes back
      window.__actionFails = links => links.filter(l => l.includes('/u/1'));
      const two = [...document.querySelectorAll('#list .row')].map(r => r.dataset.link).filter(l => /message_id=(a2|b1)&/.test(l));
      act('rd', two);
      await wait(400);
      out.partial = listed();
      out.partialToast = document.getElementById('toast').classList.contains('error');
      window.__actionFails = null;

      // with auto-advance, an action in a mail opened from a list of its own (the assistant's)
      // goes on along that list, which the reader still counts
      state.autoAdvance = true;
      const evgeny = state.objs.find(o => o.xml.title === 'evgeny@example.com');
      const extra = state.extra.get('evgeny@example.com') || [];
      const trail = new Map([evgeny.xml.entries[0], ...extra.slice(0, 2)].map(e => [e.link, {e, o: evgeny}]));
      read(evgeny.xml.entries[0], evgeny, trail);
      await wait(200);
      const pos = () => document.getElementById('reader-bar').querySelector('.pos')?.textContent;
      out.trailBefore = pos();
      actFromReader('rc_^i', evgeny.xml.entries[0]);
      await wait(250);
      out.trailAfter = [pos(), document.getElementById('reader-subject').firstChild?.textContent];
      key(document, 'KeyJ');
      await wait(200);
      out.trailJ = pos();
      key(document, 'Escape');
      await wait(100);
      undo();
      await wait(250);
      state.autoAdvance = false;

      // a side panel asks again for a mailbox's mail past the feed's 20 once its count moves, a
      // while after the last time; after accounts change places, each is asked at its own place
      const searches = () => sent('gmail.search').filter(m => m.query.includes('is:unread')).length;
      const before = searches();
      update(JSON.parse(JSON.stringify(state.objs)));
      await wait(100);
      out.extraSameCount = searches() - before;
      const moved = JSON.parse(JSON.stringify(state.objs));
      moved[0].xml.fullcount += 1;
      update(moved);
      await wait(100);
      out.extraTooSoon = searches() - before;
      extraFound.forEach(f => f.at -= 3 * 60 * 1000);
      update(JSON.parse(JSON.stringify(moved)));
      await until(() => searches() > before);
      out.extraAgain = searches() - before;
      const swap = JSON.parse(JSON.stringify(state.objs).replace(/mail\/u\/([01])/g, (m, n) => 'mail/u/' + (1 - n)));
      update(swap);
      await wait(300);
      out.extraAtPlace = [...state.extra].every(([name, list]) => {
        const o = state.objs.find(x => accountName(x) === name);
        return list.every(e => e.link.startsWith(o.xml.rootLink + '?'));
      });
      out.extraAsked = sent('gmail.search').filter(m => m.query.includes('is:unread')).slice(-2).map(m => m.url).sort();

      // what the panel knows of mail no longer listed goes
      state.files.set('https://mail.google.com/mail/u/0?message_id=gone#v', []);
      state.replies.set('evgeny@example.com|gone|v', {reply: true});
      replySeen.add('evgeny@example.com|gone|v');
      update(JSON.parse(JSON.stringify(state.objs)));
      out.pruned = !state.files.has('https://mail.google.com/mail/u/0?message_id=gone#v') && !state.replies.has('evgeny@example.com|gone|v') &&
        !replySeen.has('evgeny@example.com|gone|v') && state.files.size > 0;

      // a print view Gmail sends to its sign-in page fails, is not kept, and loads once the account is back
      const link = id => `https://mail.google.com/mail/u/2?account_id=x&message_id=${id}&view=conv&extsrc=atom`;
      const shows = node => Boolean(node?.querySelector?.('.thread, details.msg') || node?.classList?.contains('thread'));
      window.__printSignIn = true;
      out.signIn = await gmail.body(link('away'), true, 'v').then(shows, () => 'failed');
      await wait(100);
      out.signInKept = (chrome.storage.session.area['print.index'] || []).some(([k]) => k.includes('away'));
      window.__printSignIn = false;
      out.signInBack = await gmail.body(link('away'), true, 'v').then(shows, () => 'failed');
      // one that never answers is given up, and the reader says so
      const timeout = AbortSignal.timeout;
      AbortSignal.timeout = ms => timeout.call(AbortSignal, ms / 100);
      window.__printHang = true;
      const hung = 'https://mail.google.com/mail/u/1?account_id=x&message_id=hung&view=conv&extsrc=atom';
      out.hung = await gmail.body(hung, true, 'v').then(() => 'loaded', e => String(e.name || e));
      window.__printHang = false;
      AbortSignal.timeout = timeout;

      // the renderings kept are the last 20
      const first = await gmail.body(link('r0'), true, 'v');
      out.renderKept = await gmail.body(link('r0'), true, 'v') === first;
      for (let i = 1; i <= 20; i += 1) {
        await gmail.body(link('r' + i), true, 'v');
      }
      out.renderDropped = await gmail.body(link('r0'), true, 'v') !== first;

      // the print views kept for the session stay within 3 MB, and one over 300 KB is not kept
      window.__printBig = 120000;
      for (let i = 0; i < 14; i += 1) {
        await gmail.body(link('big' + i), true, 'v');
      }
      window.__printBig = 200000;
      await gmail.body(link('huge'), true, 'v');
      window.__printBig = 0;
      await wait(300);
      const area = chrome.storage.session.area;
      const prints = Object.keys(area).filter(k => k.startsWith('print:') && k !== 'print:lost#v');
      const size = k => new TextEncoder().encode(JSON.stringify(area[k])).length + k.length;
      out.printBytes = prints.reduce((n, k) => n + size(k), 0);
      out.printIndexed = JSON.stringify(area['print.index'].map(([k]) => 'print:' + k).sort()) === JSON.stringify(prints.sort());
      out.hugeKept = prints.some(k => k.includes('huge'));

      // the print view in no index goes a while after the panel opened
      await until(() => !('print:lost#v' in area), 4000);
      out.lostGone = !('print:lost#v' in area);
    }

    if (scenario === 'ux') {
      // the panel as it opens and is used: a1 a2 (evgeny's), b1 (work's)
      const $ = id => document.getElementById(id);
      const id = link => link.match(/message_id=([^&]*)/)[1];
      const rowOf = x => [...document.querySelectorAll('#list .row')].find(r => id(r.dataset.link) === x);
      const overlap = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      // the first line has the keys from the start, marked without the keyboard's ring
      const first = document.querySelector('#list .row');
      out.firstFocused = document.activeElement === first && !first.matches(':focus-visible');
      key(document, 'KeyE');
      await wait(250);
      out.firstActed = sent('gmail.action').at(-1)?.cmd === 'rc_^i' && sent('gmail.action').at(-1).links[0] === first.dataset.link;
      key(document, 'KeyZ');
      await wait(100);

      // no native titles on the buttons: a tooltip with the name and the key, under the button
      out.noTitles = !$('tools').querySelector('[title]') && !document.querySelector('#list .row button[title]');
      const search = $('tools').querySelector('[data-focus="search"]');
      search.dispatchEvent(new PointerEvent('pointerover', {bubbles: true, pointerType: 'mouse'}));
      await wait(150);
      const early = $('tip').classList.contains('show');
      await wait(450);
      const tip = $('tip');
      out.tip = {early, shown: tip.classList.contains('show'), text: tip.querySelector('span')?.textContent, key: tip.querySelector('kbd')?.textContent,
        clear: !overlap(tip.getBoundingClientRect(), search.getBoundingClientRect()), label: label(search)};
      document.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}));
      out.tipGone = !tip.classList.contains('show');
      // Add another account is at the end of the list, not in the header
      out.addAccount = !$('tools').querySelector('[data-focus="addUser"]') && Boolean($('list').querySelector('.list-foot [data-focus="add-account"]'));

      // ?: the list's keys; Esc closes it, the focus back where it was
      rowOf('a2').focus();
      key(document, 'Slash', {shiftKey: true, key: '?'});
      await wait(30);
      const rows = () => [...document.querySelectorAll('#sheet .sheet-row')].map(r => r.querySelector('.keys').textContent);
      out.sheetList = {open: Boolean($('sheet')), modal: $('app').inert, inside: $('sheet')?.contains(document.activeElement), keys: rows()};
      key(document, 'KeyE');
      await wait(30);
      out.sheetHoldsKeys = Boolean($('sheet')) && !sent('gmail.action').some(a => a.links.some(l => l.includes('message_id=a2&')));
      key(document, 'Escape');
      await wait(30);
      out.sheetClosed = !$('sheet') && !$('app').inert && document.activeElement === rowOf('a2');
      // in a message: its keys, Esc for back, no Enter
      rowOf('a1').click();
      await wait(100);
      key(document, 'Slash', {shiftKey: true, key: '?'});
      await wait(30);
      out.sheetReader = rows();
      key(document, 'Escape');
      await wait(30);
      out.sheetReaderClosed = !$('sheet') && $('app').classList.contains('reading');

      // the reader: the arrows before its place, Reply by name, the rest under ⋯
      const bar = [...$('reader-bar').children].map(el => el.dataset.focus || el.className);
      out.bar = bar;
      $('reader-bar').querySelector('.more-acts').click();
      await wait(30);
      out.more = [...document.querySelectorAll('#menu [role="menuitem"]')].map(b => b.dataset.key);
      key(document.activeElement, 'Escape');
      await wait(30);
      out.moreClosed = !$('menu') && document.activeElement === $('reader-bar').querySelector('.more-acts');
      key(document, 'Escape');
      await wait(50);

      // remind me later: 2 picks the second time; a date and a time of one's own
      rowOf('a2').focus();
      key(document, 'KeyB');
      await wait(30);
      out.remindKeys = [...document.querySelectorAll('#menu [role="menuitem"] kbd')].map(k => k.textContent);
      const second = Remind.times()[1].until;
      window.__set = [];
      key(document.activeElement, 'Digit2');
      await wait(250);
      // the worker keeps the reminders: the time is the one the panel asks it for
      const until = () => sent('remind.add').at(-1)?.until;
      out.remindByKey = Math.abs(until() - second) < 60000;
      key(document, 'KeyZ');
      await wait(100);
      rowOf('a2').focus();
      key(document, 'KeyB');
      await wait(30);
      [...document.querySelectorAll('#menu [role="menuitem"]')].at(-1).click();
      await wait(30);
      const input = document.querySelector('#menu input[type="datetime-local"]');
      const at = new Date();
      at.setDate(at.getDate() + 3);
      at.setHours(15, 30, 0, 0);
      window.__set = [];
      input.value = new Date(at - at.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      out.pickFocused = document.activeElement === input;
      input.form.requestSubmit();
      await wait(250);
      out.remindPicked = until() === at.getTime() && !$('menu');
      key(document, 'KeyZ');
      await wait(100);

      // search as one types: the list's own mail, nothing asked; Enter asks Gmail
      const searches = sent('gmail.search').length;
      const prints = window.__prints;
      key(document, 'Slash');
      await wait(30);
      const field = $('search-input');
      const type = text => {
        field.value = text;
        field.dispatchEvent(new Event('input'));
      };
      type('figma');
      await wait(30);
      out.typed = [...document.querySelectorAll('#list .row')].map(r => id(r.dataset.link));
      out.searchAll = $('list').querySelector('.search-all')?.textContent;
      type('zzzq');
      await wait(30);
      out.none = $('list').querySelector('.search-note')?.textContent === t('noMatches') && rows().length === 0;
      out.nothingAsked = sent('gmail.search').length === searches && window.__prints === prints;
      key(field, 'ArrowDown');
      out.downToAll = document.activeElement === $('list').querySelector('.search-all');
      field.focus();
      $('search').requestSubmit();
      await wait(100);
      out.enterAsks = sent('gmail.search').at(-1)?.query === 'zzzq';
      key(field, 'Escape');
      await wait(30);

      // an update without mail is a page asking for a check, not a list to draw
      const before = document.querySelectorAll('#list .row').length;
      window.__onMessage?.({method: 'update'});
      await wait(30);
      out.dataless = before > 0 && document.querySelectorAll('#list .row').length === before;
    }

    if (scenario === 'boot') {
      // a browser just started: lines stand for the mail, never "Sign in", until the first list
      const $ = id => document.getElementById(id);
      out.skeleton = Boolean($('list').querySelector('.skel')) && !$('list').querySelector('.empty, .row') && $('list').ariaBusy === 'true';
      out.tools = Boolean($('tools').querySelector('[data-focus="compose"]'));
      window.__onMessage({method: 'update', data: window.__objs});
      await wait(50);
      out.listed = !$('list').querySelector('.skel') && document.querySelectorAll('#list .row').length >= 3 && $('list').ariaBusy === 'false';
      // no one signed in after all: the panel says so, not lines
      state.booting = true;
      render();
      window.__onMessage({method: 'update', data: []});
      await wait(50);
      out.empty = Boolean($('list').querySelector('.empty .cta')) && !$('list').querySelector('.skel');
    }

    if (scenario === 'pin') {
      // the toolbar button not pinned: a line under the list says so, until closed or pinned
      const $ = id => document.getElementById(id);
      const hint = () => $('list').querySelector('.pin-hint');
      out.shown = hint()?.textContent === t('pinHint') && hint().nextElementSibling?.classList.contains('list-foot');
      window.__pinnedNow = true;
      await window.__pinChanged?.({isOnToolbar: true});
      await wait(50);
      out.goneWhenPinned = !hint();
      window.__pinnedNow = false;
      await window.__pinChanged?.({isOnToolbar: false});
      await wait(50);
      hint()?.querySelector('.icon-btn').click();
      await wait(50);
      out.closed = !hint() && window.__set.some(o => o['pinHint.dismissed'] === true);
    }

    if (scenario === 'acting') {
      // acting on mail: unsubscribing, unread, labels; read on open (?read=1), the assistant on for
      // its Newsletters (a4, Notion's digest, one click; a2, GitHub's, by mail; a1 has no way)
      const $ = id => document.getElementById(id);
      const id = link => link.match(/message_id=([^&]*)/)[1];
      const rowOf = x => [...document.querySelectorAll('#list .row')].find(r => id(r.dataset.link) === x);
      const actions = () => sent('gmail.action').map(m => m.cmd + ':' + m.links.map(id).join(',') + (m.delay ? ':' + m.delay : ''));
      const items = () => [...document.querySelectorAll('#menu [role="menuitem"]:not([hidden])')];
      const press = (code, extra = {}) => key(document.activeElement || document, code, extra);
      window.__heads = {
        a4: {messageId: 'd@notion.so', unsubscribe: {post: 'https://www.notion.so/unsub?u=1', web: 'https://www.notion.so/unsub?u=1', mailto: null, first: 'web'}},
        a2: {messageId: 's@github.com', unsubscribe: {post: null, web: null, mailto: {to: 'unsub@github.com', subject: 'unsubscribe', body: 'please'}, first: 'mailto'}}
      };
      // a mail by mail: ⋯ says so; the dialog names the sender and keeps the focus, Esc closes it
      rowOf('a2').click();
      await until(() => $('app').classList.contains('reading') && sent('gmail.headers').length);
      await wait(100);
      $('reader-bar').querySelector('.more-acts').click();
      await until(() => $('menu'));
      const item = items().find(b => b.textContent.startsWith(t('unsubscribe')));
      out.moreUnsub = item?.querySelector('.hint')?.textContent === t('howMail');
      out.moreKeys = items().map(b => b.dataset.key || '');
      item?.click();
      await wait(30);
      const dialog = () => $('sheet')?.querySelector('[role="alertdialog"]');
      out.dialog = {title: dialog()?.querySelector('h2').textContent, text: dialog()?.querySelector('.confirm-text').textContent,
        go: document.activeElement?.textContent, modal: $('app').inert};
      press('Tab');
      out.tabRound = document.activeElement === dialog()?.querySelector('.sheet-head .icon-btn');
      press('Tab', {shiftKey: true});
      out.tabBack = document.activeElement === dialog()?.querySelector('.primary-btn');
      press('Escape');
      await wait(30);
      out.escClosed = !$('sheet') && !$('app').inert && document.activeElement === $('reader-bar').querySelector('.more-acts') && $('app').classList.contains('reading');
      // again, and the message to write opens in Gmail's compose window
      $('reader-bar').querySelector('.more-acts').click();
      await until(() => $('menu'));
      items().find(b => b.textContent.startsWith(t('unsubscribe')))?.click();
      await wait(30);
      dialog()?.querySelector('.primary-btn').click();
      await wait(50);
      out.composed = sent('open').at(-1)?.url || '';
      out.noPost = sent('gmail.unsubscribe').length === 0;
      key(document, 'Escape');
      await wait(50);

      // U in the reader: back to the list, the mail read on opening listed again, Gmail asked
      rowOf('a1').click();
      await until(() => $('app').classList.contains('reading') && actions().includes('rd:a1'));
      await wait(50);
      out.readHidden = state.hidden.has(state.reading.e.link);
      key(document, 'KeyU');
      await wait(60);
      out.unread = {back: !$('app').classList.contains('reading'), listed: Boolean(rowOf('a1')), focused: document.activeElement === rowOf('a1'),
        asked: actions().includes('ur:a1'), toast: $('toast').textContent};
      // a refusal takes it back, and says so
      window.__actionFails = links => links.filter(l => l.includes('message_id=a1'));
      key(document, 'KeyU');
      await wait(60);
      out.unreadFailed = $('toast').textContent === t('unreadFailed') && $('toast').classList.contains('error');
      window.__actionFails = null;

      // L on a line: a field for the label's name, a name not listed offered as it stands
      rowOf('a1').focus();
      key(document, 'KeyL');
      await until(() => $('menu')?.querySelector('.menu-filter input'));
      const field = () => $('menu').querySelector('.menu-filter input');
      out.labelMenu = {title: $('menu').querySelector('.menu-title').textContent, focused: document.activeElement === field()};
      field().value = 'Work/Projects';
      field().dispatchEvent(new Event('input'));
      out.labelNew = items().map(b => b.textContent);
      field().dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', code: 'Enter', bubbles: true, cancelable: true}));
      await wait(80);
      out.labelled = {asked: actions().at(-1), toast: $('toast').textContent, listed: Boolean(rowOf('a1'))};
      // again: the label used is listed; a letter typed on an item goes to the field; Esc gives the line its focus back
      rowOf('a1').focus();
      key(document, 'KeyL');
      await until(() => $('menu')?.querySelector('.menu-filter input'));
      await wait(20);
      out.usedListed = items().map(b => b.textContent);
      key(field(), 'ArrowDown', {key: 'ArrowDown'});
      out.downToItem = document.activeElement === items()[0];
      press('KeyW', {key: 'w'});
      out.letterToField = document.activeElement === field();
      field().dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', code: 'Escape', bubbles: true, cancelable: true}));
      await wait(30);
      out.labelEsc = !$('menu') && document.activeElement === rowOf('a1');
      // V moves it there: out of the list with the Undo, as an archive; Z brings it back
      key(document, 'KeyV');
      await until(() => $('menu')?.querySelector('.menu-filter input'));
      out.moveTitle = $('menu').querySelector('.menu-title').textContent;
      items()[0]?.click();
      await wait(250);
      out.moved = {asked: actions().at(-1), gone: !rowOf('a1'), toast: $('toast').querySelector('span')?.textContent, undo: Boolean($('toast').querySelector('.undo'))};
      key(document, 'KeyZ');
      await wait(100);
      out.moveUndone = Boolean(rowOf('a1')) && sent('gmail.action.cancel').length === 1;

      // Newsletters: each sender with how, from its header; one click asks first, then the background sends it
      await until(() => $('chips').querySelector('.bulk-chip'), 3000);
      $('chips').querySelector('.bulk-chip')?.click();
      await wait(50);
      const sendersBtn = $('list').querySelector('.sort-bar .senders-btn');
      out.sendersBtn = sendersBtn?.getAttribute('aria-label') === t('unsubscribeSenders') && sendersBtn.getAttribute('aria-haspopup') === 'menu';
      sendersBtn?.click();
      await until(() => items()[0]?.querySelector('.hint')?.textContent === t('howOneClick'));
      out.senders = items().map(b => b.querySelector('span').textContent + ':' + b.querySelector('.hint').textContent);
      items()[0]?.click();
      await until(() => dialog());
      out.postText = dialog()?.querySelector('.confirm-text').textContent;
      // the request fails: said in the dialog, the sender's page offered instead
      window.__unsubscribeFails = true;
      dialog().querySelector('.primary-btn').click();
      await until(() => !dialog()?.querySelector('.confirm-error').hidden);
      out.failedOffer = {error: dialog().querySelector('.confirm-error').textContent, go: dialog().querySelector('.primary-btn').textContent};
      press('Escape');
      await wait(30);
      out.focusBack = document.activeElement === $('list').querySelector('.sort-bar .senders-btn');
      window.__unsubscribeFails = false;
      // it goes, with their unread mail archived too, with the Undo
      $('list').querySelector('.sort-bar .senders-btn').click();
      await until(() => items()[0]?.querySelector('.hint')?.textContent === t('howOneClick'));
      items()[0].click();
      await until(() => dialog());
      dialog().querySelector('.confirm-also input').click();
      dialog().querySelector('.primary-btn').click();
      await until(() => actions().some(a => a.startsWith('rc_^i:a4')), 3000);
      await wait(50);
      out.unsubscribed = {asked: sent('gmail.unsubscribe').map(m => id(m.link)), searched: sent('gmail.search').some(m => m.query === 'from:(team@notion.so) is:unread'),
        archived: actions().at(-1), toast: $('toast').querySelector('span')?.textContent, undo: Boolean($('toast').querySelector('.undo'))};
      out.consoleClean = window.__errors.length === 0 || window.__errors;
    }

    if (scenario === 'narrow') {
      // a side panel 320px wide: the mailbox line keeps its buttons whole and its address
      // readable, the reader's bar stays inside
      const head = document.querySelector('#list .section-head');
      const shown = el => getComputedStyle(el).display !== 'none';
      out.width = innerWidth;
      out.buttons = [...head.querySelectorAll('.icon-btn')].filter(shown).map(b => b.dataset.focus + ':' + Math.round(b.getBoundingClientRect().width));
      out.addr = Math.round(head.querySelector('.addr').getBoundingClientRect().width);
      // Gmail's categories say their count; narrowed to one, its name stays whole over the buttons
      await until(() => document.querySelectorAll('#chips .cat-chip').length === 3);
      out.catShort = [...document.querySelectorAll('#chips .cat-chip')].map(c => getComputedStyle(c.querySelector('.full')).display + ':' + c.querySelector('.short').textContent);
      document.querySelector('#chips .updates-chip').click();
      await wait(50);
      const what = document.querySelector('#list .sort-bar .sort-what .label').getBoundingClientRect();
      const first = document.querySelector('#list .sort-bar .text-btn').getBoundingClientRect();
      out.barWraps = what.width >= 40 && first.top >= what.bottom - 1;
      key(document, 'Escape');
      await wait(50);
      document.querySelector('#list .row').click();
      await wait(350);
      const bar = document.getElementById('reader-bar');
      out.barInside = bar.scrollWidth <= bar.clientWidth && [...bar.querySelectorAll('.icon-btn')].at(-1).getBoundingClientRect().right <= bar.getBoundingClientRect().right;
      // the date under the sender, not squeezed beside the name
      const name = document.getElementById('reader-name').getBoundingClientRect();
      const date = document.getElementById('reader-date').getBoundingClientRect();
      out.dateBelow = date.top >= name.bottom - 1 && date.width > 0;
    }

    if (scenario === 'cats' || scenario === 'catsearch') {
      // Gmail's own categories: a chip each, before the assistant's offer and the mailboxes
      const $ = id => document.getElementById(id);
      const ids = () => [...document.querySelectorAll('#list .row')].map(r => r.dataset.link.match(/message_id=([^&]*)/)[1]);
      const asked = () => sent('gmail.search').filter(m => m.query.includes('category:')).map(m => m.query + '@' + m.url.slice(-1));
      await until(() => $('chips').querySelectorAll('.cat-chip').length === 3);
      out.chips = [...$('chips').children].map(c => c.matches('.chip-sep') ? '|' : c.matches('.cat-chip') ? c.dataset.focus.slice(5) : c.matches('.ai-offer') ? 'ai' : 'box');
      out.labels = [...$('chips').querySelectorAll('.cat-chip')].map(c => c.getAttribute('aria-label'));
      out.tip = $('chips').querySelector('.promo-chip').dataset.tip;
      out.asked = asked();
      if (scenario === 'catsearch') {
        // kept for the next panel, which asks nothing; a count that moves is asked again a while later
        out.kept = Object.keys(chrome.storage.session.area['categories.cache'] || {});
        catFound.clear();
        catSaved = null;
        await loadCategories();
        out.secondAsks = asked().length - out.asked.length;
        out.secondChips = $('chips').querySelectorAll('.cat-chip').length;
        const moved = JSON.parse(JSON.stringify(state.objs));
        moved[0].xml.fullcount += 1;
        update(moved);
        await wait(150);
        out.tooSoon = asked().length - out.asked.length;
        extraFound.forEach(f => f.at -= 3 * 60 * 1000);
        catFound.forEach(f => f.at -= 3 * 60 * 1000);
        update(JSON.parse(JSON.stringify(moved)));
        await until(() => asked().length > out.asked.length);
        await wait(100);
        out.again = asked().length - out.asked.length;
      }
      // a chip narrows the list to its mail, with all of it read at once, and Undo
      $('chips').querySelector('.updates-chip').click();
      await wait(50);
      out.narrowed = ids();
      out.pressed = $('chips').querySelector('.updates-chip').getAttribute('aria-pressed');
      out.bar = $('list').querySelector('.sort-bar .sort-what .sr')?.textContent;
      out.barShown = [...$('list').querySelectorAll('.sort-bar .sort-what > span[aria-hidden]')].map(el => el.textContent);
      $('list').querySelector('[data-focus="sort:read"]').click();
      await wait(300);
      const read = sent('gmail.action').at(-1);
      out.readAll = read?.cmd === 'rd' && read.links.map(l => l.match(/message_id=([^&]*)/)[1]).sort().join() === 'a2,a3';
      // all of it gone, the list lets go of the chip; Z brings it back
      out.letGoWhenDone = !state.sortOnly && !$('chips').querySelector('.updates-chip');
      key(document, 'KeyZ');
      await wait(100);
      out.undone = sent('gmail.action.cancel').at(-1)?.id === read?.id && $('chips').querySelector('.updates-chip')?.getAttribute('aria-label') === t('updatesChip', 2);
      // Archive all, for what can be archived
      $('chips').querySelector('.promo-chip').click();
      await wait(50);
      out.promo = ids();
      $('list').querySelector('[data-focus="sort:archive"]').click();
      await wait(300);
      const archived = sent('gmail.action').at(-1);
      out.archived = archived?.cmd === 'rc_^i' && archived.links.length === 1 && archived.links[0].includes('message_id=a4');
      key(document, 'KeyZ');
      await wait(100);
      // Esc lets go
      $('chips').querySelector('.social-chip').click();
      await wait(50);
      out.social = ids();
      key(document, 'Escape');
      await wait(50);
      out.escLetGo = !state.sortOnly && !$('chips').querySelector('.chip.on:not([data-focus="chip:"])') && rows() === 3;
      // turned off in the settings: no chip, and a list narrowed to one lets go
      $('chips').querySelector('.updates-chip').click();
      await wait(50);
      prefsChanged({gmailCategories: false});
      render();
      out.off = !$('chips').querySelector('.cat-chip') && !state.sortOnly && rows() === 3;
      prefsChanged({gmailCategories: true});
      render();
      out.on = $('chips').querySelectorAll('.cat-chip').length === 3;
      out.consoleClean = window.__errors.length === 0 || window.__errors;
    }

    if (scenario === 'catsai') {
      // with the assistant sorting, its Newsletters stands for Promotions and Social; Updates stays
      const $ = id => document.getElementById(id);
      await until(() => state.ai.ok && $('chips').querySelectorAll('.sort-chip').length === 3 && $('chips').querySelector('.cat-chip'), 4000);
      out.kinds = [...$('chips').querySelectorAll('.sort-chip, .cat-chip')].map(c => c.dataset.focus.slice(5));
      out.noSearch = sent('gmail.search').filter(m => m.query.includes('category:') && !m.query.includes(' OR ')).length === 0;
      // its sorting turned off: Gmail's three come back
      state.ai.reply = false;
      render();
      out.withoutSorting = [...$('chips').querySelectorAll('.sort-chip, .cat-chip')].map(c => c.dataset.focus.slice(5));
    }

    if (scenario === 'saved') {
      // a chip for each search saved for an account signed in, after the kinds of mail
      const $ = id => document.getElementById(id);
      const chip = name => [...$('chips').querySelectorAll('.saved-chip')].find(c => c.textContent === name);
      const searches = () => sent('gmail.search').filter(m => m.query === 'invoice').map(m => m.url.slice(-1));
      await until(() => $('chips').querySelector('.saved-chip'));
      out.chips = [...$('chips').children].map(c => c.matches('.chip-sep') ? '|' : c.matches('.saved-chip') ? c.textContent : c.matches('.cat-chip') ? 'cat' : c.matches('.ai-offer') ? 'ai' : 'box');
      out.tip = chip('Work invoices').dataset.tip;
      // a click asks every Gmail account, the search field shows what, the chip keeps the focus
      chip('Invoices').focus();
      chip('Invoices').click();
      await until(() => rows() > 0 && !state.search?.busy);
      out.asked = searches();
      out.field = !$('search').hidden && $('search-input').value === 'invoice';
      out.pressed = chip('Invoices')?.getAttribute('aria-pressed') === 'true' && document.activeElement === chip('Invoices');
      out.found = rows();
      out.kept = Object.keys(chrome.storage.session.area['saved.cache'] || {});
      // a second click goes back to the list; a third shows what was found, asking nothing
      chip('Invoices').click();
      await wait(50);
      out.closed = $('search').hidden && !state.search && Boolean($('list').querySelector('.section-head .grip'));
      chip('Invoices').click();
      out.atOnce = rows() === out.found && searches().length === 3;
      // one for an account asks that account only
      chip('Work invoices').click();
      await until(() => !state.search?.busy);
      out.work = searches().slice(3);
      // an action forgets what was found: the chip asks again
      chip('Invoices').click();
      await wait(50);
      act('rd', [document.querySelector('#list .row').dataset.link]);
      await wait(300);
      chip('Invoices').click();
      await wait(50);
      chip('Invoices').click();
      await until(() => !state.search?.busy);
      out.askedAgain = searches().length;
      // words typed in the field are a search of their own: the chip lets go; Esc closes
      $('search-input').value = 'invoice 2';
      $('search-input').dispatchEvent(new Event('input'));
      await wait(50);
      out.typedLetGo = !$('chips').querySelector('.saved-chip.on');
      key($('search-input'), 'Escape');
      await wait(50);
      out.esc = !state.search && $('search').hidden;
      out.consoleClean = window.__errors.length === 0 || window.__errors;
    }

    if (scenario === 'rate') {
      // after real use, one line at the end of the list asks for a rating
      const $ = id => document.getElementById(id);
      const line = () => $('list').querySelector('.rate-ask');
      const DAY = 24 * 60 * 60 * 1000;
      out.counted = state.rate.days === 13 && window.__set.some(o => o.rate?.days === 13);
      out.shown = line()?.querySelector('.rate-text')?.textContent === t('rateAsk') && line().nextElementSibling?.classList.contains('list-foot');
      out.buttons = [...line().querySelectorAll('button')].map(b => b.getAttribute('aria-label') || b.textContent);
      // Later: gone, and back once three months on; the second Later is the last
      line().querySelector('[data-focus="rate-later"]').click();
      await wait(30);
      out.later = !line() && state.rate.later > 0 && !state.rate.done && window.__set.at(-1).rate?.later === state.rate.later;
      state.rate.later = Date.now() - 89 * DAY;
      render();
      out.notYet = !line();
      state.rate.later = Date.now() - 91 * DAY;
      render();
      out.again = Boolean(line());
      line().querySelector('[data-focus="rate-later"]').click();
      await wait(30);
      out.lastLater = !line() && state.rate.done === true;
      state.rate.later = Date.now() - 400 * DAY;
      render();
      out.never = !line();
      // × ends it; so does Rate, which opens the store's reviews
      const due = {first: Date.now() - 15 * DAY, days: 10, day: state.rate.day};
      state.rate = {...due};
      render();
      line().querySelector('.icon-btn').click();
      await wait(30);
      out.closed = !line() && state.rate.done === true;
      state.rate = {...due};
      render();
      line().querySelector('[data-focus="rate"]').click();
      await wait(30);
      out.rated = !line() && state.rate.done === true &&
        window.__tabsCreated?.at(-1) === 'https://chromewebstore.google.com/detail/mail-deck/hjlkjemogfgkpbbnogihekjcdmafecff/reviews';
      // not before two weeks, nor before ten days of use; never over the pinning hint
      state.rate = {first: Date.now() - 13 * DAY, days: 12, day: due.day};
      render();
      out.tooEarly = !line();
      state.rate = {first: Date.now() - 30 * DAY, days: 9, day: due.day};
      render();
      out.tooFew = !line();
      state.rate = {...due};
      state.unpinned = true;
      render();
      out.pinFirst = !line() && Boolean($('list').querySelector('.pin-hint'));
      state.unpinned = false;
      // nor over a search
      openSearch();
      await wait(30);
      out.notInSearch = !line();
      closeSearch();
      out.back = Boolean(line());
      // a day counts once
      state.rate = null;
      countDay();
      countDay();
      out.firstDay = state.rate.days === 1 && state.rate.first > Date.now() - 1000;
      state.rate.day = 'yesterday';
      countDay();
      out.nextDay = state.rate.days === 2;
    }

    if (scenario === 'wide') {
      // a 700px newsletter fits the reader without a sideways scroll
      document.querySelector('#list .row').click();
      const doc = document.getElementById('body').contentDocument;
      await until(() => doc.querySelector('.root'));
      await wait(400);
      out.scrollWidth = doc.documentElement.scrollWidth;
      out.clientWidth = doc.documentElement.clientWidth;
    }
  }
  catch (e) {
    out.error = String(e && e.stack || e);
  }
  report();
})();
