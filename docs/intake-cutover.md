# Client intake cutover runbook

Moving client onboarding off the Notion form and onto `/intake`.

Phases 1–5 are built and merged (PR #38). The code is live in production but **dormant**:
without `INTAKE_TOKEN_SECRET` the intake endpoints return `503 server_misconfigured`, so
nothing is reachable until step 1. The Notion form is still the live intake and stays that
way until step 5.

Steps are ordered and gated. **Do not close the Notion form (step 5) before step 3
passes** — that would leave no working intake at all.

---

## Step 1 — Set the two production env vars

Vercel → `soraia-designs-site` → Settings → Environment Variables → Production.

| Name | Value |
|---|---|
| `INTAKE_TOKEN_SECRET` | the secret already in `~/.hermes/credentials/intake-token.env` |
| `INTAKE_MASTER_SHEET_ID` | `1w5TxMCejQwpsUXD7wRm6WLLJTo5DkA5y-SqyoMDkuFM` |

The secret **must be byte-identical** to June's copy. She mints the links; Vercel verifies
them. A mismatch means every link a client clicks returns 403 with no useful error. Copy
it rather than retyping:

```bash
grep '^INTAKE_TOKEN_SECRET=' ~/.hermes/credentials/intake-token.env | cut -d= -f2- | tr -d '\n' | pbcopy
```

> Add via the Vercel dashboard, not `vercel env add` with piped stdin — piped input stores
> an empty value. If you must use the CLI, pass `--value`.

Then redeploy production so the functions pick the vars up (Deployments → latest →
Redeploy). Env vars do **not** apply to already-built deployments.

**Verify:** this should stop returning `server_misconfigured` and start returning a token
error instead — that flip is the signal the secret is loaded.

```bash
curl -s -X POST https://www.soraiadesigns.com/api/intake-submit \
  -H 'Content-Type: application/json' -H 'Origin: https://www.soraiadesigns.com' \
  -d '{"token":"x.y","answers":{}}'
# want: {"ok":false,"reason":"bad_signature",...}   (403)
# still server_misconfigured (503) => the var did not land, or you did not redeploy
```

---

## Step 2 — Confirm the secrets match across the two implementations

The token format exists in JS (here) and Python (June's `soraia_intake_link.py`). Drift is
invisible until a client is already stuck.

```bash
python3 ~/.hermes/scripts/test_intake_link_parity.py
# want: 21 passed, 0 failed
```

That proves the two implementations agree. Step 3 proves the two *secrets* agree.

---

## Step 3 — Smoke-test production with a real link

Use a **real client** — the link is safe, it only writes into that client's own folder,
and a live client folder is exactly what you want to prove works. Unis Taye is the
cleanest (his inspiration is already filed, so nothing is at stake if this goes sideways).

```bash
python3 ~/.hermes/scripts/soraia_intake_link.py --deal 339777464002
```

Open the link in a browser and confirm, in order:

1. The page loads and greets the client by name — the token parsed.
2. Upload one small test image under **Inspiration photos** — it reaches 100% with no
   error. *(A `TypeError: Failed to fetch` here means CORS: the session was minted without
   a forwarded Origin. See the module header in `api/_lib/intake-upload.js`.)*
3. The file appears in that client's `Inspiration & Moodboards` in Drive.
4. Fill the four required fields, submit, and land on the confirmation screen.
5. `Design Brief — <Client>` exists in their `Brief & Scope`.
6. A row appears in the [master Sheet](https://docs.google.com/spreadsheets/d/1w5TxMCejQwpsUXD7wRm6WLLJTo5DkA5y-SqyoMDkuFM/edit).

**Then clean up the test artifacts** — delete the test image, the brief, and the sheet
row. Submitting again later rewrites the same brief and row, so a leftover test row is
cosmetic, but a stray test image in `Inspiration & Moodboards` would make June's gate
report that client as clear when they are not.

**Rollback:** nothing to roll back. Keep sending the Notion form until this passes.

---

## Step 4 — Parallel run

Send the new link to the next 2–3 clients who onboard. The Notion form stays open the
whole time — this is the period where you find out whether real clients on real phones
complete it.

What to watch:

- Do the photos land in `Inspiration & Moodboards` without anyone filing them by hand?
  That is the entire point of the rebuild.
- Does `soraia_fulfillment_tracker.py --check-inspiration` flip those clients to ✅ on its
  own?
- Any client who emails photos instead of using the link is a signal the form failed them
  — find out where before closing the Notion one.

June already prints each blocked client's link on her inspiration flags, so chasing is one
step:

```bash
python3 ~/.hermes/scripts/soraia_fulfillment_tracker.py --check-inspiration
```

**Rollback:** stop sending links. Notion is untouched and still works.

---

## Step 5 — Retire the Notion form

**Only after step 4 has produced at least one client who completed the new form end to
end with zero hand-filing.**

Closing is reversible and does not delete anything — the 🚀 Onboarding Submissions
database and every past submission stay exactly as they are. It only stops accepting new
ones.

Via the Notion MCP:

```
notion-update-view
  view_url: view://7a3bb28a-8e6f-405d-8794-315f611fcbf2
  commands: FORM CLOSE
```

Before closing, edit the form's description to point at the new one, so anyone holding an
old bookmark is not just told "closed":

> Our onboarding form has moved. Check your kickoff email for your personal link, or email
> hello@soraiadesigns.com and we'll send a fresh one.

**Rollback:** `FORM OPEN` on the same view.

---

## Step 6 — Update the kickoff step

Wherever the kickoff email tells a client to fill out onboarding, it should now carry
their per-client link from `soraia_intake_link.py --deal <id>` instead of the shared Notion
URL. Links expire after 30 days; if a client comes back late, mint a fresh one — the form
tells them to ask.

---

## Known gaps, deliberately left

- **HubSpot deal properties are not written.** Budget, sqft and ADR goal stay in the Sheet
  and the brief only. The property names were unverified and guessing them errors at write
  time.
- **`~/.hermes/scripts/` is not under version control.** June's half of this — the link
  minter, the parity test, the tracker changes — has no history and no backup.
- **`vercel dev` cannot serve this repo.** The SPA catch-all rewrite in `vercel.json`
  swallows Vite's virtual module URLs and 404s them. To test the full stack locally, build
  first and serve `dist/` alongside the `api/` handlers.
