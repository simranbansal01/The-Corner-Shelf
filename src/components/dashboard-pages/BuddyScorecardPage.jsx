import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

// Reads back events BuddyPanel.jsx has been logging all along (events was
// insert-only until add_events_select_policy.sql added a SELECT policy for
// the owning user, see that migration). buddy_question_answered carries
// both the question and Buddy's actual reply in one row (see
// BuddyPanel.jsx's askQuestion), logged only once a real answer comes
// back, so a failed/unanswered ask never shows up here with nothing to
// expand.
const BUDDY_EVENT_NAMES = ['buddy_icon_clicked', 'buddy_auto_reacted', 'buddy_question_answered']

// Lightweight keyword heuristic, not real NLP: a question counts as
// "jargon" if it mentions one of these terms (the same list Buddy itself
// is told never to use without explaining, see buddyKnowledge.js's PLAIN
// LANGUAGE section, plus common AI/automation vocabulary spanning all 3
// tiers) — asking what a specific word means. Everything else counts as
// "concept" — asking how or why something works.
const JARGON_TERMS = [
  'token', 'parameter', 'deterministic', 'inference', 'latency', 'context window',
  'temperature', 'embedding', 'rag', 'retrieval augmented generation', 'fine-tun',
  'hallucinat', 'llm', 'api', 'chain-of-thought', 'chain of thought', 'few-shot',
  'zero-shot', 'guardrail', 'grounding', 'calibrat', 'vector database', 'vector db',
  'orchestrat', 'webhook', 'no-code', 'multi-agent', 'agentic', 'autogen',
  'langchain', 'crewai', 'zapier', 'make.com', 'n8n',
]

function classifyQuestion(text) {
  const lower = text.toLowerCase()
  return JARGON_TERMS.some((term) => lower.includes(term)) ? 'jargon' : 'concept'
}

// One question row, collapsed by default; expanding it reveals the answer
// Buddy actually gave. Each item owns its own open state so expanding one
// doesn't affect the others.
function QuestionItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="buddy-question-item">
      <button
        type="button"
        className="buddy-question-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{question}</span>
        <span className="buddy-question-caret">{open ? '▾' : '▸'}</span>
      </button>
      {open && <p className="buddy-question-answer">{answer}</p>}
    </li>
  )
}

export default function BuddyScorecardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select('event_name, payload')
      .eq('user_id', user.id)
      .in('event_name', BUDDY_EVENT_NAMES)

    const rows = data || []
    const opens = rows.filter((r) => r.event_name === 'buddy_icon_clicked' || r.event_name === 'buddy_auto_reacted').length
    const answeredRows = rows.filter((r) => r.event_name === 'buddy_question_answered' && r.payload?.question && r.payload?.answer)
    const questions = { concept: [], jargon: [] }
    answeredRows.forEach((r) => {
      questions[classifyQuestion(r.payload.question)].push({ question: r.payload.question, answer: r.payload.answer })
    })

    setStats({ opens, totalQuestions: answeredRows.length, questions })
    setLoading(false)
  }

  if (loading) return <p>Loading…</p>

  return (
    <>
      <h2 style={{ margin: '4px 0 12px 0' }}>Buddy Scorecard</h2>
      <div className="scorecard-tile-grid">
        <div className="scorecard-tile">
          <p className="scorecard-tile-number">{stats.opens}</p>
          <p className="scorecard-tile-label">Times you've opened Buddy</p>
        </div>
        <div className="scorecard-tile">
          <p className="scorecard-tile-number">{stats.totalQuestions}</p>
          <p className="scorecard-tile-label">Questions you've asked</p>
        </div>
      </div>

      <p className="field-label" style={{ marginTop: 20 }}>Concept questions</p>
      <p style={{ margin: '2px 0 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
        Asking how or why something works. Click one to see Buddy's answer.
      </p>
      {stats.questions.concept.length === 0 ? (
        <p>None yet.</p>
      ) : (
        <ul className="buddy-question-list">
          {stats.questions.concept.map((q, i) => <QuestionItem key={i} question={q.question} answer={q.answer} />)}
        </ul>
      )}

      <p className="field-label" style={{ marginTop: 20 }}>Jargon questions</p>
      <p style={{ margin: '2px 0 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
        Asking what a specific term means. Click one to see Buddy's answer.
      </p>
      {stats.questions.jargon.length === 0 ? (
        <p>None yet.</p>
      ) : (
        <ul className="buddy-question-list">
          {stats.questions.jargon.map((q, i) => <QuestionItem key={i} question={q.question} answer={q.answer} />)}
        </ul>
      )}

      {stats.opens === 0 && (
        <p style={{ marginTop: 16 }}>Nothing yet — open Buddy while reading a book or working on a task to start building this up.</p>
      )}
    </>
  )
}
