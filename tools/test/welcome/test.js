// Runs in the welcome page next to stub.js; ?scenario= picks what to do. It reports what it saw
// to /__result, and welcome.test.js decides what passes.
(async () => {
  const scenario = new URLSearchParams(location.search).get('scenario');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const $ = id => document.getElementById(id);
  const done = name => $('step-' + name).classList.contains('is-done');
  const sent = method => window.__sent.filter(m => m.method === method);
  const rows = () => [...document.querySelectorAll('#accounts .acc')].map(li => li.querySelector('.addr').textContent + ' ' + li.querySelector('.count').textContent);
  const shown = id => !$(id).closest('[hidden]');
  const out = {};
  const report = () => fetch('/__result?scenario=' + scenario, {method: 'POST', body: JSON.stringify(out)});
  const until = async (test, ms = 3000) => {
    for (const end = Date.now() + ms; Date.now() < end; await wait(25)) {
      if (test()) {
        return true;
      }
    }
    return false;
  };
  try {
    await wait(100);
    // nothing comes from anywhere but the page's own origin
    out.local = performance.getEntriesByType('resource').every(e => e.name.startsWith(location.origin));
    // every string found: a missing one would show its bare name
    out.untranslated = [...document.querySelectorAll('[data-i18n]')].filter(el => !el.textContent || el.textContent === el.dataset.i18n)
      .map(el => el.dataset.i18n);

    if (scenario === 'some') {
      await until(() => rows().length === 2);
      out.rows = rows();
      out.inboxesDone = done('inboxes');
      out.asked = sent('update').length;
      out.current = document.querySelector('.step[aria-current="step"]')?.id;
      // the background finds a third inbox, and a label feed of the first one
      window.__fire.message({method: 'update-reset', data: window.__accounts.many});
      await wait(50);
      out.live = rows();
      out.colours = [...document.querySelectorAll('#accounts .dot')].map(d => d.style.getPropertyValue('--c'));
      // signed out of every account: the cache empties, the page says so and offers to sign in
      window.__fire.storage({'cached-objects': {newValue: []}});
      await wait(50);
      out.signedOut = !done('inboxes') && shown('none') && !shown('looking');
      window.__fire.storage({'cached-objects': {newValue: window.__accounts.some}});
      await wait(50);
      out.back = rows().length === 2 && done('inboxes');
      // a message of another kind, or one without the accounts, changes nothing
      window.__fire.message({method: 'update'});
      window.__fire.message({method: 'close-popup'});
      await wait(50);
      out.kept = rows().length === 2;
      out.lede = $('lede').textContent;
    }

    if (scenario === 'none') {
      out.looking = shown('looking') && !shown('none') && !done('inboxes');
      // a check is asked for, never a forced one: that opens Gmail in a tab
      out.asked = sent('update').map(m => Boolean(m.forced));
      // the background found no account signed in
      window.__fire.message({method: 'close-popup'});
      await wait(50);
      out.none = shown('none') && !shown('looking');
      $('sign-in').click();
      await wait(20);
      out.tabs = window.__tabs.slice();
      $('again').click();
      await wait(20);
      out.again = sent('update').length;
      out.busy = $('again').getAttribute('aria-disabled') === 'true' && $('again').classList.contains('busy');
      // a second click while it looks asks nothing more
      $('again').click();
      await wait(20);
      out.againTwice = sent('update').length;
      // the user signs in elsewhere; the background's next check finds the account
      window.__fire.storage({'cached-objects': {newValue: [window.__accounts.some[0]]}});
      await wait(50);
      out.found = rows();
      out.inboxesDone = done('inboxes');
      out.notBusy = $('again').getAttribute('aria-disabled') === 'false';
      out.said = $('said').textContent;
      $('add').click();
      await wait(20);
      out.addTabs = window.__tabs.slice();
    }

    if (scenario === 'pin') {
      await wait(50);
      out.before = !done('pin') && $('pin-how').textContent;
      out.noManual = $('pin-manual').hidden;
      window.__pinned = true;
      window.__fire.settings({isOnToolbar: true});
      await wait(30);
      out.pinned = done('pin') && $('art').classList.contains('is-pinned') && $('pin-how').textContent;
      out.said = $('said').textContent;
      // unpinned again: the step is undone
      window.__pinned = false;
      window.__fire.settings({isOnToolbar: false});
      await wait(30);
      out.unpinned = !done('pin');
      // a change of another setting: the page asks Chrome again
      window.__pinned = true;
      window.__fire.settings({});
      await until(() => done('pin'), 1000);
      out.asked = done('pin');
      // the drawn icon carries the count of the inboxes' unread mail
      out.count = $('art-count').textContent;
    }

    if (scenario === 'poll') {
      out.before = !done('pin');
      // Chrome before 130 tells only when asked: the page asks every second
      window.__pinned = true;
      out.after = await until(() => done('pin'), 2500);
    }

    if (scenario === 'manual') {
      out.manual = !$('pin-manual').hidden && !done('pin');
      $('pin-done').click();
      await wait(20);
      out.done = done('pin') && $('pin-manual').hidden;
    }

    if (scenario === 'try') {
      out.keys = $('keys').querySelector('kbd')?.textContent;
      out.keysText = $('keys').textContent;
      $('side').click();
      await wait(30);
      out.side = window.__side;
      out.tried = done('try');
      // a test notification: Mail Deck's own, with the sound that comes with new mail
      $('test').click();
      await until(() => $('test-state').textContent);
      out.notes = window.__notes.map(n => ({id: n.id, type: n.type, iconUrl: n.iconUrl, title: n.title, message: n.message}));
      out.played = sent('test-play').length;
      out.testState = $('test-state').textContent;
      // all three done: the page says so
      window.__pinned = true;
      window.__fire.settings({isOnToolbar: true});
      await wait(30);
      out.allSet = document.body.classList.contains('all-set') && $('lede').textContent;
      out.current = document.querySelectorAll('.step[aria-current]').length;
    }

    if (scenario === 'noside') {
      out.hidden = $('side').hidden;
      out.text = $('or-icon').textContent;
      // the shortcut taken: a way to set one
      const set = $('keys').querySelector('button');
      out.setShortcut = !$('keys').hidden && set?.textContent;
      set?.click();
      await wait(20);
      out.tabs = window.__tabs.slice();
      // the icon clicked: its popup takes the focus, and the page finds it open
      out.before = done('try');
      window.__contexts = [{contextType: 'POPUP'}];
      dispatchEvent(new Event('blur'));
      out.after = await until(() => done('try'), 2500);
      // notifications turned off for Mail Deck: the page says so
      $('test').click();
      await until(() => $('test-state').textContent);
      out.denied = $('test-state').textContent;
    }

    if (scenario === 'rtl') {
      out.dir = document.documentElement.dir;
      out.lang = document.documentElement.lang;
      out.title = document.title;
      // the drawn menu sits under the puzzle piece, on the left in a right-to-left window
      const bar = document.querySelector('.bar').getBoundingClientRect();
      const menu = document.querySelector('.menu').getBoundingClientRect();
      const puzzle = document.querySelector('.puzzle').getBoundingClientRect();
      out.menuUnderPuzzle = menu.left < puzzle.right && menu.right > puzzle.left && menu.left - bar.left < bar.right - menu.right;
      // the address stays by its dot: on its right, in a right-to-left window
      const acc = document.querySelector('#accounts .acc');
      out.addrByDot = acc.querySelector('.dot').getBoundingClientRect().left - acc.querySelector('.addr').getBoundingClientRect().right < 20;
    }

    if (scenario === 'narrow') {
      out.width = innerWidth;
      out.fits = document.documentElement.scrollWidth <= innerWidth;
      // every address keeps its line beside its dot
      out.besideDot = [...document.querySelectorAll('#accounts .acc')].every(acc => {
        const dot = acc.querySelector('.dot').getBoundingClientRect();
        const addr = acc.querySelector('.addr').getBoundingClientRect();
        return addr.left >= dot.right && addr.top < dot.bottom;
      });
    }
  }
  catch (e) {
    out.error = String(e.stack || e);
  }
  report();
})();
