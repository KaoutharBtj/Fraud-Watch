// src/components/charts/RiskDistributionChart.jsx
// Note: Recharts renders raw SVG attributes, which don't reliably resolve
// CSS custom properties (var(--x)) the way normal CSS does — so chart
// colors are literal hex values here, kept in sync with tokens.css by hand.
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const BANDS = [
  { key: 'low', label: 'Low', color: '#4caf7d' },
  { key: 'medium', label: 'Medium', color: '#e0a93e' },
  { key: 'high', label: 'High', color: '#e08a3e' },
  { key: 'critical', label: 'Critical', color: '#d9534f' },
]

export default function RiskDistributionChart({ data }) {
  const chartData = BANDS.map((b) => ({ name: b.label, value: data[b.key] ?? 0, color: b.color }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <XAxis
          dataKey="name"
          stroke="#8892a6"
          tick={{ fontSize: 12, fontFamily: 'var(--font-body)' }}
          axisLine={{ stroke: '#262f42' }}
          tickLine={false}
        />
        <YAxis
          stroke="#8892a6"
          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: 'var(--surface-raised)' }}
          contentStyle={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
          labelStyle={{ color: 'var(--text-primary)' }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}