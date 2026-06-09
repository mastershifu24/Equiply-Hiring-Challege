import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'
import { lookupDeviceType } from '../src/enrichment/device-types'
import { parseManufacturedDate } from '../src/enrichment/serial-date'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const inputPath =
  process.argv[2] ?? path.join(root, 'public', 'sample-equipment.csv')
const outPath =
  process.argv[3] ?? path.join(root, 'examples', 'enriched-sample.csv')

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '_')
}

function parseDateSort(value: string): number {
  if (!value) return Infinity
  const t = Date.parse(value)
  return Number.isNaN(t) ? Infinity : t
}

if (!fs.existsSync(inputPath)) {
  console.error('Input CSV not found:', inputPath)
  process.exit(1)
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })

const text = fs.readFileSync(inputPath, 'utf8')
const parsed = Papa.parse<Record<string, string>>(text, {
  header: true,
  skipEmptyLines: true,
  transformHeader: normalizeHeader,
})

const rows = parsed.data
  .map((r) => ({
    manufacturer: r.manufacturer?.trim() ?? '',
    model: r.model?.trim() ?? '',
    serial_number: r.serial_number?.trim() ?? '',
  }))
  .filter((r) => r.manufacturer && r.model && r.serial_number)
  .map((r) => ({
    ...r,
    manufactured_date:
      parseManufacturedDate(r.serial_number, r.manufacturer) ?? '',
    device_type: lookupDeviceType(r.manufacturer, r.model) ?? '',
  }))
  .sort(
    (a, b) =>
      parseDateSort(a.manufactured_date) - parseDateSort(b.manufactured_date),
  )

const csv = Papa.unparse(rows, {
  columns: [
    'manufacturer',
    'model',
    'serial_number',
    'manufactured_date',
    'device_type',
  ],
})

fs.writeFileSync(outPath, csv)
console.log(`Wrote ${rows.length} rows to ${outPath}`)
const missing = rows.filter((r) => !r.manufactured_date).length
console.log(`Rows missing manufactured_date: ${missing}`)
