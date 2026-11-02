/* global log */

const offscreen = {
  // commands sent and not answered yet: the document they go to must stay
  pending: 0,
  // the document being made, which every command waits for
  creating: null
};

// One document, made once however many commands ask for it at the same time. A failure is
// logged, never thrown: a document that is there already (or still closing) serves as well,
// and a command that cannot reach one is answered with an error below.
offscreen.ready = () => {
  if (!offscreen.creating) {
    offscreen.creating = (async () => {
      try {
        const existingContexts = await chrome.runtime.getContexts({
          contextTypes: ['OFFSCREEN_DOCUMENT']
        });
        if (existingContexts.length === 0) {
          log('[offscreen]', 'creating...');
          await chrome.offscreen.createDocument({
            url: '/core/offscreen/index.html',
            reasons: ['AUDIO_PLAYBACK', 'DOM_SCRAPING'],
            justification: 'parse a command or play alert'
          });
        }
      }
      catch (e) {
        log('[offscreen]', 'create', e?.message || e);
      }
    })().finally(() => offscreen.creating = null);
  }
  return offscreen.creating;
};

// what a command waits for the document: its own requests to Gmail give up long before
offscreen.WAIT = 60000;
// the answer of the document; a document that closed meanwhile answers nothing, and one that
// does not answer in time is given up, so an action never stays unanswered
offscreen.send = request => new Promise(resolve => {
  const timer = setTimeout(resolve, offscreen.WAIT, {message: 'No answer from the offscreen document in time', error: 'timeout'});
  chrome.runtime.sendMessage({
    method: 'offscreen',
    request
  }, r => {
    clearTimeout(timer);
    const e = chrome.runtime.lastError;
    resolve(e ? {lost: e.message || 'No answer from the offscreen document'} : r);
  });
});

offscreen.command = async request => {
  offscreen.pending += 1;
  try {
    await offscreen.ready();
    let r = await offscreen.send(request);
    // the document closed between the look and the message: once more with a new one
    if (r?.lost) {
      await offscreen.ready();
      r = await offscreen.send(request);
    }
    // the shape each caller tells an error by: message (actions, search), error (sound)
    return r?.lost ? {message: r.lost, error: r.lost} : r;
  }
  finally {
    offscreen.pending -= 1;
  }
};

chrome.runtime.onMessage.addListener(request => {
  if (request.method === 'exit-offscreen') {
    // a command on its way keeps the document; it asks to exit again once that is done
    if (offscreen.pending || offscreen.creating) {
      log('[offscreen]', 'exit postponed', offscreen.pending);
      return;
    }
    chrome.offscreen.closeDocument().then(() => {
      log('[offscreen]', 'exited');
    }, e => log('[offscreen]', 'exit', e?.message || e));
  }
});
