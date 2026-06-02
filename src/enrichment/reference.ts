import Papa from 'papaparse'
import type { EnrichmentResult } from '../types/equipment'

export interface ReferenceEntry {
  manufactured_date: string
  device_type: string
}

export type ReferenceLookup = Map<string, ReferenceEntry>

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

export function referenceKey(
  manufacturer: string,
  model: string,
  serial_number?: string,
): string {
  if (serial_number?.trim()) {
    return `serial:${normalize(serial_number)}`
  }
  return `mm:${normalize(manufacturer)}|${normalize(model)}`
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '_')
}

export function parseReferenceCsv(text: string): ReferenceLookup {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  })

  const lookup: ReferenceLookup = new Map()

  for (const row of parsed.data) {
    const manufactured_date = row.manufactured_date?.trim()
    const device_type = row.device_type?.trim()
    if (!manufactured_date || !device_type) continue

    const entry: ReferenceEntry = { manufactured_date, device_type }

    const serial = row.serial_number?.trim()
    if (serial) {
      lookup.set(referenceKey('', '', serial), entry)
    }

    const manufacturer = row.manufacturer?.trim()
    const model = row.model?.trim()
    if (manufacturer && model) {
      lookup.set(referenceKey(manufacturer, model), entry)
    }
  }

  return lookup
}

export function lookupReference(
  lookup: ReferenceLookup | null,
  manufacturer: string,
  model: string,
  serial_number: string,
): EnrichmentResult | null {
  if (!lookup || lookup.size === 0) return null

  const bySerial = lookup.get(referenceKey('', '', serial_number))
  if (bySerial) {
    return {
      manufactured_date: bySerial.manufactured_date,
      device_type: bySerial.device_type,
    }
  }

  const byModel = lookup.get(referenceKey(manufacturer, model))
  if (byModel) {
    return {
      manufactured_date: byModel.manufactured_date,
      device_type: byModel.device_type,
    }
  }

  return null
}
