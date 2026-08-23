import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ErrorsSection() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.rpc('admin_recent_errors').then(({ data, error }) => {
      if (!error) setData(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="admin-card admin-loading">Loading error log…</div>

  return (
    <div className="admin-card admin-card-errors">
      <h3 className="admin-card-title">Recent errors</h3>
      {data.length === 0 ? (
        <p className="admin-empty">Nothing logged — platform's been quiet.</p>
      ) : (
        <ul className="admin-error-list">
          {data.map((e, i) => (
            <li key={i}>
              <span className="admin-error-type">{e.error_type}</span>
              <span className="admin-error-message">{e.error_message}</span>
              <span className="admin-error-time">{new Date(e.occurred_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
