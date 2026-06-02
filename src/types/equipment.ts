export const EQUIPMENT_COLUMNS = [
  'manufacturer',
  'model',
  'serial_number',
] as const

export const ENRICHMENT_COLUMNS = [
  'manufactured_date',
  'device_type',
] as const

export const OUTPUT_COLUMNS = [
  ...EQUIPMENT_COLUMNS,
  ...ENRICHMENT_COLUMNS,
] as const

export type EquipmentColumn = (typeof EQUIPMENT_COLUMNS)[number]
export type EnrichmentColumn = (typeof ENRICHMENT_COLUMNS)[number]
export type OutputColumn = (typeof OUTPUT_COLUMNS)[number]

export interface EquipmentRecord {
  manufacturer: string
  model: string
  serial_number: string
}

export interface EnrichedEquipment extends EquipmentRecord {
  manufactured_date: string
  device_type: string
}

export interface EnrichmentResult {
  manufactured_date: string | null
  device_type: string | null
}
