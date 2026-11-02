// core/services.js, the runner of the mail services besides Gmail, with a fake service:
// which services are asked, the mailboxes it builds, new mail, a failed check, the Origin
// rules, and where actions and the reader go.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const EXT = path.join(__dirname, '../../extension');

const setup = ({on = ['fake'], granted = true, fake = {}, rules: start = []} = {}) => {
  const local = {services: on};
  const session = {};
  const area = store => ({
    get: async d => {
      const keys = typeof d === 'string' ? {[d]: undefined} : Array.isArray(d) ? Object.fromEntries(d.map(k => [k, undefined])) : d;
      const o = {};
      for (const k in keys) {
        if (k in store) {
          o[k] = structuredClone(store[k]);
        }
        else if (keys[k] !== undefined) {
          o[k] = keys[k];
        }
      }
      return o;
    },
    set: async o => Object.assign(store, structuredClone(o))
  });
  // the session rules the browser holds already (they outlive the worker)
  let rules = structuredClone(start);
  const changed = [];
  const sent = {offscreen: [], collect: 0, action: [], body: [], rules: 0};
  const service = {
    id: 'fake',
    name: 'Fake Mail',
    origins: ['https://mail.fake.test/*'],
    hosts: ['https://mail.fake.test/'],
    signIn: 'https://mail.fake.test/login',
    compose: () => 'https://mail.fake.test/compose',
    can: {archive: true, spam: true, body: true},
    rewrite: [{urlFilter: '||mail.fake.test/api/', origin: 'https://mail.fake.test'}],
    boxes: [{
      email: 'Ann@Fake.test',
      inbox: 'https://mail.fake.test/inbox',
      unread: 30,
      entries: [
        {id: 'fake:1', link: 'https://mail.fake.test/m/1', ref: {mid: '1'}, title: 'New', summary: 's', modified: new Date().toISOString(), author_name: 'Bo', author_email: 'bo@x.test'},
        {id: 'fake:2', link: 'https://mail.fake.test/m/2', ref: {mid: '2'}, title: '', modified: '2020-01-01T00:00:00Z', author_email: 'cy@x.test'}
      ]
    }],
    async collect({signal}) {
      sent.collect += 1;
      if (service.fail) {
        throw Error('down');
      }
      if (service.hang) {
        await new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(Error('aborted'))));
      }
      return structuredClone(service.boxes);
    },
    async action(o) {
      sent.action.push({cmd: o.cmd, email: o.email, refs: o.refs, prefs: o.prefs});
      if (service.refuse) {
        throw Error('refused');
      }
      return true;
    },
    async body(o) {
      sent.body.push(o.ref);
      return [{name: 'Bo', date: '2026-10-31T09:00:00Z', html: '<p>hi</p>'}];
    },
    ...fake
  };
  const chrome = {
    runtime: {id: 'extid'},
    tabs: {TAB_ID_NONE: -1},
    i18n: {getMessage: k => k === 'msg_1' ? '(unknown sender)' : ''},
    storage: {local: area(local), session: area(session), onChanged: {addListener: f => changed.push(f)}},
    permissions: {contains: async () => granted, onAdded: {addListener() {}}, onRemoved: {addListener() {}}},
    declarativeNetRequest: {
      getSessionRules: async () => rules,
      updateSessionRules: async ({removeRuleIds, addRules}) => {
        sent.rules += 1;
        rules = [...rules.filter(r => !removeRuleIds.includes(r.id)), ...addRules];
      }
    }
  };
  const ctx = {chrome, console, setTimeout, clearTimeout, AbortController, AbortSignal, URL, Date, Promise, Map, Set, structuredClone,
    log() {},
    offscreen: {command: async o => {
      sent.offscreen.push(o.request);
      return true;
    }}};
  ctx.self = ctx;
  ctx.MailServices = {fake: service};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(EXT + '/core/services.js', 'utf8'), ctx, {filename: 'services.js'});
  // turns services on or off as the settings do
  const turn = async ids => {
    local.services = ids;
    changed.forEach(f => f({services: {newValue: ids}}, 'local'));
    // the diagnostics wait for the rules, as a check does
    await ctx.Services.check('fake');
  };
  return {Services: ctx.Services, ctx, service, local, session, sent, turn, rules: () => rules};
};
const signal = () => new AbortController().signal;
// values made in the context are of its realm: compared as plain data
const eq = (a, b) => assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), b);

const tests = [
  ['nothing turned on: no service is asked', async () => {
    const t = setup({on: []});
    eq(await t.Services.collect(signal(), 9000), []);
    assert.strictEqual(t.sent.collect, 0);
  }],
  ['turned on but its hosts not granted: not asked', async () => {
    const t = setup({granted: false});
    eq(await t.Services.collect(signal(), 9000), []);
    assert.strictEqual(t.sent.collect, 0);
  }],
  ['a mailbox is built like a Gmail one', async () => {
    const t = setup();
    const [o] = await t.Services.collect(signal(), 9000);
    assert.strictEqual(o.network, true);
    assert.strictEqual(o.notAuthorized, false);
    assert.strictEqual(o.xml.title, 'ann@fake.test');
    assert.strictEqual(o.xml.service, 'fake');
    assert.strictEqual(o.xml.fullcount, 30);
    assert.strictEqual(o.xml.rootLink, 'https://mail.fake.test/inbox');
    assert.strictEqual(o.xml.link, 'https://mail.fake.test/inbox');
    assert.strictEqual(o.xml.label, '');
    assert.ok(!isNaN(Date.parse(o.xml.modified)));
    assert.strictEqual(o.xml.entries[1].title, '');
    assert.strictEqual(o.xml.entries[1].summary, '');
    assert.strictEqual(o.xml.entries[1].author_name, 'cy@x.test');
  }],
  ['a sender without a name or an address is left blank', async () => {
    const t = setup();
    t.service.boxes[0].entries[1].author_email = '';
    const [o] = await t.Services.collect(signal(), 9000);
    assert.strictEqual(o.xml.entries[1].author_name, '');
    assert.strictEqual(o.xml.entries[0].author_name, 'Bo');
  }],
  ['the count is never below what is listed', async () => {
    const t = setup();
    t.service.boxes[0].unread = 0;
    const [o] = await t.Services.collect(signal(), 9000);
    assert.strictEqual(o.xml.fullcount, 2);
  }],
  ['recent mail not seen before is new, once', async () => {
    const t = setup();
    const [o] = await t.Services.collect(signal(), 9000);
    eq([...o.newIDs], ['fake:1']);
    o.commit();
    await new Promise(r => setTimeout(r, 0));
    const [again] = await t.Services.collect(signal(), 9000);
    eq([...again.newIDs], []);
  }],
  ['the Origin rule touches only this extension\'s requests to the service', async () => {
    const t = setup();
    await t.Services.collect(signal(), 9000);
    const [rule] = t.rules();
    assert.ok(rule.id >= 1000);
    assert.strictEqual(rule.condition.urlFilter, '||mail.fake.test/api/');
    eq([...rule.condition.initiatorDomains], ['extid']);
    eq([...rule.condition.tabIds], [-1]);
    eq(rule.action.requestHeaders.map(h => h.value), ['https://mail.fake.test', 'https://mail.fake.test/']);
  }],
  ['a worker that starts finds the rules in place and leaves them', async () => {
    const first = setup();
    await first.Services.collect(signal(), 9000);
    assert.strictEqual(first.sent.rules, 1); // a browser start: none were there
    const kept = JSON.parse(JSON.stringify(first.rules()));
    const t = setup({rules: kept});
    await t.Services.collect(signal(), 9000);
    assert.strictEqual(t.sent.rules, 0);
    eq(t.rules(), kept);
    // a rule that differs is put right
    const changed = setup({rules: [{...kept[0], condition: {...kept[0].condition, urlFilter: '||old.test/'}}]});
    await changed.Services.collect(signal(), 9000);
    assert.strictEqual(changed.sent.rules, 1);
    eq(changed.rules(), kept);
  }],
  ['a service turned off takes its rule with it', async () => {
    const t = setup();
    await t.Services.collect(signal(), 9000);
    assert.strictEqual(t.rules().length, 1);
    await t.turn([]);
    eq(t.rules(), []);
  }],
  ['a failed check keeps the last answer, without telling its mail again', async () => {
    const t = setup();
    await t.Services.collect(signal(), 9000);
    t.service.fail = true;
    const [o] = await t.Services.collect(signal(), 9000);
    assert.strictEqual(o.xml.title, 'ann@fake.test');
    eq([...o.newIDs], []);
  }],
  ['a failed check with nothing before it lists nothing', async () => {
    const t = setup();
    t.service.fail = true;
    eq(await t.Services.collect(signal(), 9000), []);
  }],
  ['a service that hangs is given up after the timeout', async () => {
    const t = setup();
    t.service.hang = true;
    const t0 = Date.now();
    eq(await t.Services.collect(signal(), 200), []);
    assert.ok(Date.now() - t0 < 1000);
  }],
  ['an aborted check returns nothing', async () => {
    const t = setup();
    const c = new AbortController();
    const p = t.Services.collect(c.signal, 9000);
    c.abort();
    eq(await p, []);
  }],
  ['a check aborted before the services are asked asks none of them', async () => {
    const t = setup();
    t.service.hang = true;
    const c = new AbortController();
    const p = t.Services.collect(c.signal, 5000);
    c.abort();
    const t0 = Date.now();
    eq(await p, []);
    assert.ok(Date.now() - t0 < 500);
    assert.strictEqual(t.sent.collect, 0);
  }],
  ['an action reaches the service with the refs of its mailbox', async () => {
    const t = setup();
    await t.Services.collect(signal(), 9000);
    const r = await t.Services.action({cmd: 'rc_^i', links: ['https://mail.fake.test/m/1', 'https://mail.fake.test/m/2'], prefs: {doReadOnArchive: true}});
    assert.strictEqual(r, true);
    assert.strictEqual(t.sent.action.length, 1);
    assert.strictEqual(t.sent.action[0].email, 'ann@fake.test');
    eq(t.sent.action[0].refs.map(r => r.mid), ['1', '2']);
    assert.strictEqual(t.sent.action[0].prefs.doReadOnArchive, true);
  }],
  ['a refused action comes back with the service name', async () => {
    const t = setup();
    await t.Services.collect(signal(), 9000);
    t.service.refuse = true;
    const r = await t.Services.action({cmd: 'tr', links: ['https://mail.fake.test/m/1']});
    assert.strictEqual(r.message, 'Fake Mail: refused');
  }],
  ['one mailbox that fails does not keep the others from theirs', async () => {
    const t = setup();
    t.service.boxes.push({email: 'bob@fake.test', inbox: 'https://mail.fake.test/inbox?b', unread: 1, entries: [
      {id: 'fake:3', link: 'https://mail.fake.test/m/3', ref: {mid: '3'}, title: 'x', modified: new Date().toISOString(), author_email: 'dee@x.test'}
    ]});
    await t.Services.collect(signal(), 9000);
    const asked = [];
    t.service.action = async o => {
      asked.push(o.email);
      if (o.email === 'ann@fake.test') {
        throw Error('refused');
      }
      return true;
    };
    const r = await t.Services.action({cmd: 'rd', links: ['https://mail.fake.test/m/1', 'https://mail.fake.test/m/3']});
    assert.strictEqual(r.message, 'Fake Mail: refused');
    eq(asked.sort(), ['ann@fake.test', 'bob@fake.test']);
  }],
  ['nothing is sent while one of the mailboxes cannot take the command', async () => {
    const t = setup({on: ['fake', 'plain']});
    t.ctx.MailServices.plain = {...t.service, id: 'plain', name: 'Plain Mail', hosts: ['https://mail.plain.test/'], rewrite: [],
      can: {archive: false, spam: false, body: false},
      collect: async () => [{email: 'cy@plain.test', inbox: 'https://mail.plain.test/inbox', unread: 1, entries: [
        {id: 'plain:1', link: 'https://mail.plain.test/m/1', ref: {mid: 'p1'}, title: 'x', modified: new Date().toISOString(), author_email: 'e@x.test'}
      ]}]};
    await t.Services.collect(signal(), 9000);
    const r = await t.Services.action({cmd: 'rc_^i', links: ['https://mail.fake.test/m/1', 'https://mail.plain.test/m/1'], prefs: {}});
    assert.strictEqual(r.message, 'Plain Mail: not supported');
    assert.strictEqual(t.sent.action.length, 0);
  }],
  ['archive is not sent to a service without one', async () => {
    const t = setup({fake: {can: {archive: false, spam: true, body: true}}});
    await t.Services.collect(signal(), 9000);
    const r = await t.Services.action({cmd: 'rc_^i', links: ['https://mail.fake.test/m/1'], prefs: {doReadOnArchive: true}});
    assert.ok(r.message);
    assert.strictEqual(t.sent.action.length, 0);
  }],
  ['an unknown mail is not sent anywhere', async () => {
    const t = setup();
    const r = await t.Services.action({cmd: 'rd', links: ['https://mail.fake.test/m/9']});
    assert.ok(r.message);
    assert.strictEqual(t.sent.action.length, 0);
  }],
  ['Gmail links go to the offscreen document, a service\'s to the service', async () => {
    const t = setup();
    await t.Services.collect(signal(), 9000);
    const gmail = 'https://mail.google.com/mail/u/0?message_id=abc';
    const r = await t.Services.dispatch({cmd: 'rd', links: [gmail, 'https://mail.fake.test/m/1']});
    assert.strictEqual(r, true);
    eq([...t.sent.offscreen[0].links], [gmail]);
    eq(t.sent.action[0].refs.map(r => r.mid), ['1']);
  }],
  ['Gmail mail of two accounts goes in one request each, a failure of either reported', async () => {
    const t = setup();
    const a = ['https://mail.google.com/mail/u/0?message_id=a1', 'https://mail.google.com/mail/u/0?message_id=a2'];
    const b = ['https://mail.google.com/mail/u/2?message_id=b1'];
    const r = await t.Services.dispatch({cmd: 'rc_^i', links: [a[0], b[0], a[1]]});
    assert.strictEqual(r, true);
    eq(t.sent.offscreen.map(x => [...x.links]), [a, b]);
  }],
  ['an action of two accounts that fails in one says which mail is left undone; the other\'s stays done', async () => {
    const t = setup();
    await t.Services.collect(signal(), 9000);
    const a = ['https://mail.google.com/mail/u/0?message_id=a1', 'https://mail.google.com/mail/u/0?message_id=a2'];
    const b = ['https://mail.google.com/mail/u/2?message_id=b1'];
    t.ctx.offscreen.command = async o => {
      t.sent.offscreen.push(o.request);
      return o.request.links[0].includes('/u/2') ? {message: 'core.js -> action -> 500'} : true;
    };
    const r = await t.Services.dispatch({cmd: 'rc_^i', links: [a[0], b[0], a[1], 'https://mail.fake.test/m/1']});
    eq([r.message, r.failed], ['core.js -> action -> 500', b]);
    // a service mailbox that fails among others: its own mail only
    t.service.boxes.push({email: 'bob@fake.test', inbox: 'https://mail.fake.test/inbox?b', unread: 1, entries: [
      {id: 'fake:3', link: 'https://mail.fake.test/m/3', ref: {mid: '3'}, title: 'x', modified: new Date().toISOString(), author_email: 'dee@x.test'}
    ]});
    await t.Services.collect(signal(), 9000);
    t.service.action = async o => {
      if (o.email === 'bob@fake.test') {
        throw Error('refused');
      }
      return true;
    };
    const s = await t.Services.dispatch({cmd: 'rd', links: ['https://mail.fake.test/m/1', 'https://mail.fake.test/m/3', a[0]]});
    eq([s.message, s.failed], ['Fake Mail: refused', ['https://mail.fake.test/m/3']]);
  }],
  ['a large action reaches Gmail in parts of 100; a part that fails leaves the rest undone', async () => {
    const t = setup();
    const links = [...Array(250).keys()].map(i => 'https://mail.google.com/mail/u/0?message_id=t' + i);
    assert.strictEqual(await t.Services.dispatch({cmd: 'rd', links}), true);
    eq(t.sent.offscreen.map(x => x.links.length), [100, 100, 50]);
    t.sent.offscreen.length = 0;
    t.ctx.offscreen.command = async o => {
      t.sent.offscreen.push(o.request);
      return t.sent.offscreen.length === 2 ? {message: 'down'} : true;
    };
    const r = await t.Services.dispatch({cmd: 'rd', links});
    eq([t.sent.offscreen.length, r.failed.length, r.failed[0]], [2, 150, links[100]]);
  }],
  ['only Gmail: the services are not involved', async () => {
    const t = setup();
    await t.Services.dispatch({cmd: 'rd', links: ['https://mail.google.com/mail/u/1?message_id=x']});
    assert.strictEqual(t.sent.action.length, 0);
    assert.strictEqual(t.sent.offscreen.length, 1);
  }],
  ['the reader gets the messages of a listed mail', async () => {
    const t = setup();
    await t.Services.collect(signal(), 9000);
    const r = await t.Services.body('https://mail.fake.test/m/2');
    assert.strictEqual(r.messages[0].html, '<p>hi</p>');
    assert.strictEqual(t.sent.body[0].mid, '2');
  }],
  ['a service without bodies says so', async () => {
    const t = setup({fake: {can: {archive: true, spam: true, body: false}}});
    await t.Services.collect(signal(), 9000);
    const r = await t.Services.body('https://mail.fake.test/m/1');
    assert.ok(r.message);
    assert.strictEqual(t.sent.body.length, 0);
  }],
  ['the diagnostics see what the service answers', async () => {
    const t = setup();
    const r = await t.Services.check('fake');
    eq(r.boxes.map(b => [b.email, b.unread]), [['Ann@Fake.test', 30]]);
  }],
  ['a link tells its service', async () => {
    const t = setup();
    assert.strictEqual(t.Services.of('https://mail.fake.test/m/1').id, 'fake');
    assert.strictEqual(t.Services.of('https://mail.google.com/mail/u/0'), undefined);
    assert.strictEqual(t.Services.of(undefined), undefined);
  }]
];

(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log('ok', name);
    }
    catch (e) {
      failed += 1;
      console.log('not ok', name, '-', e.message);
    }
  }
  process.exit(failed ? 1 : 0);
})();
