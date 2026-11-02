# Notice

Mail Deck (formerly Mail Deck for Gmail) is derived from Notifier for Gmail, whose Initial Developer is InBasic. It is distributed under the Mozilla Public License 1.1; see [LICENSE](LICENSE).

## Changes (October 2026)

- A new toolbar panel (`data/panel/`) lists every signed-in mailbox with its unread mail, a full message view and read, archive, delete and spam actions.
- `core/check.js` builds one feed per account: each account checks its own watched labels or its inbox.
- `core/repeater.js` rechecks when an account's watched labels change.
- A new settings page (`data/settings/`) replaces the old options page.
- New icons and a red badge by default.
- Renamed to Mail Deck for Gmail. The original project's install, update and uninstall pages and its older versions were removed.
- Other mail services: `core/services.js` checks Yahoo Mail, AOL Mail, Proton Mail, Yandex Mail and Mail.ru, each from its own file in `core/services/`, once the user turns it on. Renamed to Mail Deck.

## Code from other projects

The mail services in `core/services/` adapt code and request shapes from these projects. Each file names its sources at the top.

- `yahoo.js`, `aol.js`: X-notifier Neo 4.0.8 by Byungwook Kang (`js/scripts/yahoo.js`, `aol.js`), Mozilla Public License 2.0, https://addons.mozilla.org/firefox/addon/xnotifier-neo/. These two files are covered by the MPL 2.0, as their headers say.
- `proton.js`: Mail Notifier Hub by MS-Jahan (`src/providers/proton/api.js`), Mozilla Public License 2.0, https://github.com/MS-Jahan/mail-notifier-hub. This file is covered by the MPL 2.0, as its header says. Request shapes also follow go-proton-api, Copyright (c) Proton AG, MIT License, https://github.com/ProtonMail/go-proton-api.
- `yandex.js`: Pulsar by Ilya Levin (`lib/providers/yandex.ts`), MIT License, https://github.com/ilyachase/pulsar; yandex-mail-proxy by Sergey Krashevich, Apache License 2.0, https://github.com/skrashevich/yandex-mail-proxy. Its MIME parser follows the approach of postal-mime by Andris Reinman (MIT-0).
- `mailru.js`: Pulsar by Ilya Levin (`lib/providers/mailru.ts`), MIT License; 3MR mailru-notifier 1.5.1 by 3MR (`lib/mailapi.js`), MIT License, https://github.com/3MR-apps/mailru-notifier.

The panel's list of open-tracking pixels (`data/panel/trackers.js`) is checked against, and partly drawn from, the list of MailTrackerBlocker by Aaron Lee, BSD 3-Clause License, https://github.com/apparition47/MailTrackerBlocker. The file's header carries that license's notice in full: Copyright (c) 2020, Aaron Lee. All rights reserved.

The MIT License of the projects above (Copyright (c) 2026 Ilya Levin; Copyright (c) 2026 3MR; Copyright (c) Proton AG):

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

yandex-mail-proxy is licensed under the Apache License, Version 2.0 (https://www.apache.org/licenses/LICENSE-2.0); `yandex.js` adapts its request shapes and states its changes in its header comments.
