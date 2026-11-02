#!/bin/sh
# Runs every test and exits non-zero when one fails. CHROME names the browser for the
# panel test (default: Google Chrome on macOS, google-chrome elsewhere); CHROME_EXT one that
# loads an unpacked extension, for the sign-in test (default: Playwright's Chrome for Testing).
cd "$(dirname "$0")/../.." || exit 1
status=0
run() {
  name=$1
  shift
  if out=$("$@" 2>&1); then
    echo "PASS $name"
  else
    echo "FAIL $name"
    echo "$out" | grep -v '^ok ' | sed 's/^/  /'
    status=1
  fi
}
run 'scripts parse, no clashing globals, every locale complete' node tools/test/static.test.js
run 'quiet hours and word rules' node tools/test/quiet.test.js
run 'settings: backups, labels by account, service access, quiet times' node tools/test/settings.test.js
run 'background check: parallel, timeout, signed-out accounts' node tools/test/check.test.js
run 'background messages: actions, their Undo window across a restart, partial failures' node tools/test/worker.test.js
run 'Gmail: the header of a mail read and no more, and its unsubscribe links' node tools/test/gmail.test.js
run 'other mail services: what is asked, actions, the reader' node tools/test/services.test.js
for t in tools/test/services/*.test.js; do
  run "mail service $(basename "$t" .test.js)" node "$t"
done
run 'AI assistant: providers, streaming, summaries, waiting for reply' node tools/test/ai.test.js
run 'ChatGPT sign-in coming back to the extension in a real Chrome' node tools/test/callback.test.js
run 'panel in headless Chrome' node tools/test/panel.test.js
run 'welcome page: opened on install only; inboxes, pin and panel steps in headless Chrome' node tools/test/welcome.test.js
exit $status
