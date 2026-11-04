/* global gmail */
const ids = new Set();

const exit = () => {
  clearTimeout(exit.id);
  console.info('%c[offscreen iframe]', 'color:#ff9900', 'exit request', ids.size);
  exit.id = setTimeout(() => {
    if (ids.size === 0) {
      chrome.runtime.sendMessage({
        method: 'exit-offscreen'
      });
    }
  }, 60000);
};

const play = request => new Promise((resolve, reject) => {
  stop();
  const audio = document.createElement('audio');
  audio.setAttribute('preload', 'auto');
  audio.setAttribute('autobuffer', 'true');
  audio.setAttribute('autoplay', 'true');
  audio.onended = audio.onerror = e => {
    ids.delete(request.id);
    exit();
  };
  audio.iid = request.id;
  document.body.append(audio);

  const {index, media, prefs} = request;

  // 0-3: a built-in sound; 4: the user's own file, a data: URL of audio or video read by the
  // settings page (data/settings/index.js checks the same). Anything else, an address to fetch
  // above all, plays the first built-in sound.
  const {type, file} = index === null ? media.default : media['custom' + index];
  const own = type === 4 && typeof file === 'string' && file.length <= 10 * 1024 * 1024 &&
    /^data:(audio|video)\/[\w.+-]+(;\s*[\w.+-]+=[\w.+"-]+)*;base64,/i.test(file.slice(0, 200));
  audio.src = own ? file : '/data/sounds/' + ([0, 1, 2, 3].includes(type) ? type : 0) + '.mp4';
  audio.volume = prefs.soundVolume / 100;
  audio.play().then(() => resolve(true), e => reject(e));
});

const stop = () => {
  for (const e of document.querySelectorAll('audio')) {
    e.pause();
    e.remove();
    ids.delete(e.iid);
  }
  exit();
};

// A sign-in code a notification's button copies (core/check.js). This document never has the
// focus navigator.clipboard asks for; the copy command needs none once the user has let the
// extension write the clipboard (clipboardWrite). Firefox's background keeps the clipboard API.
const copy = async text => {
  if (typeof text !== 'string' || text === '') {
    throw Error('nothing to copy');
  }
  const area = document.createElement('textarea');
  area.value = text;
  document.body.append(area);
  area.select();
  let done = false;
  try {
    done = document.execCommand('copy');
  }
  catch (e) {}
  area.remove();
  if (!done) {
    await navigator.clipboard.writeText(text);
  }
  return true;
};

chrome.runtime.onMessage.addListener(({request, method}, sender, response) => {
  if (method === 'offscreen') {
    console.info('%c[offscreen iframe]', 'color:#ff9900', 'request', request);
    clearTimeout(exit.id);
    const id = request.cmd + ';' + Math.random();
    request.id = id;
    ids.add(id);

    if (request.cmd === 'play') {
      play(request).then(() => response(true), e => response({
        error: e.message
      }));

      return true;
    }
    else if (request.cmd === 'stop') {
      stop(request);
      response(true);
      ids.delete(request.id);
      exit();
    }
    else if (request.cmd === 'copy') {
      copy(request.text).then(() => response(true), e => response({
        error: e?.message || String(e)
      })).finally(() => {
        ids.delete(request.id);
        exit();
      });
      return true;
    }
    else if (request.cmd === 'gmail.action') {
      gmail.action(request.request).then(() => response(true)).catch(e => {
        console.error(e);
        response({
          message: e.message,
          details: e.details
        });
      }).finally(() => {
        ids.delete(request.id);
        exit();
      });
      return true;
    }
    else if (request.cmd === 'gmail.search' || request.cmd === 'gmail.headers' || request.cmd === 'gmail.send') {
      ({'gmail.search': gmail.search, 'gmail.headers': gmail.headers, 'gmail.send': gmail.send})[request.cmd](request.request).then(response).catch(e => {
        console.error(e);
        response({
          message: e.message,
          details: e.details
        });
      }).finally(() => {
        ids.delete(request.id);
        exit();
      });
      return true;
    }
  }
});
