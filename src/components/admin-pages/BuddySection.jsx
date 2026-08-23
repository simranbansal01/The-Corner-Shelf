import { useEffect, useState } from 'react'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabase'

const SOURCE_COLORS = { groq: '#7fae95', gemini: '#3b6fd8', unknown: '#9b9184' }

// Platform-wide version of dashboard-pages/BuddyScorecardPage.jsx's
// per-user stats.
export default function BuddySection() {
  const [usage, setUsage] = useState([])
  const [source, setSource] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: u }, { data: s }] = await Promise.all([
        supabase.rpc('admin_buddy_usage_by_day'),
        supabase.rpc('admin_buddy_source_split'),
      ])
      setUsage(u || [])
      setSource(s || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="admin-card admin-loading">Loading Buddy usage…</div>

  return (
    <div className="admin-card">
      <h3 className="admin-card-title">Buddy usage</h3>

      {usage.length === 0 ? (
        <p className="admin-empty">No Buddy activity in the last 30 days.</p>
      ) : (
        <div className="admin-chart-box admin-chart-box-sm">
          <ResponsiveContainer>
            <LineChart data={usage}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="opens" stroke="#7fae95" strokeWidth={2} dot={false} name="Opens" />
              <Line type="monotone" dataKey="questions" stroke="#3b6fd8" strokeWidth={2} dot={false} name="Questions" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <h4 className="admin-card-subtitle">Answer source</h4>
      {source.length === 0 ? (
        <p className="admin-empty">No LLM answers logged yet.</p>
      ) : (
        <div className="admin-chart-box admin-chart-box-sm">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={source} dataKey="count" nameKey="source" innerRadius={40} outerRadius={70} paddingAngle={2}>
                {source.map((d, i) => (
                  <Cell key={i} fill={SOURCE_COLORS[d.source] || '#9b9184'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
