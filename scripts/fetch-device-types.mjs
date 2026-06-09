/**
 * Optional: batch-generate device_type labels via OpenAI for a CSV of equipment.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... npm run fetch-types
 *   node scripts/fetch-device-types.mjs path/to/equipment.csv
 *
 * Writes: src/data/device-types.json
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const apiKey = process.env.OPENAI_API_KEY
const inputPath =
  process.argv[2] ?? path.join(root, 'public', 'sample-equipment.csv')
const outPath = path.join(root, 'src/data/device-types.json')

if (!apiKey) {
  console.error('Set OPENAI_API_KEY in your environment first.')
  process.exit(1)
}

if (!fs.existsSync(inputPath)) {
  console.error('CSV not found:', inputPath)
  process.exit(1)
}

const parsed = Papa.parse(fs.readFileSync(inputPath, 'utf8'), {
  header: true,
  skipEmptyLines: true,
})

const pairs = [
  ...new Map(
    parsed.data.map((r) => {
      const manufacturer = r.manufacturer?.trim() ?? ''
      const model = r.model?.trim() ?? ''
      const key = `${manufacturer.toLowerCase()}|${model.toLowerCase()}`
      return [key, { manufacturer, model }]
    }),
  ).values(),
]

const prompt = `For each medical device below, return device_type (short category label).
Return JSON only: { "items": [ { "manufacturer": "...", "model": "...", "device_type": "..." } ] }

Devices:
${pairs.map((p) => `- ${p.manufacturer} | ${p.model}`).join('\n')}`

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You classify hospital equipment. Use consistent, concise device_type labels.',
      },
      { role: 'user', content: prompt },
    ],
  }),
})

if (!response.ok) {
  console.error('OpenAI error:', response.status, await response.text())
  process.exit(1)
}

const body = await response.json()
const content = body.choices?.[0]?.message?.content
const parsedJson = JSON.parse(content)
const items = parsedJson.items ?? parsedJson.devices ?? []

const lookup = {}
for (const item of items) {
  const key = `${item.manufacturer.trim().toLowerCase()}|${item.model.trim().toLowerCase()}`
  lookup[key] = item.device_type.trim()
}

fs.writeFileSync(outPath, JSON.stringify(lookup, null, 2) + '\n')
console.log(`Wrote ${Object.keys(lookup).length} device types to ${outPath}`)
