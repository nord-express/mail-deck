<div align="center">

<img src="extension/data/icons/red/128.png" width="88" height="88" alt="">

# Mail Deck

**Every inbox you are signed in to, in one panel.**<br>
Gmail, Yahoo Mail, AOL Mail, Proton Mail, Yandex Mail and Mail.ru. Read, archive and delete mail without opening a tab.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/hjlkjemogfgkpbbnogihekjcdmafecff?label=Chrome%20Web%20Store&logo=googlechrome&logoColor=white&color=4352e3)](https://chromewebstore.google.com/detail/mail-deck/hjlkjemogfgkpbbnogihekjcdmafecff)
[![Tests](https://github.com/nord-express/mail-deck/actions/workflows/test.yml/badge.svg)](https://github.com/nord-express/mail-deck/actions/workflows/test.yml)
[![License: MPL 1.1](https://img.shields.io/badge/license-MPL%201.1-blue)](LICENSE)

[Website](https://nord-express.github.io/mail-deck/) · [Features](#features) · [This site](#mail-from-this-site) · [AI assistant](#ai-assistant) · [Other mail](#other-mail-services) · [Screens](#screens) · [Install](#install) · [Privacy](PRIVACY.md) · [Development](#development)

<br>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/hero-dark.png">
  <img src="docs/images/hero-light.png" alt="The Mail Deck panel: Gmail, Yandex Mail and Yahoo Mail mailboxes with a sign-in code and two messages waiting for a reply, and an open message with its AI summary" width="860">
</picture>

</div>

## Features

- **All your inboxes at once.** Gmail and, once you turn them on, Yahoo Mail, AOL Mail, Proton Mail, Yandex Mail and Mail.ru. Each mailbox gets its own colour and its unread count, and a Google account its own picture too. The chips at the top narrow the list to one inbox.
- **Fast.** Every mailbox is checked at the same time, a Gmail message is fetched while you point at it, and the panel opens again without asking any mail service anything.
- **Read in place.** Click a message to read it in the panel: a Gmail conversation whole, attachments included, and mail from Yahoo, AOL, Yandex and Mail.ru too. Proton mail opens on Proton's site. <kbd>J</kbd> and <kbd>K</kbd> go to the next and previous message without going back to the list.
- **Mail from this site.** Open the panel on a web page and that site's unread mail is at the top, from every inbox, with a fresh sign-in code ready to copy. [More below](#mail-from-this-site).
- **Attachments in plain sight.** A Gmail message's files show on its line before you open it, each with a coloured tag of its kind (PDF, sheet, picture…); a click opens the file without the mail. The open message lists them under the sender, with Download.
- **Sign-in codes.** A mail that carries a one-time code shows it as a pill before the subject and in the open message. A click or <kbd>C</kbd> copies the digits; the mail is not opened, marked or moved. The new mail's notification shows the code in its title, and can have a **Copy** button.
- **Trackers stay out.** Before a message loads, the pictures that only report that you opened it (known tracking pixels, hidden one-pixel images) are kept out, and the reader says how many and whose. Gmail's pictures can wait for **Show pictures** too.
- **Who really sent it.** A calm warning when the sender's name claims a well-known brand its address does not belong to, when its domain imitates another (`paypa1.com`), or when replies would go somewhere else.
- **Unsubscribe in one click.** A newsletter's ⋯ menu offers **Unsubscribe**, the way its header asks: one request, an email to send, or the sender's page, always after you confirm; its unread mail can go to the archive at once. The Newsletters chip lists its senders to leave.
- **AI assistant, if you want one.** Ask your mail anything in plain words (“when is my flight?”, “invoices from October”), get what is important in your unread mail, have replies and new mail drafted, mail translated and summarized, and unread mail sorted into waiting for your reply, important and newsletters to clear at once. It runs with Chrome's built-in model or a model of your own on this computer (Ollama, LM Studio), your ChatGPT plan, or your own API key from Anthropic, OpenAI, Google Gemini, xAI, DeepSeek, Mistral, Qwen, Kimi, Z.ai, Groq, OpenRouter or Yandex, and stays off until you turn it on. [More below](#ai-assistant).
- **Search as you type.** The list narrows at once while you type; <kbd>Enter</kbd> searches all your Google accounts. Save searches you run often ("Invoices": `has:attachment invoice newer_than:30d`) as chips.
- **Gmail's categories as chips.** Promotions, Social and Updates, each with its count, narrow the list, with **Mark all read** and **Archive all** over it; no AI needed.
- **Later.** Put a message away until this evening, tomorrow or next week; it comes back with a notification.
- **One key per action.** Mark as read or unread, archive, delete or report spam from the list, from the open message or from a notification. <kbd>?</kbd> shows every key. If you like, the next message opens by itself after an action, and replies open in a small window of their own.
- **Labels.** Watch chosen Gmail labels instead of the inbox, set per account, or only Gmail's Primary tab.
- **Your order.** Drag the inboxes into the order you want. Accounts you signed out of stay listed, one click from signing back in.
- **Meet in one click.** Each Gmail mailbox has a button that starts a Google Meet from its account.
- **Notifications and sound.** A desktop notification and an optional sound for new mail, with **Later** among its buttons if you like, and a click that opens the mail or the panel. A notification about one inbox has its address as the title, and your own notification text can name it with `[account]`. It can come back every 5 to 60 minutes while the mail stays unread. Mute an inbox while it stays in the panel, set quiet hours and a quiet weekend, or notify only for, or never for, chosen senders and subjects.
- **Your count.** Leave an inbox out of the number on the toolbar icon while it stays in the panel, or have the number count only the mail that came since you last opened the panel.
- **Side panel and keyboard.** Keep the deck open beside the page, or open it with Alt+Shift+M. Text size is yours to set.
- **Backup.** Export your settings to a file, or keep a copy in Chrome sync. An AI key or sign-in is never in either.
- **Light and dark.** The panel, the settings and the welcome page follow your system theme. Settings has a search, and each section shows what it needs first.
- **A first run that works.** Installing opens a welcome page that finds your inboxes, shows how to pin the icon (and notices when you do) and sends a test notification.
- **Nothing in between.** No servers, no analytics. The extension talks only to Google and to the mail services you turn on, with the session your browser already has, and never sees your password. The AI assistant adds the one provider you connect, if you connect one.

## Mail from this site

Open the panel on a web page, with its toolbar button or <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>M</kbd>, and the unread mail from that site is at the top: the newest three, from every inbox, and "N more" to narrow the list to the site (<kbd>Esc</kbd> widens it again). A sign-in code that came in the last 30 minutes shows big above them, ready to copy with a click or <kbd>C</kbd>. It is for the moment a page says "we sent you a code", for an order you just placed, a password reset, or GitHub's mail while you are on github.com.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/site-dark.png">
    <img src="docs/images/site-light.png" alt="The panel opened over a website: that site's mail on top, from two inboxes, with its sign-in code ready to copy" width="420">
  </picture>
</p>

A mail is the site's when its sender's domain is the site's (`github.com`, `noreply.github.com`), the same name under another ending (`amazon.de` on `amazon.com`, but not for short or generic names such as `shop` or `app`), or a bulk mail sender whose sender name is the site's. Webmail sites, free mail domains, IP addresses and `chrome://` pages show nothing.

Chrome lets the panel read the tab's address when you open it (the `activeTab` permission, which asks nothing at install). Mail Deck takes the site's domain from it inside the panel; the address is not stored or sent. In the side panel this works for tabs on which you used the toolbar button.

## AI assistant

Its buttons are in view from the start (the ✨ in the header, **Sort with AI**, and **Summary**, **Reply with AI** and **Ask** in an open message), and the first click offers to turn it on. Nothing is sent anywhere until you do. **Settings → AI** has a switch to hide the buttons while it is off.

- **Ask your mail.** The ✨ button (or <kbd>A</kbd>) opens the assistant. Type a question or a search in plain words: “when is my flight to Rome?”, “what did Anna say about the budget?”, “invoices from October”, “mail with attachments this week”. It turns that into a Gmail search across all your accounts (and looks through the other services' unread mail), reads the first few mails it finds, and answers with numbered references; a number opens its mail, and <kbd>J</kbd>/<kbd>K</kbd> walk the mail it found. “What's important?” sums up your unread mail: what needs you soon first, newsletters in one line. Ask on from there (“only last week”, “summarize them”), and act on what it found: **Mark all read** or **Archive all**, with Undo; it never acts until you click. A search that finds nothing is tried more broadly by itself, and a citation that does not match its mail is marked. The search field has **Ask AI** for the same.
- **Write.** “Write to Anna that the meeting moves to Friday” drafts a new mail with its address, subject and text, to change and then open in Gmail's compose window. In an open message, **Reply with AI** drafts a reply in the thread's language and tone, from a quick choice (Yes, Decline politely, Ask for details, Thank them, Propose times) or your own words, then **Shorter**, **Longer**, **More formal**, **Friendlier** or **Fix grammar**; **Open in Gmail** puts it in the compose window, ready to send. Nothing is ever sent for you.
- **Summary.** **Summary** (or <kbd>I</kbd>) puts a card above the conversation: its key points, what it asks of you (leaving out what you already answered), its dates, counted from the message that says them, each with an **Add to Google Calendar** link, and its details to copy: an order number, an amount, a tracking number. It fills in as the answer arrives, can be copied, asked again or hidden, and is kept for the session. Summaries come on click (the default) or by themselves for long mail.
- **Ask about this mail.** **Ask** (or <kbd>A</kbd> in an open message) answers a question about the conversation you are reading.
- **Translate.** A message in another language than Chrome's gets **Translate from …**: Chrome's own translator turns it into your language where it stands, on this computer and free, with **Show original** to go back; it needs no engine. Where Chrome has no translator for that language, the assistant translates it.
- **Sort unread mail.** Unread mail gets chips: **Reply** (people who expect an answer from you, each marked with the reason), **Important** (deadlines, payments, travel, alerts about your accounts) and **Newsletters** (mail you can clear without reading). A chip narrows the list to that mail, with **Mark all read** and **Archive all** above it. Mail from your own addresses and mail older than 14 days are left out; each answer is kept on this computer for 30 days, so a mail is asked about once.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/assist-dark.png">
    <img src="docs/images/assist-light.png" alt="The AI assistant: what is important in the unread mail, with numbered references to each mail, and an answer about the Q4 plan review" width="620">
  </picture>
</p>

Choose where it runs:

| Engine | Cost | What leaves this computer |
|---|---|---|
| **On this computer**: Chrome's built-in model | free | nothing: the model runs in Chrome, offline. Chrome downloads it once (a few gigabytes) from your click, in the panel or in Settings. It needs Chrome 138 or newer and a computer that can run it; Mail Deck says whether yours can. Where it does not support your language yet, it answers in English. |
| **ChatGPT plan**: Plus or Pro | included in your plan | **Continue with ChatGPT** signs in with OpenAI's official [Sign in with ChatGPT](https://developers.openai.com/siwc) for open-source apps; requests then use the usage included in your plan (on Plus, its five-hour limit is shared with ChatGPT's other apps; **Manage usage** opens it). What a request needs goes to `api.openai.com`. |
| **On this computer**: a model you run with Ollama or LM Studio | free | nothing: requests go to the model server on your own computer, at `localhost` or `127.0.0.1`. See [below](#a-model-on-this-computer) for what it needs. |
| **Your own API key** from one of the providers below | billed by the provider, per use; some have a free tier | what a request needs, straight from your browser to that provider's API. |

With your own key:

| Provider | Cost | Requests go to | The key |
|---|---|---|---|
| **Anthropic** (Claude) | per use | `api.anthropic.com` | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **OpenAI** | per use | `api.openai.com` | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Google Gemini** | per use, or a free tier on which Google may use what you send to improve its products, and people may read it | `generativelanguage.googleapis.com` | [aistudio.google.com](https://aistudio.google.com/apikey) |
| **xAI** (Grok) | per use | `api.x.ai` | [console.x.ai](https://console.x.ai) |
| **DeepSeek** | per use | `api.deepseek.com` | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| **Mistral** | per use | `api.mistral.ai` | [console.mistral.ai](https://console.mistral.ai/api-keys) |
| **Qwen** (Alibaba Cloud Model Studio, international) | per use, with free tokens for new accounts | `dashscope-intl.aliyuncs.com` | [Model Studio](https://modelstudio.console.alibabacloud.com/) |
| **Kimi** (Moonshot AI) | per use | `api.moonshot.ai` | [platform.kimi.ai](https://platform.kimi.ai/console/api-keys) |
| **Z.ai** (GLM) | per use | `api.z.ai` | [z.ai](https://docs.z.ai/guides/overview/quick-start) |
| **Groq** | per use, or a free plan with tight limits | `api.groq.com` | [console.groq.com](https://console.groq.com/keys) |
| **OpenRouter**: hundreds of models with one key | each model's own price; some models are free | `openrouter.ai`, which passes the request on to the company that runs the model you chose | **Sign in with OpenRouter** makes one for Mail Deck, with nothing to copy; or one from [openrouter.ai](https://openrouter.ai/settings/keys) |
| **Yandex AI Studio** (YandexGPT) | per use, through a Yandex Cloud billing account | `ai.api.cloud.yandex.net` | [Yandex Cloud console](https://console.yandex.cloud/): a service account's API key and your folder id |

What a request needs: a summary, a reply, a translation or a question about a mail sends that conversation's text and subject; a question to the assistant sends your words, then the sender, subject, date and text of the first few mails the search found (the rest by their preview); “what's important” sends the sender, subject and preview of your unread mail; sorting sends the sender, subject and preview of unread mail, 20 at a time.

A Claude Pro or Max subscription cannot be used here: Anthropic allows it only in its own apps, so Claude takes an API key. A GLM Coding Plan key from Z.ai works only in coding tools, and a Gemini key on the free tier has small daily limits. **Connect** asks Chrome for that provider's site alone, checks the key and lists its models, the recommended ones first; **Disconnect** forgets the key, or signs out of ChatGPT, and gives the access back. **Sign in with OpenRouter** gets a key without copying one: OpenRouter's own sign-in (OAuth with PKCE) asks you there, then hands Mail Deck a key of your account, named Mail Deck in your OpenRouter keys, which is checked and kept as a pasted one is. OpenRouter keeps that key after **Disconnect**; **Manage key** opens its page there, to limit or delete it. Keys and the ChatGPT sign-in stay in this browser's extension storage: never in a backup, in Chrome sync or in diagnostics. There are no servers of ours in between, and answers are shown as plain text. The details are in the [privacy policy](PRIVACY.md#ai-assistant).

### A model on this computer

Install [Ollama](https://ollama.com) or [LM Studio](https://lmstudio.ai), download a model and start its server (Ollama's runs by itself, at `http://localhost:11434`; LM Studio's is in its Developer tab, at `http://localhost:1234`). In Settings → AI, pick **Ollama · LM Studio** under On this computer, choose your server (or Other, for another address on this computer) and click **Connect**: Chrome asks you to allow it, and Mail Deck lists the server's models. Nothing leaves your computer, and nothing is paid.

Ollama turns away requests from browser extensions unless they come with its own address as their origin, so Mail Deck sets that origin on its own requests to it (a Chrome rule for those requests alone); nothing needs changing. If an older Ollama still refuses, allow extensions with the `OLLAMA_ORIGINS` environment variable, `chrome-extension://*`: on a Mac, `launchctl setenv OLLAMA_ORIGINS "chrome-extension://*"` and restart Ollama; on Windows, a user environment variable; on Linux, `Environment="OLLAMA_ORIGINS=chrome-extension://*"` in the service's settings (`systemctl edit ollama.service`). In LM Studio, turn on **Enable CORS** in the server's settings.

A model on a laptop answers slower and less well than the providers' large models. Ollama reads 4096 tokens at a time unless told more (`OLLAMA_CONTEXT_LENGTH`), so a long thread is read in part.

## Other mail services

Yahoo Mail, AOL Mail, Proton Mail, Yandex Mail and Mail.ru work the way Gmail does: through the session the browser already has on the service's site. No password, no app password, no OAuth, no servers of ours.

1. Sign in on the service's site as usual.
2. In Mail Deck's settings, under **Other mail**, turn the service on. Chrome asks you to allow that service's sites.
3. Its mailboxes join the panel, the badge and the notifications.

Turning a service off removes the permission again. A service that fails for a moment keeps showing its last answer for up to 30 minutes.

| Service | Sites it asks for | Read in the panel | Archive |
|---|---|---|---|
| Yahoo Mail | `mail.yahoo.com` | yes | yes |
| AOL Mail | `mail.aol.com` | yes | yes |
| Proton Mail | `mail.proton.me` | no, opens on Proton's site: the mail is end-to-end encrypted | yes |
| Yandex Mail | `api.passport.yandex.ru`, `mail.yandex.ru`, `mail.360.yandex.ru` | yes | no |
| Mail.ru | `portal.mail.ru`, `e.mail.ru` | yes | no |

Mark as read, delete, report spam, Undo and Remind me later work for all of them. Search, stars, Google Meet, labels and the Primary tab are Gmail's, and only Gmail's mail is fetched ahead while you point at it. Proton Mail, Yandex Mail and Mail.ru show every account signed in on their site; Yahoo Mail and AOL Mail show the one their site has open.

None of these services has a public interface for this, so Mail Deck follows their own web apps, and a change on their side can stop one until Mail Deck is updated. What each one is asked, and why, is in the [privacy policy](PRIVACY.md).

## Screens

<table>
  <tr>
    <td width="50%" align="center">
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="docs/images/inbox-dark.png">
        <img src="docs/images/inbox-light.png" alt="Inbox with mail from Gmail, Yandex Mail and Yahoo Mail: a sign-in code, and two messages marked as waiting for a reply">
      </picture>
      <br><b>Inbox</b><br><sub>One card per mailbox, actions on hover, the mail waiting for your reply marked</sub>
    </td>
    <td width="50%" align="center">
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="docs/images/read-dark.png">
        <img src="docs/images/read-light.png" alt="An open message with its AI summary above it: the key points, a thing to do, and two dates with Add to Google Calendar">
      </picture>
      <br><b>Message</b><br><sub>The conversation with its summary, and every action one click or key away</sub>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="docs/images/empty-dark.png">
        <img src="docs/images/empty-light.png" alt="All caught up: six mailboxes from several mail services">
      </picture>
      <br><b>All caught up</b><br><sub>Nothing unread, with a link to every inbox</sub>
    </td>
    <td width="50%" align="center">
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="docs/images/signin-dark.png">
        <img src="docs/images/signin-light.png" alt="Sign in to Gmail, or open Other mail services">
      </picture>
      <br><b>First run</b><br><sub>Sign in to Google and your mail shows up; other mail services are one click away</sub>
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <picture>
        <source media="(prefers-color-scheme: dark)" srcset="docs/images/settings-dark.png">
        <img src="docs/images/settings-light.png" alt="Settings: Other mail, with a switch for each mail service">
      </picture>
      <br><b>Settings</b><br><sub>Other mail: one switch per service, and Chrome asks for that service's sites alone</sub>
    </td>
  </tr>
</table>

### Keys

| In the list | In a message | Does |
|---|---|---|
| <kbd>J</kbd> / <kbd>K</kbd> or arrows | <kbd>J</kbd> / <kbd>K</kbd> | Next / previous message |
| <kbd>Enter</kbd> | | Open the message |
| <kbd>R</kbd> | <kbd>R</kbd> | Mark as read |
| <kbd>U</kbd> | <kbd>U</kbd> | Mark as unread (Gmail) |
| <kbd>E</kbd> | <kbd>E</kbd> | Archive |
| <kbd>Delete</kbd> or <kbd>Backspace</kbd> | <kbd>Delete</kbd> or <kbd>Backspace</kbd> | Delete |
| <kbd>!</kbd> | <kbd>!</kbd> | Report spam |
| <kbd>O</kbd> | <kbd>O</kbd> | Open in the web app |
| <kbd>B</kbd> | <kbd>B</kbd> | Remind me later; then <kbd>1</kbd>–<kbd>4</kbd> pick a time |
| <kbd>C</kbd> | <kbd>C</kbd> | Copy the one-time code: the open message's, the focused line's, or else the site's at the top |
| | <kbd>S</kbd> | Star (Gmail) |
| | <kbd>I</kbd> | Show or hide the summary (AI assistant) |
| | <kbd>A</kbd> | The AI assistant; in an open message, a question about it |
| <kbd>Z</kbd> | <kbd>Z</kbd> | Undo the last action |
| <kbd>/</kbd> | | Search: the list narrows as you type, <kbd>Enter</kbd> searches every Gmail inbox |
| <kbd>Alt</kbd>+<kbd>↑</kbd> / <kbd>↓</kbd> | | Move the inbox of the focused line up or down |
| <kbd>Esc</kbd> | <kbd>Esc</kbd> | Back to the list from a message; out of the search, the site's mail or a chip |
| <kbd>?</kbd> | <kbd>?</kbd> | All the keys, in the panel |

The keys go by position, so they work with any keyboard layout. In a message, the arrows scroll it. Archive is not there for Yandex Mail and Mail.ru.

## Install

**From the [Chrome Web Store](https://chromewebstore.google.com/detail/mail-deck/hjlkjemogfgkpbbnogihekjcdmafecff).**

**From source** (Chrome, Brave, Edge, any Chromium browser):

1. Download this repository and unzip it.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and pick the `extension` folder.
4. Sign in to Gmail in the same browser, or turn on another mail service in the settings under **Other mail**. The envelope on the toolbar shows your unread count.

## Development

```
extension/            the extension (load this folder unpacked)
  manifest.json
  core/               background: checking feeds, badge, notifications, actions
  core/services/      the other mail services, one file each: Yahoo, AOL, Proton, Yandex, Mail.ru
  core/services.js    runs them: their permissions, the Origin rules, their mailboxes in the check
  core/utils/code.js  the one-time code finder, shared by the panel and the notifications
  data/panel/         the toolbar panel; trackers.js keeps tracking pixels out, sender.js warns of a sender who is not who the name says
  data/ai/ai.js       the AI assistant: the engines, summaries, sorting, the assistant's plans, answers, drafts and translations
  data/ai/callback.*  where Sign in with ChatGPT comes back to
  data/settings/      the settings page (ui.js: its rail, search, More options and components)
  data/welcome/       the page a new install opens
  _locales/           translations
store/                Chrome Web Store listing text and images
tools/icon/           the icon's SVG sources; render.py renders every PNG
tools/promo/          the store's promo tile (tile.html); render.py renders store/promo-440x280.png
tools/package.sh      zips the extension for the store into dist/
tools/publish.py      uploads that zip to the Chrome Web Store and submits it for review
tools/test/run.sh     runs the tests: scripts, locales, settings, the background check and the worker, the mail services, Gmail's headers, the AI module, trackers and sender warnings, the panel and the welcome page in headless Chrome
tools/test/services/  one test per mail service, against a fake of that service
docs/images/          the pictures in this README
```

Mail comes from Gmail's Atom feed of each signed-in account, the full text from the message's print view, and actions go to `mail.google.com` the way the Gmail page sends them.

Each of the other services is one file in `extension/core/services/` with the same shape: its `name`, the sites it needs (`origins`), its `signIn` and `compose` links, what it `can` do (`archive`, `spam`, `body`), and `collect`, `action` and `body`, which talk to the service the way its web app does. `extension/core/services.js` checks only the services turned on and granted, sets the Origin rules and hands their mailboxes to the check, so the panel takes them like Gmail's. `tools/test/services.test.js` tests that runner, and `tools/test/services/` has one test per service against a fake of it, so no account is needed.

The AI assistant is `extension/data/ai/ai.js` (`self.AI`), loaded by the panel and the settings page. It calls Chrome's Prompt API or each provider's HTTP API with `fetch` and streaming, with no SDK, and turns every failure into a short `AIError`. Sign in with ChatGPT and Sign in with OpenRouter (for a key) are OAuth with PKCE: their loopback callbacks (`127.0.0.1:1455`, `127.0.0.1:1456`) never reach the network, a session rule of `declarativeNetRequest` sends each to `data/ai/callback.html`. `tools/test/ai.test.js` tests it all against mocked streams, with no network.

There is no build step: edit a file, then reload the extension on `chrome://extensions`.

Package for the store:

```sh
tools/package.sh      # dist/mail-deck-<version>.zip
```

## License

[Mozilla Public License 1.1](LICENSE). Mail Deck grew out of Notifier for Gmail by InBasic; see [NOTICE.md](extension/NOTICE.md). The mail services in `extension/core/services/` adapt code from other open-source projects under MPL-2.0, MIT and Apache-2.0; each file names its sources and their licence at the top.

Mail Deck is not made by or affiliated with Google, Yahoo, AOL, Proton, Yandex, VK, OpenAI, Anthropic, xAI, DeepSeek, Mistral AI, Alibaba Cloud, Moonshot AI, Z.ai, Groq, OpenRouter, Ollama or LM Studio. Gmail is a trademark of Google LLC; the other names belong to their owners.
