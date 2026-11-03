# AI Marketing Analytics Pro

**The offline, hands-on intermediate course for AI Marketing Analytics — a downloadable Windows PC program that can put Coursera to shame.**

No videos to buffer. No subscription nagging. No "audit mode" paywall. Install (or just double-click the portable .exe) and you own a complete 32-hour practitioner program that runs entirely on your machine.

---

## Why this beats a typical MOOC

| Coursera-style MOOC | AI Marketing Analytics Pro |
|---|---|
| 10-min passive videos, bandwidth required | Dense text + interactive labs, **100% offline** |
| Auto-graded quizzes only | Quizzes **and autograded coding labs** with numeric tolerances on real datasets |
| Content rotates behind subscription | One download, yours forever |
| Fake/one-row toy datasets | Deterministic bundled datasets (~6k events, 4k orders, 5k scored users…) |
| Certificates behind paywall | Printable certificate generated locally at ≥80% progress / ≥75% grade |

## What's inside

- **8 modules, ~32 hours**: Data Foundations → Feature Engineering (RFM as-of, leakage) → Response/Churn Models (calibration, lift) → Attribution & MMM (adstock, saturation, incrementality) → CLV & Segmentation (BG/NBD concepts) → Guardrailed GenAI for analytics → Experimentation & Power Analysis → Capstone sprint with checklist.
- **7 autograded labs** in a built-in code console: write JS/logic against bundled data, press *Run & Grade*, get per-task feedback tables. Solutions loadable after attempts.
- **Knowledge-check quizzes** per module with instant right/wrong highlighting; best scores retained.
- **Dashboard** with SVG charts (works with zero internet), progress bars, module tracker.
- **Glossary** of 14 core terms and a **printable PDF certificate** with serial number.
- Progress auto-saves locally (localStorage) — resume anytime.

## Run it now (source)

```bash
npm install
npm start            # launches the desktop app
```

**Zero-setup option:** unzip `AIMarketingAnalyticsPro-Windows.zip` and double-click `app\index.html` — the full course runs in Edge/Chrome, offline, no installs.

## Build the downloadable Windows program

```bash
npm run dist:win     # see docs/BUILD_WINDOWS.md
```

Produces:
- `AI Marketing Analytics Pro Setup 1.0.0.exe` (installer)
- `AI Marketing Analytics Pro 1.0.0.exe` (**portable** — copy to any PC, double-click, teach)

Lightweight alternative (no Node): PyInstaller + pywebview — instructions in `docs/BUILD_WINDOWS.md`.

---

## Publish this repo to GitHub

The repo is already clean (single commit, `node_modules/` ignored, zip tracked). You need a GitHub account + a Personal Access Token (PAT with `repo` scope, classic) or the GitHub CLI logged in.

**Option A — GitHub CLI (`gh`), one shot:**

```bash
gh auth login                          # sign in once
cd <this folder>
gh repo create ai-marketing-analytics-pro --public --source=. --push \
  --tag v1.0.0 --release-name "AI Marketing Analytics Pro v1.0.0" \
  --notes "Offline Windows course app: 8 modules, 7 autograded labs, PDF certificate. Download AIMarketingAnalyticsPro-Windows.zip below, or build the portable .exe with npm run dist:win." \
  AIMarketingAnalyticsPro-Windows.zip
```

That creates the repo, pushes `main`, opens Release **v1.0.0**, and attaches the zip as a downloadable asset — visitors get a big green **Download** button on the Releases page.

**Option B — plain git (no `gh`):**

```bash
# 1. On github.com: New repository -> name it, DO NOT add README/.gitignore/license
cd <this folder>
git remote add origin https://github.com/<YOUR-USERNAME>/ai-marketing-analytics-pro.git
git push -u origin main
# 2. Then on github.com: Releases -> Draft new release -> tag v1.0.0
#    -> drag AIMarketingAnalyticsPro-Windows.zip into "Attach binaries" -> Publish
```

**Windows users pushing from PowerShell/cmd:** identical commands; when prompted for a password, paste your PAT, not your account password.

## Verify grading integrity

```bash
node scripts/verify_labs.js   # runs all bundled solutions vs expected answers
```

## Project layout

```
main.js               Electron entry
app/index.html        App shell (sidebar, views)
app/js/courseData.js  All lessons/quizzes/labs
app/js/labEngine.js   Sandboxed runner + grader
app/js/charts.js      Offline SVG charting
data/datasets.js      Seeded datasets + expected answers
scripts/              build helpers & verification
docs/                 Windows packaging guide
```

License: MIT. Built by Analytics Forge Labs.
