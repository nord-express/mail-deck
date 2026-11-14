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
  // ?s=privacy: a newsletter with trackers, a brand's name from another domain, a lookalike
  // domain, replies sent to a lookalike of the reader's own domain, and an ordinary mail
  const privacy = q.get('s') === 'privacy' && [acc(0, 'evgeny@arbitron.app', [
    entry(0, 't1', 'Shop', 'news@shop.example', 'Weekly deals', 'This week only', 2),
    entry(0, 'w1', 'PayPal', 'service@paypal-billing.net', 'Your account is limited', 'Confirm your details', 5),
    entry(0, 'w2', 'Support', 'help@arnazon.com', 'Your order', 'Your order has shipped', 8),
    entry(0, 'w3', 'Boss', 'boss@arbitron.app', 'Wire today', 'Please handle this today', 11),
    entry(0, 'w4', 'Boss', 'boss@arbitron.app', 'Wire tomorrow', 'Please handle this tomorrow', 12),
    entry(0, 'n1', 'GitHub', 'noreply@github.com', 'New sign-in', 'A new sign-in to your account', 14)
  ])];
  const nine = ['bychkovea@gmail.com', 'evgeny@arbitron.app', 'abrahamlincolncrypto@gmail.com', 'georgewashingtoncypto@gmail.com', 'knivesmagician@gmail.com', 'thomasjeffersoncrypto@gmail.com', 'codewithevgeny@gmail.com', 'cryptobychkov@gmail.com', 'eco.toplivo.msk@gmail.com'];
  const objs = services || codes || site || privacy || (q.get('s') === 'nine' ? nine.map((m, i) => acc(i, m, [])) : caught ? [acc(0, 'evgeny@example.com', []), acc(1, 'work@arbitron.example', [])] : [
    acc(0, 'evgeny@example.com', [
      entry(0, 'a1', 'Anna Petrova', 'anna@figma.com', 'Макеты на ревью', 'Посмотри, пожалуйста, до пятницы', 4),
      entry(0, 'a2', 'GitHub', 'noreply@github.com', 'New sign-in', 'A new sign-in to your account', 95)
    ], 5),
    acc(1, 'work@arbitron.example', [entry(1, 'b1', 'Ivan', 'ivan@gmail.com', 'Созвон', 'Давай созвонимся сегодня?', 30)]),
    acc(2, 'old@example.org', [])
  ]);
  const local = {accounts: services ? {'evgeny@example.com': {}, 'ev@yahoo.com': {service: 'yahoo'}, 'ev@proton.me': {service: 'proton'}, 'gone@yahoo.com': {service: 'yahoo'}} :
    privacy ? {'evgeny@arbitron.app': {}} : q.get('s') === 'nine' ? Object.fromEntries(nine.map(m => [m, {}])) : {'evgeny@example.com': {}, 'work@arbitron.example': {}, 'old@example.org': {}, 'gone@example.com': {}},
    accountOrder: [], panelScale: Number(q.get('scale') || 1), readOnOpen: q.get('read') === '1', 'remind.links': [],
    autoAdvance: q.get('advance') === '1', 'badge.count': q.get('badge') || 'all', askPictures: q.get('ask') === '1',
    // ?ai=on|off|real: the assistant's engine (real: the real ai.js, loaded by the panel, with no key)
    ...(q.get('ai') ? {'ai.engine': q.get('ai') === 'off' ? 'off' : 'openai', 'ai.summary': q.get('summary') || 'click', 'ai.reply': q.get('reply') !== '0',
      'ai.buttons': q.get('buttons') !== '0'} : {}),
    // ?cats=off: Gmail's categories turned off in the settings
    ...(q.get('cats') === 'off' ? {gmailCategories: false} : {}),
    // ?saved=1: searches saved in the settings, one of them for an account not signed in, one empty
    ...(q.get('saved') ? {savedSearches: [{name: 'Invoices', query: 'invoice', account: ''}, {name: 'Work invoices', query: ' invoice ', account: 'work@arbitron.example'},
      {name: '', query: 'from:gone', account: 'gone@example.com'}, {name: 'Empty', query: '  ', account: ''}]} : {}),
    // ?rate=due: the panel opened on twelve days since three weeks ago, nothing asked yet
    ...(q.get('rate') === 'due' ? {rate: {first: now - 21 * 24 * 60 * 60 * 1000, days: 12, day: '2026-1-1'}} : {})};
  window.__sent = []; window.__set = []; window.__objs = objs;
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
      facts: [{label: 'File', value: 'Макеты-v3.pdf'}, {label: 'Order', value: '4815-1623'}],
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
      summarize: ({key, fresh, signal, onUpdate, subject, messages, reader}) => new Promise((resolve, reject) => {
        call('summarize', {key, fresh: Boolean(fresh), subject, messages: messages.length, chars: messages.reduce((n, m) => n + m.text.length, 0),
          reader, emails: messages.map(m => m.email)});
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
      // what the page knows to be bulk (Gmail's categories) comes first, then the rest in one batch
      needsReply: async ({items, accounts, onBatch, bulkOf}) => {
        const known = new Set(bulkOf ? await bulkOf(items) : []);
        call('needsReply', {n: items.length, ids: items.map(it => it.id), accounts, known: [...known], threads: items.map(it => it.thread)});
        const first = new Map([...known].map(id => [id, {reply: false, important: false, bulk: true, why: ''}]));
        if (first.size) {
          onBatch?.(first);
        }
        await new Promise(r => setTimeout(r, 20));
        // a question waits for a reply; GitHub's sign-in is important, a digest bulk
        const out = new Map(items.filter(it => !known.has(it.id)).map(it => [it.id, /\?|пожалуйста/.test(it.snippet) ?
          {reply: true, important: false, bulk: false, why: it.snippet.includes('?') ? 'asks a question' : 'asks for the mockups'} :
          {reply: false, important: /sign-in/i.test(it.subject), bulk: /digest|newsletter/i.test(it.subject), why: ''}]));
        if (ai.replyFail) {
          throw Object.assign(err(ai.replyFail), {results: new Map([...first, ...out])});
        }
        onBatch?.(out);
        return new Map([...first, ...out]);
      },
      // the assistant: a plan by the words of the request, answers that cite the first mail;
      // __ai.planFail fails the plan with that code, __ai.hold keeps an answer going until stopped
      // __ai.describe: what another engine would say of itself
      describe: async () => ai.describe || {engine: 'openai', provider: 'OpenAI', model: 'gpt-test', plan: false, local: false},
      // "archive …" asks to archive what it finds, "… them" is about the mail found before,
      // "nothing" finds nothing even searched more broadly
      plan: async ({request, previous, subjects, signal}) => {
        call('plan', {request, previous, subjects: subjects?.length});
        await new Promise(r => setTimeout(r, 20));
        if (ai.planFail) {
          throw err(ai.planFail);
        }
        const p = {scope: 'new', terms: '', since: '', until: '', op: ''};
        return /^write|напиши/i.test(request) ? {...p, action: 'write', query: '', words: [], title: 'A note'} :
          /important|важн/i.test(request) ? {...p, action: 'brief', query: '', words: [], title: 'Unread mail'} :
            /them$/i.test(request) ? {...p, action: /^archive/i.test(request) ? 'find' : 'answer', scope: 'previous', query: '', words: [],
              op: /^archive/i.test(request) ? 'archive' : '', title: 'Those'} :
              /nothing/i.test(request) ? {...p, action: 'find', query: 'subject:"zz nothing"', words: ['zzz'], title: 'Nothing'} :
                /^(find|archive)/i.test(request) ? {...p, action: 'find', query: 'invoice', words: ['invoice'], op: /^archive/i.test(request) ? 'archive' : '', title: 'Invoices'} :
                  {...p, action: 'answer', query: 'invoice', words: ['invoice'], title: 'The invoice'};
      },
      broaden: (query, words) => [query, query.replace(/subject:|"/g, ''), ...(words.length ? [words.join(' OR ')] : [])]
        .filter((q, i, all) => q && all.indexOf(q) === i),
      warm: async tasks => call('warm', {tasks}),
      // a question with "unknown" in it is answered by no mail; one about a thread reads it whole
      answer: ({question, mail = [], thread, history, signal, onUpdate}) => new Promise((resolve, reject) => {
        call('answer', {question, n: thread ? thread.messages.length : mail.length, mail, thread, history});
        const none = /unknown|неизвест/i.test(question);
        const text = 'The invoice #1042 is ready [1]. It was paid on 99999 [1].';
        if (!none) {
          onUpdate?.('The invoice');
        }
        signal?.addEventListener('abort', () => reject(err('aborted')), {once: true});
        if (!ai.hold) {
          setTimeout(() => resolve(none ? {text: '', cites: [], doubtful: [], notFound: true} :
            {text, cites: [1], doubtful: ['It was paid on 99999 [1].'], engine: 'openai', model: 'gpt-test'}), 30);
        }
      }),
      // a rewrite streams in a few steps of __ai.step ms
      rewrite: ({text, how, lang, signal, onUpdate}) => new Promise((resolve, reject) => {
        call('rewrite', {text, how, lang});
        const out = how === 'shorter' ? 'Аня, спасибо, посмотрю.' : text.toUpperCase();
        let i = 0;
        const timer = setInterval(() => {
          i += 1;
          onUpdate?.(out.slice(0, Math.ceil(out.length * i / 3)));
          if (i === 3) {
            clearInterval(timer);
            resolve({text: out});
          }
        }, ai.step);
        signal?.addEventListener('abort', () => {
          clearInterval(timer);
          reject(err('aborted'));
        }, {once: true});
      }),
      compose: async ({request, onUpdate}) => {
        call('compose', {request});
        onUpdate?.({to: '', subject: 'Встреча', body: ''});
        await new Promise(r => setTimeout(r, 20));
        return {to: 'anna@figma.com', subject: 'Встреча в пятницу', body: 'Анна, привет!\n\nВстреча переносится на пятницу.'};
      },
      draft: async ({intent, reader, lang, messages, onUpdate}) => {
        call('draft', {intent, reader, lang, n: messages.length});
        onUpdate?.('Привет');
        await new Promise(r => setTimeout(r, 20));
        onUpdate?.('Привет, Аня!');
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
  // ?cats=search: Gmail's rows carry no label of its categories, each is searched for instead
  const sorting = q.get('cats') === 'search' ? () => [] : (...labels) => labels;
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
    // Gmail's categories: the digest is a promotion (and bulk, for the assistant), the invitation
    // social, GitHub's sign-in and the bill updates
    if (query.includes(' OR ') || query.includes('category:promotions')) {
      return n === 0 ? [row('a4', 'Weekly digest', 'Notion <team@notion.so>', 'Your workspace this week', 2000, ['^u', '^i', 'STARRED'])] : [];
    }
    if (query.includes('category:social')) {
      return n === 0 ? [row('a5', 'Приглашение', ['Мария', 'maria@yandex.ru'], 'Приходи в субботу', 3000, ['^u', '^i'])] : [];
    }
    if (query.includes('category:updates')) {
      return n === 0 ? [row('a2', 'New sign-in', ['GitHub', 'noreply@github.com'], '…', 95, ['^u', '^i']),
        row('a3', 'Счёт за октябрь', ['Бухгалтерия', 'billing@stripe.com'], 'Счёт №1042 во вложении', 600, ['^u', '^i'])] : [];
    }
    if (query.includes('nothing') || query.includes('zzz')) {
      return [];
    }
    if (query.includes('is:unread')) {
      // where Gmail sorted each thread, as its labels say
      return n === 0 ? [
        row('a1', 'Макеты на ревью', ['Anna Petrova', 'anna@figma.com'], '…', 4, ['^u', '^i', 'STARRED', ...sorting('^smartlabel_personal', '^sq_ig_i_personal')]),
        row('a2', 'New sign-in', ['GitHub', 'noreply@github.com'], '…', 95, ['^u', '^i', ...sorting('^smartlabel_notification')]),
        row('a3', 'Счёт за октябрь', ['Бухгалтерия', 'billing@stripe.com'], 'Счёт №1042 во вложении', 600, ['^u', '^i', ...sorting('^sq_ig_i_notification')]),
        row('a4', 'Weekly digest', 'Notion <team@notion.so>', 'Your workspace this week', 2000, ['^u', '^i', 'STARRED', ...sorting('^smartlabel_promo', '^sq_ig_i_promo')]),
        row('a5', 'Приглашение', ['Мария', 'maria@yandex.ru'], 'Приходи в субботу', 3000, ['^u', '^i', ...sorting('^smartlabel_social')])
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
    // how a mail is unsubscribed from, by its thread (__heads); __unsubscribeFails: the one-click request does not go
    if (m.method === 'gmail.headers') r = window.__heads?.[(m.link.match(/message_id=([^&]+)/) || [])[1]] || {messageId: '', unsubscribe: null};
    if (m.method === 'gmail.unsubscribe') r = window.__unsubscribeFails ? {message: 'Failed to fetch'} : {sent: true};
    // mail sent: Gmail takes it, refuses it (__sendFails), or it waits for its Undo (__sendHold)
    if (m.method === 'gmail.send' && window.__sendHold) {
      window.__held = cb;
      return;
    }
    if (m.method === 'gmail.send') r = window.__sendFails ? {message: 'core.js -> send -> 500'} : {sent: true};
    if (m.method === 'gmail.send.cancel') {
      window.__held?.({cancelled: true});
      window.__held = null;
      r = {cancelled: true};
    }
    // what a service answers: markup that must not run in the reader
    // and markup that must not load before Show pictures, nor open a link over the panel
    const px = k => `${location.origin}/__pixel?k=services-svc-${k}`;
    if (m.method === 'services.body') r = {messages: [
      {name: 'Bo', email: 'bo@x.test', date: '2026-10-30T09:00:00Z', to: 'ev@yahoo.com', html: '<p>first</p>'},
      {name: 'Cy', email: 'cy@x.test', date: '2026-10-31T09:00:00Z', to: 'ev@yahoo.com',
        html: '<html><head><style>p{color:red}</style></head><body><p id="safe">second <a href="javascript:alert(1)">x</a><a href="/rel">rel</a></p><script>window.parent.__ran=1</script><img src="x.png" onerror="window.parent.__ran=1"><iframe src="https://evil.test"></iframe><form action="https://evil.test"><input></form>' +
          `<div style="width:9px;height:9px;background:URL(${px('css')})"></div><svg width="9" height="9"><image href="${px('svg')}" width="9" height="9"/></svg>` +
          `<video src="${px('video')}" poster="${px('poster')}" width="9" height="9"></video><img width="1" height="1" alt="" src="${px('track')}">` +
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
    // what the background would send the panel goes to __onMessage
    runtime: {sendMessage: respond, onMessage: {addListener(f) { window.__onMessage = f; }}, openOptionsPage() {}, getURL: p => location.origin + p},
    storage: {
      // the files of every line are known already (none), so the print views stay the reader's,
      // as the other scenarios count them; ?scenario=files reads them ahead
      // ?boot=1: a browser just started, the background has read no mail yet (__objs is what it will)
      session: (() => { const area = {...(q.get('boot') ? {} : {'cached-objects': objs}), 'resolved.links': [], ...(q.get('scenario') === 'files' ? {} : {'files.index': new Proxy({}, {get: (o, k) => typeof k === 'string' && k.includes('#') ? o[k] ?? [] : o[k], has: () => true})})}; return {get: store(area), set: o => { Object.assign(area, o); return Promise.resolve(); }, remove: k => { [k].flat().forEach(x => delete area[x]); return Promise.resolve(); }, getKeys: () => Promise.resolve(Object.keys(area)), area}; })(),
      local: {get: store(local), set: (o) => { window.__set.push(o); Object.assign(local, o); return Promise.resolve(); }},
      // a change to the storage, as Chrome would tell it: __storageChanged(changes, area)
      onChanged: {addListener: f => { window.__storageChanged = f; }}
    },
    sidePanel: {open: () => Promise.resolve()},
    // ?pinned=0: the toolbar button is not pinned; __pinChanged(settings) is Chrome saying it changed
    action: {getUserSettings: async () => ({isOnToolbar: window.__pinnedNow ?? q.get('pinned') !== '0'}), onUserSettingsChanged: {addListener: f => { window.__pinChanged = f; }}},
    windows: {getCurrent: () => Promise.resolve({id: 1}), create: o => { (window.__windowsCreated ||= []).push(o.url); }},
    // the active tab: its address is ?url= (none: a tab the panel may not read); a test changes
    // __tabUrl and calls __tabEvents.updated or .activated as Chrome would
    tabs: {
      query: () => Promise.resolve([{id: 7, index: 2, active: true, windowId: 1, ...(window.__tabUrl ? {url: window.__tabUrl} : {})}]),
      // __tabsOpened: each tab as it was asked for
      create: o => { (window.__tabsCreated ||= []).push(o.url); (window.__tabsOpened ||= []).push(o); },
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
      `<img width=24 height=16 src="${location.origin}/__pixel?k=${q.get('scenario')}-gmail">`, att)
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
  // ?s=privacy: each mail's own print view. The newsletter's pictures: one to see, two trackers
  // by their look (a pixel, a hidden one) and two by name (Mailchimp's behind Gmail's proxy,
  // SendGrid's), a blank spacer, a background, a styled picture and a style's tracker (Litmus)
  const k = name => `${location.origin}/__pixel?k=${q.get('scenario')}-${name}`;
  const print = (name, email, body, to = '') => `<html><body>${msg(name, email, 'Mon, Nov 2 at 09:00', to, body)}</body></html>`;
  const pages = privacy ? {
    t1: print('Shop', 'news@shop.example', '<p>Deals of the week</p>' +
      `<img width=40 height=20 alt="Deals" src="${k('pic')}"><img width=1 height=1 src="${k('tiny')}&uid=a1b2c3d4e5">` +
      `<img style="display:none" src="${k('hidden')}&r=zz9988">` +
      '<img width=1 height=1 src="https://ci3.googleusercontent.com/meips/ADKq_NZtest=s0-d-e1-ft#https://shop.us1.list-manage.com/track/open.php?u=1&id=2&e=3">' +
      `<img src="${location.origin}/wf/open?upn=abcdef123456"><img width=1 height=1 src="${location.origin}/spacer.gif">` +
      `<table background="${k('bg')}" width=40 height=20><tr><td>&nbsp;</td></tr></table>` +
      `<div style="width:20px;height:10px;background-image:url(${k('css')})">&nbsp;</div>` +
      '<div style="background:url(https://emltrk.com/v2/abc?d=x)">&nbsp;</div>'),
    w1: print('PayPal', 'service@paypal-billing.net', 'Confirm your details.'),
    w2: print('Support', 'help@arnazon.com', 'Your order has shipped.'),
    w3: print('Boss', 'boss@arbitron.app', 'Please handle this today.', '<div>Reply-To: Boss &lt;boss@arbltron.app&gt;</div>'),
    // Gmail in a language whose word for Reply-To the reader does not know
    w4: print('Boss', 'boss@arbitron.app', 'Please handle this tomorrow.', '<div>Yanıt adresi: Boss &lt;boss@arbltron.app&gt;</div>'),
    n1: print('GitHub', 'noreply@github.com', 'A new sign-in to your account.', '<div>Reply-To: noreply@github.com</div>')
  } : {};
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
    const body = pages[/[?&](?:msg|th)=([^&]+)/.exec(url)?.[1]] || (window.__printBig ? page.replace('— Аня', '— Аня' + 'ж'.repeat(window.__printBig)) : q.get('wide') ? wide : window.__printLong ? long : page);
    return Promise.resolve(new Response(body, {status: window.__printStatus || 200}));
  };
})();
