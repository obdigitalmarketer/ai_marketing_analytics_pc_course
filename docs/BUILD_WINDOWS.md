# AI Marketing Analytics Pro — Build the Windows .exe

You have two options. Both produce a **downloadable, offline Windows program**.

---

## Option A — Electron installer (recommended, richest app)

Requires: Node.js 18+ on any machine (Windows/macOS/Linux; cross-build to Windows from Linux is supported with Wine, or just build on a Windows PC).

```bat
:: from this project root
npm install --no-audit --fund=false
npm run dist:win
```

Output appears in `dist/`:
- `AI Marketing Analytics Pro Setup 1.0.0.exe`  → NSIS installer (desktop shortcut, add/remove programs entry)
- `AI Marketing Analytics Pro 1.0.0.exe`        → portable single-file EXE (no install needed — perfect for "downloadable PC program")

Run either one; the entire course (lessons, quizzes, 7 autograded labs, charts, certificate) works with **zero internet**.

### Notes
- `electron-builder` targets are configured in `package.json` (`win: [nsis, portable]`).
- Icon: drop `build/icon.ico` before packaging for a branded exe (optional).
- Code signing: for public distribution add your cert via env vars (`CSC_LINK`, `CSC_KEY_PASSWORD`) — unsigned builds trigger SmartScreen warnings; that's normal for indie software.

---

## Option B — Pure-Python fallback (tiny .exe, no Node needed)

If you prefer a lightweight native toolchain:

```bat
pip install pywebview pyinstaller
pyinstaller --onefile --windowed --name "AIMarketingAnalyticsPro" scripts\launcher_win.py
:: result: dist\AIMarketingAnalyticsPro.exe
```

`scripts/launcher_win.py` opens the same `app/index.html` in a native WebView2 window.

---

## Quick test without building
```bat
npm start
```
This launches the Electron app directly from source.

## Verify lab grader integrity (optional, dev)
```bat
node scripts\verify_labs.js
```
Runs every bundled solution against the deterministic datasets and prints PASS/FAIL for all 7 labs.
