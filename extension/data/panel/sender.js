'use strict';
// Who a mail says it is from, against where it comes from: the reader's calm warning line
// (data/panel/index.js, read) for a few clear signs of a forged sender, from the sender's name
// and the addresses alone, never from a guess about the text. Ordinary mail shows nothing:
// tools/test/sender.test.js holds every rule to a corpus of ordinary senders. The reader shows
// Gmail's print view, which holds a table for each message (its sender, its recipients, its
// body: gmail.js, getMessages) and none of the warnings Gmail's own page draws over a message
// ("Be careful with this message", a sender it could not verify), so this says them instead.
//
// The rules, the first that holds:
// 1. brand: the sender's name is a well-known brand, alone or with words such as Support,
//    Security or Team ("PayPal", "Apple ID", "service@paypal.com"), and the address is not
//    one of that brand's domains. A free mailbox (gmail.com, icloud.com...) never speaks for
//    a brand, though the brand's own systems may send from a part of it (insideicloud.icloud.com).
//    A name that only mentions a brand ("Netflix Tech Blog", "Anna via DocuSign") claims nothing.
// 2. lookalike: the sender's domain imitates a well-known one or the reader's own:
//    - letters of another script or with marks among Latin ones, or a domain in another script
//      that reads as a known one (pаypal.com with a Cyrillic а, xn--pypal-4ve.com);
//    - characters that read alike: rn for m, vv for w, 1 or I for l, 0 for o (paypa1.com, arnazon.com);
//    - a letter doubled or a double one made single (gooogle.com, aple.com);
//    - for a name of six letters or more, a letter dropped, added or two swapped (micosoft.com,
//      gogole.com), but no other letter in place of one: that makes ordinary words
//      (finance, email, twister) and they are left alone; nor an s at the end;
//    - the known domain put in front of another (paypal.com.account-help.net).
//    The known domains themselves, the brands' and the free mailboxes', are never lookalikes.
// 3. reply-to: replies go to another domain than the sender's, and that domain imitates the
//    sender's, the reader's or a known one; or a brand's own mail (rule 1 holds for it) asks
//    for replies outside the brand. Gmail's print view names Reply-To in Gmail's language:
//    gmail.js reads the line in the languages it knows.
const Sender = (() => {
  // a name's words: no marks, small letters, digits and letters only
  const words = text => String(text || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  // what a name may add to a brand and still be the brand: a team, a service, a company's form
  const GENERIC = new Set(words(`
    the team support service services customer customers care help helpdesk desk center centre account accounts my id
    security secure safety billing payment payments notification notifications notice notices alert alerts info
    information official online noreply no reply do not donotreply inc llc ltd limited gmbh corp corporation co company
    verification verify update updates mail email mailer message messages department dept admin administrator
    administration system systems store login sign in
    com net org de uk fr it es ca jp nl pl ru au br mx us eu at ch be se
    kundenservice kundendienst kundensupport sicherheit konto hilfe benachrichtigung der die das und
    client clients clientèle sécurité compte assistance équipe du la le des
    servicio cliente clientes seguridad cuenta soporte atención equipo ayuda al el del
    servizio clienti sicurezza assistenza supporto di
    serviço segurança conta suporte atendimento
    служба поддержки поддержка безопасность безопасности аккаунт аккаунта клиентов клиентская команда уведомление
    уведомления сервис центр онлайн`));
  // Characters that read as others: another script's letters (Cyrillic, Greek, Armenian),
  // Latin ones that look plain, digits, and the pairs that pass for one letter. In a domain an i
  // passes for an l too (linkedln); a name keeps its i, or Appie would read as Apple.
  const LIKE = {
    'а': 'a', 'в': 'b', 'е': 'e', 'ё': 'e', 'к': 'k', 'м': 'm', 'н': 'h', 'о': 'o', 'р': 'p', 'с': 'c', 'т': 't', 'у': 'y',
    'х': 'x', 'ѕ': 's', 'і': 'i', 'ї': 'i', 'ј': 'j', 'ԁ': 'd', 'ԛ': 'q', 'ԝ': 'w', 'һ': 'h', 'ӏ': 'l', 'ɡ': 'g', 'ı': 'i',
    'ł': 'l', 'ɑ': 'a', 'ɩ': 'i', 'ȷ': 'j', 'α': 'a', 'β': 'b', 'ε': 'e', 'ι': 'i', 'κ': 'k', 'ν': 'v', 'ο': 'o', 'ρ': 'p',
    'τ': 't', 'υ': 'u', 'χ': 'x', 'ү': 'y', 'ո': 'n', 'ս': 'u', 'օ': 'o', 'հ': 'h', 'ց': 'g', 'զ': 'q',
    '0': 'o', '1': 'l', '|': 'l'
  };
  const skeleton = (text, domain = true) => {
    const plain = [...String(text).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()].map(c => LIKE[c] || c).join('');
    return (domain ? plain.replace(/i/g, 'l') : plain).replace(/rn/g, 'm').replace(/vv/g, 'w');
  };

  // Punycode (RFC 3492): an xn-- label as it reads
  const decode = label => {
    if (!/^xn--/i.test(label)) {
      return label;
    }
    const input = label.slice(4).toLowerCase();
    const out = [];
    const end = input.lastIndexOf('-');
    for (let j = 0; j < end; j += 1) {
      out.push(input.charCodeAt(j));
    }
    const digit = c => c >= 48 && c <= 57 ? c - 22 : c >= 97 && c <= 122 ? c - 97 : 36;
    const adapt = (delta, points, first) => {
      delta = first ? Math.floor(delta / 700) : delta >> 1;
      delta += Math.floor(delta / points);
      let k = 0;
      for (; delta > 455; k += 36) {
        delta = Math.floor(delta / 35);
      }
      return Math.floor(k + 36 * delta / (delta + 38));
    };
    let n = 128;
    let i = 0;
    let bias = 72;
    for (let at = end > 0 ? end + 1 : 0; at < input.length;) {
      const old = i;
      for (let w = 1, k = 36; ; k += 36) {
        const d = at < input.length ? digit(input.charCodeAt(at++)) : 36;
        if (d >= 36) {
          return label;
        }
        i += d * w;
        const t = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;
        if (d < t) {
          break;
        }
        w *= 36 - t;
      }
      bias = adapt(i - old, out.length + 1, old === 0);
      n += Math.floor(i / (out.length + 1));
      i %= out.length + 1;
      if (n > 0x10ffff) {
        return label;
      }
      out.splice(i, 0, n);
      i += 1;
    }
    return String.fromCodePoint(...out);
  };
  const unicode = host => String(host || '').toLowerCase().replace(/\.$/, '').split('.').map(decode).join('.');

  // the registrable part of a host, as the panel takes it (index.js, registrable)
  const SUFFIX2 = new Set(['co', 'com', 'net', 'org', 'gov', 'edu', 'ac', 'or', 'ne', 'go', 'gob', 'ltd', 'plc', 'nic', 'mil', 'sch', 'gen', 'nom', 'biz']);
  const domain = host => {
    const p = unicode(host).split('.');
    return p.slice(p.length > 2 && p.at(-1).length === 2 && SUFFIX2.has(p.at(-2)) ? -3 : -2).join('.');
  };
  const hostOf = email => String(email || '').trim().toLowerCase().split('@')[1]?.replace(/[>\s].*$/, '') || '';
  const ascii = text => /^[\x00-\x7f]*$/.test(text);
  // a host as it goes on the wire (xn-- for another script), so the warning shows the trick
  const wire = host => {
    try {
      return new URL('http://' + host).hostname;
    }
    catch (e) {
      return String(host || '').toLowerCase();
    }
  };
  // the registrable domain, spelled so
  const shown = host => wire(host).split('.').slice(-domain(host).split('.').length).join('.');

  // Free mailboxes: anyone has an address there, so the domain speaks for no brand
  const FREE = new Set(`gmail.com googlemail.com outlook.com hotmail.com live.com msn.com yahoo.com ymail.com rocketmail.com
    aol.com icloud.com me.com mac.com proton.me protonmail.com pm.me gmx.com gmx.de gmx.net web.de mail.com email.com
    yandex.ru yandex.com ya.ru mail.ru bk.ru inbox.ru list.ru rambler.ru zoho.com fastmail.com tutanota.com tuta.io hey.com
    qq.com 163.com 126.com naver.com seznam.cz libero.it orange.fr t-online.de wp.pl o2.pl interia.pl ukr.net abv.bg`.split(/\s+/));
  // The brands a name may claim, and where their mail comes from: one of their names with a
  // common ending (.com, .net, .org, a country's own, co.uk), or a domain of their own.
  // Small and careful: a brand whose name is a common word or a first name is not here.
  const BRANDS = [
    {brand: 'PayPal', names: ['paypal'], labels: ['paypal'],
      domains: ['paypal-communication.com', 'paypal-prepaid.com', 'paypal-community.com', 'xoom.com', 'venmo.com', 'braintreepayments.com']},
    {brand: 'Apple', names: ['apple', 'icloud', 'itunes', 'apple pay', 'apple music', 'apple tv', 'apple one', 'apple card'],
      labels: ['apple', 'icloud', 'itunes'], domains: ['apple.news', 'applecard.apple', 'me.com', 'mac.com']},
    {brand: 'Microsoft', names: ['microsoft', 'microsoft 365', 'office 365', 'microsoft office', 'onedrive', 'microsoft teams', 'microsoft outlook',
      'xbox', 'microsoft azure', 'microsoft rewards'],
    labels: ['microsoft', 'office', 'office365', 'microsoftonline', 'microsoft365', 'xbox', 'onedrive', 'sharepointonline', 'microsoftstore',
      'microsoftrewards', 'azure', 'outlook', 'hotmail', 'live', 'msn', 'bing', 'skype'], domains: []},
    {brand: 'Google', names: ['google', 'google play', 'google pay', 'google wallet', 'google drive', 'google one', 'google workspace', 'google photos',
      'gmail', 'youtube', 'google ads', 'google payments'],
    labels: ['google', 'youtube', 'gmail', 'googlemail', 'android', 'withgoogle'], domains: []},
    {brand: 'Amazon', names: ['amazon', 'amazon prime', 'prime video', 'amazon pay', 'amazon web services', 'aws', 'amazon music', 'kindle'],
      labels: ['amazon', 'primevideo', 'amazonaws', 'aws', 'amazonpay'], domains: ['amazon.jobs']},
    {brand: 'Netflix', names: ['netflix'], labels: ['netflix'], domains: []},
    {brand: 'Meta', names: ['facebook', 'meta', 'instagram', 'whatsapp', 'facebook ads', 'meta for business'],
      labels: ['facebook', 'facebookmail', 'fb', 'meta', 'metamail', 'instagram', 'whatsapp', 'messenger'], domains: []},
    {brand: 'LinkedIn', names: ['linkedin'], labels: ['linkedin'], domains: []},
    {brand: 'DHL', names: ['dhl', 'dhl express', 'dhl paket', 'dhl parcel', 'dhl ecommerce'], labels: ['dhl', 'dhlparcel', 'dpdhl', 'deutschepost'], domains: []},
    {brand: 'FedEx', names: ['fedex', 'fedex delivery manager', 'fedex tracking'], labels: ['fedex'], domains: []},
    {brand: 'UPS', names: ['ups', 'ups my choice', 'ups quantum view'], labels: ['ups', 'theupsstore'], domains: []},
    {brand: 'DocuSign', names: ['docusign', 'docusign esignature'], labels: ['docusign'], domains: []},
    {brand: 'Dropbox', names: ['dropbox', 'dropbox sign'], labels: ['dropbox', 'dropboxmail', 'hellosign'], domains: []},
    {brand: 'Coinbase', names: ['coinbase'], labels: ['coinbase'], domains: []},
    {brand: 'Binance', names: ['binance'], labels: ['binance'], domains: []},
    {brand: 'СберБанк', names: ['сбербанк', 'сбербанка', 'сбер', 'сбера', 'sberbank', 'sber', 'сбербанк россии'], labels: ['sberbank', 'sber'], domains: []},
    {brand: 'Госуслуги', names: ['госуслуги', 'gosuslugi'], labels: ['gosuslugi'], domains: ['госуслуги.рф']},
    {brand: 'Т-Банк', names: ['тинькофф', 'tinkoff', 'т банк', 'tbank', 't bank', 'тинькофф банк', 'tinkoff bank'], labels: ['tinkoff', 'tbank'], domains: []}
  ].map(b => ({...b, names: new Set(b.names.map(n => skeleton(words(n).join(' '), false)))}));
  // .com, .net, .org, a country's own (.de), or a country's second level (co.uk, com.br)
  const COMMON = /^(com|net|org|[a-z]{2}|(co|com|net|org|or|ne|ac)\.[a-z]{2})$/;
  // the brand a name claims, or null: a capital I after a small letter may stand for an l (PayPaI)
  const claim = name => {
    for (const text of [name, String(name || '').replace(/(?<=\p{Ll})I/gu, 'l')]) {
      const core = skeleton(words(text).filter(w => !GENERIC.has(w)).join(' '), false);
      const b = core && BRANDS.find(x => x.names.has(core));
      if (b) {
        return b;
      }
    }
    return null;
  };
  // whether mail from this host is the brand's own
  const ofBrand = (b, host) => {
    const reg = domain(host);
    if (FREE.has(reg) && unicode(host) === reg) {
      return false;
    }
    const [label, ...rest] = reg.split('.');
    return (b.labels.includes(label) && COMMON.test(rest.join('.'))) || b.domains.includes(reg);
  };
  // the known domains a lookalike imitates
  const TOPS = `paypal.com google.com gmail.com amazon.com apple.com icloud.com microsoft.com microsoftonline.com outlook.com hotmail.com
    netflix.com facebook.com instagram.com whatsapp.com linkedin.com yahoo.com dropbox.com docusign.com docusign.net coinbase.com
    binance.com github.com twitter.com adobe.com booking.com shopify.com steampowered.com steamcommunity.com wellsfargo.com
    bankofamerica.com americanexpress.com yandex.ru sberbank.ru tinkoff.ru gosuslugi.ru wildberries.ru avito.ru`.split(/\s+/);
  // what a name of a domain may be next to a known one and still be its own
  const NEAR = new Set(['cloud', 'email', 'mail']);
  const KNOWN = new Set([...FREE, ...TOPS]);
  const known = (reg, host) => KNOWN.has(reg) || BRANDS.some(b => ofBrand(b, host));
  // one letter dropped, added or two swapped: never another letter in its place, nor an s at the end
  const oneOff = (a, b) => {
    if (a === b || Math.abs(a.length - b.length) > 1) {
      return false;
    }
    if (a.length === b.length) {
      const i = [...a].findIndex((c, k) => c !== b[k]);
      return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
    }
    const [long, short] = a.length > b.length ? [a, b] : [b, a];
    const i = [...short].findIndex((c, k) => c !== long[k]);
    const at = i === -1 ? short.length : i;
    return !(at === short.length && long.at(-1) === 's') && long.slice(at + 1) === short.slice(at);
  };
  // a letter doubled, or a double one made single
  const doubled = (a, b) => {
    const [long, short] = a.length > b.length ? [a, b] : [b, a];
    if (long.length !== short.length + 1) {
      return false;
    }
    for (let i = 0; i < long.length; i += 1) {
      if (long.slice(0, i) + long.slice(i + 1) === short) {
        return long[i] === long[i - 1] || long[i] === long[i + 1];
      }
    }
    return false;
  };
  const MIXED = /\p{Script=Latin}/u;
  const OTHER = /[\p{Script=Cyrillic}\p{Script=Greek}\p{Script=Armenian}]/u;
  // The known domain a host imitates, or '': tops are the reader's or the sender's own,
  // imitated as well as the known ones
  const lookalike = (host, tops = []) => {
    const full = unicode(host);
    const reg = domain(host);
    if (!reg.includes('.') || known(reg, host)) {
      return '';
    }
    // paypal.com.account-help.net
    const before = full.slice(0, -reg.length - 1);
    const front = TOPS.find(top => before === top || before.endsWith('.' + top));
    if (front) {
      return front;
    }
    const [label, ...rest] = reg.split('.');
    const others = [...new Set([...tops.filter(Boolean).map(t => domain(t)).filter(t => t !== reg), ...TOPS])];
    for (const top of others) {
      const name = top.split('.')[0];
      if (name === label || NEAR.has(label)) {
        continue;
      }
      // a name in another script, or with marks, that reads as a known one
      const reads = skeleton(label) === skeleton(name);
      if (reads || (name.length >= 6 && oneOff(label, name)) || (name.length >= 5 && doubled(label, name))) {
        return top;
      }
    }
    // Latin letters mixed with another script's in one name
    if (!ascii(label) && MIXED.test(label) && OTHER.test(label)) {
      return skeleton(label) + '.' + rest.join('.');
    }
    return '';
  };

  // The reader's line for a sender: null, or {rule: 'brand', brand, domain} | {rule:
  // 'lookalike', domain, like}. account: the reader's own address, whose domain is imitated too.
  const check = ({name, email, account}) => {
    const host = hostOf(email);
    if (!host || !host.includes('.')) {
      return null;
    }
    const b = claim(name);
    if (b) {
      return ofBrand(b, host) ? null : {rule: 'brand', brand: b.brand, domain: shown(host)};
    }
    const own = hostOf(account);
    const like = lookalike(host, own && !FREE.has(domain(own)) ? [own] : []);
    return like ? {rule: 'lookalike', domain: shown(host), like} : null;
  };
  // Where the newest message's replies go, against its sender: null, or {rule: 'replyTo',
  // replyTo, domain}. senders: [{name, email, replyTo}], oldest first; the reader's own are passed over.
  const replyTo = (senders, account) => {
    const own = String(account || '').toLowerCase();
    const m = [...senders || []].reverse().find(s => s.email && s.email.toLowerCase() !== own);
    const to = hostOf(m?.replyTo);
    const from = hostOf(m?.email);
    if (!to || !from || domain(to) === domain(from)) {
      return null;
    }
    const b = claim(m.name);
    const ownHost = hostOf(own);
    const like = lookalike(to, [from, ownHost && !FREE.has(domain(ownHost)) ? ownHost : '']);
    return like || (b && ofBrand(b, from) && !ofBrand(b, to)) ?
      {rule: 'replyTo', replyTo: m.replyTo.trim().toLowerCase().split('@')[0] + '@' + wire(to), domain: shown(from)} : null;
  };

  return {check, replyTo, lookalike, claim, domain, decode};
})();
