# Equipment Enrichment

A browser-based tool for enriching hospital equipment CSV files with **manufactured date** (decoded from serial numbers) and **device type** (from a lookup table).

Upload a CSV → view a sorted table and device-type pie chart → export enriched results. **All processing runs client-side** — files never leave the browser.

> **Background:** This project started as a hiring challenge (hospital asset inventory enrichment). I rebuilt it as a standalone portfolio app: same core problem, no challenge-specific branding, sample data only, and a focus on readable TypeScript you can learn from.

---

## Table of contents

- [Live demo & video](#live-demo--video)
- [Commands cheat sheet](#commands-cheat-sheet)
- [Quick start](#quick-start)
- [Using the dashboard](#using-the-dashboard)
- [Input & output format](#input--output-format)
- [How enrichment works](#how-enrichment-works)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [CLI (batch enrichment)](#cli-batch-enrichment)
- [Learning TypeScript with this repo](#learning-typescript-with-this-repo)
- [Deploy](#deploy)
- [Optional: regenerate device types (OpenAI)](#optional-regenerate-device-types-openai)
- [Development](#development)

---

## Live demo & video

**Try locally:** run the dashboard (see [Commands](#commands-cheat-sheet)), then upload `public/sample-equipment.csv`.

**Sample files:**

| File | Purpose |
|------|---------|
| `public/sample-equipment.csv` | 8-row input — manufacturer, model, serial number |
| `public/sample-reference.csv` | Optional overrides for `manufactured_date` / `device_type` |
| `examples/enriched-sample.csv` | Example output from `npm run enrich` |

**Walkthrough video:** [Loom demo](https://www.loom.com/share/b9da5e66daac4cd39e0b5650283521f2)

---

## Commands cheat sheet

There is **no** `npm run demo`. Use these:

| Command | What it does |
|---------|----------------|
| `npm install` | Install dependencies (first time) |
| **`npm run dev`** | **Start the dashboard** — Vite dev server (usually http://localhost:5173) |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Serve the production build locally (run after `build`) |
| `npm run lint` | ESLint |
| `npm run enrich` | CLI: enrich CSV on disk (same logic as the app) |
| `npm run fetch-types` | Optional: regenerate `device-types.json` via OpenAI |

---

## Quick start

```bash
git clone https://github.com/YOUR_USERNAME/equipment-enrichment.git
cd equipment-enrichment
npm install
npm run dev
```

1. Open the URL Vite prints (default **http://localhost:5173**).
2. Click **Equipment CSV** and choose `public/sample-equipment.csv`.
3. Review the table and pie chart.
4. Click **Export enriched CSV**.

---

## Using the dashboard

### Equipment CSV (required)

Required columns (header names are flexible — spaces become underscores, case-insensitive):

- `manufacturer`
- `model`
- `serial number` or `serial_number`

Rows missing any of these fields are skipped with an error summary.

### Reference CSV (optional)

Upload a second file to **override** enrichment for specific rows. Useful when:

- A serial format isn’t implemented yet
- You have ground-truth dates from another system
- You want to demo “partial parser + manual fixes”

Reference rows are matched on `manufacturer`, `model`, and `serial_number`. Re-upload the equipment file after loading reference data to re-run enrichment.

### Export

**Export enriched CSV** downloads `enriched.csv` with columns:

`manufacturer`, `model`, `serial_number`, `manufactured_date`, `device_type`

Rows are sorted **ascending by manufactured date** (empty dates sort last).

---

## Input & output format

### Input example

```csv
manufacturer,model,serial_number
ZOLL Medical,AEDPlus,T15A00360162
Philips,IntelliVue MP20,DE622A000543
```

### Output example

```csv
manufacturer,model,serial_number,manufactured_date,device_type
Philips,IntelliVue MP20,DE622A000543,1962-01-01,Patient Monitor
ZOLL Medical,AEDPlus,T15A00360162,2015-01-01,AED
```

Dates are ISO `YYYY-MM-DD`. Empty string means “could not resolve.”

---

## How enrichment works

For each equipment row, two fields are resolved in `src/enrichment/resolve.ts`:

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│ Reference CSV   │────▶│ resolveEnrichment()  │────▶│ Enriched row    │
│ (optional)      │     │                      │     │ date + type     │
└─────────────────┘     │  1. Reference hit?   │     └─────────────────┘
                          │  2. Else parser /  │
┌─────────────────┐     │     lookup           │
│ Serial + mfg    │────▶│                      │
└─────────────────┘     └──────────────────────┘
┌─────────────────┐              ▲
│ device-types    │──────────────┘
│ .json lookup    │
└─────────────────┘
```

| Field | Primary source | Fallback |
|-------|----------------|----------|
| `manufactured_date` | Reference CSV | `parseManufacturedDate()` in `serial-date.ts` — manufacturer-specific rules on the serial string |
| `device_type` | Reference CSV | `lookupDeviceType()` in `device-types.ts` — key `manufacturer\|model` (lowercased) in `device-types.json` |

### Serial date parsing (high level)

`serial-date.ts` applies **vendor-specific rules** — there is no single universal format. Examples:

| Manufacturer pattern | Idea |
|---------------------|------|
| ZOLL (`T15…`, `AR22…`, etc.) | Two-digit year codes in prefix |
| Philips (`DE62…`) | `DE` + two digits → 19xx or 20xx |
| Jiangmen (`WU20160706…`) | Embedded `YYYYMMDD` after `WU` |
| GE (`SPX18…`) | Prefix letters + two-digit year |
| Mindray (`FS-190615-…`) | Segmented date in serial |

Leading parenthetical prefixes like `(21) ABC123` are stripped before parsing.

Years are clamped to a plausible range (1950–2040). Invalid dates return empty.

### Device type lookup

`src/data/device-types.json` maps ~55 `manufacturer|model` pairs to short labels (e.g. `"Patient Monitor"`, `"Infusion Pump"`). Keys are built with:

```ts
`${manufacturer.trim().toLowerCase()}|${model.trim().toLowerCase()}`
```

Model spelling must match the lookup key (e.g. `AEDPlus` not `AED Plus` for ZOLL).

---

## Architecture

```
Browser (React)
  │
  ├─ FileUpload ──▶ parseEquipmentCsv() / parseReferenceCsv()
  │
  ├─ enrichRecords() ──▶ resolveEnrichment() per row
  │                        ├─ serial-date.ts
  │                        ├─ device-types.ts
  │                        └─ reference.ts
  │
  ├─ sortByManufacturedDateAsc()
  ├─ deviceTypeDistribution() ──▶ DeviceTypeChart (Recharts)
  ├─ EquipmentTable
  └─ enrichedToCsv() + downloadCsv()
```

**Design choices:**

- **No backend** — privacy-friendly; works offline after load; easy to deploy as static files.
- **Shared logic** — `scripts/enrich-cli.ts` imports the same `src/enrichment/` modules as the app.
- **Reference overrides** — separates “best effort parsing” from known-good data without forking the pipeline.

---

## Project structure

```
equipment-enrichment/
├── public/
│   ├── sample-equipment.csv      # Demo input
│   ├── sample-reference.csv      # Demo reference overrides
│   └── icons.svg
├── examples/
│   └── enriched-sample.csv       # CLI output example
├── scripts/
│   ├── enrich-cli.ts             # Batch enrich (Node + tsx)
│   └── fetch-device-types.mjs    # Optional OpenAI batch labeling
├── src/
│   ├── App.tsx                   # Layout, upload handlers, export
│   ├── components/
│   │   ├── FileUpload.tsx
│   │   ├── EquipmentTable.tsx
│   │   └── DeviceTypeChart.tsx
│   ├── enrichment/
│   │   ├── index.ts              # enrichRecords()
│   │   ├── resolve.ts            # reference → parser → lookup
│   │   ├── serial-date.ts        # Manufacturer serial parsers
│   │   ├── device-types.ts       # JSON lookup helpers
│   │   └── reference.ts          # Optional override CSV
│   ├── lib/
│   │   ├── csv.ts                # Parse + export CSV
│   │   ├── sort.ts               # Date ascending sort
│   │   └── stats.ts              # Pie chart percentages
│   ├── data/
│   │   └── device-types.json     # manufacturer|model → type
│   └── types/
│       └── equipment.ts          # Shared TypeScript interfaces
├── package.json
├── vite.config.ts
└── README.md
```

---

## CLI (batch enrichment)

Same enrichment as the web app, for automation or large files:

```bash
# Defaults: public/sample-equipment.csv → examples/enriched-sample.csv
npm run enrich

# Custom paths
npx tsx scripts/enrich-cli.ts path/to/input.csv path/to/output.csv
```

Output includes a count of rows still missing `manufactured_date`.

---

## Learning TypeScript with this repo

This codebase is intentionally small enough to read end-to-end. Suggested order:

1. **`src/types/equipment.ts`** — interfaces and column constants (`EquipmentRecord`, `EnrichedEquipment`).
2. **`src/lib/csv.ts`** — parsing user uploads with PapaParse; header normalization.
3. **`src/enrichment/resolve.ts`** — single place where business rules meet (`??` fallback chain).
4. **`src/enrichment/serial-date.ts`** — longest file; pick one manufacturer, trace one serial through to a date string.
5. **`src/App.tsx`** — React state, `useMemo` for sorted rows and chart data, file handlers.
6. **`scripts/enrich-cli.ts`** — same modules, no UI — good pattern for “shared core + thin shells.”

**Exercises:**

- Add a new manufacturer branch in `serial-date.ts` and a row in `sample-equipment.csv` to test it.
- Add a `device_types` entry in JSON for a new model.
- Extend `EquipmentTable` with a “missing date” filter.
- Code-split Recharts to shrink the production bundle (Vite currently warns about chunk size).

If you learned Python on a similar pipeline first, map concepts directly: `resolve.ts` ≈ enrich loop, `serial-date.ts` ≈ per-vendor parsers, `device-types.json` ≈ lookup dict.

---

## Deploy

The app is a **static SPA** — no API keys or server required for normal use.

```bash
npm run build
# output in dist/
```

### Recommended: Vercel

Best fit for Vite + React. This repo includes **`vercel.json`** — build settings are preconfigured (`npm run build` → `dist/`).

1. Push repo to GitHub.
2. [vercel.com](https://vercel.com) → **Add New Project** → Import your GitHub repo.
3. Vercel reads `vercel.json` automatically — click **Deploy** (no manual build/output fields needed).
4. Every push to `main` redeploys.

Optional CLI (after `npm i -g vercel`): run `vercel` in the project root from your terminal.

Free tier is enough for a portfolio demo.

### Also good

| Platform | Notes |
|----------|--------|
| **Netlify** | Same as Vercel — connect repo, build `dist`, publish |
| **Cloudflare Pages** | Fast global CDN, generous free tier |
| **GitHub Pages** | Free; add `base: '/repo-name/'` in `vite.config.ts` if not using a custom domain |

After deploy, link the live URL in your README and LinkedIn.

**Local production check before deploy:**

```bash
npm run build
npm run preview
```

---

## Optional: regenerate device types (OpenAI)

Not required — types are already in `src/data/device-types.json`.

If you add new manufacturer/model pairs and want AI-generated labels:

```bash
# PowerShell
$env:OPENAI_API_KEY = "sk-..."
npm run fetch-types

# Or with a custom CSV
node scripts/fetch-device-types.mjs path/to/equipment.csv
```

Copy `.env.example` to `.env` locally (never commit `.env`). Uses one batched `gpt-4o-mini` call.

---

## Development

**Requirements:** Node.js 20+ (LTS recommended)

```bash
npm run dev      # dashboard with hot reload
npm run lint     # ESLint
npm run build    # production build
```

### Tech stack

| Layer | Choice |
|-------|--------|
| UI | React 19, TypeScript |
| Build | Vite 6 |
| CSV | PapaParse |
| Charts | Recharts |
| CLI | tsx (TypeScript execute) |

---

## License

MIT (or add your preferred license)

---

## Author

Your name — [LinkedIn](https://linkedin.com/in/yourprofile) · [Live demo](https://your-deploy-url.vercel.app)

*Originally developed as a hiring-challenge submission; extended and open-sourced as a learning and portfolio project.*
