// The toolbar's panel opening, in a real Chrome with the extension loaded. Chrome shows an
// extension's popup only once its page has stopped loading, pictures included: a sender's
// logo (Google's icon service, seconds for a domain it has not seen lately) or an account's
// photo asked for during that time keeps the window from opening until the slowest one comes.
// Here nine inboxes with mail from as many domains, each with its photo; Google's pictures are
// held unanswered until the page has loaded, then answered, so nothing goes to the network.
// Google Chrome no longer loads an unpacked extension from the command line: Chrome for
// Testing (Playwright's) does. CHROME_EXT names one; without it the check is skipped.
const fs = require('fs');
const os = require('os');
const path = require('path');
const {spawn} = require('child_process');

const EXT = path.join(__dirname, '../../extension');
const find = () => {
  if (process.env.CHROME_EXT) {
    return process.env.CHROME_EXT;
  }
  const roots = [path.join(os.homedir(), 'Library/Caches/ms-playwright'), path.join(os.homedir(), '.cache/ms-playwright')];
  const found = roots.filter(fs.existsSync).flatMap(root => fs.readdirSync(root).filter(d => /^chromium-\d+$/.test(d))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
    .flatMap(d => [
      path.join(root, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
      path.join(root, d, 'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
      path.join(root, d, 'chrome-linux64/chrome'),
      path.join(root, d, 'chrome-linux/chrome')
    ]));
  return found.find(fs.existsSync);
};
const CHROME = find();
if (!CHROME) {
  console.log('ok the panel opening in a real Chrome - skipped: no Chrome that loads an unpacked extension (set CHROME_EXT)');
  process.exit(0);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
// how long Google's pictures are held: far longer than the page needs to load without them
const HOLD = 4000;
// a picture 64 pixels a side: a logo to the panel (it takes one of 32 or more), or a photo
const PICTURE = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">' +
  '<rect width="64" height="64" fill="#1a73e8"/></svg>').toString('base64');
const NINE = ['one@gmail.com', 'two@gmail.com', 'three@example.org', 'four@gmail.com', 'five@company.app', 'six@gmail.com',
  'seven@gmail.com', 'eight@gmail.com', 'nine@gmail.com'];
const DOMAINS = ['figma.com', 'github.com', 'notion.so', 'linear.app', 'stripe.com', 'binance.com', 'booking.com', 'ozon.ru',
  'airbnb.com', 'slack.com', 'zoom.us', 'atlassian.com'];

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mail-deck-open-profile-'));
  // no host resolves: the background's check of Gmail fails at once and leaves the mail below
  const chrome = spawn(CHROME, ['--headless=new', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`,
    '--remote-debugging-port=0', '--window-size=420,600', `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`,
    '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1',
    ...(process.platform === 'linux' ? ['--no-sandbox'] : []), 'about:blank'], {stdio: 'ignore'});
  const out = {};
  try {
    let port;
    for (let i = 0; i < 80 && !port; i += 1) {
      await sleep(100);
      try {
        port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0];
      }
      catch (e) {}
    }
    let worker;
    for (let i = 0; i < 80 && !worker; i += 1) {
      await sleep(100);
      try {
        worker = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.url.endsWith('/worker.js'));
      }
      catch (e) {}
    }
    const id = new URL(worker.url).host;
    const page = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {method: 'PUT'})).json();
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    let n = 0;
    const call = (method, params = {}) => new Promise((resolve, reject) => {
      const mid = ++n;
      const h = ev => {
        const m = JSON.parse(ev.data);
        if (m.id === mid) {
          ws.removeEventListener('message', h);
          m.error ? reject(Error(m.error.message)) : resolve(m.result);
        }
      };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({id: mid, method, params}));
    });
    const errors = [];
    // Google's pictures asked for: when, and held until released
    const asked = [];
    let release = false;
    const answer = requestId => call('Fetch.fulfillRequest', {requestId, responseCode: 200,
      responseHeaders: [{name: 'content-type', value: 'image/svg+xml'}], body: PICTURE}).catch(() => {});
    let started = 0;
    let stopped = null;
    let frameId;
    ws.addEventListener('message', ev => {
      const m = JSON.parse(ev.data);
      if (m.method === 'Fetch.requestPaused') {
        asked.push({url: m.params.request.url, at: Date.now() - started, requestId: m.params.requestId});
        if (release) {
          answer(m.params.requestId);
        }
      }
      if (m.method === 'Page.frameStoppedLoading' && started && m.params.frameId === frameId && stopped === null) {
        stopped = Date.now() - started;
      }
      if (m.method === 'Runtime.exceptionThrown') {
        errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      }
    });
    await new Promise(r => ws.addEventListener('open', r));
    await call('Runtime.enable');
    await call('Page.enable');
    frameId = (await call('Page.getFrameTree')).frameTree.frame.id;
    const run = async expression => {
      const r = await call('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true});
      if (r.exceptionDetails) {
        throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      }
      return r.result.value;
    };
    // an extension page with nothing of its own to do, to write the storage from
    await call('Page.navigate', {url: `chrome-extension://${id}/data/panel/body/index.html`});
    await sleep(500);
    // the background's first check over (it finds no one), so it writes nothing more for minutes
    for (let i = 0; i < 50; i += 1) {
      if (await run(`chrome.storage.session.get('accounts.count').then(p => p['accounts.count'] !== undefined)`)) {
        break;
      }
      await sleep(200);
    }
    const now = Date.now();
    const iso = m => new Date(now - m * 60000).toISOString();
    let k = 0;
    const objs = NINE.map((email, u) => ({meta: {}, newIDs: [], xml: {title: email, link: `https://mail.google.com/mail/u/${u}/#inbox`,
      rootLink: `https://mail.google.com/mail/u/${u}`, fullcount: 2, modified: iso(0), entries: [0, 1].map(j => {
        const domain = DOMAINS[k++ % DOMAINS.length];
        return {link: `https://mail.google.com/mail/u/${u}?account_id=x&message_id=m${u}${j}&view=conv&extsrc=atom`, id: `tag:m${u}${j}`,
          author_name: domain.split('.')[0], author_email: `news@mail.${domain}`, title: `Mail ${u}.${j}`, summary: 'Hello', modified: iso(k)};
      })}}));
    await run(`Promise.all([
      chrome.storage.local.set({accounts: Object.fromEntries(${JSON.stringify(NINE)}.map(m => [m, {}])),
        avatars: Object.fromEntries(${JSON.stringify(NINE)}.map((m, i) => [m, {url: 'https://lh3.googleusercontent.com/a/ACg8oc' + i + '=s64-c', at: Date.now()}]))}),
      chrome.storage.session.set({'cached-objects': ${JSON.stringify(objs)}, 'accounts.count': ${NINE.length}})
    ])`);
    await call('Fetch.enable', {patterns: [{urlPattern: 'https://www.google.com/s2/favicons*'}, {urlPattern: 'https://lh3.googleusercontent.com/*'}]});
    // when the list showed its first line, and when the page's load event came
    await call('Page.addScriptToEvaluateOnNewDocument', {source: `
      new MutationObserver(() => {
        if (!window.__firstRow && document.querySelector('#list .row')) {
          window.__firstRow = performance.now();
        }
      }).observe(document, {childList: true, subtree: true});
      addEventListener('load', () => window.__loaded = performance.now());`});
    started = Date.now();
    await call('Page.navigate', {url: `chrome-extension://${id}/data/panel/index.html`});
    for (let i = 0; i < HOLD / 50 && stopped === null; i += 1) {
      await sleep(50);
    }
    out.stopped = stopped;
    out.askedBeforeStop = stopped === null ? asked.length : asked.filter(a => a.at < stopped).length;
    out.rowsWhileHeld = await run(`document.querySelectorAll('#list .row').length`);
    out.firstRow = await run(`window.__firstRow ?? null`);
    // Google answers now: what was held, and whatever is asked from here on
    release = true;
    asked.forEach(a => answer(a.requestId));
    // the pictures asked for once the page has loaded
    for (let i = 0; i < 40 && asked.length < DOMAINS.length + NINE.length; i += 1) {
      await sleep(50);
    }
    await sleep(500);
    out.asked = asked.length;
    out.logos = await run(`document.querySelectorAll('#list .avatar.logo').length`);
    // each mailbox's line: its photo where the coloured dot would be
    out.photos = await run(`[...document.querySelectorAll('.section-head > img.me')].filter(img => img.complete && img.naturalWidth > 0).length`);
    out.dots = await run(`document.querySelectorAll('.section-head > .dot').length`);
    out.errors = errors;
    ws.close();
  }
  catch (e) {
    out.error = String(e.stack || e);
  }
  chrome.kill();
  await sleep(300);
  fs.rmSync(profile, {recursive: true, force: true, maxRetries: 3});

  const checks = {
    'the panel\'s page loads, and the window opens, while Google\'s pictures are still on their way': out.stopped !== null && out.stopped < 1500,
    'the list is drawn by then': out.rowsWhileHeld === NINE.length * 2 && out.firstRow !== null,
    'no picture of the network is asked for before the page has loaded': out.askedBeforeStop === 0,
    'then every sender\'s logo is asked for once and shows': out.asked >= DOMAINS.length + NINE.length && out.logos === NINE.length * 2,
    'and every mailbox\'s photo shows, none is left a dot': out.photos === NINE.length && out.dots === 0,
    'the page throws nothing': out.errors?.length === 0 && !out.error
  };
  let failed = false;
  for (const [name, pass] of Object.entries(checks)) {
    console.log((pass ? 'ok ' : 'not ok ') + name);
    failed ||= !pass;
  }
  if (failed) {
    console.log(JSON.stringify(out, null, 1).slice(0, 3000));
  }
  process.exit(failed ? 1 : 0);
})();
