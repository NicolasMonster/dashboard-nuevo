'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatDate, formatCurrency, formatRoas } from '@/lib/utils'

interface RoasChartProps {
  data: { date: string; roas: number; spend: number; revenue: number }[]
  loading?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltipRoas = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-800 border border-slate-700 rounded-lg p-3 text-sm shadow-xl">
        <p className="text-slate-400 mb-2 font-medium">{formatDate(label)}</p>
        {payload.map((entry: { name: string; value: number; color: string }) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-300 capitalize">{entry.name}:</span>
            <span className="font-semibold text-white">
              {entry.name === 'roas' ? formatRoas(entry.value) : formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function RoasLineChart({ data, loading }: RoasChartProps) {
  if (loading) {
    return <div className="h-64 bg-surface-800 rounded-lg animate-pulse" />
  }

  if (!data?.length) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        Sin datos para el período seleccionado
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={{ stroke: '#1e293b' }}
          tickLine={false}
        />
        <YAxis
          yAxisId="roas"
          orientation="left"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}x`}
        />
        <Tooltip content={<CustomTooltipRoas />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
          formatter={(value) => value.toUpperCase()}
        />
        <Line
          yAxisId="roas"
          type="monotone"
          dataKey="roas"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface SalesChartProps {
  data: { date: string; roas: number; spend: number; revenue: number }[]
  loading?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltipBars = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-800 border border-slate-700 rounded-lg p-3 text-sm shadow-xl">
        <p className="text-slate-400 mb-2 font-medium">{formatDate(label)}</p>
        {payload.map((entry: { name: string; value: number; color: string }) => (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-300 capitalize">
              {entry.name === 'revenue' ? 'Revenue' : 'Inversión'}:
            </span>
            <span className="font-semibold text-white">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function SalesBarChart({ data, loading }: SalesChartProps) {
  if (loading) {
    return <div className="h-64 bg-surface-800 rounded-lg animate-pulse" />
  }

  if (!data?.length) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        Sin datos para el período seleccionado
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={{ stroke: '#1e293b' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
        />
        <Tooltip content={<CustomTooltipBars />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
          formatter={(value) => (value === 'revenue' ? 'Revenue' : 'Inversión')}
        />
        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={20} />
        <Bar dataKey="spend" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  )
}
