# Hospital Equipment Enrichment

Equiply hiring challenge — enrich hospital equipment CSV with `manufactured_date` and `device_type`.

**Solution:** Device types come from a lookup table (`src/data/device-types.json`). Manufactured dates are decoded from manufacturer-specific serial number patterns (`src/enrichment/serial-date.ts`). A React app provides upload, sorted table, pie chart, and export; `npm run enrich` writes the submission CSV.

## Quick start (app)

```bash
npm install
npm run dev
```

Upload `challenge_data-v1.csv` → table + pie chart → **Export enriched CSV** (downloads `enriched.csv`).

## Minimum submission (`enriched.csv`)

```bash
npm run enrich
```

Writes **`enriched.csv`** at the repo root (801 rows, sorted by `manufactured_date` ascending).

Default input path: `%USERPROFILE%\Downloads\challenge_data-v1.csv`  
Or pass a path:

```bash
npx tsx scripts/enrich-cli.ts "C:\path\to\challenge_data-v1.csv"
```

The app **Export** button and `npm run enrich` use the same enrichment logic and both produce `enriched.csv`.

## Demo video

https://youtu.be/YOUR_LINK

Walkthrough: upload challenge CSV → enriched table + device-type chart → export `enriched.csv`.

## Push to GitHub

```powershell
cd "c:\Users\hurri\Equiply Hiring Challege"
git init
git add .
git commit -m "Equiply challenge: equipment enrichment app and enriched.csv"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Do not commit `.env` or API keys (already in `.gitignore`).

## How the Equiply API key works (tracking)

The submit form asks for **Email**, **API Key**, and **GitHub URL**. That key is a **service account** on Equiply’s OpenAI project. They can see which key was used and how many tokens were consumed.

**You do not put the key in source code or commit it to GitHub.**

1. Copy the key from the challenge submit page (starts with `sk-`).
2. Set it only in your terminal session or a local `.env` file (gitignored):

**PowerShell:**

```powershell
$env:OPENAI_API_KEY = "sk-..."   # paste once per terminal window
```

**Optional `.env` file** (local only):

```powershell
copy .env.example .env
# edit .env and paste your key
```

3. When you call OpenAI, use that env var (see `scripts/fetch-device-types.mjs`).
4. On submit, paste the **same key** into the form so they can match your usage to your email/repo.

### When to use the API (minimal tokens)

| Task | API? | Notes |
|------|------|--------|
| `device_type` for 55 models | Optional | Pre-filled in `src/data/device-types.json`. Re-run `npm run fetch-types` if you want model-generated labels (~1 call, `gpt-4o-mini`). |
| `manufactured_date` per row | **No** | Parsed from serial patterns in `src/enrichment/serial-date.ts` |

```bash
npm run fetch-types
```

Regenerates `src/data/device-types.json` from one batched OpenAI request.

## Submission checklist

- [x] `enriched.csv` in repo root
- [ ] All source code committed (no `.env`, no API keys)
- [ ] Demo video link above (YouTube/Loom — replace `YOUR_LINK`)
- [ ] GitHub repo URL + email + API key on Equiply form

## Build

```bash
npm run build
```
