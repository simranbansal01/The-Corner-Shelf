import { useEffect, useRef, useState } from 'react'
import { logEvent, logError } from '../../lib/events'
import { usePetBuddy } from '../../context/PetBuddyContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import Button from '../Button'

// Chapter quiz question ids follow `${stageId}_c${chapterNumber}_q${n}` (see
// learnContent.js), so the id prefix without the trailing `_qN` is already a
// stable per-chapter key, no separate id field needed on the chapter object
// itself. Falls back to the title for the (currently nonexistent) case of a
// chapter with no quiz at all.
function chapterKeyFor(chapter) {
  return chapter.quiz[0]?.id.replace(/_q\d+$/, '') || chapter.title
}

// The table-of-contents page a Tier 1 book opens on: one entry per chapter
// plus the closing case-study ("Final Task"), each jumping straight to
// that page, matching the artifact's own clickable table of contents.
// Otherwise navigation is the reader's own prev/next arrows, same as every
// other page below, none of these render their own "continue" button.
export function TocPage({ tocEntries, onJump }) {
  return (
    <>
      <h2 style={{ margin: '4px 0 16px 0' }}>Contents</h2>
      <div className="toc-grid">
        {tocEntries.map((entry, i) => (
          <button key={i} type="button" className="toc-tile" onClick={() => onJump(entry.pageIndex)}>
            <span className="toc-tile-icon">{entry.icon || '✦'}</span>
            <span className="toc-tile-body">
              <span className="toc-item-kicker">{entry.kicker}</span>
              <span className="toc-item-title">{entry.title}</span>
            </span>
            <span className="toc-tile-arrow">›</span>
          </button>
        ))}
      </div>
    </>
  )
}

export function ChapterIntroPage({ chapter }) {
  return (
    <>
      <h2 style={{ margin: '4px 0 12px 0' }}>Introduction</h2>
      <p>{chapter.intro}</p>
    </>
  )
}

// Real embed once a chapter has a sourced videoId; otherwise a plain
// placeholder showing what the video will cover, no fake embed.
export function ChapterVideoPage({ chapter }) {
  return (
    <>
      <h2 style={{ margin: '4px 0 12px 0' }}>Watch &amp; Learn</h2>
      {chapter.videoId ? (
        <div className="video-embed-wrapper">
          <iframe
            className="video-embed-iframe"
            src={`https://www.youtube.com/embed/${chapter.videoId}`}
            title={chapter.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="video-placeholder-box">
          <span className="video-placeholder-icon">🎬</span>
          <p className="video-placeholder-caption">{chapter.videoCaption}</p>
        </div>
      )}
    </>
  )
}

export function ChapterNotesPage({ chapter }) {
  return (
    <>
      <h2 style={{ margin: '4px 0 12px 0' }}>Quick Notes</h2>
      {chapter.notesSections.map((section, si) => (
        <div key={si}>
          {section.heading && <p className="notes-section-heading">{section.heading}</p>}
          <ul className="notes-section-list">
            {section.items.map((item, i) =>
              typeof item === 'string' ? (
                <li key={i}>{item}</li>
              ) : (
                <li key={i}>
                  {item.text}
                  <ul className="notes-sub-list">
                    {item.subs.map((sub, si2) => (
                      <li key={si2}>{sub}</li>
                    ))}
                  </ul>
                </li>
              ),
            )}
          </ul>
        </div>
      ))}
    </>
  )
}

// One quiz question per page: pick an option, both the correct option and
// (if wrong) the one you picked light up at once, with an explanation
// underneath, matching the artifact's own quiz page exactly. No in-page
// "continue" button, the reader's prev/next arrows move on; onAnswered
// reports up to BookReader so the chapter's scorecard page can total it.
// Rendered with key={question.id} by BookReader so a fresh instance mounts
// per question instead of needing to reset state in an effect.
export function ChapterQuizPage({ question, onAnswered }) {
  const [selected, setSelected] = useState(null)
  const { triggerSuccess, triggerError } = usePetBuddy()

  function pick(optionId) {
    if (selected !== null) return
    setSelected(optionId)
    const isCorrect = optionId === question.correct
    logEvent('chapter_quiz_answered', { question_id: question.id, selected_option: optionId, is_correct: isCorrect })
    onAnswered(question.id, isCorrect)
    if (isCorrect) {
      triggerSuccess('Awesome job! You nailed that concept!')
    } else {
      triggerError("Uh oh, not quite! Check the hint and try again.")
    }
  }

  const answered = selected !== null
  const isCorrect = selected === question.correct

  return (
    <>
      <h2 style={{ margin: '4px 0 12px 0' }}>Quick Check</h2>
      <p className="chapter-quiz-question">{question.text}</p>
      <div className="chapter-quiz-options">
        {question.options.map((opt) => {
          const isSelected = selected === opt.id
          const isTheCorrectOne = opt.id === question.correct
          const showCorrect = answered && isTheCorrectOne
          const showIncorrect = answered && isSelected && !isTheCorrectOne
          return (
            <button
              key={opt.id}
              type="button"
              className={`chapter-quiz-option ${showCorrect ? 'chapter-quiz-option-correct' : ''} ${showIncorrect ? 'chapter-quiz-option-incorrect' : ''}`}
              onClick={() => pick(opt.id)}
              disabled={answered}
            >
              {opt.text}
            </button>
          )
        })}
      </div>

      {answered && question.explanation && (
        <div className="reader-explanation">
          <strong>{isCorrect ? "Correct — here's why:" : "Not quite — here's why:"}</strong> {question.explanation}
        </div>
      )}
    </>
  )
}

// The per-chapter scorecard: total from quizAnswers (populated by
// ChapterQuizPage's onAnswered as the reader goes), a caption depending on
// how they did, and a retake button that clears this chapter's answers and
// jumps back to its first quiz question, matching the artifact's own
// scorecard page. Once every question is answered, also asks for a quick
// rating and optional "what should be improved" note (quiz_feedback table) —
// BookReader remounts this component per chapter (key={chapterNumber}), so
// celebratedFor/feedbackSubmitted both start fresh for each new chapter
// without needing a manual reset effect.
export function ChapterScorePage({ stageId, chapter, quizAnswers, onRetake }) {
  const { user } = useAuth()
  const { triggerSuccess } = usePetBuddy()
  const celebratedFor = useRef(null)
  const questionIds = chapter.quiz.map((q) => q.id)
  const allAnswered = questionIds.every((id) => quizAnswers[id] !== undefined)
  const correctCount = questionIds.filter((id) => quizAnswers[id]).length
  const total = questionIds.length
  const chapterKey = chapterKeyFor(chapter)

  const [rating, setRating] = useState(null)
  const [improveText, setImproveText] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  // Fires once per chapter the first time its score page is reached fully
  // answered — guarded by chapterKey so revisiting an already-completed
  // chapter (or re-rendering mid-session) doesn't replay the celebration.
  useEffect(() => {
    if (allAnswered && celebratedFor.current !== chapterKey) {
      celebratedFor.current = chapterKey
      triggerSuccess('Chapter complete! Great work getting through that.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allAnswered, chapterKey])

  async function submitFeedback() {
    if (!rating || feedbackSubmitting) return
    setFeedbackSubmitting(true)
    try {
      const { error } = await supabase.from('quiz_feedback').insert({
        user_id: user.id,
        stage_id: stageId,
        chapter_key: chapterKey,
        rating,
        improve_text: improveText.trim() || null,
      })
      if (error) throw error
      logEvent('chapter_quiz_feedback_submitted', {
        stage_id: stageId,
        chapter_key: chapterKey,
        rating,
        has_improve_text: improveText.trim().length > 0,
      })
      setFeedbackSubmitted(true)
    } catch (err) {
      logError('quiz_feedback_submit_failed', err.message, 'submitFeedback')
      alert('Something went wrong submitting your feedback. Please try again.')
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  const caption = !allAnswered
    ? 'Answer all the questions in this chapter to see your score.'
    : correctCount === total
      ? "Perfect score! You've got this chapter down."
      : 'Nice work. Retake the quiz any time to sharpen your score.'

  return (
    <>
      <h2 style={{ margin: '4px 0 8px 0' }}>Chapter Complete</h2>
      <div className={`chapter-score ${allAnswered && correctCount < total ? 'chapter-score-low' : ''}`}>
        {allAnswered ? `${correctCount} / ${total}` : `— / ${total}`}
      </div>
      <p className="chapter-score-caption">{caption}</p>
      <Button variant="secondary" onClick={onRetake}>Retake Quiz</Button>

      {allAnswered && (
        <div className="chapter-feedback">
          {feedbackSubmitted ? (
            <p className="reader-buddy-response">✓ Thanks — that helps us improve this chapter.</p>
          ) : (
            <>
              <p className="chapter-feedback-label">How was this chapter's quiz?</p>
              <div className="chapter-feedback-stars" role="radiogroup" aria-label="Rate this chapter's quiz">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`chapter-feedback-star${rating >= n ? ' is-filled' : ''}`}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    aria-pressed={rating === n}
                    onClick={() => setRating(n)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                className="judgment-textarea"
                rows={2}
                maxLength={500}
                placeholder="Anything you'd want improved? (optional)"
                value={improveText}
                onChange={(e) => setImproveText(e.target.value)}
              />
              <Button disabled={!rating || feedbackSubmitting} onClick={submitFeedback}>
                {feedbackSubmitting ? 'Sending…' : 'Send feedback'}
              </Button>
            </>
          )}
        </div>
      )}
    </>
  )
}
