import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabase'

const TIER_COLORS = { basic: '#7fae95', intermediate: '#e3b23c', advanced: '#c1554d', none: '#9b9184' }
const TIER_LABELS = { basic: 'Basic', intermediate: 'Intermediate', advanced: 'Advanced', none: 'No tier yet' }

export default function TierSection() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.rpc('admin_tier_distribution').then(({ data, error }) => {
      if (!error) setData(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="admin-card admin-loading">Loading tiers…</div>

  const total = data.reduce((sum, d) => sum + Number(d.count), 0)

  return (
    <div className="admin-card">
      <h3 className="admin-card-title">Tier distribution</h3>
      {total === 0 ? (
        <p className="admin-empty">No users yet.</p>
      ) : (
        <div className="admin-chart-box">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="tier" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {data.map((d, i) => (
                  <Cell key={i} fill={TIER_COLORS[d.tier] || '#9b9184'} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, TIER_LABELS[n] || n]} />
              <Legend formatter={(v) => TIER_LABELS[v] || v} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
