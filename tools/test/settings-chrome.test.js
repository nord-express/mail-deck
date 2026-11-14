// The settings page as Chrome draws it, with the extension loaded: what only a real extension
// page shows. Chrome gives such a page a body { font-size: 75% } of its own, outside any layer;
// Google's picture of an account is as large as it was asked for (one with no photo gets a
// coloured square with a letter); a provider's name has to fit its tile in a narrow window.
// Google's pictures are answered here, so nothing goes to the network.
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
  console.log('ok the settings page in a real Chrome - skipped: no Chrome that loads an unpacked extension (set CHROME_EXT)');
  process.exit(0);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
// Google's picture of an account with no photo: a square with its letter, 96 pixels a side
const PICTURE = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">' +
  '<rect width="96" height="96" fill="#c2185b"/><text x="48" y="64" font-size="48" text-anchor="middle" fill="#fff">B</text></svg>').toString('base64');
const PIC = 'https://lh3.googleusercontent.com/a/ACg8ocTest=s96-c';
const NAMES = ['alice.long.address@gmail.com', 'bob@gmail.com', 'carol@example.org', 'eve@company.app'];

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mail-deck-settings-profile-'));
  const chrome = spawn(CHROME, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--use-mock-keychain', `--user-data-dir=${profile}`,
    '--remote-debugging-port=0', '--window-size=1280,1400', `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`,
    ...(process.platform === 'linux' ? ['--no-sandbox'] : []), 'about:blank'], {stdio: 'ignore'});
  const out = {};
  try {
    // the port Chrome took, then the extension's id from its service worker
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
    ws.addEventListener('message', ev => {
      const m = JSON.parse(ev.data);
      if (m.method === 'Fetch.requestPaused') {
        call('Fetch.fulfillRequest', {requestId: m.params.requestId, responseCode: 200,
          responseHeaders: [{name: 'content-type', value: 'image/svg+xml'}], body: PICTURE}).catch(() => {});
      }
      if (m.method === 'Runtime.exceptionThrown') {
        errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
      }
    });
    await new Promise(r => ws.addEventListener('open', r));
    await call('Runtime.enable');
    await call('Page.enable');
    await call('Fetch.enable', {patterns: [{urlPattern: 'https://lh3.googleusercontent.com/*'}]});
    const run = async expression => {
      const r = await call('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true});
      if (r.exceptionDetails) {
        throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      }
      return r.result.value;
    };
    const settings = `chrome-extension://${id}/data/settings/index.html`;
    await call('Page.navigate', {url: settings});
    await sleep(1500);
    // four inboxes, two of them with Google's picture
    await run(`chrome.storage.local.set({accounts: Object.fromEntries(${JSON.stringify(NAMES)}.map(n => [n, {}])),
      avatars: {'bob@gmail.com': {url: '${PIC}', at: Date.now()}, 'eve@company.app': {url: '${PIC}', at: Date.now()}}})`);
    await call('Page.reload');
    await sleep(2500);
    Object.assign(out, await run(`(() => {
      const box = el => {
        const r = el.getBoundingClientRect();
        return {x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)};
      };
      return {
        body: getComputedStyle(document.body).fontSize,
        rail: getComputedStyle(document.querySelector('.rail a, nav a') || document.body).fontSize,
        avatars: [...document.querySelectorAll('.acc .avatar')].map(a => ({box: box(a), pic: a.classList.contains('pic'),
          img: a.querySelector('img') && box(a.querySelector('img')), row: box(a.closest('.acc'))}))
      };
    })()`));
    // the provider tiles in a window under 900 pixels
    await call('Emulation.setDeviceMetricsOverride', {width: 560, height: 1400, deviceScaleFactor: 1, mobile: false});
    await sleep(500);
    out.cut = await run(`[...document.querySelectorAll('.engine.pick b')].filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent)`);
    out.tiles = await run(`document.querySelectorAll('.engine.pick b').length`);
    out.errors = errors;
    ws.close();
  }
  catch (e) {
    out.error = String(e.stack || e);
  }
  chrome.kill();
  await sleep(300);
  fs.rmSync(profile, {recursive: true, force: true, maxRetries: 3});

  const pics = (out.avatars || []).filter(a => a.img);
  const checks = {
    'the page\'s text is at its own size, not three quarters of it': out.body === '14px' && out.rail !== '10.5px',
    'every inbox has its picture or letter in a circle of 36 pixels': out.avatars?.length === NAMES.length &&
      out.avatars.every(a => a.box.w === 36 && a.box.h === 36),
    'Google\'s picture fills that circle and stays in its row': pics.length === 2 && pics.every(a => a.pic &&
      a.img.w === 36 && a.img.h === 36 && a.img.x === a.box.x && a.img.y === a.box.y &&
      a.img.y >= a.row.y && a.img.y + a.img.h <= a.row.y + a.row.h),
    'in a narrow window every provider\'s name fits its tile': out.tiles >= 12 && out.cut?.length === 0,
    'the page throws nothing': out.errors?.length === 0
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
