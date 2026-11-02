'use strict';
// Open trackers: pictures in a mail that tell its sender it was opened, when, and often by whom.
// The reader (gmail.js) asks this file about every picture of a mail before anything of it
// loads; a tracker never loads, the rest loads as the reader shows it. Gmail fetches the
// pictures of its mail through its own proxy, which hides the reader's address but not the
// moment: the tracker still learns that the mail was opened. So Mail Deck knows them:
// - by name: the list below, a pixel's address at the services that send most mail;
// - by look: a picture nobody is meant to see (hidden, or a pixel or two wide) that carries
//   something that could tell the reader apart, or one of no size whose address names an
//   open or a recipient.
// A picture meant to be seen is never judged by its look, only by the list: a wrong guess there
// would break the mail. A hidden picture the mail's own styles may show (a phone layout)
// is judged by its address alone.
//
// Each pattern of the list names the address of a pixel only: the same services' logos and
// photos load. A pattern is
// - 'host/path': the host or one of its subdomains, with a path that starts so;
// - 'host': a host that serves trackers only;
// - '/path': a path that starts so on any host, for a pixel served from the sender's own domain;
// - a RegExp, tested against host + path + query.
// The services' own documentation of their open tracking, checked against MailTrackerBlocker's
// list (Copyright (c) 2020, Aaron Lee; BSD 3-Clause License, below), itself drawn from HEY's.
// A pattern added here names a pixel that was seen in real mail, never a whole service.
//
// MailTrackerBlocker, BSD 3-Clause License: Copyright (c) 2020, Aaron Lee. All rights reserved.
// Redistribution and use in source and binary forms, with or without modification, are permitted
// provided that the following conditions are met: * Redistributions of source code must retain
// the above copyright notice, this list of conditions and the following disclaimer.
// * Redistributions in binary form must reproduce the above copyright notice, this list of
// conditions and the following disclaimer in the documentation and/or other materials provided
// with the distribution. * Neither the name MailTrackerBlocker nor the names of its contributors
// may be used to endorse or promote products derived from this software without specific prior
// written permission. THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
// COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
// EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
// GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
// OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
const Trackers = (() => {
  const LIST = [
    // the services that send newsletters, receipts and other mail in bulk
    ['Mailchimp', 'list-manage.com/track/open.php', 'mandrillapp.com/track/open.php', /^us\d+\.mailchimp\.com\/mctx\/opens/, '/track/open.php?u='],
    ['SendGrid', 'sendgrid.net/wf/open', 'sendgrid.net/trk', 'sendgrid.net/mpss/o', 'sendgrid.net/ss/o', '/wf/open?upn=',
      /^[^/]+\/ss\/o\/[\w.-]+\/[a-z0-9]{3}\/[\w.-]+\/ho\.gif/],
    ['Mailgun', /^[^/]+\/o\/eJ[\w-]{10}/],
    ['Amazon SES', 'awstrack.me/I0/'],
    ['Postmark', 'pstmrk.it'],
    ['SparkPost', 'sparkpostmail2.com', /^[^/]+\/q\/[^?]+~~\//],
    ['Mailjet', /^[^/]+\/oo\/[a-z0-9]+\/[a-z0-9]{8}\/e\.gif/i],
    ['Brevo', 'sendibtd.com', 'sendibw.com/track/', '/tr/op/'],
    ['Constant Contact', 'rs6.net/on.jsp'],
    ['Campaign Monitor', /^([\w-]+\.)*cmail\d{1,2}\.com\/t\//],
    ['Klaviyo', 'trk.klaviyomail.com', /^ctrk\.klclick\d?\.com\/o\//],
    ['HubSpot', /^t\.(hubspotemail|hubspotfree|signaux|senal|signale|sidekickopen|sigopn|hsmsdd)[\w-]*\.[a-z.]+\//, /^t\.strk\d{2}\.email\//,
      'track.getsidekick.com', /^([\w-]+\.)*hubspotlinks\.com\/[bc]to\//, '/e1t/o/', '/e2t/o/', '/e2t/to/', '/e2t/c/', /^[^/]+\/e3t\/[bc]to\//],
    ['Marketo', '/trk?t=1&mid='],
    ['Adobe', /^[^/]+\/r\/\?id=\w+,\w+,1/i, '/ee/v1/open', 'postoffice.adobe.com/po-server/link/open', 'demdex.net', '112.2o7.net'],
    ['Salesforce', '/open.aspx?', 'pixel.inbox.exacttarget.com/pixel.gif', 'nova.collect.igodigital.com', 'pardot.com/r/', 'salesforceiq.com/t.png'],
    ['Oracle', '/e/FooterImages/FooterImage', 'en25.com/e/', '/pub/as?_ri_=', 'bm23.com/t/', 'bm5150.com/t/', 'tags.bluekai.com/site', 'dynect.net/trk.php'],
    ['Acoustic', '/open/log/', /^([\w-]+\.)*mkt\d+\.com\/open/, /^[^/]+\/eos\/v1\/\w+/],
    ['Selligent', '/optiext/optiextension.dll', 'slgnt.eu', 'slgnt.us', 'strongview.com/t'],
    ['Emarsys', 'emarsys.com/e2t/o/', /^[^/]+\/mo\/[\w.-]{8,}\.gif/],
    ['Iterable', '/e/eo?_t=', /^[^/]+\/s\/eo\/[\w-]+\/[a-z0-9]+\/\d{2}/i],
    ['Customer.io', 'customeriomail.com/e/o', 'track.customer.io/e/o', /^[^/]+\/e\/o\/[\w-]{20,}/],
    ['Intercom', 'via.intercom.io/o', /^([\w-]+\.)*intercom-mail[\w-]*\.com\/(via\/)?[oq]/],
    ['ActiveCampaign', '/lt.php?', '/Prod/link-tracker?nl='],
    ['Kit', 'convertkit-mail.com/o/', 'open.convertkit-mail2.com'],
    ['Substack', 'substack.com/o/', 'eotrx.substackcdn.com'],
    ['MailerLite', 'clicks.mlsend.com', '/link/o/'],
    ['AWeber', 'openrate.aweber.com'],
    ['Benchmark', 'bmetrack.com/c/o'],
    ['GetResponse', '/open.html?x='],
    ['Zoho', 'maillist-manage.com/clicks/', /^sender\d\.zohoinsights-crm\.com\/ocimage\//],
    ['Dotdigital', 'trackedlink.net', 'dmtrk.net'],
    ['Emma', 'e2ma.net/track', 't.e2ma.net'],
    ['Omnisend', /^[^/]+\/transactional\/track\/[^?]+\?signature=/],
    ['SendPulse', 'stat-pulse.com'],
    ['Mapp', '/tr/p.gif?'],
    ['Inxmail', '/d/d.gif?'],
    ['phpList', '/ut.php?u='],
    ['Sailthru', 'sailthru.com/trk'],
    ['Granicus', /^([\w-]+\.)*govdelivery\.com(:\d+)?\/track/],
    ['Copernica', '/images/pixel2.gif?pomiv=', /^[^/]+\/image\/\d{4}\/\w+\/image\.gif\?cdmiv=/],
    ['Higher Logic', /^([\w-]+\.)*informz\.net\/z\/\w+\/image\.gif/],
    ['Shopify', '/tools/emails/open/'],
    ['Squarespace', 'engage.squarespace-mail.com/v2/a.gif'],
    ['Movable Ink', /^[^/]+\/p\/[cu]p\/[^?]+\/o\.gif/],
    ['LiveIntent', /^[^/]+\/imp\?s=\d{6}/],
    ['Litmus', 'emltrk.com'],
    ['Email on Acid', 'eoapxl.com'],
    ['Validity', 'returnpath.net/pixel.gif'],
    ['Cheetah Digital', '/rts/open.aspx?tp='],
    ['Epsilon', 'login.dotomi.com/ucm/UCMController'],
    ['Blueshift', 'getblueshift.com/track'],
    ['Infobip', '/tracking/1/open/'],
    // sales tools and the extensions that tell a sender when a mail was read
    ['Mailtrack', 'mailtrack.io/trace', 'mltrk.io/pixel'],
    ['Yesware', 't.yesware.com', 'yesware.com/trk', 'yesware.com/t/'],
    ['Streak', 'mailfoogae.appspot.com'],
    ['Mixmax', 'email.mixmax.com', 'track.mixmax.com', 'mixmax.com/api/track/'],
    ['Outreach', 'app.outreach.io', 'outrch.com/api/mailings/opened', 'getoutreach.com/api/mailings/opened'],
    ['Salesloft', 'salesloft.com/email_trackers'],
    ['Bananatag', 'bl-1.com'],
    ['Boomerang', 'mailstat.us/tr'],
    ['Superhuman', 'r.superhuman.com'],
    ['Polymail', 'polymail.io/v2/z/', 'share.polymail.io'],
    ['Mailbutler', 'bowtie.mailbutler.io/tracking/hit/'],
    ['GMass', 'gmtrack.net', /^([\w-]+\.)*gmreg\d\.net\//],
    ['Cirrus Insight', 'tracking.cirrusinsight.com'],
    ['ContactMonkey', 'contactmonkey.com/api/v1/tracker'],
    ['Close', 'close.com/email_opened', 'close.io/email_opened'],
    ['cloudHQ', 'cloudhq.io/mail_track', /^([\w-]+\.)*cloudhq-mkt\d\.net\/mail_track/],
    ['Gmelius', 'gml.email'],
    ['Nylas', 'api.nylas.com/open'],
    ['Mailshake', 'w1.mslai.net/prod/open/', 'w1.msstnu.com/prod/open/'],
    ['YAMM', 'yamm-track.appspot.com'],
    ['Canary Mail', 'receipts.canarymail.io'],
    ['Mailspring', 'getmailspring.com/open'],
    ['Mailbird', 'tracking.getmailbird.com/OpenTrackingPixel/'],
    ['SalesHandy', 'saleshandy.com/web/email/countopened'],
    ['Copper', 'prosperworks.com/tp/t'],
    ['Zendesk', 'futuresimple.com/api/v1/sprite.png'],
    ['Microsoft Dynamics', 'svc.dynamics.com/t/i/'],
    ['Keap', 'infusionsoft.com/app/emailOpened'],
    // the sites' own: a notification marked read, an open counted
    ['GitHub', 'github.com/notifications/beacon/'],
    ['LinkedIn', 'linkedin.com/emimp/'],
    ['Meta', 'facebook.com/email_open_log_pic.php', 'instagram.com/email_open_log_pic.php', 'facebook.com/aymt/aa/'],
    ['X', 'twitter.com/scribe/ibis', 'x.com/scribe/ibis'],
    ['Quora', 'quora.com/qemail/mark_read'],
    ['Google', 'google-analytics.com/collect', 'google-analytics.com/g/collect', 'notifications.google.com/g/img/', 'google.com/appserve/mkt/img/',
      'notifications.googleapis.com/email/t', 'ad.doubleclick.net/ddm/ad'],
    ['Netflix', 'beaconimages.netflix.net/img/'],
    ['PayPal', 'paypal-communication.com/O/', 't.paypal.com/ts?'],
    ['Amazon', /^([\w-]+\.)*amazon\.[a-z.]+\/gp\/r\.html/],
    ['Asana', 'app.asana.com/-/open'],
    ['Atlassian', 'i.trellomail.com/e/eo', 'bitbucket.org/account/notifications/mark-read/'],
    ['Steam', 'store.steampowered.com/emi/'],
    ['Discord', 'discord.com/api/science/'],
    ['eBay', 'ebayadservices.com/marketingtracking/v1/impression'],
    ['Mixpanel', 'api.mixpanel.com/tr'],
    ['Segment', 'api.segment.io/v1/pixel/track'],
    ['WordPress', 'pixel.wp.com/t.gif'],
    ['Yahoo', 'a.analytics.yahoo.com/p.pl'],
    ['Twitch', 'spade.twitch.tv/track'],
    ['Indeed', 'subscriptions.indeed.com/imgping'],
    ['Eventbrite', 'eventbrite.com/emails/action'],
    ['Grammarly', 'grammarly.com/open'],
    ['Wise', 'links.transferwise.com/track/'],
    ['Medium', 'medium.com/_/stat?event=email.opened']
  ];
  // address -> {host, rest: path and query, full: both}; null for anything but a web address
  const parts = url => {
    try {
      const u = new URL(url);
      return /^https?:$/.test(u.protocol) ? {host: u.host.toLowerCase(), rest: u.pathname + u.search, full: u.host.toLowerCase() + u.pathname + u.search} : null;
    }
    catch (e) {
      return null;
    }
  };
  const compile = p => {
    if (p instanceof RegExp) {
      return t => p.test(t.full);
    }
    if (p.startsWith('/')) {
      return t => t.rest.startsWith(p);
    }
    const cut = p.includes('/') ? p.indexOf('/') : p.length;
    const host = p.slice(0, cut);
    const path = p.slice(cut);
    return t => (t.host === host || t.host.endsWith('.' + host)) && t.rest.startsWith(path);
  };
  const KNOWN = LIST.map(([name, ...patterns]) => [name, patterns.map(compile)]);
  // the vendor whose pixel this is, or ''
  const known = url => {
    const t = parts(url);
    return t && KNOWN.find(([, tests]) => tests.some(test => test(t)))?.[0] || '';
  };

  // Gmail shows a mail's pictures through its proxy, with the sender's own address after the #
  const PROXY = /^https:\/\/ci\d+\.googleusercontent\.com\/(proxy|meips)\//i;
  const proxied = url => PROXY.test(url);
  // the picture's own address: the sender's behind Gmail's proxy ('' when it does not say), or itself
  const original = url => {
    if (!proxied(url)) {
      return url;
    }
    const at = url.indexOf('#');
    let behind = at === -1 ? '' : url.slice(at + 1);
    if (!/^https?:\/\//i.test(behind)) {
      try {
        behind = decodeURIComponent(behind);
      }
      catch (e) {}
    }
    return /^https?:\/\//i.test(behind) ? behind : '';
  };
  // Gmail's and Google's own pictures (an attachment shown in the mail, an icon): no sender
  // learns anything of them, and they are never held for Show pictures
  const OWN = /^https:\/\/([\w-]+\.)*(mail\.google\.com|gstatic\.com|googleusercontent\.com)(:\d+)?\//i;
  const own = url => OWN.test(url) && !proxied(url);
  // a picture that comes from the sender, or another's site on its behalf
  const foreign = url => /^https?:/i.test(url) && !own(url);

  // what a tracker is called when the list does not know it: the domain it reports to
  const SUFFIX2 = new Set(['co', 'com', 'net', 'org', 'gov', 'edu', 'ac', 'or', 'ne', 'go', 'gob', 'ltd', 'plc', 'nic', 'mil', 'sch', 'gen', 'nom', 'biz']);
  const site = url => {
    const host = parts(url)?.host.replace(/:\d+$/, '') || '';
    if (!host || /^[\d.]+$|^\[/.test(host)) {
      return host;
    }
    const p = host.split('.');
    return p.slice(p.length > 2 && p.at(-1).length === 2 && SUFFIX2.has(p.at(-2)) ? -3 : -2).join('.');
  };

  // a picture's own styles, as the mail wrote them: {property: value}
  const declarations = style => {
    const out = {};
    for (const d of String(style || '').split(';')) {
      const i = d.indexOf(':');
      if (i > 0) {
        out[d.slice(0, i).trim().toLowerCase()] = d.slice(i + 1).replace(/!\s*important/i, '').trim().toLowerCase();
      }
    }
    return out;
  };
  // a length in pixels (1, 1px, 0.5px); NaN for another kind (100%, auto, 2em), undefined for none
  const px = v => {
    if (v === undefined || v === null || !String(v).trim()) {
      return undefined;
    }
    const m = /^(\d+(?:\.\d+)?)(px)?$/i.exec(String(v).trim());
    return m ? Number(m[1]) : NaN;
  };
  // the names of pictures that open and recipient trackers give their pixels
  const ENDPOINT = /^((open|opened|opens|openrate|pixel|beacon|track|tracker|tracking|trk|trace|imp|impression|1x1|emailopen|email_open|mailopen|openmail|readreceipt|read_receipt|mark_read|markread)(\.(gif|png|php|aspx?|ashx|jsp|cgi|pl))?|(o|t|p|b|e|r|px)\.gif)$/i;
  // a query that names who the mail went to
  const RECIPIENT = /^(e|em|email|mail|uid|user_?id|subscriber(_?id)?|sid|rid|recipient(_?id)?|contact(_?id)?|cid|mid|eid|lid|tid|upn|ecid|mc_eid|subid|jobid)$/i;
  // what could tell one reader from another: a query, a long token in the path, an address
  const identifies = url => {
    const t = parts(url);
    return Boolean(t) && (/\?./.test(t.rest) || /[\w=-]{16,}/.test(t.rest) || /@|%40/.test(t.rest));
  };
  const names = url => {
    const t = parts(url);
    if (!t) {
      return false;
    }
    const u = new URL(url);
    return ENDPOINT.test(u.pathname.split('/').filter(Boolean).at(-1) || '') || /@|%40/.test(u.search) ||
      [...u.searchParams].some(([k, v]) => RECIPIENT.test(k) && v.length >= 6);
  };

  // A picture of the mail: {src (absolute), width, height, style (attributes as written), hidden
  // (the attribute), styled (the mail's own styles name its class)}. What becomes of it:
  // {kind: 'tracker', name} never loads and is named in the reader; 'quiet' never loads either,
  // a blank spacer that could tell no one anything; 'picture' loads as the reader shows pictures.
  const image = img => {
    const url = img.src || '';
    if (!/^https?:/i.test(url)) {
      return {kind: 'picture'};
    }
    const behind = original(url);
    const target = behind || url;
    const vendor = known(target);
    if (vendor) {
      return {kind: 'tracker', name: vendor};
    }
    if (own(url)) {
      return {kind: 'picture'};
    }
    const s = declarations(img.style);
    const w = px(s.width) ?? px(img.width);
    const h = px(s.height) ?? px(img.height);
    const hidden = img.hidden || s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity || 1) <= 0.01 ||
      w === 0 || h === 0 || px(s['max-width']) === 0 || px(s['max-height']) === 0;
    // a pixel or two: both sides under 2px, or one given that small and the other not at all
    const tiny = (w < 2 || h < 2) && (w === undefined || w < 2) && (h === undefined || h < 2);
    const unsized = w === undefined && h === undefined;
    const tracker = () => ({kind: 'tracker', name: behind || !proxied(url) ? site(target) : ''});
    if ((hidden || tiny) && !img.styled) {
      return identifies(target) ? tracker() : {kind: 'quiet'};
    }
    if ((hidden || tiny || unsized) && names(target) && identifies(target)) {
      return tracker();
    }
    return {kind: 'picture'};
  };
  // whether the mail's own style sheets name one of these classes: a hidden picture of one may
  // show on a phone, or in a narrow side panel
  const styledBy = sheets => cls => Boolean(sheets) && String(cls || '').split(/\s+/)
    .some(c => c && new RegExp('\\.' + c.replace(/[^\w-]/g, '\\$&') + '(?![\\w-])').test(sheets));
  // a picture a style asks for (a background, a style sheet's url()): known pixels only, a
  // style cannot tell how large it shows
  const css = url => known(original(url));

  return {known, original, foreign, image, css, styledBy, site};
})();
