import type { EnrichedEquipment } from '../types/equipment'
import { OUTPUT_COLUMNS } from '../types/equipment'

const COLUMN_LABELS: Record<string, string> = {
  manufacturer: 'Manufacturer',
  model: 'Model',
  serial_number: 'Serial number',
  manufactured_date: 'Manufactured date',
  device_type: 'Device type',
}

interface EquipmentTableProps {
  rows: EnrichedEquipment[]
}

export function EquipmentTable({ rows }: EquipmentTableProps) {
  if (rows.length === 0) {
    return (
      <p className="empty-state">
        Upload equipment CSV to see enriched data sorted by manufactured date.
      </p>
    )
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {OUTPUT_COLUMNS.map((col) => (
              <th key={col}>{COLUMN_LABELS[col] ?? col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.serial_number}>
              {OUTPUT_COLUMNS.map((col) => (
                <td key={col}>{row[col] || '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
