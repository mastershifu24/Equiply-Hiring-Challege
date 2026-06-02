import type { EnrichedEquipment } from '../types/equipment'

export interface DeviceTypeSlice {
  device_type: string
  count: number
  percentage: number
}

export function deviceTypeDistribution(
  rows: EnrichedEquipment[],
): DeviceTypeSlice[] {
  if (rows.length === 0) return []

  const counts = new Map<string, number>()
  for (const row of rows) {
    const key = row.device_type.trim() || 'Unknown'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const total = rows.length
  return [...counts.entries()]
    .map(([device_type, count]) => ({
      device_type,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count)
}
