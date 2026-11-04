# Changes

Each version that reaches `main` is released on GitHub with the notes of its section here
(`.github/workflows/release.yml`), and goes to the Chrome Web Store with `tools/publish.py submit`.

## 1.8.1

Mail Deck 1.8.1 lets you answer a Gmail message in your own words and send it from the panel, no AI needed. It includes everything of 1.8.0, which did not reach the store on its own.

**New**
- **Reply from the panel** (Gmail): Reply in an open message opens a field for your answer right there, addressed to the sender (their Reply-To, if they set one); Ctrl+Enter (⌘+Enter) or Send sends it in its thread, with five seconds to undo. Open in Gmail takes it to the compose window instead; other mail services' Reply opens theirs, as before.

## 1.8.0

Mail Deck 1.8.0 sends your reply from the panel: the AI drafts it, Send sends it, with five seconds to change your mind.

**New**
- **Send from the panel** (Gmail): Reply with AI and the assistant's new mail have a Send button. A reply goes to the sender (their Reply-To, if they set one), shown above the draft, and stays in its conversation for you and for them. For five seconds Undo (or Z) keeps it back, with the draft as it was; it goes even if you close the panel meanwhile, and if Gmail does not take it, nothing is lost: the draft stays, or opens in Gmail when the panel is closed. Open in Gmail is still there, and other mail services keep it as before.
- **Labels** (Gmail): L labels a mail, V moves it to a label, with your labels in a menu or a new one typed in.

**Changed**
- With no unread mail, the panel says "All caught up" in the line under its title instead of a large card over your inboxes.

**Fixed**
- Mark as unread is checked against Gmail itself, and an action Gmail refuses is now shown as failed instead of done.

## 1.7.1

Mail Deck 1.7.1 puts each inbox's picture back in its place on the settings page. It includes everything of 1.7.0, which did not reach the store on its own.

**Fixed**
- Settings → Mailboxes: Google's picture of an account, and its coloured letter for an account with no photo, came at full size over the rows below; it now fills the inbox's circle.

## 1.7.0

Mail Deck 1.7.0 lets the assistant run on the AI you already use: ten more providers, or a model on your own computer that keeps your mail on it. It includes everything of 1.6.0, which did not reach the store on its own.

**New**
- **Twelve providers with your own key**: OpenAI, Anthropic, Google Gemini, xAI, DeepSeek, Z.ai, Mistral, OpenRouter, Groq, Qwen, Kimi and Yandex AI Studio, in one calm picker in Settings → AI. Each lists the models your key can use, newest first with a recommended one; OpenRouter's hundreds are grouped by maker, with a search and their prices. Several give some use for free (Gemini, Groq, OpenRouter's free models, Z.ai).
- **Sign in with OpenRouter**: OpenRouter makes a key for Mail Deck when you sign in, with nothing to copy, and opens hundreds of models, some of them free.
- **A model on your own computer**: connect Ollama or LM Studio (or another server that speaks OpenAI's API) and nothing leaves your computer, at no cost. Mail Deck sets what Ollama needs itself, and says exactly what to change when a server still refuses.
- The panel's AI setup offers four clear ways in: Chrome's built-in model, your ChatGPT plan, your API key with any of the twelve providers, or a model on this computer.

**Fixed**
- A click on a mail's file opens it: with Gmail open in a tab, it only brought that tab to the front.
- The settings page's text is drawn at its designed size: Chrome's own smaller size for extension pages had shrunk titles, the menu and buttons.
- When Chrome still runs an older copy of Mail Deck (after an update, before a reload), connecting a provider says to reload Mail Deck instead of blaming a missing access.
- A wrong Gemini key is called a wrong key, not a model the key cannot use.

## 1.6.0

Mail Deck 1.6.0 is a release about trust and finish: trackers kept out of your mail, a new settings page, a sharper assistant, one-click unsubscribe, and dozens of fixes that make it hold up when Gmail, the network or the clock does not.

**New**
- **Trackers stay out.** Pictures that only report that you opened a mail never load, not even by Show pictures, and the reader says how many it kept out and whose. Gmail's pictures can also wait for Show pictures (Settings → Panel).
- **Who really sent it.** A calm warning when a sender's name claims a well-known brand its address does not belong to, when its domain imitates another, or when replies would go somewhere else.
- **Unsubscribe in one click**, the way the sender's header asks, always after you confirm, and archive what that sender left unread. The Newsletters chip lists its senders.
- **Search as you type**, saved searches as chips, and **Gmail's own categories** (Promotions, Social, Updates) as chips that need no AI, each with Mark all read and Archive all.
- **Mark as unread** (U). Replies and new mail open in a **small window of their own**.
- **Notifications** show a sign-in code in their title and can copy it (an optional permission, asked from Settings), have a **Later** button, and can open the panel.
- **The assistant** remembers the conversation ("only last week", "summarize them"), acts on the mail it found (mark read, archive, with Undo), works out dates exactly in your time zone, searches more broadly when nothing is found, checks its citations, and says when Gmail did not answer. Summaries leave out what you already answered, count dates from the message that says them, and list details to copy. Drafts can be made shorter, longer, more formal, friendlier or corrected. Plans and sorting use a faster, cheaper model, and sorting fills the chips as it goes.
- **A new settings page**: a rail with search, a header that says what needs a look, More options in each section, inbox pictures, engine cards for the AI, a quiet-hours day bar, and a save state.
- **A redesigned panel**: one calm type and colour scale, the message kept in view under a summary, tooltips with their keys, a `?` sheet of every key, a cursor on the first mail, skeletons instead of a blank start, and a hint to pin the icon.
- **A welcome page** on install that finds your inboxes, shows how to pin the icon, and sends a test notification.
- One line, once, after two weeks of use, asking for a rating.

**Fixed**
- One Google account that needs its password again no longer hides every account after it; a Google outage no longer looks like being signed out of everything; a clock that is off no longer stops notifications or brings archived mail back; a feed that fails once keeps its mail for a while instead of dropping it.
- An action's Undo window survives a browser restart; an action over several accounts that one refuses brings back only that one's mail; mail acted on from search or the assistant leaves the list at once.
- Gmail labels now follow their account's address, not its place in the browser.
- The panel's message cache stays within a budget, never keeps a sign-in page, and no request to Gmail waits forever.
- A mail opens even with no browser window open; reminders open in their own account.

## 1.5.0

Mail Deck 1.5.0 turns the AI assistant into one you can ask anything, adds your ChatGPT plan and Z.ai's GLM as ways to run it, and puts attachments in plain sight. It includes everything of 1.4.0, which did not reach the store on its own.

**New**
- **Ask your mail.** The ✨ button (or <kbd>A</kbd>) opens the assistant: ask in plain words (“when is my flight?”, “invoices from October”, “what did Anna say about the budget?”). It searches every Gmail account and the other services' unread mail, reads what it finds and answers with numbered references that open each mail. “What's important?” sums up your unread mail. The search field has **Ask AI** too.
- **Write with it.** “Write to Anna that…” drafts a new mail with its address and subject; **Reply with AI** in an open message drafts a reply in the thread's language and tone from a quick choice or your own words. Both open in Gmail's compose window, ready for you to send.
- **Ask about this mail**, and **Translate from …**: Chrome's own translator turns a foreign-language message into yours where it stands, on your computer, with no assistant needed.
- **Sorting** adds **Important** and **Newsletters** to **Reply**: a chip narrows the list, with **Mark all read** and **Archive all** above it.
- **Your ChatGPT plan**: **Continue with ChatGPT** signs in through OpenAI's official Sign in with ChatGPT, and requests use your plan. **Z.ai (GLM)** works with your own API key, next to Anthropic and OpenAI. A Claude Pro or Max subscription cannot be used by other apps under Anthropic's rules, so Claude stays with an API key.
- **The AI buttons are in view from the start** and offer to turn it on; Chrome's built-in model turns on right in the panel. Settings → AI can hide them.
- **Attachments on the line**: a Gmail message's files show before you open it, tagged PDF, sheet or picture; a click opens the file alone. The open message lists them under the sender, with Download.

**Fixed**
- An invoice or tax number in a mail that mentions a verification code somewhere no longer shows as a one-time code.
- Mark all read or archive on mail of several Gmail accounts at once now reaches each account.

## 1.4.0

Mail Deck 1.4.0 brings an optional AI assistant, the mail of the site you're on, and a new icon.

**New**
- **Mail from the site you're on.** Open the panel on a website and that site's unread mail is at the top, from every inbox, with a fresh sign-in code ready to copy.
- **One-time codes** stand out in the list and in the message; a click or <kbd>C</kbd> copies them.
- **AI assistant** (off until you turn it on in Settings → AI): a summary of the conversation you're reading (key points, what it asks of you, dates with an "Add to Google Calendar" link), and **Waiting for your reply**, a chip that gathers unread mail from people who expect an answer. It runs with Chrome's built-in model on your computer, or with your own OpenAI or Anthropic API key, straight from your browser; the key stays on this computer.
- In the reader, <kbd>J</kbd> / <kbd>K</kbd> open the next or previous message; optionally the next one opens after an action.
- Notifications name their inbox, take an `[account]` placeholder and can repeat while the mail stays unread. Each inbox can be left out of the count, and the badge can count only mail since you last opened the panel.
- A new icon: the deck, dealt.

**Fixed**
- Offline (for example right after waking the laptop) no longer looks like being signed out; Undo brings mail back at once; label feeds no longer repeat notifications; checks by hand no longer notify about old mail; rechecks no longer wait for Chrome's 30-second alarm limit.
- Other services' mail: no remote picture loads before Show pictures; links always open in a tab of their own.
- Proton, Yandex, Mail.ru, Yahoo and AOL: a temporary error no longer drops a mailbox; Yandex mail with odd encodings reads correctly.
- Settings backups keep the mailbox order and put Gmail labels on the right account; many accessibility and right-to-left fixes; translations the background uses are complete in all 20 languages.

Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/mail-deck/hjlkjemogfgkpbbnogihekjcdmafecff) (1.4.0 is in review and arrives there automatically once approved). The zip below is the same package, for loading unpacked.



## 1.3.3

Mail Deck (formerly Mail Deck for Gmail) now checks other mail services too, the same way it checks Gmail: through the session you are already signed in to in Chrome, with no passwords and no servers in between.

- **Other mail:** Yahoo Mail, AOL Mail, Proton Mail, Yandex Mail and Mail.ru. Each one is off until you turn it on in Settings → Other mail, and Chrome then asks for that service's site alone.
- Their mailboxes sit in the same panel as your Google accounts, with unread counts, notifications, read, delete and spam. Archive works where the service has one (Yahoo, AOL, Proton).
- Messages open in the panel (Proton mail opens on Proton's site, since it is end-to-end encrypted). Remote pictures in these messages load only when you click Show pictures.
- The project now lives at [github.com/nord-express/mail-deck](https://github.com/nord-express/mail-deck), with its website at [nord-express.github.io/mail-deck](https://nord-express.github.io/mail-deck/), and is published by Nord Express.

Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/mail-deck/hjlkjemogfgkpbbnogihekjcdmafecff). The zip below is the same package, for loading unpacked.


