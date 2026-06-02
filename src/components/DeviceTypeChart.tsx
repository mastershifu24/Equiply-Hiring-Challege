import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { DeviceTypeSlice } from '../lib/stats'

const COLORS = [
  '#0d6e6e',
  '#1a8f7a',
  '#3ba4a4',
  '#5c8fd6',
  '#7b6fd6',
  '#c45c8f',
  '#d97b4a',
  '#8f6b4a',
]

interface DeviceTypeChartProps {
  slices: DeviceTypeSlice[]
}

export function DeviceTypeChart({ slices }: DeviceTypeChartProps) {
  if (slices.length === 0) {
    return (
      <p className="empty-state">
        Device type distribution appears after enrichment.
      </p>
    )
  }

  return (
    <div className="chart-panel">
      <ResponsiveContainer width="100%" height={380}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="count"
            nameKey="device_type"
            cx="50%"
            cy="50%"
            innerRadius={56}
            outerRadius={108}
            paddingAngle={2}
          >
            {slices.map((_, index) => (
              <Cell
                key={slices[index].device_type}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, _name, item) => {
              const slice = item.payload as DeviceTypeSlice
              return [`${value} (${slice.percentage}%)`, slice.device_type]
            }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            wrapperStyle={{ paddingTop: 16, lineHeight: '1.6' }}
            formatter={(value) => {
              const slice = slices.find((s) => s.device_type === value)
              return slice
                ? `${value} (${slice.percentage}%)`
                : value
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
