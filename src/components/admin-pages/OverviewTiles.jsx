import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useCountUp } from '../../lib/useCountUp'

const TILES = [
  { key: 'total_users', label: 'Total users' },
  { key: 'users_with_tier', label: 'Placed into a tier' },
  { key: 'active_users_7d', label: 'Active in last 7 days' },
  { key: 'total_task_attempts', label: 'Task attempts' },
  { key: 'overall_accuracy_pct', label: 'Overall accuracy', suffix: '%' },
  { key: 'total_chapters_completed', label: 'Chapters completed' },
  { key: 'total_buddy_opens', label: 'Buddy opens' },
  { key: 'total_referrals', label: 'Referred signups' },
]

function Tile({ label, value, suffix }) {
  const animated = useCountUp(value ?? 0)
  return (
    <div className="admin-kpi-tile">
      <p className="admin-kpi-number">{animated}{suffix || ''}</p>
      <p className="admin-kpi-label">{label}</p>
    </div>
  )
}

// admin_overview() (see supabase/add_admin_analytics.sql) returns one row
// of platform-wide totals in a single round trip, gated by assert_admin().
export default function OverviewTiles() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.rpc('admin_overview').then(({ data, error }) => {
      if (!error) setData(data?.[0] || null)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="admin-kpi-grid admin-loading">Loading overview…</div>
  if (!data) return null

  return (
    <div className="admin-kpi-grid">
      {TILES.map((t) => (
        <Tile key={t.key} label={t.label} value={data[t.key]} suffix={t.suffix} />
      ))}
    </div>
  )
}
