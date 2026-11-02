/* global toast */

{
  const parseUri = str => {
    const uri = new URL(str);
    if (uri.hostname.startsWith('mail.google')) {
      // https://mail.google.com/mail/u/0/#inbox
      // https://mail.google.com/mail/u/0/#inbox/TEST_MESSAGE_ID
      uri.messageId = (/message_id=([^&]*)|#[^/]*\/([^&]*)/.exec(uri.href) || [])[1] || uri.hash.split('/')[1] || '';
      {
        const a = uri.hash.substr(1).replace('label/', '').split('/');
        a.pop();
        uri.label = a.length ? a.join('/') : '';
      }
    }
    return uri;
  };

  // Gmail's compose window (view=cm): a new mail, a reply, an unsubscribe by mail
  const COMPOSE = /^https:\/\/mail\.google\.com\/mail\/(u\/\d+\/)?\?(.*&)?view=cm(&|$)/;
  // a mail's file, its print view or its original (view=att, pt, om): a page of its own, which a
  // Gmail tab that is open would only be brought to the front for, and which should not take the
  // place of the page in front
  const DOCUMENT = /^https:\/\/mail\.google\.com\/mail\/(u\/\d+\/)?\?(.*&)?view=(att|pt|om)(&|$)/;
  const POPUP = {width: 720, height: 640};
  // a window of its own, small and over the middle of the window in front, without the tabs and
  // the address bar of a whole one
  const popup = async url => {
    const front = await chrome.windows.getLastFocused().catch(() => null);
    const at = front?.width && front.state !== 'minimized' ? {
      left: Math.round(front.left + Math.max(0, front.width - POPUP.width) / 2),
      top: Math.round(front.top + Math.max(0, front.height - POPUP.height) / 3)
    } : {};
    return chrome.windows.create({url, type: 'popup', focused: true, ...POPUP, ...at})
      .catch(() => chrome.windows.create({url, type: 'popup', focused: true, ...POPUP}));
  };

  self.openLink = (url, inBackground, refresh) => {
    url = url.replace('@private', ''); // some urls might end with "@private" for private mode

    chrome.storage.local.get({
      'ignoreOpens': false,
      'searchMode': true, // true: current window only, false: all open windows
      'onGmailNotification': true,
      'currentTab': false,
      'newWindow': false,
      'relatedToCurrent': false,
      'background': false,
      // Gmail's compose window opens as a window of its own; false: where Gmail opens
      'compose.popup': true
    }, async prefs => {
      if (prefs['compose.popup'] !== false && COMPOSE.test(url)) {
        popup(url);
        return;
      }
      const file = DOCUMENT.test(url);
      const mode = file ? 0 : prefs.currentTab ? 2 : (prefs.newWindow ? 1 : 0);

      const tabs = prefs.ignoreOpens || file ? [] : await new Promise(resolve => {
        const options = {};
        if (prefs.searchMode) {
          options.currentWindow = true;
        }
        chrome.tabs.query(options, tabs => resolve(tabs.filter(t => t.url)));
      });

      const parse2 = parseUri(url);

      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        if (tab.url === url) {
          if (prefs.onGmailNotification && tab.active) {
            toast(chrome.i18n.getMessage('msg_1'));
          }
          const options = {
            active: true
          };
          if (refresh) {
            options.url = url;
          }
          chrome.tabs.update(tab.id, options);
          chrome.windows.update(tab.windowId, {
            focused: true
          });
          return;
        }
        const parse1 = parseUri(tab.url);
        // Only if Gmail
        if (
          parse1.hostname.startsWith('mail.google') &&
          parse1.hostname === parse2.hostname &&
          parse1.pathname.indexOf(parse2.pathname) === 0 &&
          !/to=/.test(url) &&
          !/view=cm/.test(url)
        ) {
          const reload = refresh ||
            (parse2.messageId && tab.url.indexOf(parse2.messageId) === -1) ||
            (parse1.messageId && !parse2.messageId); // when opening INBOX when a thread page is open

          if (tab.active && !reload) {
            if (prefs.onGmailNotification) {
              chrome.windows.getCurrent().then(w => {
                if (w.id === tab.windowId) {
                  toast(chrome.i18n.getMessage('msg_1'));
                }
              });
            }
          }
          const options = {
            active: true
          };
          if (reload) {
            options.url = url;
          }
          chrome.tabs.update(tab.id, options);
          chrome.windows.update(tab.windowId, {
            focused: true
          });

          return;
        }
      }
      const focused = typeof inBackground === 'undefined' ? !prefs.background : !inBackground;
      // no window open (macOS keeps the browser running without one): a window of its own
      const create = options => chrome.tabs.create(options).catch(() => chrome.windows.create({url, focused: true}));
      if (mode === 2) {
        chrome.tabs.query({
          active: true,
          currentWindow: true
        }, ([tab] = []) => tab ? chrome.tabs.update(tab.id, {url}) : create({url}));
      }
      else if (mode === 0) {
        chrome.tabs.query({
          active: true,
          currentWindow: true
        }, ([tab] = []) => {
          const options = {
            url,
            active: focused
          };
          if (prefs.relatedToCurrent && tab) {
            options.index = tab.index + 1;
          }
          create(options);
        });
      }
      else {
        chrome.windows.create({
          url,
          focused
        });
      }
    });
  };
}
