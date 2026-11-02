// chrome.* and Gmail for the panel under test: three mailboxes, Gmail's search,
// a three-message thread with an attachment, and a 700px newsletter (?wide=1).
// It records what the panel sends (__sent), stores (__set) and prints (__prints).
// A test may make Gmail fail: __printStatus answers the print view (and __printSignIn, __printHang
// below), __searchFails(m) the search,
// __actionFails(links) names the links of an action Gmail refuses.
(() => {
  const q = new URLSearchParams(location.search);
  const lang = q.get('lang') || 'ru';
  const load = l => { const x = new XMLHttpRequest(); x.open('GET', '/_locales/' + l + '/messages.json', false); x.send(); return JSON.parse(x.responseText); };
  const msgs = Object.assign(load('en'), load(lang));
  const now = Date.now();
  const iso = m => new Date(now - m * 60000).toISOString();
  const entry = (u, id, name, email, title, summary, m) => ({link: `https://mail.google.com/mail/u/${u}?account_id=x&message_id=${id}&view=conv&extsrc=atom`, id: 'tag:' + id, author_name: name, author_email: email, title, summary, modified: iso(m)});
  const acc = (u, email, entries, n) => ({meta: {}, newIDs: [], xml: {title: email, link: `https://mail.google.com/mail/u/${u}/#inbox`, rootLink: `https://mail.google.com/mail/u/${u}`, fullcount: n ?? entries.length, entries}});
  const caught = q.get('s') === 'caught';
  // ?s=services: a Gmail account next to Yahoo (reads in the panel) and Proton (opens on its site)
  const sentry = (service, base, id, name, email, title, m) => ({link: base + '/m/' + id, id: service + ':' + id, ref: {id}, author_name: name, author_email: email, title, summary: 'about ' + id, modified: iso(m)});
  const box = (service, base, email, entries) => ({meta: {service}, newIDs: [], xml: {title: email, label: '', service, link: base, rootLink: base, fullcount: entries.length, entries}});
  const services = q.get('s') === 'services' && [
    acc(0, 'evgeny@example.com', [entry(0, 'a1', 'Anna Petrova', 'anna@figma.com', 'Макеты на ревью', 'Посмотри', 4)]),
    box('yahoo', 'https://mail.yahoo.com/n/folders/1', 'ev@yahoo.com', [
      sentry('yahoo', 'https://mail.yahoo.com/n/folders/1', 'y1', 'Bo', 'bo@x.test', 'Yahoo one', 10),
      sentry('yahoo', 'https://mail.yahoo.com/n/folders/1', 'y2', 'Cy', 'cy@x.test', 'Yahoo two', 20)
    ]),
    box('proton', 'https://mail.proton.me/u/0/inbox', 'ev@proton.me', [sentry('proton', 'https://mail.proton.me/u/0/inbox', 'p1', 'Di', 'di@x.test', 'Proton one', 30)])
  ];
  // ?s=codes: mail with one-time codes, and mail with numbers that are none
  const codes = q.get('s') === 'codes' && [acc(0, 'evgeny@example.com', [
    entry(0, 'c1', 'Google', 'no-reply@accounts.google.com', 'Your Google verification code', 'G-482913 is your Google verification code.', 1),
    entry(0, 'c2', 'Банк', 'alerts@bank.test', 'Код подтверждения', 'Ваш код: 7310. Никому его не сообщайте.', 2),
    entry(0, 'c3', 'Stripe', 'billing@stripe.com', 'Invoice #1042 for 2026', 'Questions? Call +1 415 555 0134. Our code of conduct changed.', 3),
    entry(0, 'c4', 'GitHub', 'noreply@github.com', '[GitHub] Please verify your device', 'Verification code: 123-456', 4),
    entry(0, 'c5', 'Anna', 'anna@figma.com', 'Встреча', 'В 10:30, комната 4815', 5),
    // a code word far from the number, and numbers labelled as something else
    entry(0, 'c6', 'Amazon Web Services', 'invoicing@aws.com', 'Amazon Web Services Invoice Available [Account: 762728162410] [Invoice ID: 2882561041]',
      'Never share your password or verification code. Invoice Number: 0801. Tax code 0801, VAT code: 0802', 6)
  ])];
  // ?s=site: mail of github.com (one with a fresh code, one sent through a bulk sender, one in
  // another mailbox), of Amazon under two endings (its code too old), of a generic brand, and others
  const site = q.get('s') === 'site' && [
    acc(0, 'evgeny@example.com', [
      entry(0, 'g1', 'GitHub', 'noreply@github.com', '[GitHub] Please verify your device', 'Verification code: 482913', 2),
      entry(0, 'f1', 'Anna Petrova', 'anna@figma.com', 'Макеты на ревью', 'Посмотри, пожалуйста', 4),
      entry(0, 'f2', 'Банк', 'alerts@bank.test', 'Код подтверждения', 'Ваш код: 7310. Никому его не сообщайте.', 6),
      entry(0, 'z1', 'Amazon.de', 'shipment-tracking@amazon.de', 'Your order has shipped', 'Arriving Tuesday', 10),
      entry(0, 'x1', 'Shop', 'orders@store.de', 'Order confirmation', 'Thank you for your order', 15),
      entry(0, 'g2', 'GitHub', 'notifications@github.com', 'Re: [deck] Fix the build (#12)', 'Merged.', 30),
      entry(0, 'z0', 'Amazon', 'account-update@amazon.com', 'Your Amazon one-time password', 'Your one-time password is 551234', 45),
      entry(0, 'g3', 'GitHub', 'noreply@github.com', '[GitHub] A new SSH key was added', 'A new public key was added', 60),
      entry(0, 'g4', 'GitHub', 'bounces+1@sendgrid.net', 'Your weekly digest', 'Trending repositories', 120)
    ]),
    acc(1, 'work@arbitron.example', [entry(1, 'g6', 'GitHub', 'noreply@github.com', '[GitHub] Sign-in from a new device', 'We noticed a new sign-in.', 5)])
  ];
  const nine = ['bychkovea@gmail.com', 'evgeny@arbitron.app', 'abrahamlincolncrypto@gmail.com', 'georgewashingtoncypto@gmail.com', 'knivesmagician@gmail.com', 'thomasjeffersoncrypto@gmail.com', 'codewithevgeny@gmail.com', 'cryptobychkov@gmail.com', 'eco.toplivo.msk@gmail.com'];
  const objs = services || codes || site || (q.get('s') === 'nine' ? nine.map((m, i) => acc(i, m, [])) : caught ? [acc(0, 'evgeny@example.com', []), acc(1, 'work@arbitron.example', [])] : [
    acc(0, 'evgeny@example.com', [
      entry(0, 'a1', 'Anna Petrova', 'anna@figma.com', 'Макеты на ревью', 'Посмотри, пожалуйста, до пятницы', 4),
      entry(0, 'a2', 'GitHub', 'noreply@github.com', 'New sign-in', 'A new sign-in to your account', 95)
    ], 5),
    acc(1, 'work@arbitron.example', [entry(1, 'b1', 'Ivan', 'ivan@gmail.com', 'Созвон', 'Давай созвонимся сегодня?', 30)]),
    acc(2, 'old@example.org', [])
  ]);
  const local = {accounts: services ? {'evgeny@example.com': {}, 'ev@yahoo.com': {service: 'yahoo'}, 'ev@proton.me': {service: 'proton'}, 'gone@yahoo.com': {service: 'yahoo'}} :
    q.get('s') === 'nine' ? Object.fromEntries(nine.map(m => [m, {}])) : {'evgeny@example.com': {}, 'work@arbitron.example': {}, 'old@example.org': {}, 'gone@example.com': {}},
    accountOrder: [], panelScale: Number(q.get('scale') || 1), readOnOpen: q.get('read') === '1', 'remind.links': [],
    autoAdvance: q.get('advance') === '1', 'badge.count': q.get('badge') || 'all',
    // ?ai=on|off|real: the assistant's engine (real: the real ai.js, loaded by the panel, with no key)
    ...(q.get('ai') ? {'ai.engine': q.get('ai') === 'off' ? 'off' : 'openai', 'ai.summary': q.get('summary') || 'click', 'ai.reply': q.get('reply') !== '0',
      'ai.buttons': q.get('buttons') !== '0'} : {})};
  window.__sent = []; window.__set = [];
  window.__tabUrl = q.get('url') || ''; window.__tabEvents = {};
  // what the panel copies (__copied): a page under test has no clipboard of its own to ask
  Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText: async s => { window.__copied = s; }}});
  // a link opened from the panel closes it; the page under test has to stay
  window.close = () => {};
  // when the list showed its first line, and when the panel added ai.js; what went wrong unseen
  window.__errors = [];
  addEventListener('error', e => window.__errors.push(String(e.message)));
  addEventListener('unhandledrejection', e => window.__errors.push(String(e.reason?.stack || e.reason)));
  // watched from the first line parsed: the panel draws its list before DOMContentLoaded
  new MutationObserver(() => {
    if (!window.__firstRow && document.querySelector('#list .row, #list .acc')) {
      window.__firstRow = performance.now();
    }
    if (!window.__aiScriptAt && document.querySelector('script[src*="/ai/ai.js"]')) {
      window.__aiScriptAt = performance.now();
    }
  }).observe(document.documentElement, {childList: true, subtree: true});
  // ?ai=on|off: self.AI as the panel uses it, recording each call (__ai.calls). A summary streams in
  // five steps of __ai.step ms, is kept by key, stops on its signal; __ai.fail makes it fail with
  // that code, __ai.truncated cut; __ai.replyFail makes needsReply fail, with what it found.
  if (q.get('ai') === 'on' || q.get('ai') === 'off') {
    const ai = window.__ai = {calls: [], fail: null, truncated: false, step: 60, replyFail: null};
    const err = code => Object.assign(new Error(msgs['ai_err_' + code.replace(/-/g, '_')]?.message || code), {name: 'AIError', code});
    const kept = new Map();
    const call = (fn, o = {}) => ai.calls.push({fn, t: performance.now(), ...o});
    const full = subject => ({
      points: ['Anna sent the final mockups', 'She asks for feedback by Friday', 'The draft is in Figma'],
      todo: ['Review the mockups before Friday'],
      events: [{title: 'Design review', start: '2026-11-06T10:00:00Z', end: '2026-11-06T11:00:00Z', allDay: false, details: subject},
        {title: 'Offsite', start: '2026-11-10', end: '2026-11-11', allDay: true, details: subject}],
      truncated: ai.truncated, engine: 'openai', model: 'gpt-test'
    });
    window.AI = {
      state: async () => {
        call('state');
        return {ok: true, lang: 'en'};
      },
      cached: async key => {
        call('cached', {key});
        return kept.has(key) ? {...kept.get(key), cached: true} : null;
      },
      summarize: ({key, fresh, signal, onUpdate, subject, messages}) => new Promise((resolve, reject) => {
        call('summarize', {key, fresh: Boolean(fresh), subject, messages: messages.length, chars: messages.reduce((n, m) => n + m.text.length, 0)});
        if (!fresh && kept.has(key)) {
          resolve({...kept.get(key), cached: true});
          return;
        }
        const s = full(subject);
        const steps = [{points: s.points.slice(0, 1)}, {points: s.points.slice(0, 2)}, {points: s.points}, {points: s.points, todo: s.todo}, s];
        let i = 0;
        let timer;
        const stop = () => {
          clearTimeout(timer);
          call('aborted', {key});
          reject(err('aborted'));
        };
        signal?.addEventListener('abort', stop, {once: true});
        const next = () => {
          if (ai.fail) {
            signal?.removeEventListener('abort', stop);
            reject(err(ai.fail));
            return;
          }
          if (i < steps.length) {
            onUpdate?.({todo: [], events: [], truncated: false, engine: 'openai', model: 'gpt-test', ...steps[i], partial: true});
            i += 1;
            timer = setTimeout(next, ai.step);
            return;
          }
          signal?.removeEventListener('abort', stop);
          kept.set(key, s);
          resolve(s);
        };
        timer = setTimeout(next, ai.fail ? 20 : ai.step);
      }),
      needsReply: async ({items, accounts}) => {
        call('needsReply', {n: items.length, ids: items.map(it => it.id), accounts});
        await new Promise(r => setTimeout(r, 20));
        // a question waits for a reply; GitHub's sign-in is important, a digest bulk
        const out = new Map(items.map(it => [it.id, /\?|пожалуйста/.test(it.snippet) ?
          {reply: true, important: false, bulk: false, why: it.snippet.includes('?') ? 'asks a question' : 'asks for the mockups'} :
          {reply: false, important: /sign-in/i.test(it.subject), bulk: /digest|newsletter/i.test(it.subject), why: ''}]));
        if (ai.replyFail) {
          throw Object.assign(err(ai.replyFail), {results: out});
        }
        return out;
      },
      // the assistant: a plan by the words of the request, answers that cite the first mail;
      // __ai.planFail fails the plan with that code, __ai.hold keeps an answer going until stopped
      describe: async () => ({engine: 'openai', provider: 'OpenAI', model: 'gpt-test', plan: false, local: false}),
      plan: async ({request, signal}) => {
        call('plan', {request});
        await new Promise(r => setTimeout(r, 20));
        if (ai.planFail) {
          throw err(ai.planFail);
        }
        return /^write|напиши/i.test(request) ? {action: 'write', query: '', words: [], title: 'A note'} :
          /important|важн/i.test(request) ? {action: 'brief', query: '', words: [], title: 'Unread mail'} :
            /^find/i.test(request) ? {action: 'find', query: 'invoice', words: ['invoice'], title: 'Invoices'} :
              {action: 'answer', query: 'invoice', words: ['invoice'], title: 'The invoice'};
      },
      answer: ({question, mail, signal, onUpdate}) => new Promise((resolve, reject) => {
        call('answer', {question, n: mail.length, mail});
        const text = 'The invoice #1042 is ready [1].';
        onUpdate?.('The invoice');
        signal?.addEventListener('abort', () => reject(err('aborted')), {once: true});
        if (!ai.hold) {
          setTimeout(() => resolve({text, cites: [1], engine: 'openai', model: 'gpt-test'}), 30);
        }
      }),
      compose: async ({request, onUpdate}) => {
        call('compose', {request});
        onUpdate?.({to: '', subject: 'Встреча', body: ''});
        await new Promise(r => setTimeout(r, 20));
        return {to: 'anna@figma.com', subject: 'Встреча в пятницу', body: 'Анна, привет!\n\nВстреча переносится на пятницу.'};
      },
      draft: async ({intent, reader, messages, onUpdate}) => {
        call('draft', {intent, reader, n: messages.length});
        onUpdate?.('Привет');
        await new Promise(r => setTimeout(r, 20));
        return {text: 'Привет, Аня!\n\nСпасибо, посмотрю до пятницы.'};
      },
      translate: async ({messages, onUpdate}) => {
        call('translate', {n: messages.length});
        onUpdate?.('Hi! The mockups');
        await new Promise(r => setTimeout(r, 20));
        return {text: 'Hi! The mockups are attached; please look before Friday.'};
      },
      calendarUrl: (ev, {account} = {}) => 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(ev.title) +
        (account ? '&authuser=' + encodeURIComponent(account) : '')
    };
  }
  const row = (thread, subject, from, text, mins, labels) => ({subject, thread, labels, date: now - mins * 60000, from, text});
  const search = ({url, query}) => {
    // the site's mail is all in the feeds
    if (site) {
      return [];
    }
    const n = Number(url.match(/u\/(\d+)/)[1]);
    // a thread the feed lists too, found again by the search
    if (query === 'mockups') {
      return n === 0 ? [row('a1', 'Макеты на ревью', ['Anna Petrova', 'anna@figma.com'], '…', 4, ['^u', '^i'])] : [];
    }
    if (query.includes('is:unread')) {
      return n === 0 ? [
        row('a1', 'Макеты на ревью', ['Anna Petrova', 'anna@figma.com'], '…', 4, ['^u', '^i', 'STARRED']),
        row('a2', 'New sign-in', ['GitHub', 'noreply@github.com'], '…', 95, ['^u', '^i']),
        row('a3', 'Счёт за октябрь', ['Бухгалтерия', 'billing@stripe.com'], 'Счёт №1042 во вложении', 600, ['^u', '^i']),
        row('a4', 'Weekly digest', 'Notion <team@notion.so>', 'Your workspace this week', 2000, ['^u', '^i', 'STARRED']),
        row('a5', 'Приглашение', ['Мария', 'maria@yandex.ru'], 'Приходи в субботу', 3000, ['^u', '^i'])
      ] : [];
    }
    return n === 1 ? [] : [
      row('s' + n + '1', 'Invoice #1042', ['Stripe', 'billing@stripe.com'], 'Your invoice is ready', 300, ['^u']),
      row('s' + n + '2', 'Invoice #1031', ['Stripe', 'billing@stripe.com'], 'Paid, thank you', 50000, [])
    ];
  };
  const respond = (m, cb) => {
    window.__sent.push(m);
    let r;
    if (m.method === 'gmail.search') r = window.__searchFails?.(m) ? null : search(m);
    if (m.method === 'get-at') r = 'AT';
    if (m.method === 'gmail.action' && window.__actionFails?.(m.links)?.length) r = {message: 'refused', failed: window.__actionFails(m.links)};
    // what a service answers: markup that must not run in the reader
    // and markup that must not load before Show pictures, nor open a link over the panel
    const px = k => `${location.origin}/__pixel?k=services-svc-${k}`;
    if (m.method === 'services.body') r = {messages: [
      {name: 'Bo', email: 'bo@x.test', date: '2026-10-30T09:00:00Z', to: 'ev@yahoo.com', html: '<p>first</p>'},
      {name: 'Cy', email: 'cy@x.test', date: '2026-10-31T09:00:00Z', to: 'ev@yahoo.com',
        html: '<html><head><style>p{color:red}</style></head><body><p id="safe">second <a href="javascript:alert(1)">x</a><a href="/rel">rel</a></p><script>window.parent.__ran=1</script><img src="x.png" onerror="window.parent.__ran=1"><iframe src="https://evil.test"></iframe><form action="https://evil.test"><input></form>' +
          `<div style="width:9px;height:9px;background:URL(${px('css')})"></div><svg width="9" height="9"><image href="${px('svg')}" width="9" height="9"/></svg>` +
          `<video src="${px('video')}" poster="${px('poster')}" width="9" height="9"></video>` +
          `<a id="top" href="https://evil.test/top" target="_top" ping="${px('ping')}">top</a> <a id="hash" href="#safe">hash</a> <a id="data" href="data:text/plain,x">data</a>` +
          '<div id="editable" contenteditable>edit</div></body></html>'}
    ]};
    cb && setTimeout(() => cb(r), 10);
    return new Promise(res => setTimeout(() => res(r), 10));
  };
  const store = (area, d) => (defaults, cb) => {
    const out = {};
    // a key, a list of keys (what is missing stays out), or keys with their defaults
    const keys = typeof defaults === 'string' ? [defaults] : Array.isArray(defaults) ? defaults : Object.keys(defaults || {});
    for (const k of keys) {
      if (k in area || (defaults && !Array.isArray(defaults) && typeof defaults === 'object')) out[k] = k in area ? area[k] : defaults[k];
    }
    cb && cb(out);
    return Promise.resolve(out);
  };
  window.chrome = {
    i18n: {getUILanguage: () => lang, getMessage: (k, subs = []) => { const m = msgs[k]; return m ? m.message.replace(/\$(\d)/g, (_, i) => subs[i - 1] ?? '') : ''; }},
    runtime: {sendMessage: respond, onMessage: {addListener() {}}, openOptionsPage() {}, getURL: p => location.origin + p},
    storage: {
      // the files of every line are known already (none), so the print views stay the reader's,
      // as the other scenarios count them; ?scenario=files reads them ahead
      session: (() => { const area = {'cached-objects': objs, 'resolved.links': [], ...(q.get('scenario') === 'files' ? {} : {'files.index': new Proxy({}, {get: (o, k) => typeof k === 'string' && k.includes('#') ? o[k] ?? [] : o[k], has: () => true})})}; return {get: store(area), set: o => { Object.assign(area, o); return Promise.resolve(); }, remove: k => { [k].flat().forEach(x => delete area[x]); return Promise.resolve(); }, getKeys: () => Promise.resolve(Object.keys(area)), area}; })(),
      local: {get: store(local), set: (o) => { window.__set.push(o); Object.assign(local, o); return Promise.resolve(); }},
      onChanged: {addListener() {}}
    },
    sidePanel: {open: () => Promise.resolve()},
    windows: {getCurrent: () => Promise.resolve({id: 1})},
    // the active tab: its address is ?url= (none: a tab the panel may not read); a test changes
    // __tabUrl and calls __tabEvents.updated or .activated as Chrome would
    tabs: {
      query: () => Promise.resolve([{id: 7, active: true, windowId: 1, ...(window.__tabUrl ? {url: window.__tabUrl} : {})}]),
      create: o => { (window.__tabsCreated ||= []).push(o.url); },
      onActivated: {addListener: f => { window.__tabEvents.activated = f; }},
      onUpdated: {addListener: f => { window.__tabEvents.updated = f; }}
    }
  };
  // the print view of a three-message thread with a recipient line and one attachment
  const msg = (name, email, date, to, body, att) => `<table width=100% cellpadding=0 cellspacing=0 border=0 class="message">
<tr><td><font size=-1><b>${name} </b>&lt;${email}&gt;</font></td><td align=right><font size=-1>${date}</font></td></tr>
<tr><td colspan=2><font size=-1 class=recipient><div>To: Evgeny &lt;evgeny@example.com&gt;</div>${to}</font></td></tr>
<tr><td colspan=2><table width=100% cellpadding=12 cellspacing=0 border=0><tr><td><div style="overflow: hidden;"><font size=-1>${body}</font></div>${att || ''}</td></tr></table></td></tr></table>`;
  const att = `<hr><table class=att cellspacing=0 cellpadding=5 border=0><tr><td><table cellspacing=0 cellpadding=0><tr><td><a href="?ui=2&ik=abc&view=att&th=a1&attid=0.1&disp=attd&zw" target=_blank><img width=16 height=16 src="https://ssl.gstatic.com/attach.png"></a></td><td width=7></td><td><b>Макеты-v3.pdf</b><br>1.2 MB&nbsp;&nbsp;<a href="?ui=2&ik=abc&view=att&th=a1&attid=0.1&disp=safe&zw" target=_blank>View</a>&nbsp;<a href="?ui=2&ik=abc&view=att&th=a1&attid=0.1&disp=attd&zw" target=_blank>Download</a></td></tr></table></td></tr></table>`;
  const page = `<html><body>` + [
    msg('Evgeny', 'evgeny@example.com', 'Mon, Oct 26 at 10:02', '', 'Аня, пришли, пожалуйста, макеты к пятнице.'),
    msg('Anna Petrova', 'anna@figma.com', 'Tue, Oct 27 at 18:40', '<div>Cc: design@figma.com</div>', 'Почти готово, завтра пришлю. <a href="https://www.google.com/url?q=https://figma.com/file/x&sa=D">Черновик</a>'),
    msg('Anna Petrova', 'anna@figma.com', 'Fri, Oct 30 at 19:51', '', 'Привет! Макеты во вложении, посмотри, пожалуйста, до пятницы.<br><br>— Аня' +
      `<img width=1 height=1 src="${location.origin}/__pixel?k=${q.get('scenario')}-gmail">`, att)
  ].join('<hr>') + `</body></html>`;
  // __printLong: the same thread with a long newest message, a summary's work
  const long = page.replace('— Аня', '— Аня<br>' + 'The final layout keeps the cards, the reader and the settings in one grid. '.repeat(30));
  // a newsletter 700px wide, with its picture loading a moment later
  const wide = `<html><body><table width=100% cellpadding=0 cellspacing=0 border=0 class="message">
<tr><td><font size=-1><b>Московский транспорт </b>&lt;deptrans@transport.mos.ru&gt;</font></td><td align=right><font size=-1>Fri, Oct 30 at 20:32</font></td></tr>
<tr><td colspan=2><font size=-1 class=recipient><div>To: bychkovea@gmail.com</div></font></td></tr>
<tr><td colspan=2><table width=100% cellpadding=12 cellspacing=0 border=0><tr><td><div style="overflow: hidden;"><font size=-1>
<table width="700" style="width:700px;background:#000" cellpadding=30><tr><td><img width="640" src="data:image/svg+xml,${encodeURIComponent('<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'640\' height=\'420\'><rect width=\'640\' height=\'420\' fill=\'%23e98a2c\'/><circle cx=\'320\' cy=\'210\' r=\'150\' fill=\'%23234\'/></svg>')}"><p style="color:#fff;font:20px Arial">Пройдите опрос о самокатах</p></td></tr></table>
</font></div></td></tr></table></td></tr></table></body></html>`;
  const realFetch = window.fetch;
  window.__prints = 0;
  window.__printed = [];
  // __printSignIn: Gmail sends the print view to Google's sign-in page; __printHang: it never
  // answers (until the request is given up); __printBig: a thread of that many characters
  window.fetch = (url, o) => {
    if (!String(url).includes('view=pt')) {
      return realFetch(url, o);
    }
    window.__printed.push(String(url));
    ++window.__prints;
    if (window.__printSignIn) {
      return Promise.resolve({ok: true, status: 200, url: 'https://accounts.google.com/v3/signin/identifier', text: async () => '<html><body>Sign in</body></html>'});
    }
    if (window.__printHang) {
      return new Promise((resolve, reject) => o?.signal?.addEventListener('abort', () => reject(new DOMException('timeout', 'TimeoutError'))));
    }
    const body = window.__printBig ? page.replace('— Аня', '— Аня' + 'ж'.repeat(window.__printBig)) : q.get('wide') ? wide : window.__printLong ? long : page;
    return Promise.resolve(new Response(body, {status: window.__printStatus || 200}));
  };
})();
