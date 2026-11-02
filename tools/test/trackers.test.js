// The open trackers of data/panel/trackers.js, on sample mail: each picture below says what
// the reader must make of it (data-expect), and the test reads the markup as gmail.js does,
// attribute by attribute. The pictures meant to be seen are as many as the trackers: a wrong
// guess there would break a mail.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const FILE = path.join(__dirname, '../../extension/data/panel/trackers.js');
const Trackers = vm.runInNewContext(fs.readFileSync(FILE, 'utf8') + ';Trackers', {URL});

let n = 0;
const check = (name, fn) => {
  fn();
  n += 1;
  console.log('ok', name);
};

// a print view's base, which Gmail's relative addresses (an attachment shown in the mail) resolve against
const BASE = 'https://mail.google.com/mail/u/0/?ui=2&view=pt&search=all&msg=abc';
const proxy = url => 'https://ci3.googleusercontent.com/meips/ADKq_NbH0Xz7c2Q1vYwTkLm9=s0-d-e1-ft#' + url;
const old = url => 'https://ci5.googleusercontent.com/proxy/AVvXsEg3Kc9yQ1pLmZt8w=s0-d-e1-ft#' + url;
const SAMPLE = `
<style>@media (max-width: 480px) { .m_hero-mobile { display: block !important; max-height: none !important } }</style>
<!-- known by name: the services' own pixels, sized or not, behind Gmail's proxy or not -->
<img data-expect="tracker:Mailchimp" src="https://shop.us1.list-manage.com/track/open.php?u=8f3a&amp;id=2c1d&amp;e=91b7c0" height="1" width="1" alt="">
<img data-expect="tracker:Mailchimp" src="${proxy('https://shop.us1.list-manage.com/track/open.php?u=8f3a&id=2c1d&e=91b7c0')}" height="1" width="1">
<img data-expect="tracker:SendGrid" src="${old('https://u1234.ct.sendgrid.net/wf/open?upn=aBcD1234-efGH')}" alt="" width="1" height="1" border="0" style="height:1px !important;width:1px !important;border-width:0 !important">
<img data-expect="tracker:SendGrid" src="${proxy('https://url9810.shop.example/wf/open?upn=xyz123')}">
<img data-expect="tracker:HubSpot" src="${proxy('https://t.hubspotemail.net/e2t/to/VWxyz12/W1abc/0')}" width="1" height="1">
<img data-expect="tracker:HubSpot" src="https://t.sidekickopen06.com/e1t/o/5/f18dQhb0S7lC8dDMPbW2n0x6l2B9nMJW7t5XYg1qwrM7W">
<img data-expect="tracker:Mailgun" src="http://email.mg.shop.example/o/eJwNzEEOgyAQRuG7sE_GnUMAQ">
<img data-expect="tracker:Amazon SES" src="https://abcdef.r.us-east-1.awstrack.me/I0/0100018b6a1c/S6Ygh2=">
<img data-expect="tracker:Yesware" src="https://t.yesware.com/t/2f6a/8c1e/b0d4/x.gif">
<img data-expect="tracker:Mailtrack" src="https://mailtrack.io/trace/mail/7c1f2a9e.png?u=1234">
<img data-expect="tracker:Streak" src="https://mailfoogae.appspot.com/t?sender=abc&amp;type=zerocontent&amp;guid=6f1e">
<img data-expect="tracker:Salesforce" src="https://click.e.shop.example/open.aspx?ffcb10-fe8b1c7a">
<img data-expect="tracker:Klaviyo" src="https://trk.klaviyomail.com/o/aBc12/dEf34">
<img data-expect="tracker:GitHub" src="https://github.com/notifications/beacon/AABBCCDD1122.gif" height="1" width="1" alt="">
<img data-expect="tracker:LinkedIn" src="${proxy('https://www.linkedin.com/emimp/ip_ABCDEFGH12345')}" style="width:1px;height:1px">
<img data-expect="tracker:Customer.io" src="https://e.customeriomail.com/e/o/eyJlbWFpbF9pZCI6IkRVa3Ri">
<img data-expect="tracker:Substack" src="https://eotrx.substackcdn.com/open?token=eyJtIjoi">
<img data-expect="tracker:Postmark" src="https://ea.pstmrk.it/open?m=v3_1.abcDEF">
<img data-expect="tracker:Oracle" src="https://s1234.t.eloqua.com/e/FooterImages/FooterImage1?elq=abc&amp;siteid=1234">
<img data-expect="tracker:Marketo" src="https://go.shop.example/trk?t=1&amp;mid=NTM0LUlFTi0">
<img data-expect="tracker:Meta" src="https://www.facebook.com/email_open_log_pic.php?mid=5f1a">
<!-- by look: pictures nobody is meant to see that could tell the reader apart -->
<img data-expect="tracker:shop.example" src="https://track.shop.example/o?id=12345678" width="1" height="1">
<img data-expect="tracker:shop.example" src="${proxy('https://img.shop.example/x.gif?rid=99ab12')}" width="0" height="0">
<img data-expect="tracker:shop.co.uk" src="https://news.shop.co.uk/i/aB3dE5fG7hJ9kL1mN3pQ.gif" style="display:none">
<img data-expect="tracker:shop.example" src="https://shop.example/a.png?c=1" style="visibility: hidden">
<img data-expect="tracker:shop.example" src="https://shop.example/a.png?c=2" style="opacity:0">
<img data-expect="tracker:shop.example" src="https://shop.example/a.png?c=3" style="max-height:0;overflow:hidden" width="600">
<img data-expect="tracker:shop.example" src="https://shop.example/a.png?c=4" hidden>
<img data-expect="tracker:shop.example" src="https://shop.example/a.png?c=5" width="1">
<img data-expect="tracker:shop.example" src="https://shop.example/a.png?c=6" style="width:1px; height:1px">
<img data-expect="tracker:" src="https://ci3.googleusercontent.com/meips/ADKq_NbH0Xz7c2Q1vYwTkLm9=s0-d-e1-ft" width="1" height="1">
<!-- by look and address: no size given, and an address that names an open or a recipient -->
<img data-expect="tracker:shop.example" src="https://news.shop.example/pixel.gif?uid=abcdef123">
<img data-expect="tracker:shop.example" src="https://news.shop.example/e/open?m=12">
<img data-expect="tracker:shop.example" src="https://img.shop.example/banner?email=ann%40mail.example">
<img data-expect="tracker:shop.example" src="https://img.shop.example/b?subscriber_id=12345678">
<!-- a blank spacer that tells no one anything: never loads, never named -->
<img data-expect="quiet" src="https://cdn.shop.example/images/spacer.gif" width="1" height="1">
<img data-expect="quiet" src="https://cdn.shop.example/hero.jpg" style="display:none" width="300">
<!-- pictures meant to be seen, whatever their address -->
<img data-expect="picture" src="https://cdn.shop.example/img/hero.jpg" width="600" height="300" alt="Autumn sale">
<img data-expect="picture" src="${proxy('https://cdn.shop.example/img/hero.jpg')}" width="600">
<img data-expect="picture" src="https://images.ctfassets.net/abc/def/photo.jpg?w=600&amp;fm=webp">
<img data-expect="picture" src="https://cdn.shop.example/spacer.gif" width="600" height="1">
<img data-expect="picture" src="https://cdn.shop.example/banner.png?uid=abcdef123456" width="600" height="200">
<img data-expect="picture" src="https://cdn.shop.example/track/cover.jpg?id=abcdefghijklmnopqrst">
<img data-expect="picture" src="https://mcusercontent.com/8f3a/images/2c1d-photo.png">
<img data-expect="picture" src="https://gallery.mailchimp.com/8f3a/images/logo.png" width="200">
<img data-expect="picture" src="https://f.hubspotusercontent40.net/hubfs/123/logo.png" width="120">
<img data-expect="picture" src="https://marketing-image-production.s3.amazonaws.com/uploads/abc.png">
<img data-expect="picture" src="https://ibhk.mjt.lu/img/ibhk/b/abc/0.png" width="600">
<img data-expect="picture" src="https://d3k81ch9hvuctc.cloudfront.net/company/abc/images/def.png">
<img data-expect="picture" src="https://substackcdn.com/image/fetch/w_1100,c_limit/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fa.png">
<img data-expect="picture" src="https://i1.createsend1.com/ei/r/AB/12C/D34/csimport/hero.jpg" width="600">
<img data-expect="picture" class="m_hero-mobile" src="https://cdn.shop.example/hero-mobile.jpg" style="display:none;max-height:0;overflow:hidden">
<img data-expect="picture" src="https://avatars.githubusercontent.com/u/12345?s=60&amp;v=4" width="20" height="20">
<img data-expect="picture" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="1" height="1">
<img data-expect="picture" src="cid:image001.png@01DA0000.12345678" width="1" height="1">
<!-- Gmail's own: an attachment shown in the mail, an icon -->
<img data-expect="picture" src="?ui=2&amp;ik=abc&amp;attid=0.1&amp;permmsgid=msg-f:1&amp;th=abc&amp;view=fimg&amp;disp=thd" width="1" height="1">
<img data-expect="picture" src="https://ssl.gstatic.com/ui/v1/icons/mail/images/cleardot.gif" width="1" height="1">
`;

// the markup's pictures, as gmail.js hands them over: {src (absolute), width, height, style, hidden, styled}
const decode = text => text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const sheets = [...SAMPLE.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
const styled = Trackers.styledBy(sheets);
const images = [...SAMPLE.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<img\b([^>]*)>/g)].map(m => {
  const attrs = {};
  for (const a of m[1].matchAll(/([\w:-]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g)) {
    attrs[a[1].toLowerCase()] = a[2] === undefined ? '' : decode(a[2].replace(/^["']|["']$/g, ''));
  }
  let src = attrs.src;
  try {
    src = new URL(attrs.src, BASE).href;
  }
  catch (e) {}
  return {expect: attrs['data-expect'], img: {src, width: attrs.width, height: attrs.height, style: attrs.style, hidden: 'hidden' in attrs,
    styled: styled(attrs.class)}};
});
const said = v => v.kind === 'tracker' ? 'tracker:' + v.name : v.kind;

check(`each of the ${images.length} sample pictures is what it should be`, () => {
  const wrong = images.filter(x => said(Trackers.image(x.img)) !== x.expect)
    .map(x => `${x.img.src.slice(0, 90)}: ${said(Trackers.image(x.img))}, not ${x.expect}`);
  assert.deepStrictEqual(wrong, []);
});
check('the sample holds as many pictures to see as trackers', () => {
  const count = kind => images.filter(x => x.expect.startsWith(kind)).length;
  assert.ok(count('picture') >= 18 && count('tracker') >= 30, `${count('picture')} pictures, ${count('tracker')} trackers`);
});
check('the address behind Gmail\'s proxy, in both of its forms, encoded or not; none when it does not say', () => {
  assert.strictEqual(Trackers.original(proxy('https://a.example/x.gif?u=1')), 'https://a.example/x.gif?u=1');
  assert.strictEqual(Trackers.original(old('https://a.example/x.gif')), 'https://a.example/x.gif');
  assert.strictEqual(Trackers.original(proxy(encodeURIComponent('https://a.example/x.gif?u=1'))), 'https://a.example/x.gif?u=1');
  assert.strictEqual(Trackers.original('https://ci3.googleusercontent.com/meips/ADKq_Nb=s0-d-e1-ft'), '');
  assert.strictEqual(Trackers.original('https://a.example/x.gif'), 'https://a.example/x.gif');
});
check('a style\'s pictures: a known pixel is named, any other is not', () => {
  assert.strictEqual(Trackers.css('https://abc.emltrk.com/v2/abc?d=1'), 'Litmus');
  assert.strictEqual(Trackers.css(proxy('https://abc.emltrk.com/v2/abc?p=1')), 'Litmus');
  assert.strictEqual(Trackers.css('https://cdn.shop.example/bg.png?x=1'), '');
});
check('only the sender\'s pictures wait for Show pictures: Gmail\'s own and inline ones do not', () => {
  assert.strictEqual(Trackers.foreign(proxy('https://cdn.shop.example/a.png')), true);
  assert.strictEqual(Trackers.foreign('https://cdn.shop.example/a.png'), true);
  assert.strictEqual(Trackers.foreign('https://mail.google.com/mail/u/0/?view=fimg&attid=0.1'), false);
  assert.strictEqual(Trackers.foreign('https://ssl.gstatic.com/attach.png'), false);
  assert.strictEqual(Trackers.foreign('data:image/png;base64,AAAA'), false);
  assert.strictEqual(Trackers.foreign('cid:image001.png'), false);
});
check('a class the mail\'s styles name is one of theirs, not a class that starts alike', () => {
  const by = Trackers.styledBy('.hero-mobile{display:block} .x\\:y{}');
  assert.deepStrictEqual(['hero-mobile', 'hero', 'other hero-mobile', '', undefined].map(by), [true, false, true, false, false]);
  assert.strictEqual(Trackers.styledBy('')('hero'), false);
});
check('a tracker of no known vendor is named by the domain it reports to', () => {
  assert.deepStrictEqual(['https://t.news.shop.co.uk/a', 'https://a.b.example/x', 'http://127.0.0.1:8080/x', 'https://shop.com.br/x']
    .map(Trackers.site), ['shop.co.uk', 'b.example', '127.0.0.1', 'shop.com.br']);
});
check('every pattern of the list names a vendor and parses', () => {
  const text = fs.readFileSync(FILE, 'utf8');
  const list = vm.runInNewContext(/const LIST = (\[[\s\S]*?\n {2}\]);/.exec(text)[1]);
  const vendors = list.map(([name]) => name);
  assert.ok(vendors.length >= 90, vendors.length + ' vendors');
  assert.strictEqual(new Set(vendors).size, vendors.length, 'each vendor once');
  const patterns = list.flatMap(([, ...p]) => p);
  assert.ok(list.every(([name, ...p]) => typeof name === 'string' && p.length > 0));
  // a host pattern without a dot would name a whole top-level domain; a path one starts with /
  const hosts = patterns.filter(p => typeof p === 'string' && !p.startsWith('/'));
  assert.deepStrictEqual(Array.from(hosts.filter(p => !p.split('/')[0].includes('.') || /[A-Z]/.test(p.split('/')[0]))), []);
  assert.ok(patterns.every(p => typeof p === 'string' || Object.prototype.toString.call(p) === '[object RegExp]'));
  // a pattern for a path alone must not be so short that it names ordinary pictures
  assert.deepStrictEqual(Array.from(patterns.filter(p => typeof p === 'string' && p.startsWith('/') && p.length < 6)), []);
});

console.log(n + ' checks passed');
