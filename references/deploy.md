# Shipping

## Git and GitHub

Each site is its own repository (sibling folders in the portfolio directory, not a monorepo).

```bash
cd <site>
git init -b main
git add -A
git commit -m "Initial site: scroll-scrubbed hero, <feature> and WhatsApp <ordering/booking>"
gh repo create <site> --private --source . --push
```

- Keep client repos **private** unless the user says otherwise.
- If `git config user.name` is empty, pass `-c user.name=… -c user.email=…` with the user's GitHub login and noreply email (`gh api user -q .login`).
- End commit messages with the attribution line the harness asks for, if any.
- Commit and push only when the user has asked for the site to be shipped, or asks for it.

## Vercel (static, CLI deploys)

```bash
vercel deploy --prod --yes
```

- The first run creates and links the project from the folder name and writes `.vercel/` (gitignored).
- **Read the alias from the output** (`Aliased: https://….vercel.app`). If `<site>.vercel.app` is taken, Vercel assigns something like `<site>-two.vercel.app` or `<site>-beta.vercel.app`. A guessed URL may be someone else's site, so never check one.
- Git-triggered deploys have stalled in the past (state "UNKNOWN"), so redeploy from the CLI after every push instead of relying on them.
- `vercel.json` sets year-long immutable caching on `/assets/*`. `.vercelignore` keeps `frames/`, `video/`, `scripts/` and the docs out of the upload.
- If a permission check blocks `vercel deploy --prod` (it has, even right after the user said "deploy"), don't try to route around it. Give the user the command in its own `bash` block and suggest allowing `Bash(vercel deploy:*)` in their settings.

## After deploying

1. Run the audit against the live URL (`… audit.mjs <scratch>/live https://<alias>/ 320x568,390x844,1440x900 nosections`). Check for no errors, `docW == vw` and frames loading from Pages.
2. Tell the user the live URL, the repo URL and the list of placeholders to confirm with the client.
3. Save or update a project memory: folder, repo, live alias, frames host, film status (poster mode or N frames), pending placeholders, and any client-specific facts (a real client's handle, their WhatsApp number).

## README checklist (write it for the client handover)

- One line on what the site is, and whether the brand is a placeholder.
- Its features, one per bullet.
- `Run locally: python3 -m http.server <port>`
- Where to edit things: prices and catalogue in `js/data.js`; name, WhatsApp, hours and zones in `js/config.js`.
- **Placeholders to confirm:** name and logo, address and hours, prices, stats and reviews, photos (Unsplash stand-ins), and the WhatsApp number.
- The hero film status and a pointer to `VEO_PROMPT.md`.
