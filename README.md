# Portfolio — Nur Tajalli Kamalputri

Personal portfolio site, deployed via GitHub Pages to [nurtajallikp.com](https://nurtajallikp.com).

## Structure

- `index.html` — single-page site (Hero, About, Projects, Skills, Contact)
- `css/style.css` — styling (light/dark aware)
- `js/script.js` — nav toggle + footer year
- `images/` — project screenshots (replace placeholders with real screenshots)
- `CNAME` — custom domain config for GitHub Pages

## Editing content

Project descriptions for internal systems (CRS, ETP, AGS, DBS, Oracle→MariaDB migration) are
intentionally generalized to avoid exposing proprietary details. Update `index.html` directly to
refine wording, add real screenshots under `images/`, or add new projects — each project is a
`.project-card` block.

## Deploying

This repo is served via GitHub Pages with a custom domain (see `CNAME`). After pushing to `main`:

1. Go to the repo's **Settings → Pages**
2. Set source to the `main` branch, `/ (root)` folder
3. Under **Custom domain**, confirm `nurtajallikp.com` is set and DNS is verified
4. Point your domain's DNS `A` records (apex) to GitHub Pages' IPs, or `CNAME` record (subdomain) to `nurtajallikp.github.io`
