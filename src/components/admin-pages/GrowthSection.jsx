import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabase'

export default function GrowthSection() {
  const [signups, setSignups] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: r }] = await Promise.all([
        supabase.rpc('admin_signups_by_day'),
        supabase.rpc('admin_recent_signups'),
      ])
      setSignups(s || [])
      setRecent(r || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="admin-card admin-loading">Loading growth…</div>

  return (
    <div className="admin-card">
      <h3 className="admin-card-title">Growth</h3>
      {signups.length === 0 ? (
        <p className="admin-empty">No signups in the last 30 days.</p>
      ) : (
        <div className="admin-chart-box">
          <ResponsiveContainer>
            <LineChart data={signups}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b6fd8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <h4 className="admin-card-subtitle">Recent signups</h4>
      {recent.length === 0 ? (
        <p className="admin-empty">No signups yet.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Tier</th><th>Joined</th></tr></thead>
          <tbody>
            {recent.map((r, i) => (
              <tr key={i}>
                <td>{r.display_name || '—'}</td>
                <td>{r.email}</td>
                <td>{r.tier || 'none'}</td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
