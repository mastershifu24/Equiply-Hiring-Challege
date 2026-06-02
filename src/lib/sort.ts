import type { EnrichedEquipment } from '../types/equipment'

function parseManufacturedDate(value: string): number {
  const trimmed = value.trim()
  if (!trimmed) return Number.POSITIVE_INFINITY

  const iso = Date.parse(trimmed)
  if (!Number.isNaN(iso)) return iso

  const parts = trimmed.split(/[/\-.]/)
  if (parts.length === 3) {
    const [a, b, c] = parts.map((p) => Number.parseInt(p, 10))
    if (parts[0].length === 4) {
      const d = new Date(a, b - 1, c)
      if (!Number.isNaN(d.getTime())) return d.getTime()
    }
    const d = new Date(c, a - 1, b)
    if (!Number.isNaN(d.getTime())) return d.getTime()
  }

  return Number.POSITIVE_INFINITY
}

export function sortByManufacturedDateAsc(
  rows: EnrichedEquipment[],
): EnrichedEquipment[] {
  return [...rows].sort(
    (a, b) =>
      parseManufacturedDate(a.manufactured_date) -
      parseManufacturedDate(b.manufactured_date),
  )
}
