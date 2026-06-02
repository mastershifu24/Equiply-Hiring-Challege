import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { parseManufacturedDate } from '../src/enrichment/serial-date'

const input = path.join(
  process.env.USERPROFILE ?? '',
  'Downloads',
  'challenge_data-v1.csv',
)
const parsed = Papa.parse<Record<string, string>>(fs.readFileSync(input, 'utf8'), {
  header: true,
  skipEmptyLines: true,
})

const miss: { m: string; model: string; s: string }[] = []
for (const r of parsed.data) {
  const s = (r['serial number'] ?? r.serial_number ?? '').trim()
  const m = r.manufacturer?.trim() ?? ''
  if (!parseManufacturedDate(s, m)) miss.push({ m, model: r.model ?? '', s })
}

const counts = new Map<string, number>()
for (const row of miss) counts.set(row.m, (counts.get(row.m) ?? 0) + 1)

console.log('missing', miss.length)
;[...counts.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([m, n]) => console.log(n, m))

for (const m of [...counts.keys()].slice(0, 12)) {
  console.log('\n', m)
  miss
    .filter((r) => r.m === m)
    .slice(0, 6)
    .forEach((r) => console.log('  ', r.s))
}
