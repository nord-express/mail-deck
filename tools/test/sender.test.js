// The reader's warning about a sender (data/panel/sender.js): the forged senders it names,
// and a corpus of ordinary ones, the brands' own mail among them, that it must leave alone.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const url = require('url');
const assert = require('assert');

const FILE = path.join(__dirname, '../../extension/data/panel/sender.js');
const Sender = vm.runInNewContext(fs.readFileSync(FILE, 'utf8') + ';Sender', {URL});

let n = 0;
const check = (name, fn) => {
  fn();
  n += 1;
  console.log('ok', name);
};
// what the reader would say, as plain data
const said = (name, email, account = 'evgeny@arbitron.app') => JSON.parse(JSON.stringify(Sender.check({name, email, account})));

// Ordinary mail: people, newsletters, shops, banks, services that send for others, and the
// brands' own mail from the domains they really use
const ORDINARY = [
  ['Anna Petrova', 'anna@figma.com'], ['Ivan', 'ivan@gmail.com'], ['Мария', 'maria@yandex.ru'], ['Bob Smith', 'bob.smith@outlook.com'],
  ['Evgeny', 'evgeny@arbitron.app'], ['Kate', 'kate@arbitron.app'], ['Dr. Chase Miller', 'chase@clinic.example'], ['Chase', 'chase.lee@gmail.com'],
  ['Apple Kim', 'apple.kim@naver.com'], ['Meta Jansen', 'meta@ziggo.nl'], ['Amazonas Turismo', 'info@amazonas.com.br'],
  ['PayPal', 'service@paypal.com'], ['PayPal', 'service@intl.paypal.com'], ['PayPal', 'paypal@mail.paypal.de'], ['PayPal', 'paypal@emails.paypal.co.uk'],
  ['PayPal Security', 'security@paypal.com'], ['Venmo', 'venmo@venmo.com'], ['Anna via PayPal', 'service@paypal.com'],
  ['Apple', 'News@insideapple.apple.com'], ['Apple', 'no_reply@email.apple.com'], ['Apple ID', 'appleid@id.apple.com'], ['iCloud', 'noreply@email.apple.com'],
  ['iCloud', 'noreply@insideicloud.icloud.com'], ['Apple Store', 'order_acknowledgment@orders.apple.com'], ['Apple News', 'news@apple.news'],
  ['Apple Card', 'no-reply@applecard.apple'], ['App Store', 'no_reply@email.apple.com'], ['Apple Developer', 'developer@insideapple.apple.com'],
  ['Microsoft', 'microsoft@e-mail.microsoft.com'], ['Microsoft account team', 'account-security-noreply@accountprotection.microsoft.com'],
  ['Microsoft 365', 'msonlineservicesteam@microsoftonline.com'], ['Microsoft Teams', 'noreply@email.teams.microsoft.com'], ['Microsoft Store', 'msstore@microsoftstore.com'],
  ['Xbox', 'xbox@engage.xbox.com'], ['OneDrive', 'onedrive@onedrive.com'], ['Microsoft Rewards', 'microsoftrewards@email.microsoftrewards.com'],
  ['Outlook.com Team', 'member_services@outlook.com'], ['Microsoft Azure', 'azure-noreply@microsoft.com'], ['Bing', 'bing@microsoft.com'],
  ['Google', 'no-reply@accounts.google.com'], ['Google', 'googlecommunityteam-noreply@google.com'], ['Google Play', 'googleplay-noreply@google.com'],
  ['Google Payments', 'payments-noreply@google.com'], ['Google Workspace', 'workspace-noreply@google.com'], ['The Google Account Team', 'no-reply@accounts.google.com'],
  ['Gmail Team', 'mail-noreply@google.com'], ['YouTube', 'noreply@youtube.com'], ['Google Developer Groups', 'noreply@gdg.community.dev'],
  ['Google Cloud', 'CloudPlatform-noreply@google.com'], ['Anna (Google Docs)', 'comments-noreply@docs.google.com'], ['Google Calendar', 'calendar-notification@google.com'],
  ['Google Developers', 'googledevelopers-noreply@google.com'], ['Google Alerts', 'googlealerts-noreply@google.com'], ['Android', 'noreply@android.com'],
  ['Amazon', 'store-news@amazon.com'], ['Amazon.de', 'versandbestaetigung@amazon.de'], ['Amazon.co.uk', 'shipment-tracking@amazon.co.uk'],
  ['Amazon', 'auto-confirm@amazon.co.jp'], ['Amazon.com.br', 'pedidos@amazon.com.br'], ['Amazon Web Services', 'aws-marketing-email-replies@amazon.com'],
  ['AWS Notifications', 'no-reply@sns.amazonaws.com'], ['Amazon Business', 'no-reply@amazon.com'], ['Prime Video', 'primevideo@primevideo.com'],
  ['Amazon Prime', 'prime@amazon.fr'], ['Kindle', 'kindle-direct@amazon.com'], ['Amazon Jobs', 'no-reply@amazon.jobs'], ['Seller - Amazon Marketplace', 'x@marketplace.amazon.de'],
  ['Netflix', 'info@mailer.netflix.com'], ['Netflix TechBlog', 'noreply@medium.com'], ['Netflix', 'info@account.netflix.com'],
  ['Facebook', 'security@facebookmail.com'], ['Facebook', 'notification@facebookmail.com'], ['Instagram', 'security@mail.instagram.com'],
  ['WhatsApp', 'noreply@whatsapp.com'], ['Meta for Business', 'noreply@business.facebook.com'], ['Meta', 'notifications@meta.com'],
  ['LinkedIn', 'messages-noreply@linkedin.com'], ['LinkedIn Security', 'security-noreply@linkedin.com'], ['Anna via LinkedIn', 'messaging-digest-noreply@linkedin.com'],
  ['DHL', 'noreply@dhl.com'], ['DHL Paket', 'noreply.paket@dhl.de'], ['DHL Express', 'express@dhl.co.uk'], ['DHL Parcel', 'noreply@dhlparcel.nl'],
  ['Deutsche Post DHL', 'news@deutschepost.de'], ['FedEx', 'TrackingUpdates@fedex.com'], ['FedEx Delivery Manager', 'fdm@fedex.com'],
  ['UPS', 'mcinfo@ups.com'], ['UPS My Choice', 'mcinfo@ups.com'], ['The UPS Store', 'store1234@theupsstore.com'], ['USPS', 'USPSInformeddelivery@email.informeddelivery.usps.com'],
  ['DocuSign', 'dse@docusign.net'], ['Anna via Docusign', 'dse_na2@docusign.net'], ['DocuSign NA4 System', 'dse_NA4@docusign.net'],
  ['Dropbox', 'no-reply@dropbox.com'], ['Dropbox', 'no-reply@dropboxmail.com'], ['Dropbox Sign', 'noreply@mail.hellosign.com'],
  ['Coinbase', 'no-reply@info.coinbase.com'], ['Binance', 'do_not_reply@mgdirectmail.binance.com'], ['Kraken', 'noreply@kraken.com'],
  ['СберБанк', 'noreply@sberbank.ru'], ['Сбер', 'info@sber.ru'], ['СберМаркет', 'hello@sbermarket.ru'], ['Сбер Бизнес', 'sbbol@sberbank.ru'],
  ['Госуслуги', 'no-reply@gosuslugi.ru'], ['Тинькофф', 'noreply@tinkoff.ru'], ['Т-Банк', 'noreply@tbank.ru'], ['Тинькофф Банк', 'news@emails.tinkoff.ru'],
  ['Яндекс ID', 'noreply@id.yandex.ru'], ['Яндекс Маркет', 'hello@market.yandex.ru'], ['Команда Яндекс Почты', 'hello@yandex.ru'], ['VK', 'admin@notify.vk.com'],
  ['Ozon', 'news@sender.ozon.ru'], ['Wildberries', 'info@wildberries.ru'], ['Avito', 'noreply@avito.ru'], ['Почта России', 'info@pochta.ru'],
  ['GitHub', 'noreply@github.com'], ['GitHub', 'notifications@github.com'], ['GitLab', 'gitlab@mg.gitlab.com'], ['Stripe', 'billing@stripe.com'],
  ['Figma', 'no-reply@figma.com'], ['Slack', 'feedback@slack.com'], ['Notion Team', 'team@mail.notion.so'], ['Zoom', 'no-reply@zoom.us'],
  ['Calendly', 'notifications@calendly.com'], ['Typeform', 'notifications@typeform.io'], ['Mailchimp', 'no-reply@mailchimp.com'],
  ['Shopify', 'mailer@shopify.com'], ['My Store', 'store+123@t.shopifyemail.com'], ['eBay', 'ebay@ebay.com'], ['Etsy', 'transaction@etsy.com'],
  ['Booking.com', 'noreply@booking.com'], ['Airbnb', 'automated@airbnb.com'], ['Uber Receipts', 'noreply@uber.com'], ['Spotify', 'no-reply@spotify.com'],
  ['Steam', 'noreply@steampowered.com'], ['Twitch', 'no-reply@twitch.tv'], ['X', 'info@x.com'], ['Twitter', 'info@twitter.com'],
  ['Medium Daily Digest', 'noreply@medium.com'], ['Substack', 'no-reply@substack.com'], ['The Verge', 'newsletter@theverge.com'],
  ['Citrix Cloud', 'no-reply@cloud.com'], ['Email.com Team', 'service@email.com'], ['Mail.com', 'service@mail.com'], ['Yahoo', 'no-reply@cc.yahoo-inc.com'],
  ['Ymail user', 'someone@ymail.com'], ['Rocketmail', 'x@rocketmail.com'], ['Finance team', 'office@finance.ua'], ['Twister Ride', 'info@twister.example'],
  ['Bookings', 'hello@bookings.example'], ['Revolt TV', 'news@revolt.tv'], ['Apply Today', 'jobs@apply.example'], ['Appie', 'service@ah.nl'],
  ['Müller', 'service@mueller.de'], ['Müller', 'info@müller.de'], ['Почта', 'info@почта.рф'], ['Госуслуги', 'no-reply@госуслуги.рф'],
  ['例え', 'info@例え.jp'], ['München', 'info@xn--mnchen-3ya.de'], ['IT Support', 'helpdesk@arbitron.app'], ['Support', 'support@zendesk.com'],
  ['Security Team', 'security@cloudflare.com'], ['Customer Service', 'service@shop.example'], ['noreply', 'noreply@shop.example'],
  ['Google Forms', 'forms-receipts-noreply@google.com'], ['Microsoft Forms', 'no-reply@microsoft.com'], ['Office of the Dean', 'dean@university.edu'],
  ['Windows Central', 'newsletter@windowscentral.com'], ['The Outlook', 'editor@outlookindia.com'], ['Apple Valley Farm', 'hello@applevalley.example'],
  ['Amazon Smile Foundation', 'info@charity.example'], ['Google Developer Experts', 'gde@devrel.example'], ['UPS and Downs', 'band@music.example'],
  ['Apple Music', 'applemusic@email.apple.com'], ['Google Pay', 'googlepay-noreply@google.com'], ['Microsoft Outlook', 'no-reply@microsoft.com'],
  ['Facebook Ads', 'advertise-noreply@support.facebook.com'], ['WhatsApp Business', 'business@wa.example'], ['FedEx Tracking', 'TrackingUpdates@fedex.com'],
  ['PayPal Holdings Investor Relations', 'ir@q4inc.example'], ['Служба поддержки Сбербанка', 'help@sberbank.ru'], ['Сбер ID', 'id@sber.ru'],
  ['Netflix Shop', 'shop@netflix.shop'], ['Coinbase Wallet Fans', 'fans@club.example'], ['', 'no-name@shop.example'], ['Bob', ''], ['Bob', 'not-an-address']
];

check(`no warning for ${ORDINARY.length} ordinary senders`, () => {
  const wrong = ORDINARY.map(([name, email]) => [name, email, said(name, email)]).filter(([, , w]) => w);
  assert.deepStrictEqual(wrong, []);
});

check('a brand\'s name from another domain, or from a free mailbox, says so', () => {
  assert.deepStrictEqual(said('PayPal', 'service@paypal-billing.net'), {rule: 'brand', brand: 'PayPal', domain: 'paypal-billing.net'});
  assert.deepStrictEqual(said('PayPal Customer Service', 'support@mail.secure-pay.ru'), {rule: 'brand', brand: 'PayPal', domain: 'secure-pay.ru'});
  assert.deepStrictEqual(said('Apple Support', 'apple.support@icloud.com'), {rule: 'brand', brand: 'Apple', domain: 'icloud.com'});
  assert.deepStrictEqual(said('Google Security', 'google.alert@gmail.com'), {rule: 'brand', brand: 'Google', domain: 'gmail.com'});
  assert.deepStrictEqual(said('Microsoft account team', 'msaccount@outlook.com'), {rule: 'brand', brand: 'Microsoft', domain: 'outlook.com'});
  assert.deepStrictEqual(said('Netflix', 'billing@netflix-renew.com'), {rule: 'brand', brand: 'Netflix', domain: 'netflix-renew.com'});
  assert.deepStrictEqual(said('Amazon.com', 'orders@amazon-orders.net'), {rule: 'brand', brand: 'Amazon', domain: 'amazon-orders.net'});
  assert.deepStrictEqual(said('DHL Express', 'tracking@parcel-dhl.info'), {rule: 'brand', brand: 'DHL', domain: 'parcel-dhl.info'});
  assert.deepStrictEqual(said('СберБанк', 'info@sber-bank.online'), {rule: 'brand', brand: 'СберБанк', domain: 'sber-bank.online'});
  assert.deepStrictEqual(said('Служба безопасности Сбербанка', 'x@mail.ru'), {rule: 'brand', brand: 'СберБанк', domain: 'mail.ru'});
  assert.deepStrictEqual(said('Госуслуги', 'portal@gosuslugi-online.ru'), {rule: 'brand', brand: 'Госуслуги', domain: 'gosuslugi-online.ru'});
  // an address for a name, letters of another script, marks
  assert.deepStrictEqual(said('service@paypal.com', 'x@evil.example'), {rule: 'brand', brand: 'PayPal', domain: 'evil.example'});
  assert.deepStrictEqual(said('Pаypal', 'x@evil.example'), {rule: 'brand', brand: 'PayPal', domain: 'evil.example'});
  assert.deepStrictEqual(said('PayPaI Service', 'x@evil.example'), {rule: 'brand', brand: 'PayPal', domain: 'evil.example'});
  assert.deepStrictEqual(said('Аpple ID', 'x@evil.example'), {rule: 'brand', brand: 'Apple', domain: 'evil.example'});
  // a brand on a domain no one owns: an unusual ending
  assert.deepStrictEqual(said('Apple', 'id@apple.support'), {rule: 'brand', brand: 'Apple', domain: 'apple.support'});
});

check('a lookalike domain: another script, characters that read alike, a letter doubled, dropped or swapped, the real one in front', () => {
  const like = email => said('Support', email)?.like;
  assert.deepStrictEqual(['help@arnazon.com', 'help@paypa1.com', 'a@micr0soft.com', 'a@linkedln.com', 'a@gooogle.com', 'a@aple.com',
    'a@micosoft.com', 'a@gogole.com', 'a@netflixx.com', 'a@facebok.com', 'a@g1thub.com', 'a@yahooo.com', 'a@sberbnak.ru', 'a@tinkof.ru'].map(like),
  ['amazon.com', 'paypal.com', 'microsoft.com', 'linkedin.com', 'google.com', 'apple.com', 'microsoft.com', 'google.com', 'netflix.com',
    'facebook.com', 'github.com', 'yahoo.com', 'sberbank.ru', 'tinkoff.ru']);
  // in another script, as it comes on the wire and as it reads
  assert.deepStrictEqual(said('Support', 'x@xn--pypal-4ve.com'), {rule: 'lookalike', domain: 'xn--pypal-4ve.com', like: 'paypal.com'});
  assert.deepStrictEqual(said('Support', 'x@pаypal.com'), {rule: 'lookalike', domain: 'xn--pypal-4ve.com', like: 'paypal.com'});
  assert.deepStrictEqual(said('Support', 'x@xn--80ak6aa92e.com'), {rule: 'lookalike', domain: 'xn--80ak6aa92e.com', like: 'apple.com'});
  assert.deepStrictEqual(said('Support', 'x@pàypal.com'), {rule: 'lookalike', domain: url.domainToASCII('pàypal.com'), like: 'paypal.com'});
  // Latin mixed with another script, whatever it reads as
  assert.deepStrictEqual(said('Bob', 'b@pаypal-help.com'), {rule: 'lookalike', domain: 'xn--pypal-help-zqi.com', like: 'paypal-help.com'});
  // the real domain in front of another
  assert.deepStrictEqual(said('', 'a@paypal.com.account-help.net'), {rule: 'lookalike', domain: 'account-help.net', like: 'paypal.com'});
  assert.deepStrictEqual(said('', 'a@login.microsoftonline.com.verify.example'), {rule: 'lookalike', domain: 'verify.example', like: 'microsoftonline.com'});
  // the reader's own domain
  assert.deepStrictEqual(said('Kate', 'kate@arbltron.app'), {rule: 'lookalike', domain: 'arbltron.app', like: 'arbitron.app'});
  assert.deepStrictEqual(said('Kate', 'kate@arbitronn.app'), {rule: 'lookalike', domain: 'arbitronn.app', like: 'arbitron.app'});
  // but never a free mailbox's own domain, nor the reader's when it is a free mailbox
  assert.strictEqual(said('Kate', 'kate@gmaill.com', 'evgeny@gmail.com')?.like, 'gmail.com');
  assert.strictEqual(said('Kate', 'kate@gmx.com', 'evgeny@gmx.de'), null);
});

check('replies to a lookalike of the sender\'s or the reader\'s domain, or a brand\'s mail asking for replies elsewhere', () => {
  const reply = (name, email, replyTo, account = 'evgeny@arbitron.app') => JSON.parse(JSON.stringify(Sender.replyTo([{name, email, replyTo}], account)));
  assert.deepStrictEqual(reply('Boss', 'boss@arbitron.app', 'Boss <boss@arbltron.app>'.match(/<(.+)>/)[1]), {rule: 'replyTo', replyTo: 'boss@arbltron.app', domain: 'arbitron.app'});
  assert.deepStrictEqual(reply('Anna', 'anna@figma.com', 'anna@flgma.com'), {rule: 'replyTo', replyTo: 'anna@flgma.com', domain: 'figma.com'});
  assert.deepStrictEqual(reply('Shop', 'news@shop.example', 'refund@paypa1.com'), {rule: 'replyTo', replyTo: 'refund@paypa1.com', domain: 'shop.example'});
  assert.deepStrictEqual(reply('PayPal', 'service@paypal.com', 'refunds@gmail.com'), {rule: 'replyTo', replyTo: 'refunds@gmail.com', domain: 'paypal.com'});
  // ordinary: a form, a list, a notification relayed for a person, a support desk, the same domain
  for (const [name, email, to] of [['Anna', 'anna@typeform.com', 'anna@gmail.com'], ['Website', 'website@arbitron.app', 'visitor@gmail.com'],
    ['Anna (Google Docs)', 'comments-noreply@docs.google.com', 'anna@figma.com'], ['Google Calendar', 'calendar-notification@google.com', 'boss@arbitron.app'],
    ['Anna via DocuSign', 'dse@docusign.net', 'anna@figma.com'], ['GitHub', 'notifications@github.com', 'reply+abc@reply.github.com'],
    ['Shop', 'news@mail.shop.example', 'support@shop.example'], ['Shop', 'news@shop-mail.example', 'help@shop.example'],
    ['List', 'list@googlegroups.com', 'list@googlegroups.com'], ['Stripe', 'receipts@stripe.com', 'billing@merchant.example']]) {
    assert.strictEqual(Sender.replyTo([{name, email, replyTo: to}], 'evgeny@arbitron.app'), null, email + ' -> ' + to);
  }
  // the newest message not the reader's own; none at all, or none with a Reply-To
  assert.strictEqual(Sender.replyTo([{name: 'Boss', email: 'boss@arbitron.app', replyTo: 'boss@arbltron.app'}, {name: 'Evgeny', email: 'evgeny@arbitron.app', replyTo: ''}],
    'evgeny@arbitron.app').replyTo, 'boss@arbltron.app');
  assert.strictEqual(Sender.replyTo([], 'evgeny@arbitron.app'), null);
  assert.strictEqual(Sender.replyTo([{name: 'Anna', email: 'anna@figma.com', replyTo: ''}], 'evgeny@arbitron.app'), null);
});

check('a punycode name reads as it is written', () => {
  for (const d of ['xn--pypal-4ve', 'xn--80ak6aa92e', 'xn--mnchen-3ya', 'xn--e1afmkfd', 'xn--90adear', 'xn--d1acpjx3f', 'xn--wgv71a119e', 'xn--bcher-kva', 'xn--p1ai']) {
    assert.strictEqual(Sender.decode(d), url.domainToUnicode(d + '.com').replace(/\.com$/, ''), d);
  }
  assert.strictEqual(Sender.decode('example'), 'example');
  assert.strictEqual(Sender.decode('xn--'), '');
  assert.strictEqual(Sender.decode('xn--zzzz-$'), 'xn--zzzz-$');
});

check('the registrable domain, as the panel takes it', () => {
  assert.deepStrictEqual(['mail.paypal.co.uk', 'a.b.example.com', 'shop.com.br', 'xn--e1afmkfd.xn--p1ai', 'example'].map(Sender.domain),
    ['paypal.co.uk', 'example.com', 'shop.com.br', 'пример.рф', 'example']);
});

console.log(n + ' checks passed');
