import Papa from 'papaparse'
import type { EnrichedEquipment, EquipmentRecord } from '../types/equipment'
import { EQUIPMENT_COLUMNS, OUTPUT_COLUMNS } from '../types/equipment'

const REQUIRED_HEADERS = [...EQUIPMENT_COLUMNS]

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '_')
}

function rowToEquipment(row: Record<string, string>): EquipmentRecord | null {
  const manufacturer = row.manufacturer?.trim()
  const model = row.model?.trim()
  const serial_number = row.serial_number?.trim()

  if (!manufacturer || !model || !serial_number) {
    return null
  }

  return { manufacturer, model, serial_number }
}

export function parseEquipmentCsv(text: string): {
  records: EquipmentRecord[]
  errors: string[]
} {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  })

  const errors: string[] = []

  if (parsed.errors.length > 0) {
    for (const err of parsed.errors) {
      errors.push(err.message)
    }
  }

  const headers = parsed.meta.fields?.map(normalizeHeader) ?? []
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h))
  if (missing.length > 0) {
    errors.push(`Missing required columns: ${missing.join(', ')}`)
    return { records: [], errors }
  }

  const records: EquipmentRecord[] = []
  parsed.data.forEach((row, index) => {
    const record = rowToEquipment(row)
    if (record) {
      records.push(record)
    } else if (Object.values(row).some((v) => v?.trim())) {
      errors.push(`Row ${index + 2}: missing manufacturer, model, or serial_number`)
    }
  })

  return { records, errors }
}

export function enrichedToCsv(rows: EnrichedEquipment[]): string {
  return Papa.unparse(rows, { columns: [...OUTPUT_COLUMNS] })
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
