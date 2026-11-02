# Chrome Web Store listing: Mail Deck

Copy-paste fields for the Developer Dashboard (https://chrome.google.com/webstore/devconsole). Package: zip the contents of `extension/` (manifest.json at the zip root).

## Store listing tab

**Store metadata rule** (the 1.3.0 submission was rejected for keyword spam, 2026-10-31): the summary, the description, the screenshots and the promo tile must not list the mail services' names. Name Gmail only where a Gmail feature is described, call the rest "other mail services", and leave the list to the website. The same goes for the AI assistant: no AI company or model names (no OpenAI, Anthropic, Claude, ChatGPT or Gemini); say "Chrome's built-in model" and "your own API key from a supported AI provider".

**Name** (from the manifest): Mail Deck

**Summary** (from the manifest's `appDescription` in `extension/_locales/en/messages.json`, 118 of 132 chars):

```
Unread mail from every inbox you're signed in to, in one fast panel. Read, archive or delete it without opening a tab.
```

**Description:**

```
Mail Deck puts the unread mail of every inbox you're signed in to into one panel on the toolbar.

It works through the session your browser already has, the way each mail service's own web page does: no password, no app password, no OAuth, no servers of ours. Gmail works at once. Several other popular webmail services can be turned on in Settings → Other mail; Chrome then asks you to allow that service's sites, and turning it off takes the permission back. The website lists the services Mail Deck supports.

Click a message to read it right in the panel. You can mark it as read, archive it, delete it or report it as spam without opening a tab. Click a mailbox to open it on its own site.

Open the panel on a website and that site's mail is at the top, from every inbox, with a fresh sign-in code ready to copy.

Features
- Every signed-in mailbox, each with its own colour, in the order you drag them to
- Whole conversations in the panel, attachments included
- A message's attachments show on its line before you open it, with their kind; a click opens the file
- One-time codes stand out in the list, the message and the notification; a click or C copies them
- Tracking pixels never load, and the reader says how many it kept out; a calm warning when a sender is not who the name says
- Unsubscribe from a newsletter in one click, after you confirm, and archive what it left unread
- Gmail: up to ten accounts, search as you type and across accounts, saved searches, its categories as chips, stars, mark as unread, chosen labels or only the Primary tab, and a video meeting in one click
- Remind me later: put a message away until this evening, tomorrow or next week
- Read, archive, delete or report spam from the panel or a notification, with Undo
- Pictures in mail from other services load only when you ask for them
- Notifications and an optional sound, with quiet hours, quiet inboxes and sender rules
- A notification names its inbox and can come back while the mail stays unread
- Choose what the toolbar count shows: leave an inbox out, or count only mail since you last opened the panel
- Side panel, a keyboard shortcut, one key per action, and ? to see them all
- While you read, J and K open the next or previous message
- Light and dark theme, following your system
- Settings with a search, and a backup to a file or Chrome sync
- Free, with no limit on accounts and no paid tier

The other mail services have no public interface for this, so Mail Deck follows their own web apps, and a change on their side can stop one until Mail Deck is updated.

AI assistant
Its buttons are there from the start, and nothing is sent anywhere until you turn it on.
- Ask your mail in plain words, like "when is my flight?" or "invoices from October": it searches every Gmail account, reads what it finds and answers with a reference to each mail
- What's important: your unread mail summed up, what needs you soon first
- Write a new email, or a reply in the thread's language, to check and send from your mail service
- A summary of the conversation you're reading, with its dates for Google Calendar, and answers to your questions about it
- Unread mail sorted: waiting for your reply, important, and newsletters to clear in one go
- Translate a message into your language with Chrome's own translator, on your computer
It runs with Chrome's built-in model on your computer, or with a supported AI provider: your own API key, or a sign-in with your subscription where the provider allows it. The built-in model is free and private but does not run on every computer.

Privacy
Mail Deck has no servers of its own and no analytics. It talks only to Google and to the mail services you turn on, each with the session your browser already has, and each service's mail goes only to that service. The one addition is the AI assistant, if you connect a provider: what a request needs (the conversation you summarize or reply to, the mail a question found, the sender, subject and preview of unread mail it sorts) then goes from your browser straight to that provider. Keys and sign-ins stay on this computer, and with Chrome's built-in model your mail does not leave it. Unsubscribe sends one request to the sender's own unsubscribe address, and only after you confirm. The address of the page you're on is read only inside the panel, never stored or sent. Mail Deck never asks for or stores your password, and your settings stay in your browser.

Mail Deck is open source under the Mozilla Public License 1.1: https://github.com/nord-express/mail-deck
It is not made by or affiliated with any mail provider. Gmail is a trademark of Google LLC.
```

**Category:** Productivity → Communication

**Language:** English

**Store icon:** `extension/data/icons/red/128.png` (128×128)

**Screenshots** (1280×800, in this order; each carries its caption, title / line under it):

1. `store/screenshot-1-inbox.png`: Every inbox in one panel / Each account you are signed in to, its attachments in sight, and unread mail sorted for you.
2. `store/screenshot-2-assistant.png`: Ask your mail anything / What is important, when the flight is, which invoice: answers with a link to each mail.
3. `store/screenshot-3-reply.png`: Replies drafted for you / In the thread's language and tone, from a quick choice or your own words, ready to send.
4. `store/screenshot-4-site.png`: Mail from the site you’re on / Open the panel on a site and its mail is on top, with the sign-in code ready to copy.
5. `store/screenshot-5-summary.png`: The gist before you read / An AI summary with what it asks of you and its dates, on your computer or with your provider.

In the dashboard, remove the five screenshots of 1.4 (inbox, summary, site, later, AI settings) and upload these five in this order. **Small promo tile:** `store/promo-440x280.png`.

**Other languages:** translated summaries and descriptions are in `store/listing-translations.md`.

**Official URL / Homepage URL:** https://nord-express.github.io/mail-deck/

**Support URL:** https://github.com/nord-express/mail-deck/issues

## Privacy tab

**Single purpose:**

```
Show the unread mail of the webmail accounts the user is signed in to in this browser (Gmail, and Yahoo Mail, AOL Mail, Proton Mail, Yandex Mail or Mail.ru once the user turns them on) in a toolbar panel or Chrome's side panel, and let the user read, search, archive, delete, star or mark it as read, or set a reminder for it, from there. Optionally, and only once the user turns it on, an AI model the user chooses (Chrome's built-in model, the user's ChatGPT plan, or the user's own Anthropic, OpenAI or Z.ai API key) helps with that mail: it summarizes, translates, answers questions about it, finds it from a request in plain words, drafts replies and new mail for the user to send, and sorts unread mail.
```

**Permission justifications:**

| Permission | Justification |
|---|---|
| `notifications` | Shows a desktop notification when new mail arrives, with buttons to mark it as read, archive or delete it, and shows an error notice when an action or the alert sound fails. |
| `contextMenus` | Adds the right-click menu on the toolbar icon: open Gmail, refresh now, compose an email, turn notifications off for a while or for the session, and choose which accounts are included. |
| `webRequest` | Observes (never blocks or modifies) requests that the user's own Gmail tabs send to mail.google.com, so the unread count refreshes right after the user reads or archives mail in Gmail. The user can turn this off in settings. |
| `storage` | Saves the user's settings (including saved searches, which mail services are on, and the AI settings), the inbox order, labels by account, reminders, an action waiting out its Undo, the accounts' picture addresses and the unread counts in local extension storage; if the user connects an AI provider, also their own API key or ChatGPT sign-in (on this device only: never in a backup or Chrome sync), AI summaries for 7 days and, for 30 days, how a mail was sorted; keeps the last opened messages, search answers, attachment names and the assistant's conversation in session storage (memory only) so they open at once, with the session tokens of each other mail service turned on; and, only if the user turns it on, a copy of the settings (without keys) in Chrome sync. |
| `alarms` | Schedules the periodic mail check and the reminders the user sets, and removes old notifications after a set time. |
| `idle` | Lets the user mute notifications and sounds while away or while the screen is locked, and rechecks mail when the user comes back. |
| `offscreen` | Opens an offscreen document to play the new-mail sound and to parse Gmail's responses when performing actions and searches, since the service worker has no audio or DOM. |
| `sidePanel` | Lets the user keep the same Mail Deck panel open in Chrome's side panel next to the page, from a button in the toolbar panel. It shows only Mail Deck's own page. |
| `cookies` | Reads two kinds of cookie only. For Gmail, the GMAIL_AT cookie of mail.google.com, the token Gmail's own web page sends with actions, so that mark as read, archive, delete and spam requests are accepted by Gmail; its value is sent only to mail.google.com. For Proton Mail, once the user turns it on, the names of Proton's session cookies (AUTH-<id>) for mail.proton.me/api/: the name carries the session's id, which Proton's own API expects in its x-pm-uid header. Only the names are used, only to address that API, and nothing from them goes anywhere but mail.proton.me. |
| `declarativeNetRequestWithHostAccess` | (2) Only while the user signs in with ChatGPT: OpenAI returns the sign-in to the loopback address http://127.0.0.1:1455/auth/callback, and a session rule redirects that one address to the extension's own callback page, so the code never reaches the network; the rule is removed when the sign-in ends. (1) The mail APIs of Yahoo Mail (mail.yahoo.com/ws/), AOL Mail (mail.aol.com/ws/), Yandex Mail (mail.yandex.ru/web-api, mail.360.yandex.ru/web-api) and Mail.ru (e.mail.ru/api/) expect requests that come from their own web page. For each of these services the user turned on and granted, Mail Deck adds a session rule that sets the Origin and Referer headers to the service's own address. Each rule matches only the extension's own background requests to that API (initiator: the extension; no tab; XHR/fetch only), never a request from a page or tab, and is removed when the service is turned off. It does not block, redirect or read any request. |
| Optional `clipboardWrite` | Asked only when the user turns on Settings → Notifications → Copy sign-in codes from notifications, and given back when it is turned off. Writes the one-time sign-in code of a new mail to the clipboard when the user clicks the notification's Copy button. The extension never reads the clipboard and sends nothing anywhere. |
| `activeTab` | When the user opens the panel with the toolbar button or its keyboard shortcut, reads the address of the active tab so that the panel can put the unread mail sent from that site at the top, with its one-time sign-in code ready to copy. Only the site's domain is used, and only inside the panel; the address is never stored or sent. Nothing is injected into the page and the page is not read or changed. |
| Host `https://mail.google.com/*` | Reads the Gmail Atom feed of unread mail for each signed-in account; loads a conversation's print view to show it in the panel; runs Gmail's own search for the user's query and for stars and unread mail past the feed's 20; loads each account's Gmail page about once a week to find that account's picture, and once per session for Gmail's ID key; sends the user's read, archive, delete, spam and star actions; and lets the webRequest observer above see Gmail's sync requests, so the count updates after the user acts in a Gmail tab. |
| Optional host `https://mail.yahoo.com/*` | Asked only when the user turns Yahoo Mail on in Settings → Other mail, and removed when it is turned off. Reads the Yahoo Mail page for the mailbox id, the address and the token the page uses for changes; asks Yahoo's mail API on mail.yahoo.com for the folders and the unread inbox mail; loads a message's text when the user opens it in the panel; and sends the user's read, archive, delete and spam actions. |
| Optional host `https://mail.aol.com/*` | Asked only when the user turns AOL Mail on, and removed when it is turned off. Reads the AOL Mail page and its mailboxes call for the mailbox id, the address and the token for changes; asks AOL's mail API on mail.aol.com for the folders and the newest inbox mail; loads a message's text when the user opens it in the panel; and sends the user's read, archive, delete and spam actions. |
| Optional host `https://mail.proton.me/*` | Asked only when the user turns Proton Mail on, and removed when it is turned off. Reads the web app's version number, which Proton's API expects; asks Proton's API on mail.proton.me which account each signed-in session is, the inbox's unread count and the sender, subject and time of unread messages; renews an expired session the way the web app does, unless a Proton Mail tab is open; and sends the user's read, archive, delete and spam actions. It never fetches message bodies, which are end-to-end encrypted. |
| Optional hosts `https://api.passport.yandex.ru/*`, `https://mail.yandex.ru/*`, `https://mail.360.yandex.ru/*` | Asked only when the user turns Yandex Mail on, and removed when it is turned off. Asks api.passport.yandex.ru which Yandex accounts the browser is signed in to; reads each mailbox page on mail.yandex.ru, or mail.360.yandex.ru for a Yandex 360 mailbox, for the token the page uses; asks the mail web API on the same host for the unread inbox mail, the unread count and the folder list; downloads a message's original when the user opens it in the panel; and sends the user's read, delete and spam actions. |
| Optional hosts `https://portal.mail.ru/*`, `https://e.mail.ru/*` | Asked only when the user turns Mail.ru on, and removed when it is turned off. Asks portal.mail.ru which Mail.ru mailboxes the browser is signed in to; gets each mailbox's API token from e.mail.ru; asks e.mail.ru's mail API for the unread inbox mail and the folder counts; loads a message when the user opens it in the panel; and sends the user's read, delete and spam actions. |
| Optional hosts `https://api.openai.com/*`, `https://api.anthropic.com/*`, `https://api.z.ai/*` | Asked only when the user connects that AI provider in Settings → AI (an API key, or for api.openai.com also the ChatGPT plan), and removed on Disconnect. Checks the key or sign-in and lists the models; then, from the browser straight to that provider's API, sends what the user's request needs: a conversation's text and subject for a summary, a reply draft, a translation or a question about it; the user's words and the mail Gmail's search found for a request to the assistant; and the sender, subject and preview of unread mail to sort it. Nothing goes to a provider the user has not connected. |
| Optional hosts `https://auth.openai.com/*`, `http://127.0.0.1/*` | Asked only when the user chooses Continue with ChatGPT, OpenAI's official sign-in for open-source apps, and removed on sign-out. auth.openai.com: the OAuth (PKCE) token exchange, refresh and revocation, and OpenAI's published keys to check the identity token. 127.0.0.1: OpenAI returns the sign-in to http://127.0.0.1:1455/auth/callback; the session rule above redirects that address to the extension's own page, so no request goes to 127.0.0.1 at all. |

**Host permission justification** (the dashboard has one field for all hosts, at most 1000 characters):

```
mail.google.com: reads the unread-mail feed of each signed-in account, opens a conversation in the panel, runs Gmail's own search and sends the user's read, archive, delete, spam and star actions. Optional, each asked only when the user turns that feature on and removed when it is turned off: Yahoo (mail.yahoo.com), AOL (mail.aol.com), Proton (mail.proton.me), Yandex (api.passport.yandex.ru, mail.yandex.ru, mail.360.yandex.ru) and Mail.ru (portal.mail.ru, e.mail.ru) read that service's unread mail with the browser's own session and send the user's actions; the AI providers (api.openai.com, api.anthropic.com, api.z.ai) receive only what an AI request of the user needs; auth.openai.com and 127.0.0.1 serve Sign in with ChatGPT: the token exchange, and the 127.0.0.1 callback, which a session rule redirects to the extension's own page so it is never sent.
```

**Are you using remote code?** No, I am not using remote code. (All JavaScript ships in the package; nothing is loaded from a server or evaluated from strings.)

**Data usage — what user data do you collect?** The extension handles this data on the device and sends each service's mail and tokens only to the service it belongs to: mail.google.com for Gmail, and for the other services only the sites listed under the optional host permissions above, and only for the services the user turned on. Three exceptions: the domain of a Gmail sender (never an address or a message) goes to Google's icon service for sender logos, which the user can turn off; when the user confirms Unsubscribe on a mail, one request goes to the unsubscribe address that mail's own header names (or a pre-filled email opens for the user to send); and, only if the user connects an AI provider, what a request needs (the conversation they summarize, translate, reply to or ask about, their words and the mail a search found, the sender, subject and preview of unread mail it sorts) goes from the browser straight to that provider. With Chrome's built-in model nothing leaves the device. The address of the active tab is read inside the panel only, to match the site's mail, and is never stored or sent. Tick:

- [x] Personally identifiable information (account email addresses and sender names and addresses shown in the panel)
- [x] Authentication information (the GMAIL_AT token read from the mail.google.com cookie; the session tokens the other services' pages hand out, kept in session memory; the session ids in the names of Proton's AUTH cookies; the user's own AI API key or ChatGPT sign-in tokens, if they add one, kept on the device)
- [x] Personal communications (email subjects, snippets and message text)
- [x] Website content (Gmail's feed and print-view pages, and the other services' mail pages and API answers it reads)
- [ ] Health information
- [ ] Financial and payment information
- [ ] Location
- [ ] Web history
- [ ] User activity

**Certifications (tick all three):**

- [x] I do not sell or transfer user data to third parties, outside of the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** https://nord-express.github.io/mail-deck/privacy.html

## Distribution tab

**Visibility:** Public. **Regions:** All regions. **Pricing:** Free.
