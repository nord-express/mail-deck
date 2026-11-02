// The ChatGPT sign-in, and OpenRouter's for a key, coming back in a real Chrome with the
// extension loaded: a session rule turns the visit to the loopback address into
// data/ai/callback.html with its query (#openrouter for OpenRouter's), and the page finishes the
// sign-in. A copy of the extension is changed for the test only: OpenAI's sign-in site and
// OpenRouter's are a local server (the token endpoint and keys; the key exchange and the key's
// check), the page that sends the user back is one of that server's (so the copy lets it reach
// callback.html), and a page of the copy's starts each sign-in and reports what it saw.
// Google Chrome no longer loads an unpacked extension from the command line: Chrome for
// Testing (Playwright's) does. CHROME_EXT names one; without it the check is skipped.
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
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
  console.log('ok the sign-in callback in a real Chrome - skipped: no Chrome that loads an unpacked extension (set CHROME_EXT)');
  process.exit(0);
}

const b64u = x => Buffer.from(typeof x === 'string' ? x : new Uint8Array(x)).toString('base64url');
const RSA = {name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256'};
const SCOPES = 'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct';

(async () => {
  const pair = await crypto.subtle.generateKey(RSA, true, ['sign', 'verify']);
  const jwk = {...await crypto.subtle.exportKey('jwk', pair.publicKey), kid: 'k1', alg: 'RS256', use: 'sig'};
  const tokenRequests = [];
  const keyRequests = [];
  let auth;
  let done;
  const result = new Promise(r => done = r);
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (url.pathname === '/start') {
        // the consent page: a click on it sends the user back, as OpenAI's does
        res.setHeader('content-type', 'text/html');
        res.end(`<a id="go" href="/back?state=${encodeURIComponent(url.searchParams.get('state'))}">Continue</a>` +
          '<script>setTimeout(() => document.getElementById("go").click(), 200)</script>');
      }
      else if (url.pathname === '/back') {
        res.writeHead(302, {location: 'http://127.0.0.1:1455/auth/callback?code=c-1&state=' + encodeURIComponent(url.searchParams.get('state')) +
          '&scope=' + encodeURIComponent(SCOPES) + '&client_id=oaiapp_test'});
        res.end();
      }
      else if (url.pathname === '/api/accounts/oauth/token') {
        const form = Object.fromEntries(new URLSearchParams(body));
        tokenRequests.push({method: req.method, type: req.headers['content-type'], form});
        const now = Math.floor(Date.now() / 1000);
        const head = b64u(JSON.stringify({alg: 'RS256', kid: 'k1', typ: 'JWT'}));
        const claims = b64u(JSON.stringify({iss: auth, aud: form.client_id, sub: 'user-1', email: 'me@example.com',
          nonce: global.nonce, iat: now, exp: now + 3600}));
        const sig = b64u(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, Buffer.from(head + '.' + claims)));
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({access_token: 'at-1', refresh_token: 'rt-1', id_token: `${head}.${claims}.${sig}`, token_type: 'Bearer',
          expires_in: 3600, scope: SCOPES}));
      }
      else if (url.pathname === '/or-start' || url.pathname === '/or-deny') {
        // OpenRouter's page: Authorize sends the user back with a code and the state; a decline, with neither
        res.setHeader('content-type', 'text/html');
        const back = url.pathname === '/or-deny' ? '/or-back' : `/or-back?code=or-code-1&state=${encodeURIComponent(url.searchParams.get('state'))}`;
        res.end(`<a id="go" href="${back}">Authorize</a><script>setTimeout(() => document.getElementById("go").click(), 200)</script>`);
      }
      else if (url.pathname === '/or-back') {
        res.writeHead(302, {location: 'http://127.0.0.1:1456/callback' + url.search});
        res.end();
      }
      else if (url.pathname === '/api/v1/auth/keys') {
        keyRequests.push({method: req.method, type: req.headers['content-type'], body: JSON.parse(body || 'null')});
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({key: 'sk-or-v1-test-0123456789', user_id: 'user_test'}));
      }
      else if (url.pathname === '/api/v1/key') {
        keyRequests.push({method: req.method, authorization: req.headers.authorization});
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({data: {label: 'Mail Deck', limit: null, usage: 0}}));
      }
      else if (url.pathname === '/.well-known/jwks.json') {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({keys: [jwk]}));
      }
      else if (url.pathname === '/nonce') {
        // the page that starts the sign-in says which nonce the ID token is to carry
        global.nonce = url.searchParams.get('n');
        res.end('ok');
      }
      else if (url.pathname === '/result') {
        res.end('ok');
        done(JSON.parse(body));
      }
      else {
        res.writeHead(404);
        res.end();
      }
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const {port} = server.address();
  auth = `http://127.0.0.1:${port}`;

  // the copy, changed as said above
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mail-deck-callback-'));
  fs.cpSync(EXT, dir, {recursive: true});
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  manifest.host_permissions.push('http://127.0.0.1/*');
  manifest.permissions.push('tabs');
  manifest.web_accessible_resources[0].matches.push('http://localhost/*');
  manifest.background = {service_worker: '__worker.js'};
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
  const ai = path.join(dir, 'data/ai/ai.js');
  const source = fs.readFileSync(ai, 'utf8');
  // OpenAI's sign-in site, and OpenRouter's site (its page, the exchange, the key's check under
  // /api/v1/), the local server
  const swaps = [
    [`const AUTH = 'https://auth.openai.com';`, `const AUTH = '${auth}';`],
    [`const KEY_AUTH = 'https://openrouter.ai/auth';`, `const KEY_AUTH = 'http://localhost:${port}/or-start';`],
    [`const KEY_EXCHANGE = 'https://openrouter.ai/api/v1/auth/keys';`, `const KEY_EXCHANGE = '${auth}/api/v1/auth/keys';`],
    [`openrouter: {origins: ['https://openrouter.ai/*'], base: 'https://openrouter.ai/api/v1/'},`,
      `openrouter: {origins: ['http://127.0.0.1/*'], base: '${auth}/api/v1/'},`]
  ];
  for (const [from] of swaps) {
    if (!source.includes(from)) {
      throw new Error('ai.js no longer has this as the test expects: ' + from);
    }
  }
  fs.writeFileSync(ai, swaps.reduce((text, [from, to]) => text.replace(from, to), source));
  fs.writeFileSync(path.join(dir, '__worker.js'), 'chrome.runtime.onInstalled.addListener(() => chrome.tabs.create({url: "/__drive.html"}));');
  fs.writeFileSync(path.join(dir, '__drive.html'), '<!DOCTYPE html><meta charset="utf-8"><script src="/data/ai/ai.js"></script><script src="/__drive.js"></script>');
  fs.writeFileSync(path.join(dir, '__drive.js'), `
(async () => {
  const out = {};
  const until = async (what, ms = 10000) => {
    for (const end = Date.now() + ms; Date.now() < end; await new Promise(r => setTimeout(r, 50))) {
      const v = await what();
      if (v) {
        return v;
      }
    }
    return null;
  };
  // the callback page in a state (OpenRouter's: #openrouter): its window, which this page of the extension may read
  const page = (state, hash = '') => until(() => chrome.extension.getViews({type: 'tab'})
    .find(v => v.location.pathname === '/data/ai/callback.html' && v.location.hash === hash && v.document.getElementById('card')?.dataset.state === state));
  const said = v => v && {title: v.document.getElementById('title').textContent, text: v.document.getElementById('text').textContent,
    retry: !v.document.getElementById('retry').hidden, address: v.location.href, dir: v.document.documentElement.dir,
    paper: getComputedStyle(v.document.body).backgroundColor, card: getComputedStyle(v.document.getElementById('card')).borderRadius};
  try {
    const me = await chrome.tabs.getCurrent();
    const removed = new Promise(r => chrome.tabs.onRemoved.addListener(r));
    await AI._internal.begin(async url => {
      const q = new URL(url).searchParams;
      out.authorize = url;
      await fetch('${auth}/nonce?n=' + encodeURIComponent(q.get('nonce')));
      await chrome.tabs.create({url: 'http://localhost:${port}/start?state=' + encodeURIComponent(q.get('state'))});
    });
    out.rules = await chrome.declarativeNetRequest.getSessionRules();
    out.done = said(await page('ok'));
    out.closed = await Promise.race([removed.then(() => true), new Promise(r => setTimeout(r, 6000, false))]);
    out.back = (await chrome.tabs.get(me.id)).active;
    out.auth = (await chrome.storage.local.get('ai.chatgpt.auth'))['ai.chatgpt.auth'] || null;
    out.rulesAfter = await chrome.declarativeNetRequest.getSessionRules();
    out.pendingAfter = (await chrome.storage.session.get('ai.chatgpt.pending'))['ai.chatgpt.pending'] || null;
    // a visit with another state while a sign-in is underway: refused, and that one goes on
    await AI._internal.begin(async () => {});
    await chrome.tabs.create({url: 'http://127.0.0.1:1455/auth/callback?code=x&state=forged'});
    out.forged = said(await page('bad'));
    out.pendingKept = Boolean((await chrome.storage.session.get('ai.chatgpt.pending'))['ai.chatgpt.pending']);

    // OpenRouter's sign-in for a key: its page in a tab, Authorize, back to 127.0.0.1:1456
    const ended = [];
    chrome.storage.onChanged.addListener((changes, area) => {
      const c = changes['ai.openrouter.pending'];
      if (area === 'session' && c && !c.newValue) {
        ended.push(c.oldValue?.ended);
      }
    });
    const pending = async () => (await chrome.storage.session.get('ai.openrouter.pending'))['ai.openrouter.pending'] || null;
    let keyTab = null;
    const keyTabGone = new Promise(r => chrome.tabs.onRemoved.addListener(id => id === keyTab && r(true)));
    await AI._internal.keyBegin(async url => {
      out.keyAuthorize = url;
      const tab = await chrome.tabs.create({url});
      keyTab = tab.id;
      return tab;
    });
    out.keyRules = await chrome.declarativeNetRequest.getSessionRules();
    out.keyDone = said(await page('ok', '#openrouter'));
    out.keyClosed = await Promise.race([keyTabGone, new Promise(r => setTimeout(r, 6000, false))]);
    out.key = (await chrome.storage.local.get('ai.openrouter.key'))['ai.openrouter.key'] || null;
    out.keyRulesAfter = (await chrome.declarativeNetRequest.getSessionRules()).filter(x => x.id === 902);
    out.keyPendingAfter = await pending();
    // declined at OpenRouter: back with neither the state nor a code; said on the page, and over
    await AI._internal.keyBegin(async url => chrome.tabs.create({url: url.replace('/or-start?', '/or-deny?')}));
    out.keyDenied = said(await page('bad', '#openrouter'));
    await until(async () => !await pending());
    out.keyDeniedPending = await pending();
    // the tab of OpenRouter's page closed before it came back: over, said as such
    let blank = null;
    await AI._internal.keyBegin(async () => blank = await chrome.tabs.create({url: 'about:blank'}));
    await until(async () => (await pending())?.opened === blank.id);
    await chrome.tabs.remove(blank.id);
    await until(async () => !await pending());
    out.keyEnded = ended;
    out.keyRulesLast = (await chrome.declarativeNetRequest.getSessionRules()).filter(x => x.id === 902);
  }
  catch (e) {
    out.error = String(e.stack || e);
  }
  await fetch('${auth}/result', {method: 'POST', body: JSON.stringify(out)});
})();
`);

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mail-deck-callback-profile-'));
  const chrome = spawn(CHROME, ['--headless=new', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`,
    `--disable-extensions-except=${dir}`, `--load-extension=${dir}`, ...(process.platform === 'linux' ? ['--no-sandbox'] : []), 'about:blank'],
  {stdio: 'ignore'});
  const r = await Promise.race([result, new Promise(resolve => setTimeout(resolve, 45000, {error: 'no result in 45 s'}))]);
  chrome.kill();
  server.close();
  for (const d of [dir, profile]) {
    fs.rmSync(d, {recursive: true, force: true, maxRetries: 3});
  }

  const q = r.authorize ? Object.fromEntries(new URL(r.authorize).searchParams) : {};
  const keyQ = r.keyAuthorize ? Object.fromEntries(new URL(r.keyAuthorize).searchParams) : {};
  const [rule] = r.rules || [];
  const checks = {
    'the sign-in starts with a session rule for the loopback address, below core/services.js\'s': r.rules?.length === 1 && rule.id < 1000 &&
      rule.action?.redirect?.transform?.path === '/data/ai/callback.html' && JSON.stringify(rule.condition?.resourceTypes) === '["main_frame"]',
    'the authorize request goes to the sign-in site with the loopback redirect': r.authorize?.startsWith(auth + '/api/accounts/authorize?') &&
      q.redirect_uri === 'http://127.0.0.1:1455/auth/callback' && q.client_id === 'dynamic_agent_client',
    'a click on the consent page, a 302 to 127.0.0.1:1455: callback.html loads, finishes the sign-in, says so': r.done?.title === 'Signed in as me@example.com' &&
      r.done.text === 'You can close this tab.' && !r.done.retry,
    'the code was exchanged with the verifier, by POST, as a form': tokenRequests.length === 1 && tokenRequests[0].method === 'POST' &&
      tokenRequests[0].type === 'application/x-www-form-urlencoded' && tokenRequests[0].form.code === 'c-1' &&
      tokenRequests[0].form.redirect_uri === 'http://127.0.0.1:1455/auth/callback' && /^[\w-]{43}$/.test(tokenRequests[0].form.code_verifier || '') &&
      tokenRequests[0].form.client_id === 'oaiapp_test',
    'the ID token verified with WebCrypto, the sign-in kept': r.auth?.sub === 'user-1' && r.auth.access_token === 'at-1' && r.auth.refresh_token === 'rt-1' &&
      r.auth.client_id === 'oaiapp_test' && r.auth.scopes?.includes('chatgpt.tokens.use.direct'),
    'the page\'s address no longer shows the code; it is drawn as the settings page is': r.done?.address?.endsWith('/data/ai/callback.html') &&
      // the paper of the panel's colours, light or dark as the system is
      r.done.dir === 'ltr' && ['rgb(242, 243, 245)', 'rgb(15, 16, 18)'].includes(r.done.paper) && r.done.card === '22px',
    'after it the rule and the record of the sign-in are gone': r.rulesAfter?.length === 0 && r.pendingAfter === null,
    'the page goes on its own, and the tab the sign-in began in comes to the front': r.closed === true && r.back === true,
    'a visit with another state is refused with Try again; the sign-in underway stays': r.forged?.title === 'Not signed in' && r.forged.retry &&
      /did not finish/.test(r.forged.text) && r.pendingKept === true,
    'OpenRouter: its page opens with the loopback callback, PKCE and a state; its own rule marks the address #openrouter':
      keyQ.callback_url === 'http://127.0.0.1:1456/callback' && keyQ.code_challenge_method === 'S256' && /^[\w-]{43}$/.test(keyQ.state || '') &&
      r.keyRules?.some(x => x.id === 902 && x.action.redirect.transform.fragment === '#openrouter'),
    'OpenRouter: Authorize, a 302 to 127.0.0.1:1456: callback.html#openrouter loads and says it is connected': r.keyDone?.title === 'Connected to OpenRouter' &&
      r.keyDone.text === 'You can close this tab.' && !r.keyDone.retry,
    'OpenRouter: the code exchanged with the verifier as JSON, the key checked with it, then kept': keyRequests.length >= 2 &&
      keyRequests[0].method === 'POST' && keyRequests[0].type === 'application/json' && keyRequests[0].body?.code === 'or-code-1' &&
      /^[\w-]{43}$/.test(keyRequests[0].body?.code_verifier || '') && keyRequests[0].body?.code_challenge_method === 'S256' &&
      keyRequests[1].method === 'GET' && keyRequests[1].authorization === 'Bearer sk-or-v1-test-0123456789' && r.key === 'sk-or-v1-test-0123456789',
    'OpenRouter: the address no longer shows the code; the page goes on its own; the rule and the record gone':
      r.keyDone?.address?.endsWith('/data/ai/callback.html#openrouter') && r.keyClosed === true && r.keyRulesAfter?.length === 0 && r.keyPendingAfter === null,
    'OpenRouter: declined there: said on the page with Try again, and over': r.keyDenied?.title === 'Not connected' && r.keyDenied.retry &&
      /did not allow Mail Deck to get a key from OpenRouter/.test(r.keyDenied.text) && r.keyDeniedPending === null,
    'OpenRouter: its tab closed before it came back: over, as cancelled; no rule left':
      JSON.stringify(r.keyEnded) === '["ok","key-denied","key-cancelled"]' && r.keyRulesLast?.length === 0
  };
  let failed = r.error ? 1 : 0;
  if (r.error) {
    console.log('not ok the page that drives the sign-in - ' + r.error);
  }
  for (const [name, pass] of Object.entries(checks)) {
    failed += pass ? 0 : 1;
    console.log(pass ? 'ok' : 'not ok', name + (pass ? '' : ' - ' + JSON.stringify({r, tokenRequests, keyRequests})));
  }
  process.exit(failed ? 1 : 0);
})().catch(e => {
  console.log('not ok', e.stack || e);
  process.exit(1);
});
