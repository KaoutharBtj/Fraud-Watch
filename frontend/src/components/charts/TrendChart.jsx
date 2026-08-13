// src/components/charts/TrendChart.jsx
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function TrendChart({ data }) {
  const chartData = data.map((d) => ({
    day: formatDay(d.day),
    Approved: d.approved,
    Review: d.review,
    Blocked: d.blocked,
    'Avg score': d.avg_score,
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <XAxis
          dataKey="day"
          stroke="#8892a6"
          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={{ stroke: '#262f42' }}
          tickLine={false}
        />
        <YAxis
          yAxisId="count"
          stroke="#8892a6"
          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          yAxisId="score"
          orientation="right"
          stroke="#c08552"
          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
          labelStyle={{ color: 'var(--text-primary)' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-body)' }} />
        <Area
          yAxisId="count"
          type="monotone"
          dataKey="Approved"
          stackId="d"
          stroke="#4caf7d"
          fill="#4caf7d"
          fillOpacity={0.3}
        />
        <Area
          yAxisId="count"
          type="monotone"
          dataKey="Review"
          stackId="d"
          stroke="#e0a93e"
          fill="#e0a93e"
          fillOpacity={0.3}
        />
        <Area
          yAxisId="count"
          type="monotone"
          dataKey="Blocked"
          stackId="d"
          stroke="#d9534f"
          fill="#d9534f"
          fillOpacity={0.3}
        />
        <Line
          yAxisId="score"
          type="monotone"
          dataKey="Avg score"
          stroke="#c08552"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

function formatDay(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}