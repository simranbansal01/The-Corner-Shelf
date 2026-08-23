import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { logEvent } from '../../lib/events'

const CONFIDENCE_LABELS = { not_sure: 'Not sure', somewhat_sure: 'Somewhat sure', very_sure: 'Very sure' }

// Merges the old Ledger (trust score + calibration chart) and Noticeboard
// (task attempt history) menu panels into one page: both were "how am I
// doing on tasks", no reason to keep them as two separate destinations.
// Same queries/logic as the retired TrustScorePanel/HistoryPanel.
export default function TaskScorecardPage() {
  const { user } = useAuth()
  const [score, setScore] = useState(null)
  const [chartData, setChartData] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    logEvent('trust_score_detail_viewed')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true)
    const { data: scoreRow } = await supabase
      .from('trust_scores')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    setScore(scoreRow)

    const { data: allAttempts } = await supabase
      .from('task_attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(50)
    setAttempts(allAttempts || [])

    const hasEnoughData = allAttempts && allAttempts.length >= 5
    logEvent('calibration_chart_viewed', { has_enough_data: hasEnoughData })

    if (hasEnoughData) {
      const buckets = ['not_sure', 'somewhat_sure', 'very_sure'].map((key) => {
        const inBucket = allAttempts.filter((a) => a.confidence === key)
        const correct = inBucket.filter((a) => a.is_correct).length
        const accuracy = inBucket.length > 0 ? Math.round((correct / inBucket.length) * 100) : 0
        return { confidence: CONFIDENCE_LABELS[key], accuracy, count: inBucket.length }
      })
      setChartData(buckets)
    }
    setLoading(false)
  }

  if (loading) return <p>Loading…</p>

  const hasEnoughData = score && score.total_attempts >= 5

  return (
    <>
      <h2 style={{ margin: '4px 0 12px 0' }}>Task Scorecard</h2>

      {score ? (
        <>
          <p className="trust-score-number">{score.current_score}%</p>
          <p>Based on {score.total_attempts} tasks.</p>
        </>
      ) : (
        <p>No tasks attempted yet.</p>
      )}

      {hasEnoughData ? (
        <>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <XAxis dataKey="confidence" />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#3b6fd8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="calibration-caption">
            Accuracy at each confidence level. Ideally, "very sure" should have the highest bar.
            If a lower-confidence bucket scores higher, that's a sign of miscalibration worth noticing.
          </p>
        </>
      ) : (
        <p className="trust-score-calibrating">
          Still calibrating: complete {5 - (score?.total_attempts ?? 0)} more task(s) to unlock your calibration chart.
        </p>
      )}

      <h3 style={{ margin: '24px 0 8px 0' }}>Task history</h3>
      {attempts.length === 0 ? (
        <p>No attempts yet.</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr><th>Task</th><th>Date</th><th>Result</th><th>Confidence</th></tr>
          </thead>
          <tbody>
            {attempts.map((a) => (
              <tr key={a.id}>
                <td>{a.task_id}</td>
                <td>{new Date(a.submitted_at).toLocaleDateString()}</td>
                <td>{a.is_correct ? 'Correct' : 'Incorrect'}</td>
                <td>{a.confidence.replace('_', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
