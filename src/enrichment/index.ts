import type { EnrichedEquipment, EquipmentRecord } from '../types/equipment'
import type { ReferenceLookup } from './reference'
import { resolveEnrichment } from './resolve'

export function enrichRecords(
  records: EquipmentRecord[],
  reference: ReferenceLookup | null = null,
): EnrichedEquipment[] {
  return records.map((record) => {
    const enrichment = resolveEnrichment(record, reference)
    return {
      ...record,
      manufactured_date: enrichment.manufactured_date ?? '',
      device_type: enrichment.device_type ?? '',
    }
  })
}

export { parseReferenceCsv, type ReferenceLookup } from './reference'
