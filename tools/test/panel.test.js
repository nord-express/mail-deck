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
    'Show pictures brings back its SVG images and posters; a style that fetches never does': r.pixelsAfter?.['services-svc-svg'] >= 1 && r.pixelsAfter?.['services-svc-poster'] >= 1 && !r.pixelsAfter?.['services-svc-css'],
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
    'the chip narrows the list to that mail; Esc lets go': JSON.stringify(r.narrowed) === '["a1","b1"]' && r.letGo,
    'a check with nothing new asks nothing; new mail is asked about, alone': r.quietCheck && r.newMail,
    'the reader has a Summary button; nothing is asked before a click': r.button,
    'I asks: the card waits, then the points stream in': r.waiting && r.streams,
    'the summary: points, to do, dates, for that mail and its version, from the whole thread':
      JSON.stringify(r.summary) === '{"points":3,"todo":1,"events":2,"key":true,"messages":3,"fresh":false}',
    'each date links to Google Calendar in the mail\'s own account': r.calendar,
    'with the card open the message keeps room (140px at least) and the header gives way': r.room?.body >= 140 && r.room.files === 'none' && r.room.inside,
    'Copy copies the summary with its headings': r.copied,
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
    'the assistant opens from the header, its field focused, its suggestions and engine shown': r.opened && r.engine === 'OpenAI · gpt-test',
    'find: every Gmail account searched with the planned query, what it found listed': r.findQuery === 3 && r.found === 4 && r.foundOpen === true,
    'a question: the mail found read whole, an answer with a citation': r.answer === 'The invoice #1042 is ready 1.' && r.answerMail === 4 && r.readWhole && r.cite,
    'a citation opens its mail in the reader, and Esc comes back to the assistant': r.citeOpens && r.backToAssist,
    'a new mail: its fields filled and changed, then Gmail\'s compose window with them': JSON.stringify(r.email) === '["anna@figma.com","Встреча в пятницу"]' &&
      r.compose.includes('view=cm') && r.compose.includes('to=anna%40figma.com') && r.compose.includes('su=' + encodeURIComponent('Встреча: пятница')) && r.compose.includes('body=' + encodeURIComponent('Анна, привет!')),
    'what is important: the unread mail read by its preview; the conversation kept for the session': r.brief >= 5 && r.kept === 4,
    'stop ends an answer underway, with Ask again': r.stopped,
    'a usage limit offers Manage usage first': r.limit,
    'Esc in its field closes it': r.closed
  }),
  aitools: r => ({
    'the sorting: a chip for each kind found, the list narrowed with all of it read at once': JSON.stringify(r.chips) === '["reply","important","bulk"]' &&
      r.bar === T('importantShown', 1) && JSON.stringify(r.barShown) === JSON.stringify([T('importantList'), '1']) && r.narrowed === 1 && r.readAll,
    'the open mail offers a summary, a reply, a translation and a question': JSON.stringify(r.strip) === '["ai:sparkle","ai:reply","ai:translate","ai:ask"]',
    'a reply drafted from an intent opens in Gmail\'s compose window with the text': r.draft.startsWith('Привет, Аня!') && r.draftCall.intent === T('intentYes') &&
      r.draftCall.reader === 'evgeny@example.com' && r.replyUrl.includes('to=anna%40figma.com') && r.replyUrl.includes('su=Re%3A') && r.replyUrl.includes('body=' + encodeURIComponent('Привет, Аня!')),
    'a question about the mail is answered from its messages; Esc in the field closes the card only': r.askFocused && r.ask && r.escCard,
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
  aireal: r => ({
    'the real ai.js comes after the list\'s first frame; with no key the card says so, and nothing is classified':
      r.loadedAfter && r.noKey && r.noChip && r.consoleClean === true
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
    'the reader\'s bar: back, the arrows, its place, then the actions, Reply by name, and ⋯ with Open, Spam and the keys': JSON.stringify(r.bar) ===
      '["back","up","down","pos","box","grow","read","archive","trash","clock","sep","star","reply","more"]' && JSON.stringify(r.more) === '["O","!","?"]' && r.moreClosed,
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
  narrow: r => ({
    'a 320px side panel: the mailbox line keeps whole buttons, without copy and Meet, and a readable address':
      r.width === 320 && JSON.stringify(r.buttons) === '["readAll:32","archive:32","open:32"]' && r.addr >= 60,
    'a 320px side panel: the reader\'s bar stays inside': r.barInside,
    'a 320px side panel: the reader\'s date stands under the sender': r.dateBelow
  })
};

server.listen(0, '127.0.0.1', async () => {
  const {port} = server.address();
  let failed = 0;
  for (const [scenario, query, frame] of [['main', ''], ['speed', ''], ['services', '&s=services'], ['wide', '&wide=1'], ['keys', ''], ['narrow', '&side', 320],
    ['files', ''], ['codes', '&s=codes'], ['advance', '&advance=1'], ['readnext', '&read=1'], ['seen', '&badge=new'],
    ['site', '&s=site&url=' + encodeURIComponent('https://github.com/login?return_to=%2Fsettings')],
    ['ux', ''], ['boot', '&boot=1'], ['pin', '&pinned=0'], ['ai', '&ai=on'], ['aiassist', '&ai=on'], ['aitools', '&ai=on'], ['aiauto', '&ai=on&summary=auto'], ['aioff', '&ai=off'], ['ainone', '&ai=off&buttons=0'], ['aireal', '&ai=real'], ['reliable', '']].filter(([name]) => !process.env.ONLY || process.env.ONLY.split(',').includes(name))) {
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
