// The panel in headless Chrome, with chrome.* and Gmail replaced by panel/stub.js.
// A small server hands out the extension and the stub; each scenario of
// panel/test.js posts what it saw, and the checks below decide.
// CHROME names the browser; by default Google Chrome on macOS, google-chrome elsewhere. ONLY
// names the scenarios to run (main,keys), all of them by default.
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const {spawn} = require('child_process');

const EXT = path.join(__dirname, '../../extension');
const HERE = path.join(__dirname, 'panel');
// the panel's English strings, for checks that compare what it says
const EN = JSON.parse(fs.readFileSync(path.join(EXT, '_locales/en/messages.json'), 'utf8'));
const T = (key, ...subs) => (EN['panel_' + key]?.message || key).replace(/\$(\d)/g, (_, i) => subs[i - 1] ?? '');
const MAC = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CHROME = process.env.CHROME || (fs.existsSync(MAC) ? MAC : 'google-chrome');
const TYPES = {'.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.woff2': 'font/woff2'};

const waiting = new Map();
// the pictures, videos and pings a mail of the stub asks for, counted by name: what the
// reader loads, and when
const pixels = new Map();
const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/__pixel') {
    const k = url.searchParams.get('k') || '';
    pixels.set(k, (pixels.get(k) || 0) + 1);
    res.writeHead(200, {'Content-Type': 'image/gif', 'Cache-Control': 'no-store'});
    res.end(GIF);
    return;
  }
  if (url.pathname === '/__pixels') {
    const prefix = url.searchParams.get('prefix') || '';
    res.writeHead(200, {'Content-Type': 'application/json', 'Cache-Control': 'no-store'});
    res.end(JSON.stringify(Object.fromEntries([...pixels].filter(([k]) => k.startsWith(prefix)))));
    return;
  }
  if (req.method === 'POST' && url.pathname === '/__result') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      res.end('ok');
      waiting.get(url.searchParams.get('scenario'))?.(JSON.parse(body));
    });
    return;
  }
  let file;
  let content;
  if (url.pathname === '/__panel.html') {
    content = fs.readFileSync(path.join(EXT, 'data/panel/index.html'), 'utf8')
      .replace('<head>', '<head><base href="/data/panel/"><script src="/__stub.js"></script>')
      .replace('</body>', '<script src="/__test.js"></script></body>');
    file = 'x.html';
  }
  else {
    file = url.pathname.startsWith('/__') ? path.join(HERE, url.pathname.slice(3)) : path.join(EXT, decodeURIComponent(url.pathname));
    if (!file.startsWith(EXT) && !file.startsWith(HERE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end();
      return;
    }
    content = fs.readFileSync(file);
  }
  res.writeHead(200, {'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream'});
  res.end(content);
});

// frame: a width narrower than a window can be; the panel then runs in a frame that wide
const run = (port, scenario, query = '', frame = 0) => new Promise(resolve => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mail-deck-chrome-'));
  const panel = `lang=en&scenario=${scenario}${query}`;
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    `--user-data-dir=${profile}`, '--window-size=800,600',
    ...(process.platform === 'linux' ? ['--no-sandbox'] : []),
    frame ? `http://127.0.0.1:${port}/__frame.html?w=${frame}&q=${encodeURIComponent(panel)}` : `http://127.0.0.1:${port}/__panel.html?${panel}`];
  const chrome = spawn(CHROME, args, {stdio: 'ignore'});
  const done = result => {
    clearTimeout(timer);
    waiting.delete(scenario);
    chrome.kill();
    resolve(result);
  };
  const timer = setTimeout(() => done({error: 'no result in 30 s'}), 30000);
  waiting.set(scenario, done);
  chrome.on('error', e => done({error: 'cannot start ' + CHROME + ': ' + e.message}));
});

// what Gmail's categories do once their chips are up, found either way (cats, catsearch)
const categoryChecks = r => ({
  'a category\'s chip narrows the list to its mail, pressed, with how much over it': JSON.stringify(r.narrowed) === '["a2","a3"]' && r.pressed === 'true' &&
    r.bar === T('updatesShown', 2) && JSON.stringify(r.barShown) === JSON.stringify([T('updatesList'), '2']),
  'Mark all as read reads all of it; with none left the list lets go; Z brings it back': r.readAll && r.letGoWhenDone && r.undone,
  'Archive all archives it; Esc lets go of the chip': JSON.stringify(r.promo) === '["a4"]' && r.archived && JSON.stringify(r.social) === '["a5"]' && r.escLetGo,
  'turned off in the settings, no chip and no list narrowed to one; on again, they are back': r.off && r.on,
  'nothing goes wrong unseen (categories)': r.consoleClean === true
});
const checks = {
  main: r => ({
    'the feed\'s mail shows': r.rowsBefore >= 3,
    'show more adds the search\'s extra mail': r.moreShown && r.rowsAfterMore === r.rowsBefore + 3,
    'starred mail is marked': r.starred >= 2,
    'signed-out accounts are listed': r.signedOut?.some(s => s.includes('gone@example.com')),
    'an action reaches the background at once, with its Undo window': r.action?.cmd === 'rc_^i' && r.action.delay === 5000 && r.action.id && r.rowsAfterAction === 1,
    'Undo cancels that same action and brings the row back': r.cancelSameId && r.rowsAfterUndo,
    'remind me later offers its times and has the background write the reminder, with its account':
      r.menuItems >= 3 && ['account', 'from', 'link', 'open', 'title', 'until'].every(k => r.reminder?.includes(k)) && r.reminderAccount === 'evgeny@example.com',
    'a dragged mailbox moves, the order is saved': r.orderAfter?.[0] === r.orderBefore?.[1] && JSON.stringify(r.orderSaved) === JSON.stringify(r.orderAfter),
    'every mailbox keeps its colour when moved': r.coloursKept,
    'the reader shows the whole thread, newest open': r.thread?.messages === 3 && r.thread.lastOpen && r.thread.olderClosed && r.thread.to,
    'an attachment becomes a chip, Gmail\'s table goes': r.thread?.chips >= 1 && r.thread.attTableGone,
    'Google\'s redirect is taken off links': r.thread?.redirectUnwrapped,
    'a Gmail mail\'s links and chips open in a tab of their own, without a ping': r.thread?.linksExternal,
    'Esc inside the message goes back': r.reading && r.escInFrameBack,
    'search every mailbox': r.searchFocused && r.searchCalls >= 2 && r.searchSections >= 1 && r.searchSeen >= 1,
    'with the count at all unread mail, opening the panel marks no time': r.noSeen
  }),
  speed: r => ({
    'the first panel asks the search': r.firstOpenSearches >= 1 && r.cached >= 1,
    'a second panel asks nothing and shows the same': r.secondOpenSearches === 0 && r.extraBack >= 3,
    'pointing at a mail fetches it': r.printsAfterHover === 1,
    'pointing at a mail loads none of its pictures': r.picturesAfterHover === 0,
    'opening it then needs no second request': r.printsAfterOpen === 1 && r.keptForSession >= 1,
    'opening it loads its pictures, as Gmail shows them': r.picturesAfterOpen >= 1,
    'an action drops the kept answers': r.cacheDroppedAfterAction,
    'without auto-advance an action in the reader goes back to the list': r.backAfterAction
  }),
  services: r => ({
    'Meet is Gmail\'s alone': JSON.stringify(r.meet) === '[true,false,false]',
    'sender logos, asked of Google, show for Gmail mailboxes only': JSON.stringify(r.logos) === '[1,0]',
    'a service mail says where it opens': r.openTitle?.includes('Yahoo Mail'),
    'a signed-out service mailbox signs in on its own site': r.signedOut?.some(s => s.includes('gone@yahoo.com')) && r.signInOpened?.startsWith('https://login.yahoo.com/'),
    'a service mail reads in the panel, older messages folded': r.bodyAsked?.startsWith('https://mail.yahoo.com/') && r.messages === 2,
    'nothing of the service\'s markup can run or leave': r.safeText.startsWith('second') && r.dangerous === 0 && !r.ran && r.relative.startsWith('https://mail.yahoo.com/'),
    'a service mail\'s pictures load only when asked for': r.heldBefore === 1 && r.loadedBefore === 0 && r.loadedAfter === 1 && r.barGone,
    'nothing of a service mail loads before Show pictures: SVG, video, poster, URL() styles': JSON.stringify(r.pixelsBefore) === '{}' && JSON.stringify(r.heldOther) === '[1,1,1]',
    'Show pictures brings back its SVG images and posters; a style that fetches never does, nor a tracker': r.pixelsAfter?.['services-svc-svg'] >= 1 && r.pixelsAfter?.['services-svc-poster'] >= 1 && !r.pixelsAfter?.['services-svc-css'] &&
      !r.pixelsAfter?.['services-svc-track'] && r.serviceTrackers === T('trackersBlocked', 1) + ' · 127.0.0.1',
    'a service mail\'s links open in a tab, never over the panel; no ping, nothing editable': r.links?.target === '_blank' && r.links.rel === 'noopener noreferrer' && !r.links.ping && !r.links.editable,
    'a click opens a web link in front, Ctrl and the middle button behind, Shift in a window; other links open nothing':
      JSON.stringify(r.opened) === JSON.stringify([['https://evil.test/top', true, 3], ['https://evil.test/top', false, 3], ['https://evil.test/top', false, 3]]) &&
      JSON.stringify(r.windowOpened) === '["https://evil.test/top"]' && r.panelStayed && !r.pingAfterClicks,
    'no star where the service has none, nor S in the keys\' sheet; Esc closes the sheet, not the mail': r.star === false && r.noStarHint,
    'a mail the panel cannot read opens on its site': r.protonReader === false && r.protonOpened?.startsWith('https://mail.proton.me/'),
    'Enter on it opens it on its site too, not a reader that cannot load it': r.protonEnterReader === false && r.protonEnterOpened?.startsWith('https://mail.proton.me/'),
    'pointing at a service mail fetches nothing': r.hoverFetched === 0,
    'search asks Gmail only': JSON.stringify(r.searchUrls) === '["https://mail.google.com/mail/u/0"]',
    'with a service\'s chip chosen, search asks Gmail instead of failing': r.yahooChosen && JSON.stringify(r.chipSearchUrls) === '["https://mail.google.com/mail/u/0"]' && !r.chipSearchFailed
  }),
  privacy: r => ({
    'a mail pointed at loads none of its pictures, trackers or not': JSON.stringify(r.hover) === '{}',
    'a Gmail mail\'s trackers never load, known by name (behind Gmail\'s proxy too) or by look; a blank spacer neither':
      !r.before.tiny && !r.before.hidden && !r.after.tiny && !r.after.hidden && r.blanks === 5 &&
      JSON.stringify(r.named) === '["127.0.0.1","127.0.0.1","Mailchimp","SendGrid"]' && r.litmusGone,
    'its other pictures, backgrounds and styled pictures load at once, as Gmail shows them': !r.bar && r.before.pic >= 1 && r.before.bg >= 1 && r.before.css >= 1,
    'the reader says how many trackers it blocked and whose; the tooltip says what they are and names them all':
      JSON.stringify(r.trackerLine) === JSON.stringify(['ok:' + T('trackersBlocked', 5) + ' · 127.0.0.1, Mailchimp, SendGrid +1']) &&
      r.tip === T('trackersTip') + '\n127.0.0.1, Mailchimp, SendGrid, Litmus' && r.focusable,
    'a brand\'s name from another domain: one calm line, with what to take care of': JSON.stringify(r.brand) === JSON.stringify(['warn:' + T('warnBrand', 'PayPal', 'paypal-billing.net')]) &&
      r.warnTip === T('warnTip'),
    'a lookalike domain: one line': JSON.stringify(r.lookalike) === JSON.stringify(['warn:' + T('warnLookalike', 'arnazon.com', 'amazon.com')]),
    'replies sent to a lookalike of the reader\'s own domain, from the print view\'s Reply-To': JSON.stringify(r.replyTo) === JSON.stringify(['warn:' + T('warnReplyTo', 'boss@arbltron.app', 'arbitron.app')]),
    'an ordinary mail says nothing': JSON.stringify(r.normal) === '[]' && r.notesHidden,
    'nothing goes wrong unseen': r.consoleClean === true
  }),
  privacyask: r => ({
    'asked first: a Gmail mail\'s pictures wait for Show pictures, its trackers stay out after it too':
      r.bar && JSON.stringify(r.before) === '{}' && r.after.pic >= 1 && r.after.bg >= 1 && r.after.css >= 1 && !r.after.tiny && !r.after.hidden &&
      r.blanks === 5 && r.trackerLine.length === 1
  }),
  wide: r => ({
    'a 700px newsletter fits without a sideways scroll': r.clientWidth > 0 && r.scrollWidth <= r.clientWidth + 1
  }),
  keys: r => ({
    'read on open: a mail whose body did not load stays unread and listed': r.failedMarked === 0 && r.failedListed,
    'read on open: back from a mail marked read, the next mail has the focus': r.readMarked === 1 && r.focusAfterReadOnOpen === 'row:b1',
    'the reader takes the focus, the list under it is inert until back': r.readerFocused && r.underInert && r.backFocus === 'row:a1' && r.underBack,
    'E pressed twice while the mail folds: one action, and Z cancels it': r.doubleKey?.length === 1 && r.doubleKeyUndone,
    'a double click on delete: one action; a click on the folding mail opens nothing': r.doubleClick === 1 && r.foldClickReads === false,
    'the only mail of a mailbox archived: the focus goes to the mail before it, Undo brings it back': r.focusAfterLast === 'row:a1' && r.focusAfterUndo === 'row:b1',
    'a chip keeps the focus; show more hands it to the first mail it brought': r.focusAfterChip && r.focusAfterMore === 'row:a3',
    'a check keeps a toolbar button focused and a scrolled list where it was': r.toolKept === 'compose' && r.scrollKept,
    'a check with nothing new does not draw the list again; its times move on; a change draws it': r.sameNotDrawn && r.timesMoved && r.changeDrawn,
    'the background\'s answer to an action does not cut the fold short': r.foldGoesOn && r.foldDone,
    'remind me later: its button says it opens a menu, the focused time shows a ring': r.menuExpanded && r.menuRing === 'solid',
    'remind me later: Esc gives the focus back to the mail, Tab out closes it': r.menuEsc && r.menuTabOut,
    'remind me later at a larger text size opens at its clock, inside the window': r.zoomMenu?.alignedRight && r.zoomMenu.inside && r.zoomMenu.atClock,
    'a subject keeps its own direction and the panel\'s side (Hebrew in English, English in Hebrew)': r.bidi?.hebrewInLtr && r.bidi.englishInRtl,
    'search: an account that did not answer says so; the result is said to a screen reader': r.searchFailedLine && r.searchFoundLine && r.searchSaid,
    'Esc in the search field gives the focus to the search button': r.focusAfterSearch === 'search'
  }),
  files: r => ({
    'a mail\'s files show on its line before it is opened, with their kind': JSON.stringify(r.lineFiles) === '["Макеты-v3.pdf"]' && r.kind === 'pdf' && r.everyLine,
    'each line\'s print view is fetched once for it': r.onePrintEach,
    'a click on a file opens the file alone, not the mail': r.fileOpened.includes('view=att') && r.fileOpened.includes('disp=safe') && !r.readingAfterFile,
    'the open mail shows its files over the message, at once and with Download, with no second request': r.stripAtOnce && JSON.stringify(r.stripFiles) === '["Макеты-v3.pdf"]' && r.download.startsWith(T('download')) && r.noSecondPrint,
    'the message\'s own chips of its files step aside for them, so no file shows twice': r.frameChipsHidden,
    'the files found stay for the session': r.kept > 0
  }),
  codes: r => ({
    'a one-time code shows on its line; numbers that are none show nothing': JSON.stringify(r.pills) === '["G-482913","7310","","123-456","",""]',
    'a click on it copies the digits, and opens, reads or deletes nothing': r.copied === '482913' && r.copiedShown && !r.opened && r.actions === 0 && r.rowsKept,
    'C copies the code of the focused line, and nothing from a line without one': r.copiedByKey === '7310' && r.copiedNone === null,
    'the reader shows the code too, and C copies it there without an action': r.readerPill === '123-456' && r.copiedInReader === '123456' && r.actionsAfter === 0
  }),
  advance: r => ({
    'J and K move between the mails in the reader': r.first === 'Макеты на ревью' && r.afterJ === 'New sign-in' && r.afterK === 'Макеты на ревью' && r.prevDisabledAtFirst,
    'with auto-advance an action from the reader opens the next mail': r.stillReading && r.afterE === 'New sign-in' && r.archived.includes('message_id=a1&') && r.posAfterE === '1 of 2',
    'the reader\'s arrow goes on as J does; J stops at the last mail': r.atLast === 'Созвон' && r.pastLast === 'Созвон' && r.nextDisabled,
    'K passes over the mail acted on': r.topAfterArchive === 'New sign-in'
  }),
  readnext: r => ({
    'J goes on from a mail that read on open took out of the list': r.marked === 1 && !r.listedAfterRead && r.afterJ === 'New sign-in'
  }),
  seen: r => ({
    'with the count at mail since the panel was opened, opening it marks the time, a list update does not': r.seen && !r.seenOnUpdate
  }),
  site: r => ({
    'over github.com, its mail comes first: newest three, from both mailboxes, a bulk sender\'s in its name counted, "2 more"':
      r.first && r.head && JSON.stringify(r.pins) === '["g1","g6","g2"]' && r.more,
    'its pins are named buttons, not lines of the list': r.pinsNamed && r.noRows,
    'a fresh code shows large and grouped; a click copies its digits, says so, and acts on no mail': r.codeShown && r.codeCopied && r.noAction,
    'C copies it with no line focused and from a line without a code; a line with its own code keeps C': r.keyNoFocus && r.keyPlainLine && r.keyOwnCode,
    'typing in the search copies nothing, and the search hides the block until it closes': r.keyInSearch && r.backAfterSearch,
    'a pin opens its mail in the reader, and back gives it the focus again': r.pinReads && r.pinFocusBack,
    '"N more" narrows the list to the site\'s mail behind a chip; Esc lets go': JSON.stringify(r.narrowed) === '["g1","g2","g3","g4","g6"]' && r.narrowChip && r.letGo,
    'no block over chrome://, over Gmail itself, for a generic brand, or with no mail from the site': r.chromePage && r.gmailHost && r.generic && r.noMatch && r.backOnGithub,
    'the brand matches across endings (amazon.de and .com on amazon.co.uk); a code past half an hour does not show':
      JSON.stringify(r.amazon) === '{"pins":["z1","z0"],"code":false,"head":true}',
    'the block follows the tab: another one activated': r.onActivated,
    'a site is its registrable domain, never webmail, an address, people\'s mail or a file':
      JSON.stringify(r.sites) === '["bbc.co.uk","bmw.de","example.com.br",null,null,null,null,null]',
    'a brand under another ending matches; a generic one, or another brand that starts alike, does not': JSON.stringify(r.brands) === '[true,false,false,null]',
    'matching nine mailboxes of twenty takes under 2 ms, from memory': r.ms < 2
  }),
  ai: r => ({
    'the assistant starts after the list is on screen; waiting for a reply asks 800 ms later': r.afterPaint && r.replyWaited,
    'Reply · N comes first among the chips; the lines get ↩ with the reason': r.chip && r.asked?.calls === 1 && r.asked.n >= 3 && r.asked.own &&
      JSON.stringify(r.marks) === JSON.stringify(['a1:' + T('replyWhy', 'asks for the mockups'), 'b1:' + T('replyWhy', 'asks a question')]),
    'Gmail\'s own categories mark bulk mail before any model is asked': r.knownBulk,
    'the chip narrows the list to that mail; Esc lets go': JSON.stringify(r.narrowed) === '["a1","b1"]' && r.letGo,
    'a check with nothing new asks nothing; new mail is asked about, alone': r.quietCheck && r.newMail,
    'the reader has a Summary button; nothing is asked before a click': r.button,
    'I asks: the card waits, then the points stream in': r.waiting && r.streams,
    'the summary: points, to do, dates and details, for that mail and its version, from the whole thread, the reader\'s own messages known':
      JSON.stringify(r.summary) === '{"points":3,"todo":1,"events":2,"facts":2,"key":true,"messages":3,"fresh":false,"reader":"evgeny@example.com",' +
        '"emails":"evgeny@example.com,anna@figma.com,anna@figma.com"}',
    'a detail of the summary copies its value alone': r.factCopied,
    'each date links to Google Calendar in the mail\'s own account': r.calendar,
    'with the card open the message keeps room (140px at least) and the header gives way': r.room?.body >= 140 && r.room.files === 'none' && r.room.inside,
    'Copy copies the summary with its headings and details': r.copied,
    'Hide hides it; I shows it again from the session, Regenerate asks anew': r.hidden && r.again && r.regenerating,
    'back hides the card; the mail opened again shows its summary without a click': r.backHides && r.keptShown,
    'back, and J, stop a summary underway': r.backStops && r.jStops,
    'every error says what it is, with the way to the AI settings': r.errors?.length === 11 && r.errors.every(e => e === 'ok') && r.settings,
    'a thread cut to its latest messages says so': r.truncated,
    'no summary where the panel shows no mail (Proton)': r.proton,
    'waiting for a reply failing puts a dot on the chip, with why; what was found stays': r.errorDot,
    'nothing goes wrong unseen (no errors, no unhandled rejections)': r.consoleClean === true
  }),
  aiauto: r => ({
    '"automatically for long mail": a short thread waits for a click, a long one summarizes itself': r.shortWaits && r.longStarts && r.longDone
  }),
  aiassist: r => ({
    'the assistant opens from the header, its field focused, its suggestions and engine shown; its first sessions made ready':
      r.opened && r.engine === 'OpenAI · gpt-test' && r.warmed,
    '"Who is waiting for my reply?" lists the sorting\'s mail with why, and asks no model to plan it':
      JSON.stringify(r.replies) === JSON.stringify({plans: 0, refs: ['Макеты на ревью', 'Созвон'], why: 'asks for the mockups', title: true}),
    'find: every Gmail account searched with the planned query, what it found listed, Mark all read and Archive all with their counts':
      r.findQuery === 3 && r.found === 4 && r.foundOpen === true &&
      JSON.stringify(r.acts) === JSON.stringify(['text-btn:' + T('markAllRead') + '2', 'text-btn:' + T('archiveAll') + '4']),
    '"archive them": the mail found before, nothing searched; Archive all first and only on a click, with Undo':
      JSON.stringify(r.them) === JSON.stringify({searches: 0, refs: 4, prev: 'find invoices:4', first: 'primary-btn:4'}) && r.archived && r.undone,
    'nothing found, searched more broadly: the search shown, Edit search puts it in the search field': JSON.stringify(r.nothing) === JSON.stringify({
      searched: ['subject:"zz nothing"', 'zz nothing', 'zzz'], text: T('nothingFound'), query: 'subject:"zz nothing"',
      buttons: [T('editSearch'), T('searchInGmail')]}) && r.edit,
    'Gmail not answering says so, with its sign-in, not "nothing found"': r.failed,
    'a mail kept from before the accounts moved opens in its own account': r.moved,
    'a question: the mail found read whole, an answer with a citation; a number no mail has, marked to check':
      r.answer === 'The invoice #1042 is ready 1. It was paid on 99999 1.' && r.answerMail === 4 && r.readWhole && r.cite && r.doubt,
    'a citation opens its mail in the reader, and Esc comes back to the assistant': r.citeOpens && r.backToAssist,
    'a new mail: its fields filled and changed, then Gmail\'s compose window with them': JSON.stringify(r.email) === '["anna@figma.com","Встреча в пятницу"]' &&
      r.compose.includes('view=cm') && r.compose.includes('to=anna%40figma.com') && r.compose.includes('su=' + encodeURIComponent('Встреча: пятница')) && r.compose.includes('body=' + encodeURIComponent('Анна, привет!')),
    'what is important: the unread mail read by its preview, with how it was sorted; the conversation kept for the session': r.brief >= 5 && r.flags && r.kept === 8,
    'the emails do not say: said so, what was found still listed': r.notFound,
    'stop ends an answer underway, with Ask again': r.stopped,
    'a usage limit offers Manage usage first': r.limit,
    'Esc in its field closes it': r.closed
  }),
  aitools: r => ({
    'the sorting: a chip for each kind found, the list narrowed with all of it read at once': JSON.stringify(r.chips) === '["reply","important","bulk"]' &&
      r.bar === T('importantShown', 1) && JSON.stringify(r.barShown) === JSON.stringify([T('importantList'), '1']) && r.narrowed === 1 && r.readAll,
    'the open mail offers a summary, a reply, a translation and a question': JSON.stringify(r.strip) === '["ai:sparkle","ai:reply","ai:translate","ai:ask"]',
    'a reply drafted from an intent, marked as chosen, opens in Gmail\'s compose window with the text': r.chosen && r.draft.startsWith('Привет, Аня!') &&
      r.draftCall.intent === T('intentYes') && r.draftCall.reader === 'evgeny@example.com' && r.replyUrl.includes('to=anna%40figma.com') &&
      r.replyUrl.includes('su=Re%3A') && r.replyUrl.includes('body=' + encodeURIComponent('Привет, Аня!')) &&
      JSON.stringify(r.intents) === JSON.stringify(['intentYes', 'intentNo', 'intentMore', 'intentTimes', 'intentAccept', 'intentThanks'].map(k => T(k))),
    'with a draft, the intents fold into one Rewrite… field with its buttons': r.folded,
    'a rewrite of the reader\'s own change streams into the same field; Undo brings the change back; the reader\'s words rewrite too':
      r.inPlace && r.rewrite.call === 'shorter:Привет, Аня! Спасибо большое, посмотрю всё до пятницы.' && r.rewrite.text === 'Аня, спасибо, посмотрю.' &&
      r.undo && r.ownWords,
    'a question about the mail is answered from its thread, newest first; Esc in the field closes the card only': r.askFocused && r.ask && r.escCard,
    'a translation by the engine shows as a card': r.translation === 'Hi! The mockups are attached; please look before Friday.',
    'A asks about the open mail': r.keyA
  }),
  aioff: r => ({
    'the assistant off: its buttons offer it, I too (the keys\' sheet says so), with no ai.js, no summary, no sorting and not one call': JSON.stringify(r.off) ===
      '{"calls":0,"button":true,"card":false,"offerCard":true,"chip":false,"offer":true,"header":true,"script":false,"hint":true}'
  }),
  ainone: r => ({
    'the assistant off and its buttons too: nothing of it shows, and nothing is loaded or asked': JSON.stringify(r.off) ===
      '{"calls":0,"button":false,"card":false,"offerCard":false,"chip":false,"offer":false,"header":false,"script":false,"hint":false}'
  }),
  aisetup: r => ({
    'the setup offers the built-in model where Chrome has one, the ChatGPT plan, a key and a server on this computer':
      JSON.stringify(r.choices) === JSON.stringify([...r.builtin ? ['builtin'] : [], 'chatgpt', 'key', 'local']),
    'the key\'s providers are one choice that opens their row in place, named as a group, the focus kept':
      r.closed && r.expanded && r.group && r.keptOpen && r.closedAgain,
    'every provider of a key has its tile, by the name people know it by':
      JSON.stringify(r.tiles) === '["anthropic","openai","gemini","xai","deepseek","mistral","qwen","kimi","zai","groq","openrouter","yandex"]' &&
      r.tileNames?.[0] === 'Anthropic Claude' && r.tileNames[2] === 'Google Gemini' && r.tileNames[4] === 'DeepSeek',
    'a tile opens Settings at its provider, the server choice at its own': r.gemini === '#ai-gemini' && r.local === '#ai-local',
    'every engine Settings can turn on turns the assistant on; an unknown one is off':
      JSON.stringify(r.engines) === '["gemini","xai","deepseek","mistral","qwen","kimi","groq","openrouter","local","yandex","zai","off"]',
    'an engine\'s own key, model or sign-in restarts the assistant; what it keeps does not':
      JSON.stringify(r.restarts) === '[true,true,true,true,true,false,false,false]',
    'with an engine on, the setup marks it and opens its keys': JSON.stringify(r.marked) === '["kimi"]' && r.openForKey,
    'an engine says its model once, a server here its model on this computer, a plan the plan alone': JSON.stringify(r.labels) === JSON.stringify([
      'Gemini 3.8 Flash', 'OpenRouter · Anthropic: Claude Sonnet 5', 'DeepSeek', T('engineLocal', 'qwen3:8b'), T('engineLocal', 'LM Studio'),
      T('engineLocal', 'Chrome'), T('enginePlan', 'ChatGPT', '').replace(/\s*·\s*$/, '')]),
    'nothing goes wrong unseen (setup)': r.consoleClean === true
  }),
  aireal: r => ({
    'the real ai.js comes after the list\'s first frame; with no key the card says so, and nothing is classified':
      r.loadedAfter && r.noKey && r.noChip && r.consoleClean === true,
    'every engine ai.js runs is one the panel turns the assistant on with': JSON.stringify(r.unknownEngines) === '[]',
    'every engine the panel offers is one ai.js runs': JSON.stringify(r.missingEngines) === '[]'
  }),
  reliable: r => ({
    'a mail archived from Gmail\'s search leaves the feed\'s list as well; Undo brings it back':
      JSON.stringify(r.searchFound) === '["a1"]' && JSON.stringify(r.afterSearchAction) === '["a2","b1"]' && JSON.stringify(r.afterUndo) === '["a1","a2","b1"]',
    'an action over two accounts that one refuses brings back only that one\'s mail, and says it failed':
      JSON.stringify(r.partial) === '["a1","b1"]' && r.partialToast,
    'an action with auto-advance goes on along the list the mail was opened from, J too':
      r.trailBefore === '1 of 3' && JSON.stringify(r.trailAfter) === '["1 of 2","Счёт за октябрь"]' && r.trailJ === '2 of 2',
    'a side panel asks for the mail past the feed\'s 20 again once a count moves, not sooner than in 3 minutes':
      r.extraSameCount === 0 && r.extraTooSoon === 0 && r.extraAgain === 1,
    'after accounts change places, the mail past the feed\'s 20 of each is asked at its own place':
      r.extraAtPlace && JSON.stringify(r.extraAsked) === '["https://mail.google.com/mail/u/0","https://mail.google.com/mail/u/1"]',
    'a print view sent to Google\'s sign-in page fails, is not kept, and the mail loads once the account is back':
      r.signIn === 'failed' && r.signInKept === false && r.signInBack === true,
    'a print view that never comes is given up': r.hung === 'TimeoutError',
    'the files and the sorting of mail no longer listed are forgotten; the listed mail\'s stay': r.pruned,
    'the panel keeps the last 20 threads it rendered': r.renderKept && r.renderDropped,
    'the print views kept for the session stay within 3 MB, one over 300 KB is not kept, and the index names them all':
      r.printBytes > 0 && r.printBytes <= 3 * 1024 * 1024 && r.printIndexed && r.hugeKept === false,
    'a print view no index names goes': r.lostGone
  }),
  ux: r => ({
    'the panel opens with its first mail under the keys, marked without the keyboard\'s ring; E archives it': r.firstFocused && r.firstActed,
    'buttons have no native title: their tooltip says the name and the key, after a moment, beside the button, gone on a click':
      r.noTitles && !r.tip?.early && r.tip.shown && r.tip.text === T('search') && r.tip.key === '/' && r.tip.clear && r.tip.label === T('search') && r.tipGone,
    'Add another account is at the end of the list, not in the header': r.addAccount,
    '? lists the list\'s keys over the panel and holds them; Esc closes it and gives the focus back': r.sheetList?.open && r.sheetList.modal && r.sheetList.inside &&
      ['J/↓', 'Enter', 'E', '/', '?'].every(k => r.sheetList.keys.includes(k)) && !r.sheetList.keys.includes('Esc') && r.sheetHoldsKeys && r.sheetClosed,
    'in a message ? lists its keys (Esc for back, star, summary off), and Esc closes only the sheet': ['J', 'S', 'Esc', 'O'].every(k => r.sheetReader?.includes(k)) &&
      !r.sheetReader.includes('Enter') && r.sheetReaderClosed,
    'the reader\'s bar: back, the arrows, its place, then the actions, Reply by name, and ⋯ with Open, unread, the sender\'s mail, Spam and the keys (labels wait for labels.beta)':
      JSON.stringify(r.bar) === '["back","up","down","pos","box","grow","read","archive","trash","clock","sep","star","reply","more"]' &&
      JSON.stringify(r.more) === '["O","U",null,"!","?"]' && r.moreClosed,
    'the keys\' sheet lists U for Gmail mail, and L and V only once labels.beta is on': r.sheetList?.keys.includes('U') && r.sheetReader?.includes('U') &&
      !['L', 'V'].some(k => r.sheetList.keys.includes(k) || r.sheetReader.includes(k)),
    'remind me later: its times have the keys 1-4; a date and a time of one\'s own': JSON.stringify(r.remindKeys?.slice(0, 3)) === '["1","2","3"]' && r.remindByKey &&
      r.pickFocused && r.remindPicked,
    'search as one types: the list\'s mail narrows, nothing is asked; Enter asks Gmail': JSON.stringify(r.typed) === '["a1"]' &&
      r.searchAll === T('searchGmailFor', 'figma') + '↵' && r.none && r.nothingAsked && r.downToAll && r.enterAsks,
    'an update without data draws nothing': r.dataless
  }),
  boot: r => ({
    'after a browser start: lines stand for the mail, never Sign in, until the first list; then the list': r.skeleton && r.tools && r.listed,
    'lines only before the first answer: no one signed in shows Sign in': r.empty
  }),
  pin: r => ({
    'the toolbar button not pinned: a line says what pinning gives; it goes once pinned, or closed for good': r.shown && r.goneWhenPinned && r.closed
  }),
  cats: r => ({
    'Gmail\'s categories: a chip each with its count, before the assistant\'s offer and the mailboxes':
      JSON.stringify(r.chips) === '["promo","social","updates","ai","|","box","box","box"]' &&
      JSON.stringify(r.labels) === JSON.stringify([T('promoChip', 1), T('socialChip', 1), T('updatesChip', 2)]) && r.tip === T('promoChip', 1) + ' — ' + T('categoryTip'),
    'the labels of the search for the mail past the feed\'s 20 say them: nothing more is asked': JSON.stringify(r.asked) === '[]',
    ...categoryChecks(r)
  }),
  catsearch: r => ({
    'rows without the labels: each category searched for in that inbox alone, the same chips': JSON.stringify(r.asked) === JSON.stringify(
      ['promotions', 'social', 'updates'].map(c => `in:inbox is:unread category:${c}@0`)) &&
      JSON.stringify(r.labels) === JSON.stringify([T('promoChip', 1), T('socialChip', 1), T('updatesChip', 2)]),
    'what was found is kept for the next panel, which asks nothing': JSON.stringify(r.kept) === '["evgeny@example.com"]' && r.secondAsks === 0 && r.secondChips === 3,
    'a count that moves is asked again, not sooner than in 3 minutes': r.tooSoon === 0 && r.again === 3,
    ...categoryChecks(r)
  }),
  catsai: r => ({
    'with the assistant sorting, its Newsletters stands for Promotions and Social; Updates keeps its chip, with nothing asked':
      JSON.stringify(r.kinds) === '["reply","important","bulk","updates"]' && r.noSearch,
    'its sorting off, Gmail\'s three come back': JSON.stringify(r.withoutSorting) === '["promo","social","updates"]'
  }),
  saved: r => ({
    'a saved search is a chip by its name, its search in its tooltip; none for an account signed out or an empty one':
      JSON.stringify(r.chips) === '["cat","cat","cat","ai","Invoices","Work invoices","|","box","box","box"]' && r.tip === 'invoice · work@arbitron.example',
    'a click asks every Gmail account, shows the search in its field and keeps the focus on the chip':
      JSON.stringify(r.asked) === '["0","1","2"]' && r.field && r.pressed && r.found > 0,
    'a second click goes back to the list; a third shows what was found at once, asking nothing':
      r.closed && r.atOnce && JSON.stringify(r.kept) === '["|invoice"]',
    'one saved for an account asks that account only': JSON.stringify(r.work) === '["1"]',
    'an action forgets what was found: the chip asks again': r.askedAgain === 7,
    'typed words let go of the chip; Esc closes the search': r.typedLetGo && r.esc,
    'nothing goes wrong unseen': r.consoleClean === true
  }),
  rate: r => ({
    'after two weeks and ten days of use, one line at the end of the list asks for a rating: Rate, Later, Don\'t ask again':
      r.counted && r.shown && JSON.stringify(r.buttons) === JSON.stringify([T('rateGo'), T('rateLater'), T('rateNever')]),
    'Later: back once, three months on; the second Later is the last': r.later && r.notYet && r.again && r.lastLater && r.never,
    '× and Rate end it for good; Rate opens the store\'s reviews': r.closed && r.rated,
    'not before two weeks, nor ten days of use; not over the pinning hint or a search': r.tooEarly && r.tooFew && r.pinFirst && r.notInSearch && r.back,
    'a day of use counts once': r.firstDay && r.nextDay
  }),
  acting: r => ({
    'a mail with a List-Unsubscribe: ⋯ offers Unsubscribe with its way, next to U, L and V': r.moreUnsub && JSON.stringify(r.moreKeys) === '["O","U","L","V","","","!","?"]',
    'Unsubscribe asks first in a dialog that names the sender and what happens; the focus stays in it and comes back on Esc':
      r.dialog?.title === T('unsubscribeFrom', 'GitHub') && r.dialog.text === T('unsubscribeMail', 'unsub@github.com') && r.dialog.go === T('unsubscribeWrite') &&
      r.dialog.modal && r.tabRound && r.tabBack && r.escClosed,
    'by mail: Gmail\'s compose window with its address, subject and text; nothing is posted': r.composed.includes('view=cm') &&
      r.composed.includes('to=unsub%40github.com') && r.composed.includes('su=unsubscribe') && r.composed.includes('body=please') && r.noPost,
    'U in the reader: back to the list, the mail read on opening listed again and focused, Gmail asked': r.readHidden &&
      JSON.stringify(r.unread) === JSON.stringify({back: true, listed: true, focused: true, asked: true, toast: T('doneUnread')}),
    'a mark as unread Gmail refuses says so': r.unreadFailed,
    'L: the label menu with its field; a name not listed is offered, Enter adds it with no Undo window and the mail stays':
      r.labelMenu?.title === T('labelTitle') && r.labelMenu.focused && JSON.stringify(r.labelNew) === JSON.stringify([T('labelNew', 'Work/Projects')]) &&
      JSON.stringify(r.labelled) === JSON.stringify({asked: 'ac_Work/Projects:a1', toast: T('doneLabel', 'Work/Projects'), listed: true}),
    'a label used is listed next time; ↓ goes to it, a letter back to the field, Esc to the line': JSON.stringify(r.usedListed) === '["Work/Projects"]' &&
      r.downToItem && r.letterToField && r.labelEsc,
    'V moves the mail there with the list\'s Undo, and Z brings it back': r.moveTitle === T('moveTitle') &&
      JSON.stringify(r.moved) === JSON.stringify({asked: 'mv_Work/Projects:a1:5000', gone: true, toast: T('doneMove', 'Work/Projects'), undo: true}) && r.moveUndone,
    'Newsletters: a menu of its senders, each with its way from its header': r.sendersBtn && JSON.stringify(r.senders) === JSON.stringify(['Notion:' + T('howOneClick')]) &&
      r.postText === T('unsubscribePost', 'notion.so'),
    'a one-click request that does not go says so in the dialog and offers the sender\'s page; Esc gives the focus back':
      JSON.stringify(r.failedOffer) === JSON.stringify({error: T('unsubscribeFailed'), go: T('unsubscribeOpen')}) && r.focusBack,
    'one click: the background sends it; their unread mail found in every account and archived with the Undo':
      JSON.stringify(r.unsubscribed) === JSON.stringify({asked: ['a4', 'a4'], searched: true, archived: 'rc_^i:a4:5000',
        toast: T('unsubscribeSent') + ' · ' + T('doneArchive') + ': 1', undo: true}),
    'nothing goes wrong unseen': r.consoleClean === true
  }),
  narrow: r => ({
    'a 320px side panel: the mailbox line keeps whole buttons, without copy and Meet, and a readable address':
      r.width === 320 && JSON.stringify(r.buttons) === '["readAll:32","archive:32","open:32"]' && r.addr >= 60,
    'a 320px side panel: the reader\'s bar stays inside': r.barInside,
    'a 320px side panel: Gmail\'s categories say their count; narrowed to one, its name stays whole over its buttons':
      JSON.stringify(r.catShort) === '["none:1","none:1","none:2"]' && r.barWraps,
    'a 320px side panel: the reader\'s date stands under the sender': r.dateBelow
  })
};

server.listen(0, '127.0.0.1', async () => {
  const {port} = server.address();
  let failed = 0;
  for (const [scenario, query, frame] of [['main', ''], ['speed', ''], ['services', '&s=services'], ['wide', '&wide=1'], ['keys', ''], ['narrow', '&side', 320],
    ['files', ''], ['codes', '&s=codes'], ['advance', '&advance=1'], ['readnext', '&read=1'], ['seen', '&badge=new'],
    ['site', '&s=site&url=' + encodeURIComponent('https://github.com/login?return_to=%2Fsettings')],
    ['ux', ''], ['acting', '&ai=on&read=1'], ['boot', '&boot=1'], ['pin', '&pinned=0'], ['cats', ''], ['catsearch', '&cats=search'], ['catsai', '&ai=on'], ['saved', '&saved=1'], ['rate', '&rate=due'], ['ai', '&ai=on'], ['aiassist', '&ai=on'], ['aitools', '&ai=on'], ['aiauto', '&ai=on&summary=auto'], ['aioff', '&ai=off'], ['aisetup', '&ai=off'], ['ainone', '&ai=off&buttons=0'], ['aireal', '&ai=real'], ['reliable', ''], ['privacy', '&s=privacy'], ['privacyask', '&s=privacy&ask=1']].filter(([name]) => !process.env.ONLY || process.env.ONLY.split(',').includes(name))) {
    const r = await run(port, scenario, query, frame);
    if (r.error) {
      failed += 1;
      console.log('not ok', scenario, '-', r.error);
      continue;
    }
    for (const [name, pass] of Object.entries(checks[scenario](r))) {
      if (!pass) {
        failed += 1;
      }
      console.log(pass ? 'ok' : 'not ok', name + (pass ? '' : ' - ' + JSON.stringify(r)));
    }
  }
  server.close();
  process.exit(failed ? 1 : 0);
});
