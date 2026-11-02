// The welcome page: worker.js opens it on install and never on update; then the page itself in
// headless Chrome, with chrome.* replaced by welcome/stub.js. Each scenario of welcome/test.js
// posts what it saw, and the checks below decide.
// CHROME names the browser; by default Google Chrome on macOS, google-chrome elsewhere.
const fs = require('fs');
const os = require('os');
const vm = require('vm');
const path = require('path');
const http = require('http');
const {spawn} = require('child_process');

const EXT = path.join(__dirname, '../../extension');
const HERE = path.join(__dirname, 'welcome');
const PAGE = '/data/welcome/index.html';
const EN = JSON.parse(fs.readFileSync(path.join(EXT, '_locales/en/messages.json'), 'utf8'));
const HE = JSON.parse(fs.readFileSync(path.join(EXT, '_locales/he/messages.json'), 'utf8'));
const T = (key, ...subs) => (EN['welcome_' + key]?.message || key).replace(/\$(\d)/g, (_, i) => subs[i - 1] ?? '');
const MAC = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CHROME = process.env.CHROME || (fs.existsSync(MAC) ? MAC : 'google-chrome');
const TYPES = {'.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png'};
const ADD_ACCOUNT = 'https://accounts.google.com/AddSession?continue=https://mail.google.com/mail/';
let failed = 0;
const check = (name, pass, detail) => {
  if (!pass) {
    failed += 1;
  }
  console.log(pass ? 'ok' : 'not ok', name + (pass || detail === undefined ? '' : ' - ' + JSON.stringify(detail)));
};

/* worker.js: the page on install, nothing on an update */
{
  const installed = [];
  const tabs = [];
  const on = list => ({addListener: f => list.push(f)});
  const ctx = {
    chrome: {
      runtime: {onInstalled: on(installed), onMessage: on([]), getManifest: () => ({homepage_url: 'https://example.test/'})},
      action: {onClicked: on([])},
      tabs: {create: o => tabs.push(o.url)},
      i18n: {getUILanguage: () => 'en', getMessage: () => ''},
      storage: {local: {get: async () => ({}), remove: async () => {}}}
    }
  };
  ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(EXT, 'worker.js'), 'utf8'), ctx, {filename: 'worker.js'});
  const fire = details => installed.forEach(f => f(details));
  fire({reason: 'install'});
  check('installing opens the welcome page, and only it', JSON.stringify(tabs) === JSON.stringify([PAGE]) && fs.existsSync(path.join(EXT, PAGE)), tabs);
  tabs.length = 0;
  fire({reason: 'update', previousVersion: '1.5.0'});
  fire({reason: 'chrome_update'});
  fire({reason: 'shared_module_update'});
  check('an update of Mail Deck or of Chrome opens nothing', tabs.length === 0, tabs);
}

/* the page */
const waiting = new Map();
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname === '/__result') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      res.end('ok');
      waiting.get(url.searchParams.get('scenario'))?.(JSON.parse(body));
    });
    return;
  }
  let file;
  let content;
  if (url.pathname === '/__welcome.html') {
    content = fs.readFileSync(path.join(EXT, PAGE), 'utf8')
      .replace('<head>', '<head><base href="/data/welcome/"><script src="/__stub.js"></script>')
      .replace('</body>', '<script src="/__test.js"></script></body>');
    file = 'x.html';
  }
  else {
    file = url.pathname.startsWith('/__') ? path.join(HERE, url.pathname.slice(3)) : path.join(EXT, decodeURIComponent(url.pathname));
    if (!file.startsWith(EXT) && !file.startsWith(HERE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end();
      return;
    }
    content = fs.readFileSync(file);
  }
  res.writeHead(200, {'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream'});
  res.end(content);
});

// frame: a width narrower than a window can be; the page then runs in a frame that wide
const run = (port, scenario, query = '', frame = 0) => new Promise(resolve => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mail-deck-chrome-'));
  const page = `scenario=${scenario}${query}`;
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    `--user-data-dir=${profile}`, '--window-size=1000,900',
    ...(process.platform === 'linux' ? ['--no-sandbox'] : []),
    frame ? `http://127.0.0.1:${port}/__frame.html?w=${frame}&q=${encodeURIComponent(page)}` : `http://127.0.0.1:${port}/__welcome.html?${page}`];
  const chrome = spawn(CHROME, args, {stdio: 'ignore'});
  const done = result => {
    clearTimeout(timer);
    waiting.delete(scenario);
    chrome.kill();
    resolve(result);
  };
  const timer = setTimeout(() => done({error: 'no result in 30 s'}), 30000);
  waiting.set(scenario, done);
  chrome.on('error', e => done({error: 'cannot start ' + CHROME + ': ' + e.message}));
});

const checks = {
  some: r => ({
    'the inboxes found are listed, one line each, with their unread mail': JSON.stringify(r.rows) ===
      JSON.stringify(['alex.morgan@gmail.com ' + T('unread', 4), 'alex@copperfield-studio.com ' + T('noUnread')]) && r.inboxesDone,
    'with inboxes known already, no check is asked for (an open panel would draw nothing meanwhile)': r.asked === 0,
    'the first step not done is the current one': r.current === 'step-pin',
    'an inbox the background finds shows at once; a label feed adds to its account, in the panel\'s colours': JSON.stringify(r.live) ===
      JSON.stringify(['alex.morgan@gmail.com ' + T('unread', 6), 'alex@copperfield-studio.com ' + T('noUnread'), 'alex.family@gmail.com ' + T('unread', 1)]) &&
      JSON.stringify(r.colours) === '["#3567e6","#169b62","#d23f3a"]',
    'signed out of every inbox: the step is undone and offers the sign-in; signed in again: back': r.signedOut && r.back,
    'a message without the accounts, or the panel closing, changes nothing': r.kept,
    'nothing loads from anywhere else; every string is found': r.local && r.untranslated.length === 0 && r.lede === T('lede')
  }),
  none: r => ({
    'with nothing found yet the page looks, and asks the background for a check that is not forced': r.looking && JSON.stringify(r.asked) === '[false]',
    'no account signed in: Sign in to Gmail opens Google\'s page for one more account': r.none && JSON.stringify(r.tabs) === JSON.stringify([ADD_ACCOUNT]),
    'Check again asks once and keeps its place while it looks': r.again === 2 && r.busy && r.againTwice === 2,
    'the account signed in elsewhere shows when the background finds it, and the step ticks off for a screen reader too':
      JSON.stringify(r.found) === JSON.stringify(['alex.morgan@gmail.com ' + T('unread', 4)]) && r.inboxesDone && r.notBusy && r.said === T('stepDone', T('inboxes')),
    'Add another account opens the same page': r.addTabs?.at(-1) === ADD_ACCOUNT,
    'nothing loads from anywhere else; every string is found': r.local && r.untranslated.length === 0
  }),
  pin: r => ({
    'not pinned: the drawn puzzle menu and how to pin, no Done button': r.before === T('pinHow') && r.noManual,
    'pinned from the puzzle menu: the step ticks off at once, says so, and the icon shows on the drawn toolbar': r.pinned === T('pinned') &&
      r.said === T('stepDone', T('pin')),
    'unpinned again: the step is undone': r.unpinned,
    'a change of another setting: Chrome is asked again': r.asked,
    'the drawn icon carries the inboxes\' unread count': r.count === '4'
  }),
  poll: r => ({
    'where Chrome does not say when the pin changes, the page asks it and ticks off in time': r.before && r.after
  }),
  manual: r => ({
    'where Chrome cannot tell, the steps come with a Done button that ticks it off': r.manual && r.done
  }),
  try: r => ({
    'the shortcut Chrome has for the panel is shown': r.keys === 'Alt+Shift+M' && r.keysText === T('shortcut', 'Alt+Shift+M'),
    'Open the side panel opens it in this window, from the click, and ticks the step off': JSON.stringify(r.side) === '[{"windowId":1}]' && r.tried,
    'a test notification is Mail Deck\'s, with its sound; the page says where to look if none shows': JSON.stringify(r.notes) === JSON.stringify([{
      id: 'welcome.test', type: 'basic', iconUrl: '/data/icons/notification/48.png', title: T('testTitle'), message: T('testText')}]) &&
      r.played === 1 && r.testState === T('testSent'),
    'all three done: the page says the user is set, and no step is current': r.allSet === T('allSet') && r.current === 0
  }),
  noside: r => ({
    'without the side panel the page says to click the icon': r.hidden && r.text === T('clickIcon'),
    'without a shortcut, a way to set one': r.setShortcut === T('setShortcut') && r.tabs?.includes('chrome://extensions/shortcuts'),
    'the icon\'s popup opened from the toolbar ticks the step off': !r.before && r.after,
    'notifications turned off for Mail Deck: the page says so': r.denied === T('testDenied')
  }),
  rtl: r => ({
    'Hebrew: right to left, in Hebrew': r.dir === 'rtl' && r.lang === 'he' && r.title === HE.welcome_title.message && r.untranslated.length === 0,
    'right to left, the drawn menu hangs under the puzzle piece and an address stays by its dot': r.menuUnderPuzzle && r.addrByDot
  }),
  narrow: r => ({
    'a 360px window: nothing wider than it, every address beside its dot': r.width === 360 && r.fits && r.besideDot
  })
};

/* Installed in a real Chrome: the real worker opens the page, which runs on Chrome's own APIs.
   A copy of the extension has a probe on the page that reports it. Google Chrome no longer loads
   an unpacked extension from the command line: Chrome for Testing (Playwright's) does. CHROME_EXT
   names one; without it this part is skipped. */
const chromeForTesting = () => {
  if (process.env.CHROME_EXT) {
    return process.env.CHROME_EXT;
  }
  const roots = [path.join(os.homedir(), 'Library/Caches/ms-playwright'), path.join(os.homedir(), '.cache/ms-playwright')];
  return roots.filter(fs.existsSync).flatMap(root => fs.readdirSync(root).filter(d => /^chromium-\d+$/.test(d))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
    .flatMap(d => [
      path.join(root, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
      path.join(root, d, 'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
      path.join(root, d, 'chrome-linux64/chrome'),
      path.join(root, d, 'chrome-linux/chrome')
    ])).find(fs.existsSync);
};
const installed = async () => {
  const browser = chromeForTesting();
  if (!browser) {
    console.log('ok installed in a real Chrome - skipped: no Chrome that loads an unpacked extension (set CHROME_EXT)');
    return;
  }
  let done;
  const result = new Promise(r => done = r);
  const probe = http.createServer((req, res) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end('ok');
      if (req.method === 'POST') {
        done(JSON.parse(body));
      }
    });
  });
  await new Promise(r => probe.listen(0, '127.0.0.1', r));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mail-deck-welcome-'));
  fs.cpSync(EXT, dir, {recursive: true});
  const page = path.join(dir, PAGE);
  // first on the page, so it hears every error of the page's own script
  fs.writeFileSync(page, fs.readFileSync(page, 'utf8').replace('<head>', '<head><script src="/__probe.js"></script>'));
  fs.writeFileSync(path.join(dir, '__probe.js'), `
const errors = [];
addEventListener('error', e => errors.push(String(e.message)));
addEventListener('unhandledrejection', e => errors.push(String(e.reason?.stack || e.reason)));
setTimeout(async () => {
  const $ = id => document.getElementById(id);
  const out = {errors};
  try {
    Object.assign(out, {
      page: location.pathname,
      title: document.title,
      // a fresh profile: no account found yet, nothing pinned
      looking: !$('looking').hidden || !$('none').hidden,
      pinHow: $('pin-how').textContent,
      manual: !$('pin-manual').hidden,
      pinned: (await chrome.action.getUserSettings()).isOnToolbar,
      api: [typeof chrome.action.onUserSettingsChanged?.addListener, typeof chrome.runtime.getContexts, typeof chrome.sidePanel?.open],
      // the window Chrome started with, and this page: the website did not open as well
      tabs: (await chrome.tabs.query({})).length,
      welcomes: chrome.extension.getViews({type: 'tab'}).length
    });
  }
  catch (e) {
    errors.push(String(e.stack || e));
  }
  fetch('http://127.0.0.1:${probe.address().port}/', {method: 'POST', body: JSON.stringify(out)});
}, 2500);
`);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mail-deck-welcome-profile-'));
  const chrome = spawn(browser, ['--headless=new', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`,
    `--disable-extensions-except=${dir}`, `--load-extension=${dir}`, ...(process.platform === 'linux' ? ['--no-sandbox'] : []), 'about:blank'],
  {stdio: 'ignore'});
  const r = await Promise.race([result, new Promise(resolve => setTimeout(resolve, 30000, {error: 'no result in 30 s'}))]);
  chrome.kill();
  probe.close();
  for (const d of [dir, profile]) {
    fs.rmSync(d, {recursive: true, force: true, maxRetries: 3});
  }
  check('installed in a real Chrome: the welcome page opens, alone, in English', r.page === PAGE && r.title === T('title') && r.tabs === 2 && r.welcomes === 1, r);
  check('it runs on Chrome\'s own APIs without an error: looking for inboxes, the pin read and followed, the side panel there',
    r.errors?.length === 0 && r.looking && r.pinned === false && r.pinHow === T('pinHow') && !r.manual &&
    JSON.stringify(r.api) === '["function","function","function"]', r);
};

server.listen(0, '127.0.0.1', async () => {
  const {port} = server.address();
  for (const [scenario, query, frame] of [['some', ''], ['none', '&accounts=none'], ['pin', ''], ['poll', '&pin=poll'], ['manual', '&pin=none'],
    ['try', ''], ['noside', '&side=0&shortcut=none&perm=denied'], ['rtl', '&lang=he'], ['narrow', '&lang=de&accounts=many', 360]]) {
    const r = await run(port, scenario, query, frame);
    if (r.error) {
      failed += 1;
      console.log('not ok', scenario, '-', r.error);
      continue;
    }
    for (const [name, pass] of Object.entries(checks[scenario](r))) {
      check(name, pass, r);
    }
  }
  server.close();
  await installed();
  process.exit(failed ? 1 : 0);
});
