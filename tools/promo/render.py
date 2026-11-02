#!/usr/bin/env python3
# Run: python3 tools/promo/render.py   (renders store/promo-440x280.png from tile.html with headless Chrome, then checks it)
"""Mail Deck small promo tile: tile.html -> store/promo-440x280.png.

The dashboard takes a 440x280 PNG or JPEG with no alpha. Rendering uses chrome-headless-shell
(Playwright's build; `npx playwright install chromium-headless-shell`), or the binary named by
$CHROME, at one device pixel per CSS pixel, in sRGB. PREVIEW=1 also writes a 2x copy next to
it in /tmp for a closer look.
"""
import os
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / 'tools' / 'icon'))
from render import find_chrome  # noqa: E402

OUT = ROOT / 'store' / 'promo-440x280.png'
W, H = 440, 280


def shoot(chrome, out, scale):
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([
            chrome, '--disable-gpu', '--no-first-run', f'--user-data-dir={tmp}/profile',
            '--hide-scrollbars', f'--force-device-scale-factor={scale}', '--force-color-profile=srgb',
            f'--window-size={W},{H}', '--allow-file-access-from-files',
            '--run-all-compositor-stages-before-draw', '--virtual-time-budget=3000',
            f'--screenshot={out}', (HERE / 'tile.html').as_uri(),
        ], check=True, capture_output=True, timeout=90)


def check(path):
    b = path.read_bytes()
    assert b[:8] == b'\x89PNG\r\n\x1a\n', 'not a PNG'
    w, h, depth, ctype = struct.unpack('>IIBB', b[16:26])
    assert (w, h) == (W, H), f'size {w}x{h}, expected {W}x{H}'
    assert (depth, ctype) == (8, 2), f'expected 24-bit RGB with no alpha, got depth {depth} type {ctype}'
    return f'{w}x{h} RGB, {len(b) // 1024} KB'


def main():
    chrome = find_chrome()
    shoot(chrome, OUT, 1)
    if os.environ.get('PREVIEW'):
        big = Path(tempfile.gettempdir()) / 'promo-440x280@2x.png'
        shoot(chrome, big, 2)
        print(f'preview {big}')
    try:
        print(f'ok    {OUT.relative_to(ROOT)}  {check(OUT)}')
    except AssertionError as e:
        sys.exit(f'FAIL  {OUT.relative_to(ROOT)}  {e}')


if __name__ == '__main__':
    main()
