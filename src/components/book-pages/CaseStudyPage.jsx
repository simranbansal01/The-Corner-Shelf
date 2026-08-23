import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { logEvent, logError } from '../../lib/events'
import Button from '../Button'

const MIN_LENGTH = 20

// The book's closing page, ported from the artifact's own "casestudy" page
// type: a real-work scenario, a textarea, and a "Submit to Buddy" button
// that (once the answer is long enough) locks the textarea and shows a
// confirmation, same behavior and copy as the reference. Persists the
// answer the same way the app's old capstone reflection did.
export default function CaseStudyPage({ caseStudy, onContextChange }) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [hint, setHint] = useState('A few sentences is plenty — Buddy just wants to see your reasoning.')
  const [hintIsError, setHintIsError] = useState(false)

  useEffect(() => {
    logEvent('case_study_shown')
  }, [])

  useEffect(() => {
    onContextChange?.({ screen: 'case-study' })
  }, [onContextChange])

  async function handleSubmit() {
    if (submitting || submitted) return
    if (text.trim().length < MIN_LENGTH) {
      setHint('Buddy needs a bit more to go on — try writing a few full sentences.')
      setHintIsError(true)
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('real_work_reflections').insert({
        user_id: user.id,
        response_text: text.trim(),
        submitted_at: new Date().toISOString(),
      })
      if (error) throw error
      logEvent('case_study_submitted', { char_count: text.trim().length })
      setSubmitted(true)
    } catch (err) {
      logError('case_study_submit_failed', err.message, 'handleSubmit')
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h2 style={{ margin: '4px 0 12px 0' }}>Case Study</h2>
      {caseStudy.prompt.split('\n\n').map((para, i) => (
        <p key={i} className="case-study-prompt">{para}</p>
      ))}
      <textarea
        className="judgment-textarea case-study-textarea"
        rows={6}
        placeholder="Write your recommendation here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={submitted}
      />
      {!submitted && (
        <>
          <p className={`case-study-hint ${hintIsError ? 'case-study-hint-error' : ''}`}>{hint}</p>
          <Button disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Submitting…' : 'Submit to Buddy'}
          </Button>
        </>
      )}
      {submitted && (
        <div className="reader-buddy-response">
          ✓ Buddy read your case study and gave it a thoughtful nod.
        </div>
      )}
    </>
  )
}
