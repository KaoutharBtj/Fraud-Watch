// src/components/charts/AnomalyScatter.jsx
// Plots each transaction's amount_ratio (x) against its ml_score (y) —
// directly visualizes the same signal detector_agent.py uses to catch
// card-testing patterns: abnormally low ratios clustering with high scores.
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const COLORS = {
  APPROVE: '#4caf7d',
  REVIEW: '#e0a93e',
  BLOCK: '#d9534f',
}

export default function AnomalyScatter({ transactions }) {
  const points = transactions.map((tx) => ({
    x: tx.amount_ratio,
    y: tx.ml_score,
    decision: tx.final_decision,
    customerId: tx.customer_id,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <XAxis
          type="number"
          dataKey="x"
          name="Amount ratio"
          stroke="#8892a6"
          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={{ stroke: '#262f42' }}
          tickLine={false}
          label={{
            value: 'Amount ratio (x avg)',
            position: 'insideBottom',
            offset: -4,
            fill: '#8892a6',
            fontSize: 11,
          }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="Risk score"
          domain={[0, 100]}
          stroke="#8892a6"
          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
        />
        <ZAxis range={[40, 41]} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3', stroke: '#37415a' }}
          contentStyle={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
          formatter={(value, name) => [value, name]}
          labelFormatter={() => ''}
        />
        <Scatter data={points}>
          {points.map((p, i) => (
            <Cell key={i} fill={COLORS[p.decision] || '#8892a6'} fillOpacity={0.75} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}