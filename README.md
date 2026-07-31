# Portfolio — Nur Tajalli Kamalputri

Personal portfolio site, deployed via GitHub Pages to [nurtajallikp.com](https://nurtajallikp.com).

## Structure

- `index.html` — single-page site (Hero, About, Experience, Skills, Contact)
- `css/style.css` — styling (light/dark aware)
- `js/script.js` — nav toggle, footer year, Garmin widget rendering
- `images/` — project screenshots (replace placeholders with real screenshots)
- `CNAME` — custom domain config for GitHub Pages
- `data/garmin.json` — daily snapshot of Garmin stats, committed by the sync workflow
- `scripts/fetch_garmin.py` — pulls Garmin Connect data via the unofficial `garminconnect` library
- `.github/workflows/garmin-sync.yml` — scheduled GitHub Action that runs the script daily

## Garmin sync setup

The Garmin Fitness Dashboard project card fetches `data/garmin.json` at page load. That file is
kept up to date by a daily GitHub Action, not by anything running in the browser. To enable it:

1. In the repo's **Settings → Secrets and variables → Actions**, add:
   - `GARMIN_EMAIL` — your Garmin Connect login email
   - `GARMIN_PASSWORD` — your Garmin Connect password
2. The workflow runs daily at 06:00 UTC, or trigger it manually from the **Actions** tab
   (`Sync Garmin data` → **Run workflow**).
3. It fetches steps, resting HR, sleep, VO2 max, and the last 5 activities, writes them to
   `data/garmin.json`, and commits the change if anything differs.

Notes:
- Garmin has no public API for individual developers — this uses `garminconnect`, an unofficial
  library that logs in as a real account. If that account has MFA enabled, non-interactive login
  from GitHub Actions will fail; use an account without MFA, or generate a persisted `garth`
  session token locally and adapt the script to load it instead of a password.
- Field names come from Garmin's undocumented internal API and can change without notice —
  if the workflow starts failing, check the Action logs first; `fetch_garmin.py` fetches each
  field independently so one broken field won't blank out the rest.

## Editing content

Project descriptions for internal systems (CRS, ETP, AGS, DBS, Oracle→MariaDB migration) are
intentionally generalized to avoid exposing proprietary details. They're grouped under an
`.experience-block` for Westports Malaysia Sdn Bhd; a second `.experience-block` holds Personal
Project as a placeholder. Update `index.html` directly to refine wording, add real screenshots
under `images/`, or add new projects — each project is a `.project-card` block.

## Deploying

This repo is served via GitHub Pages with a custom domain (see `CNAME`). After pushing to `main`:

1. Go to the repo's **Settings → Pages**
2. Set source to the `main` branch, `/ (root)` folder
3. Under **Custom domain**, confirm `nurtajallikp.com` is set and DNS is verified
4. Point your domain's DNS `A` records (apex) to GitHub Pages' IPs, or `CNAME` record (subdomain) to `nurtajallikp.github.io`
