import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabase'

const CONFIDENCE_LABELS = { not_sure: 'Not sure', somewhat_sure: 'Somewhat sure', very_sure: 'Very sure' }

// Platform-wide version of the per-user calibration chart already in
// dashboard-pages/TaskScorecardPage.jsx, plus a daily activity trend and a
// "hardest tasks" ranking, all from admin_* RPCs in
// supabase/add_admin_analytics.sql.
export default function TaskSection() {
  const [confidence, setConfidence] = useState([])
  const [activity, setActivity] = useState([])
  const [hardest, setHardest] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: a }, { data: h }] = await Promise.all([
        supabase.rpc('admin_task_accuracy_by_confidence'),
        supabase.rpc('admin_task_activity_by_day'),
        supabase.rpc('admin_hardest_tasks'),
      ])
      setConfidence((c || []).map((row) => ({ ...row, label: CONFIDENCE_LABELS[row.confidence] || row.confidence })))
      setActivity(a || [])
      setHardest(h || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="admin-card admin-loading">Loading task performance…</div>

  return (
    <div className="admin-card">
      <h3 className="admin-card-title">Task performance</h3>

      <h4 className="admin-card-subtitle">Accuracy by confidence (platform-wide calibration)</h4>
      {confidence.length === 0 ? (
        <p className="admin-empty">No task attempts yet.</p>
      ) : (
        <div className="admin-chart-box admin-chart-box-sm">
          <ResponsiveContainer>
            <BarChart data={confidence}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="accuracy_pct" fill="#3b6fd8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <h4 className="admin-card-subtitle">Daily activity</h4>
      {activity.length === 0 ? (
        <p className="admin-empty">No activity in the last 30 days.</p>
      ) : (
        <div className="admin-chart-box admin-chart-box-sm">
          <ResponsiveContainer>
            <LineChart data={activity}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="attempts" stroke="#3b6fd8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <h4 className="admin-card-subtitle">Hardest tasks</h4>
      {hardest.length === 0 ? (
        <p className="admin-empty">Not enough attempts yet to rank tasks.</p>
      ) : (
        <table className="admin-table">
          <thead><tr><th>Task</th><th>Category</th><th>Difficulty</th><th>Attempts</th><th>Accuracy</th></tr></thead>
          <tbody>
            {hardest.map((h, i) => (
              <tr key={i}>
                <td>{h.task_id}</td>
                <td>{h.category}</td>
                <td>{h.difficulty}</td>
                <td>{h.attempts}</td>
                <td>{h.accuracy_pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
