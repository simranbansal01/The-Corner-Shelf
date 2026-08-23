import { useState } from 'react'
import { logEvent } from '../../lib/events'
import Button from '../Button'

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

  function pick(optionId) {
    if (selected !== null) return
    setSelected(optionId)
    const isCorrect = optionId === question.correct
    logEvent('chapter_quiz_answered', { question_id: question.id, selected_option: optionId, is_correct: isCorrect })
    onAnswered(question.id, isCorrect)
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
// scorecard page.
export function ChapterScorePage({ chapter, quizAnswers, onRetake }) {
  const questionIds = chapter.quiz.map((q) => q.id)
  const allAnswered = questionIds.every((id) => quizAnswers[id] !== undefined)
  const correctCount = questionIds.filter((id) => quizAnswers[id]).length
  const total = questionIds.length

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
    </>
  )
}
