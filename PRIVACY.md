# Mail Deck: privacy policy

Last updated: 2026-11-03

Mail Deck has no servers, no analytics and no tracking. Nothing it reads leaves your browser except the requests it sends to the mail services themselves: to Google for Gmail, and to each other mail service you turn on. If you turn on the AI assistant with your ChatGPT plan or your own Anthropic, OpenAI or Z.ai key, the mail it works on also goes to that provider, as described below.

## What it reads from Gmail

- **Unread mail.** Mail Deck reads the Gmail Atom feed (`mail.google.com/mail/u/N/feed/atom`) for each Google account you are signed in to in this browser. The browser sends your existing Google session cookies with those requests. Mail Deck never asks for, sees or stores your password.
- **Message text.** When you open a message in the panel, or point at it, Mail Deck loads that conversation's print view from `mail.google.com` and shows it in the panel, with links to its attachments.
- **Attachments.** To show a message's files on its line in the list before you open it, Mail Deck loads the print view of each Gmail conversation the list shows, two at a time, and reads only the names and links of its attachments. Loading it does not mark the mail as read, and its pictures are not loaded. The names and links are kept in session storage until the browser closes.
- **Gmail search.** When the panel opens, Mail Deck asks Gmail's own search on `mail.google.com` for the unread mail of each inbox, to show which mail is starred and the mail past the 20 the feed lists. When you type in the panel's search field, that query goes to the same search of each of your inboxes.
- **Account pictures.** About once a week Mail Deck loads each signed-in account's Gmail page from `mail.google.com` to find that account's own picture, which the panel then shows from Google's image server (`lh3.googleusercontent.com`).
- **Gmail's action token.** To mark mail as read, archive, delete or report spam, Mail Deck reads the `GMAIL_AT` cookie that Gmail sets for `mail.google.com` and sends it back to `mail.google.com` with the action, the same way the Gmail web page does.
- **Gmail tab requests.** If "Check when Gmail tabs or the network change" is on in settings (it is by default), Mail Deck notices when a Gmail tab sends a request to `mail.google.com` so it can refresh the unread count. It does not read, block or change those requests.

## Other mail services

Yahoo Mail, AOL Mail, Proton Mail, Yandex Mail and Mail.ru are off until you turn one on in Settings → Other mail. Chrome then asks you to allow that service's sites, listed below, one service at a time. Until you allow them, Mail Deck sends that service nothing. Turning a service off removes the permission again.

Each service is read the way its own web page reads it, with the session your browser already has on its site. Mail Deck never asks for, sees or stores your password, an app password or an OAuth token. As with Gmail, it reads the unread mail of the inbox (the sender, the subject, the time and, where the service gives one, a short snippet) and sends your actions, such as mark as read, archive, delete or report spam, back to the same service.

- **Yahoo Mail** (`mail.yahoo.com`). Mail Deck loads the Yahoo Mail page to read the mailbox id, your address and the token the page uses for changes. With those it asks Yahoo's mail interface on the same host (`mail.yahoo.com/ws/v3/batch`) for the folders and the unread inbox mail of the signed-in account, for a message's text when you open it in the panel, and to carry out your actions.
- **AOL Mail** (`mail.aol.com`). Mail Deck loads the AOL Mail page for a request id, then `mail.aol.com/ws/v3/mailboxes` for the mailbox id, your address and the token for changes. With those it asks `mail.aol.com/ws/v3/batch` for the folders and the newest inbox mail, of which it keeps the unread, for a message's text when you open it in the panel, and to carry out your actions.
- **Proton Mail** (`mail.proton.me`). Mail Deck reads the web app's version number from `mail.proton.me/assets/version.json`, without cookies, because Proton's interface expects it with every request. It then asks that interface (`mail.proton.me/api/`) which account each signed-in session is, the inbox's unread count, and the sender, subject and time of up to 20 unread messages, and sends your actions there. It never fetches message bodies, which are end-to-end encrypted, and never touches your keys: a Proton message opens on Proton's site. When a session has expired, Mail Deck renews it the way Proton's web app does (`mail.proton.me/api/auth/refresh`), unless a Proton Mail tab is open, which renews it itself. To tell, it looks only at the addresses of open tabs on `mail.proton.me`.
- **Proton's session cookies.** Proton's interface wants each session's id in a header (`x-pm-uid`). Mail Deck finds that id in the names of Proton's session cookies (`AUTH-<id>`, set for `mail.proton.me/api/`), which it lists with Chrome's cookies permission. It uses only the names, and only to address Proton's own interface. The cookies themselves go only to `mail.proton.me`, sent by the browser as it sends them for the web app.
- **Yandex Mail** (`api.passport.yandex.ru`, `mail.yandex.ru`, `mail.360.yandex.ru`). Mail Deck asks `api.passport.yandex.ru/accounts` which Yandex accounts the browser is signed in to. For each one it loads the mailbox page on `mail.yandex.ru`, or on `mail.360.yandex.ru` for a Yandex 360 mailbox, to read the token the page uses, and asks the mail interface on the same host (`/web-api/models/liza1`) for the unread inbox mail, the unread count and the folder list, and to carry out your actions. When you open a message in the panel, Mail Deck downloads that message's original from the same host and reads it inside the extension.
- **Mail.ru** (`portal.mail.ru`, `e.mail.ru`). Mail Deck asks `portal.mail.ru/NaviData` which Mail.ru mailboxes the browser is signed in to. For each one it gets the mailbox's token from `e.mail.ru/api/v1/user/short`, then asks `e.mail.ru/api/v1/` for the unread inbox mail and the folder counts, for a message when you open it in the panel, and to carry out your actions.

The interfaces of Yahoo Mail, AOL Mail, Yandex Mail and Mail.ru expect requests that come from their own web page. For each of these services you turn on, Mail Deck adds a Chrome rule (`declarativeNetRequest`, kept for the browser session) that sets the `Origin` and `Referer` headers to the service's own address, only on Mail Deck's own requests to that interface: `mail.yahoo.com/ws/`, `mail.aol.com/ws/`, `mail.yandex.ru/web-api`, `mail.360.yandex.ru/web-api` and `e.mail.ru/api/`. The rule matches only requests the extension itself sends in the background, never a request from a tab, and it does not read, block or change anything else. Turning the service off removes its rule. Proton Mail needs no such rule.

## The page you are on

When you open the panel with its toolbar button or its keyboard shortcut, Chrome lets Mail Deck read the address of the tab you are on, for that tab only (the `activeTab` permission). Mail Deck takes the site's domain from it and shows, at the top of the panel, the unread mail whose sender is that site, with a one-time code ready to copy. The comparison happens inside the panel. The address is not stored and is not sent anywhere. In the side panel this works only for tabs on which you used the toolbar button.

## AI assistant

The AI assistant is off until you turn it on. Its buttons show in the panel from the start and, while it is off, only offer to turn it on (Settings → AI can hide them): nothing is sent to any provider before you choose one. Once on, it can:

- summarize the conversation you are reading, with its key points, what it asks of you and its dates (with links that open Google Calendar's own "new event" page);
- draft a reply to it, answer a question about it, or translate it;
- take a request in your own words in the assistant ("when is my flight?", "invoices from October", "write to Anna that…"): find the mail with Gmail's search in your accounts and among the other services' unread mail, answer from what it found, sum up your unread mail, or draft a new mail;
- sort unread mail into mail waiting for your reply, important mail, and newsletters you can clear without reading.

A draft only ever opens in your mail service's compose window, or is copied: the assistant never sends mail for you.

You choose where it runs:

- **On this computer.** Chrome's built-in model runs on your device, and nothing is sent anywhere. Chrome downloads the model from Google once, from your click.
- **Your ChatGPT plan.** **Continue with ChatGPT** signs in with OpenAI's official "Sign in with ChatGPT" for open-source apps (OAuth with PKCE). Chrome first asks you to allow `auth.openai.com` and `api.openai.com`, and `127.0.0.1`; until then Mail Deck sends OpenAI nothing. OpenAI sends you back to `http://127.0.0.1:1455/auth/callback` after you sign in, an address on your own computer where nothing listens: a Chrome rule (`declarativeNetRequest`, for that one address, removed when the sign-in ends or after 15 minutes) takes that visit to Mail Deck's own page instead, so the sign-in code never reaches the network or any program on your computer, and Mail Deck then gives back its access to `127.0.0.1`. Mail Deck checks the identity token against OpenAI's published keys and keeps the tokens OpenAI issues (an access token renewed every hour, a refresh token and the identity token), with your account's email address, shown to say which account is signed in, and an account id it does not show. Requests then go to `api.openai.com` with them, and use the usage included in your ChatGPT plan, which you manage in ChatGPT's settings. Signing out revokes the sign-in at OpenAI, deletes the tokens here and gives back Chrome's access to `auth.openai.com` (and to `api.openai.com`, unless an OpenAI key still uses it); if OpenAI does not confirm the revocation, Mail Deck says so, and you can disconnect it in your ChatGPT settings.
- **Anthropic, OpenAI or Z.ai, with your own API key.** When you connect a provider, Chrome asks you to allow its site (`api.anthropic.com`, `api.openai.com` or `api.z.ai`); until then Mail Deck sends it nothing.

Requests go from your browser straight to that provider; Mail Deck has no servers in between. Each request sends only what it needs, with the current date, time and time zone so that dates such as "tomorrow at 3" can be read:

- a summary, a reply, a translation or a question about a mail: the text of that conversation (sender names, dates and message text) and its subject, when you ask (or, for summaries, by itself for long mail if you chose that);
- a request to the assistant: your words, then the sender, subject, date and text of the first few mails the search found and the sender, subject and preview of the rest, up to 30;
- "what's important": the sender, subject and preview of your unread mail, up to 60;
- sorting: the sender, subject and preview of unread mail from the last 14 days, 20 messages at a time, from senders other than your own addresses.

The provider handles this data under its own terms: [OpenAI](https://openai.com/policies/row-privacy-policy/), [Anthropic](https://www.anthropic.com/legal/privacy), [Z.ai](https://docs.z.ai/legal-agreement/privacy-policy).

Your API keys and the ChatGPT sign-in (its tokens, the app id OpenAI issued to this browser, an anonymous random id of this browser that OpenAI asks for, and your account's email address) are kept only in this browser's extension storage on your device (`chrome.storage.local`). They are never part of a settings backup or of Chrome sync, never shown in diagnostics, and sent only to their own provider. Disconnect removes them and Chrome's access to the provider. A summary (its key points, what it asks of you, its dates and details, not the mail itself) is kept on your device for 7 days, at most 200 of them, so a mail opened again shows it at once; the assistant's conversation is kept in session storage, in memory only, until the browser closes. How a mail was sorted (waiting for a reply, important or newsletter, and a few words why) is kept on your device for 30 days, so the same mail is not sent again.

Translation by Chrome's own translator (**Translate from …** in an open message) runs on your computer and needs no assistant: Chrome may download a language pack from Google once, from your click, and nothing of the mail leaves your device.

## The clipboard

When you turn on Settings → Notifications → **Copy sign-in codes from notifications**, Chrome asks you to let Mail Deck write to the clipboard (the optional `clipboardWrite` permission). Then a new mail's notification that carries a one-time code has a **Copy** button: a click puts that code, found in the mail's subject or preview, on your clipboard. Mail Deck never reads the clipboard, and nothing is sent anywhere. Turning the switch off gives the permission back.

## Where it goes

To the mail services themselves: `mail.google.com` for Gmail, and the sites above for each other service you turn on. A service's mail, addresses and tokens go only to that service. To the AI provider you chose, if you did, as described above. And to Google in two more cases:

- **Sender icons.** For mail in your Gmail inboxes, the panel shows the sender's site icon from Google's icon service (`www.google.com/s2/favicons`), which receives the sender's domain, such as `github.com`, never an address or a message. Like any request your browser makes to Google, it may carry your Google cookies. Mail of the other services gets no icon from Google. "Show sender logos" in settings turns this off.
- **Chrome sync.** If you turn on the settings copy in Chrome sync, your Mail Deck settings are stored with `chrome.storage.sync`, which Chrome keeps in your Google account like your other synced data. It is off by default.

**Pictures and trackers.** A Gmail message you open in the panel shows its pictures through Google's image proxy, as Gmail does, unless you turn on "Ask before showing pictures in Gmail mail" (Settings → Panel → More options); then they wait for Show pictures. In a message of another service, pictures from the internet always wait for Show pictures. Before anything of a message loads, Mail Deck checks each of its pictures inside the extension: a picture that only reports that you opened the message (a known open-tracking pixel, or a hidden or one-pixel picture whose address could identify you) is never loaded, not even by Show pictures, and the panel says how many it kept out and whose. The list is built into Mail Deck: nothing is downloaded or sent to check a picture.

**Sender warnings.** For the message you open, the panel compares the sender's name and address, and its Reply-To when Gmail shows one, with a list of well-known brands and domains built into Mail Deck, and says so when they do not match. This happens inside the panel; nothing is sent anywhere.

**Unsubscribe.** When you open a Gmail message, Mail Deck reads its header from `mail.google.com` (only the lines that say how to unsubscribe, the message id and Gmail's own check of the sender's signature) to offer Unsubscribe. Nothing is sent until you choose Unsubscribe and confirm: then, as the sender's header asks, Mail Deck either sends one request to the sender's unsubscribe address, with no cookies and nothing about you but what that address already holds, or opens a pre-filled email in Gmail for you to send, or opens the sender's page in a tab.

Mail Deck does not send your mail, addresses, cookies or settings to its author, or to anyone other than the services named above. It does not sell or share data, and it does not use your data for advertising or credit decisions.

## What it stores

Your settings (including which mail services you turned on), the order of your inboxes, the reminders you set and the current unread counts are kept in the browser's extension storage (`chrome.storage`) on your device. So that a message opens at once, the last messages you opened (or, in Gmail, pointed at), from any service, up to 3 MB, and Gmail's answers to the panel's searches, are kept in the session part of that storage: in memory only, never written to disk, and gone when the browser closes. An action you just took waits out its five-second Undo in the extension's storage on your device, so that a browser closing meanwhile does not lose it. The same session storage holds what the other services need between checks: the tokens their pages hand out, which Proton session is which account, each service's last answer, shown for up to 30 minutes when a check fails, and which listed message belongs to which mailbox. Reminders never reach Gmail or any other service. Removing the extension deletes all of it, except a settings copy you chose to keep in Chrome sync, which you can turn off in settings.

## Contact

Questions or problems: open an issue at https://github.com/nord-express/mail-deck/issues.
