import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ReferralSection() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.rpc('admin_referral_leaderboard').then(({ data, error }) => {
      if (!error) setData(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="admin-card admin-loading">Loading referrals…</div>

  return (
    <div className="admin-card">
      <h3 className="admin-card-title">Referral leaderboard</h3>
      {data.length === 0 ? (
        <p className="admin-empty">No referred signups yet.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Inviter</th><th>Email</th><th>Friends invited</th></tr></thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={i}>
                <td>{r.display_name || '—'}</td>
                <td>{r.email}</td>
                <td>{r.referral_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
