import type {
  EnrichmentResult,
  EquipmentRecord,
} from '../types/equipment'
import { lookupDeviceType } from './device-types'
import {
  lookupReference,
  type ReferenceLookup,
} from './reference'
import { parseManufacturedDate } from './serial-date'

export function resolveEnrichment(
  record: EquipmentRecord,
  reference: ReferenceLookup | null,
): EnrichmentResult {
  const fromReference = lookupReference(
    reference,
    record.manufacturer,
    record.model,
    record.serial_number,
  )

  const manufactured_date =
    fromReference?.manufactured_date ??
    parseManufacturedDate(record.serial_number, record.manufacturer) ??
    null

  const device_type =
    fromReference?.device_type ??
    lookupDeviceType(record.manufacturer, record.model) ??
    null

  return { manufactured_date, device_type }
}
