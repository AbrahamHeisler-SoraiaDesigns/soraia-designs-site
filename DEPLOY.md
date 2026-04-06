# Deploy Instructions

## Step 1 — Push to GitHub

Option A (easiest — GitHub web):
1. Go to github.com → New repository → name it `soraia-designs-site`, Public
2. Copy the repo URL (e.g. `https://github.com/YOUR_USERNAME/soraia-designs-site.git`)
3. Run in this folder:
   ```
   git remote add origin https://github.com/YOUR_USERNAME/soraia-designs-site.git
   git push -u origin main
   ```

Option B (via gh CLI, if installed):
```
gh repo create soraia-designs-site --public --source=. --remote=origin --push
```

## Step 2 — Connect to Vercel

1. Go to vercel.com → Add New Project
2. Import the `soraia-designs-site` GitHub repo
3. Framework: **Vite** (auto-detected)
4. Build command: `vite build` (default)
5. Output dir: `dist` (default)
6. Click Deploy

## Step 3 — Custom Domain

In Vercel project → Settings → Domains → Add `soraiadesigns.com`
Then in Cloudflare DNS:
- Add CNAME record: `@` → `cname.vercel-dns.com`
- Or A record to Vercel's IP (shown in Vercel dashboard)

## Local Development

```bash
# Start dev server
node /Applications/Cursor.app/Contents/Resources/app/resources/helpers/node \
  ~/homebrew/var/homebrew/tmp/.cellar/node/25.9.0_1/libexec/lib/node_modules/npm/bin/npm-cli.js \
  run dev

# Or once Node is in your PATH:
npm run dev

# Run screenshot loop (dev server must be running on :5173)
node puppeteer-screenshot.js
```

## Adding Node to PATH permanently

Add to your `~/.zshrc`:
```
export PATH="/Applications/Cursor.app/Contents/Resources/app/resources/helpers:$PATH"
```
Then `source ~/.zshrc` and use `node` and `npm` normally.
