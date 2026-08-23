import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const EVENT_LABELS = {
  bookshelf_stage_clicked: 'Opened a book',
  book_closed: 'Closed a book',
  task_submitted: 'Submitted a task',
  task_viewed: 'Viewed a task',
  chapter_quiz_answered: 'Answered a quiz question',
  buddy_icon_clicked: 'Opened Buddy',
  buddy_question_asked: 'Asked Buddy a question',
  shop_panel_opened: 'Opened a panel',
  case_study_submitted: 'Submitted a case study',
  pet_changed: 'Changed companion',
  onboarding_completed: 'Finished onboarding',
  placement_completed: 'Finished the placement quiz',
}

function labelFor(eventName) {
  return EVENT_LABELS[eventName] || eventName.replace(/_/g, ' ')
}

// Reads back events logEvent() has been recording since day one (events was
// insert-only until add_events_select_policy.sql added a SELECT policy for
// the owning user, see that migration).
export default function JourneyPage() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select('event_name, occurred_at')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(200)
    setEvents(data || [])
    setLoading(false)
  }

  if (loading) return <p>Loading…</p>

  const activeDays = new Set(events.map((e) => new Date(e.occurred_at).toDateString())).size
  const counts = events.reduce((acc, e) => {
    acc[e.event_name] = (acc[e.event_name] || 0) + 1
    return acc
  }, {})
  const topEvents = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'

  return (
    <>
      <h2 style={{ margin: '4px 0 12px 0' }}>Your Journey</h2>
      <div className="scorecard-tile-grid">
        <div className="scorecard-tile">
          <p className="scorecard-tile-number">{memberSince}</p>
          <p className="scorecard-tile-label">Member since</p>
        </div>
        <div className="scorecard-tile">
          <p className="scorecard-tile-number">{activeDays}</p>
          <p className="scorecard-tile-label">Days active</p>
        </div>
        <div className="scorecard-tile">
          <p className="scorecard-tile-number">{events.length}{events.length === 200 ? '+' : ''}</p>
          <p className="scorecard-tile-label">Actions logged</p>
        </div>
      </div>

      {topEvents.length > 0 && (
        <>
          <p className="field-label" style={{ marginTop: 20 }}>What you do most</p>
          <ul className="dashboard-stat-list">
            {topEvents.map(([name, count]) => (
              <li key={name}>
                <span style={{ textTransform: 'capitalize' }}>{labelFor(name)}</span>
                <span>{count}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="field-label" style={{ marginTop: 20 }}>Recent activity</p>
      {events.length === 0 ? (
        <p>Nothing logged yet — start exploring the shop.</p>
      ) : (
        <ul className="journey-activity-list">
          {events.slice(0, 15).map((e, i) => (
            <li key={i}>
              <span>{labelFor(e.event_name)}</span>
              <span>{new Date(e.occurred_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
