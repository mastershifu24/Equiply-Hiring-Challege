import deviceTypes from '../data/device-types.json'

const lookup = deviceTypes as Record<string, string>

export function deviceTypeKey(manufacturer: string, model: string): string {
  return `${manufacturer.trim().toLowerCase()}|${model.trim().toLowerCase()}`
}

export function lookupDeviceType(
  manufacturer: string,
  model: string,
): string | null {
  return lookup[deviceTypeKey(manufacturer, model)] ?? null
}
