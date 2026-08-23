import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { gradeTask, summarizeAnswer } from '../../lib/taskGrading'
import { logEvent, logError } from '../../lib/events'
import Button from '../Button'
import ConfidenceSelector from '../ConfidenceSelector'

const TYPE_LABELS = {
  flaw_spot: 'Spot the flaw',
  scenario_decision: 'Scenario',
  troubleshooting: 'Troubleshooting',
  step_ordering: 'Put the steps in order',
}

function shuffledStepIds(steps) {
  const ids = steps.map((s) => s.id)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }
  return ids
}

// One practice-task page inside the open book. Ported from the old routed
// Task.jsx: same grading (taskGrading.js), same task_attempts write, same
// Buddy context shape, just driven by a `task` prop (the book already knows
// exactly which task this page is) instead of fetching "the next one" from
// a ?stage= URL param.
export default function TaskPage({ task, onAdvance, onContextChange }) {
  const { user } = useAuth()
  const [confidence, setConfidence] = useState(null)
  const [judgmentText, setJudgmentText] = useState('')
  const [flaggedWrong, setFlaggedWrong] = useState(null) // flaw_spot: true = "wrong", false = "looks fine"
  const [selected, setSelected] = useState(null) // scenario_decision / troubleshooting: option id
  const [order, setOrder] = useState([]) // step_ordering: step ids in current arrangement
  const [phase, setPhase] = useState('answering') // 'answering' | 'verdict'
  const [isCorrect, setIsCorrect] = useState(null)
  const [startedAt, setStartedAt] = useState(null)

  useEffect(() => {
    setPhase('answering')
    setConfidence(null)
    setJudgmentText('')
    setFlaggedWrong(null)
    setSelected(null)
    setOrder(task.type === 'step_ordering' ? shuffledStepIds(task.steps) : [])
    setStartedAt(Date.now())
    logEvent('task_viewed', { task_id: task.id, category: task.category, difficulty: task.difficulty, type: task.type })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id])

  function currentResponse() {
    if (task.type === 'step_ordering') return { order }
    if (task.type === 'flaw_spot') return { flaggedWrong }
    return { selected }
  }

  function canSubmit() {
    if (confidence === null) return false
    if (task.type === 'flaw_spot') return flaggedWrong !== null
    if (task.type === 'step_ordering') return order.length === task.steps.length
    return selected !== null
  }

  function moveStep(index, direction) {
    setOrder((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function handleSubmit() {
    if (!canSubmit()) return // guard, button should already be disabled

    try {
      const response = currentResponse()
      const correct = gradeTask(task, response)
      const { error } = await supabase.from('task_attempts').insert({
        user_id: user.id,
        task_id: task.id,
        confidence,
        user_judgment_text: judgmentText || null,
        user_flagged_wrong: task.type === 'flaw_spot' ? flaggedWrong : null,
        user_answer: task.type === 'step_ordering' ? JSON.stringify(order) : task.type === 'flaw_spot' ? null : selected,
        is_correct: correct,
        started_at: new Date(startedAt).toISOString(),
        submitted_at: new Date().toISOString(),
      })
      if (error) throw error

      logEvent('task_submitted', {
        task_id: task.id,
        type: task.type,
        confidence_level: confidence,
        time_spent_ms: Date.now() - startedAt,
      })

      setIsCorrect(correct)
      setPhase('verdict')
      logEvent('verdict_viewed', { task_id: task.id, is_correct: correct, confidence_level: confidence })
    } catch (err) {
      logError('submit_task_failed', err.message, 'handleSubmit')
      alert('Something went wrong submitting your answer. Please try again.')
    }
  }

  function handleNext() {
    logEvent('next_task_clicked', { task_id: task.id })
    onAdvance()
  }

  useEffect(() => {
    onContextChange({
      screen: 'task',
      taskId: task.id,
      scenario: task.scenario,
      // Extra detail beyond the scenario, per type. step_ordering has none
      // here on purpose: the steps ARE the answer key, so they're never
      // sent to Buddy, only the user's own in-progress order is (below).
      aiOutput:
        task.type === 'flaw_spot' ? task.aiOutput
        : task.type === 'troubleshooting' ? task.symptom
        : task.type === 'scenario_decision' ? task.question
        : null,
      userJudgmentText: judgmentText || null,
      // In-progress selection pre-submit, works for every task type, so
      // Buddy can respond to what the user is actually doing mid-task
      // instead of a generic nudge.
      currentAnswerSummary: phase === 'answering' ? summarizeAnswer(task, currentResponse()) : null,
      confidence,
      isCorrect: phase === 'verdict' ? isCorrect : null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id, phase, judgmentText, confidence, isCorrect, selected, flaggedWrong, order])

  const answerRecapText = summarizeAnswer(task, currentResponse())

  return (
    <>
      <p className="task-type-label">{TYPE_LABELS[task.type]}</p>

      {phase === 'answering' && (
        <>
          <p className="task-scenario">{task.scenario}</p>

          {task.type === 'flaw_spot' && (
            <div className="ai-output-box">
              <p className="ai-output-label">AI output</p>
              <p>{task.aiOutput}</p>
            </div>
          )}
          {task.type === 'troubleshooting' && (
            <div className="ai-output-box">
              <p className="ai-output-label">Symptom</p>
              <p>{task.symptom}</p>
            </div>
          )}
          {(task.type === 'scenario_decision' || task.type === 'troubleshooting') && (
            <p className="task-question">{task.question}</p>
          )}

          {task.type === 'flaw_spot' && (
            <div className="judgment-row">
              <Button variant={flaggedWrong === false ? 'primary' : 'secondary'} onClick={() => setFlaggedWrong(false)}>
                Looks fine
              </Button>
              <Button variant={flaggedWrong === true ? 'primary' : 'secondary'} onClick={() => setFlaggedWrong(true)}>
                Something's wrong
              </Button>
            </div>
          )}

          {(task.type === 'scenario_decision' || task.type === 'troubleshooting') && (
            <div className="option-list">
              {task.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`option-btn ${selected === opt.id ? 'option-btn-selected' : ''}`}
                  onClick={() => setSelected(opt.id)}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          )}

          {task.type === 'step_ordering' && (
            <div className="step-order-list">
              {order.map((stepId, i) => {
                const step = task.steps.find((s) => s.id === stepId)
                return (
                  <div className="step-order-row" key={stepId}>
                    <span className="step-order-num">{i + 1}</span>
                    <span className="step-order-text">{step.text}</span>
                    <div className="step-order-controls">
                      <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                      <button type="button" onClick={() => moveStep(i, 1)} disabled={i === order.length - 1} aria-label="Move down">↓</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <textarea
            className="judgment-textarea"
            placeholder="Optional: what specifically makes you sure (or unsure)?"
            value={judgmentText}
            onChange={(e) => setJudgmentText(e.target.value)}
            onFocus={() => logEvent('judgment_field_focused', { task_id: task.id })}
            onBlur={() =>
              logEvent('judgment_field_blurred', {
                task_id: task.id,
                has_content: judgmentText.length > 0,
                char_count: judgmentText.length,
              })
            }
          />

          <ConfidenceSelector value={confidence} onChange={setConfidence} />

          <Button onClick={handleSubmit} disabled={!canSubmit()}>
            Submit
          </Button>
        </>
      )}

      {phase === 'verdict' && (
        <>
          <p className="verdict-recap-label">{task.type === 'step_ordering' ? 'What you submitted' : 'What you judged'}</p>

          {task.type === 'step_ordering' ? (
            <div className="ai-output-box">
              <ol className="step-order-recap">
                {order.map((stepId) => {
                  const step = task.steps.find((s) => s.id === stepId)
                  return <li key={stepId}>{step.text}</li>
                })}
              </ol>
            </div>
          ) : (
            <>
              {task.type === 'flaw_spot' && (
                <div className="ai-output-box">
                  <p className="ai-output-label">AI output</p>
                  <p>{task.aiOutput}</p>
                </div>
              )}
              {task.type === 'troubleshooting' && (
                <div className="ai-output-box">
                  <p className="ai-output-label">Symptom</p>
                  <p>{task.symptom}</p>
                </div>
              )}
            </>
          )}

          <div className={`verdict-banner ${isCorrect ? 'verdict-correct' : 'verdict-incorrect'}`}>
            {isCorrect ? '✓ You called it correctly' : '✗ Not quite'}
          </div>

          <p className="verdict-section-label">What was actually going on</p>
          <p className="verdict-explanation">{task.explanation}</p>

          <p className="verdict-confidence-line">
            {task.type === 'step_ordering' ? (
              <>At <strong>{confidence.replace('_', ' ')}</strong> confidence, you were <strong>{isCorrect ? 'right' : 'wrong'}</strong>.</>
            ) : (
              <>You said <strong>{answerRecapText}</strong>, at <strong>{confidence.replace('_', ' ')}</strong> confidence, and you were <strong>{isCorrect ? 'right' : 'wrong'}</strong>.</>
            )}
          </p>

          <Button onClick={handleNext}>Next task</Button>
        </>
      )}
    </>
  )
}
