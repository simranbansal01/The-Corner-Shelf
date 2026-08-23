import { useState, useRef, useEffect } from 'react'
import { pickBuddyPrompt, pickGuidePrompt } from '../lib/buddyPrompts'
import { getLLMBuddyFeedback } from '../lib/buddyLLM'
import { logEvent, logError } from '../lib/events'
import { useAuth } from '../context/AuthContext'
import PetIllustration from './PetIllustration'

// The buddy is a small illustrated creature (not an emoji), sitting in the
// corner by default, draggable anywhere on screen, with a gentle idle sway
// so it feels alive without being distracting. Which creature it is comes
// from the user's onboarding pick (profile.pet_choice), see PetIllustration.
//
// context shape: { screen, taskId?, scenario?, aiOutput?, userJudgmentText?, currentAnswerSummary?, confidence?, isCorrect? }
//
// petOverride: mid-onboarding, the user's pet pick lives in Bookshelf's own
// local state until the whole onboarding flow finishes and writes it (plus
// everything else) to `users` in one save, see saveOnboardingAnswers. Without
// this, the corner icon would keep showing the old/default pet through the
// entire why/goal/level/placement flow after picking a different one,
// since profile.pet_choice doesn't change until that final write + refresh.
export default function BuddyPanel({ context, petOverride }) {
  const { profile } = useAuth()
  const pet = petOverride || profile?.pet_choice || 'sprout'
  const petSize = profile?.pet_size ?? 1
  const [open, setOpen] = useState(false)
  const [waking, setWaking] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [question, setQuestion] = useState('')
  const [position, setPosition] = useState(null) // null = default corner position (set via CSS)
  const openedAt = useRef(null)
  const drag = useRef({ dragging: false, moved: false, startX: 0, startY: 0, origX: 0, origY: 0 })
  const lastVerdictKey = useRef(null)

  function defaultPos() {
    return { x: window.innerWidth - 76, y: window.innerHeight - 76 }
  }

  // Four distinct modes, not just "has a verdict or not":
  //  - 'reaction': a verdict exists (context.isCorrect is set), react to it.
  //  - 'guide': the user is mid-task (on the task screen, task loaded) but
  //    hasn't submitted a judgment yet. Help them think it through without
  //    ever implying an answer, since nothing's been judged. Also gets the
  //    ask box below, still routed through the server's GUIDING mode so a
  //    typed question gets answered without ever leaking the verdict.
  //  - 'chapter': reading a book chapter (video/notes/quiz page). No verdict
  //    to react to, but there IS real content Buddy can answer questions
  //    against, specific to whatever's on the current page (chapter notes,
  //    the video's caption, or the exact quiz question on screen, see
  //    BookReader's per-page-type buddyContext), via the ask box below and
  //    the server's EXPLAINING instructions in supabase/functions/buddy-feedback.
  //  - 'idle': nothing to react to and no chapter/task in progress (e.g.
  //    clicked from the dashboard). Static message, no LLM call needed.
  // Getting this wrong is exactly the bug this app teaches people to catch:
  // earlier, clicking Buddy before submitting still called the LLM with no
  // verdict, and it hallucinated a "nice, you got it right" reaction to an
  // answer that was never given.
  function resolveMode() {
    const hasVerdict = context?.isCorrect !== null && context?.isCorrect !== undefined
    if (hasVerdict) return 'reaction'
    if (context?.screen === 'task' && context?.taskId) return 'guide'
    if (context?.screen === 'chapter') return 'chapter'
    return 'idle'
  }
  const mode = resolveMode()

  // Tries a live, grounded reaction first (Groq, then Gemini on failure,
  // see lib/buddyLLM.js), and only falls back to the static templates if
  // both providers fail or time out. Buddy should never go silent.
  async function openWithReaction(source) {
    const confidence = context?.confidence ?? null
    const isCorrect = context?.isCorrect ?? null
    openedAt.current = Date.now()
    logEvent(source === 'auto' ? 'buddy_auto_reacted' : 'buddy_icon_clicked', {
      context_screen: context?.screen,
      context_task_id: context?.taskId ?? null,
      mode,
    })
    setWaking(true)
    setTimeout(() => setWaking(false), 420)
    setOpen(true)

    if (mode === 'idle') {
      const { stateKey, prompt: text } = pickBuddyPrompt(null, null)
      setPrompt(text)
      setThinking(false)
      logEvent('buddy_prompt_shown', { prompt_template_id: stateKey, state: stateKey })
      return
    }

    // No verdict to react to yet here either, just an invite, the real
    // answer only happens once they type a question (see askQuestion).
    if (mode === 'chapter') {
      setPrompt("Stuck on something in this chapter? Ask below and I'll explain it using the notes.")
      setThinking(false)
      logEvent('buddy_prompt_shown', { prompt_template_id: 'chapter_invite', state: 'chapter' })
      return
    }

    setThinking(true)
    setPrompt('')

    logEvent('llm_call_started', { context_screen: context?.screen, context_task_id: context?.taskId ?? null, mode })
    const llmResult = await getLLMBuddyFeedback({
      mode,
      screen: context?.screen,
      taskId: context?.taskId,
      scenario: context?.scenario,
      aiOutput: context?.aiOutput,
      confidence,
      isCorrect,
      userJudgmentText: context?.userJudgmentText,
      currentAnswerSummary: context?.currentAnswerSummary,
      goal: profile?.onboarding_goal,
    })

    if (llmResult) {
      setPrompt(llmResult.text)
      setThinking(false)
      logEvent('llm_call_succeeded', { source: llmResult.source, mode })
      logEvent('buddy_prompt_shown', { prompt_template_id: llmResult.source, state: llmResult.source })
      return
    }

    logError('llm_call_failed', 'both providers failed or timed out', 'openWithReaction')
    const { stateKey, prompt: text } = mode === 'guide' ? pickGuidePrompt() : pickBuddyPrompt(confidence, isCorrect)
    setPrompt(text)
    setThinking(false)
    logEvent('buddy_prompt_shown', { prompt_template_id: stateKey, state: stateKey })
  }

  // The ask box's submit, available on both 'chapter' pages (video/notes/
  // quiz) and mid-task 'guide' pages, but talking to the server in two
  // different modes:
  //  - 'chapter': the server's EXPLAINING mode, a genuine teaching moment,
  //    answers directly using whatever's on the current page (chapter
  //    notes, the video's caption, or the exact quiz question on screen,
  //    see BookReader's per-page-type buddyContext).
  //  - 'guide' (mid-task): still the server's GUIDING mode, so it answers
  //    the question but never reveals the verdict, same rule as the
  //    automatic nudge, just responding to what was actually asked instead
  //    of a generic prompt.
  async function askQuestion() {
    const text = question.trim()
    if (!text || thinking) return
    // question text included so BuddyScorecardPage.jsx can list/categorize
    // what was actually asked, not just count that something was.
    logEvent('buddy_question_asked', { context_screen: context?.screen, mode, question: text })
    setThinking(true)
    setPrompt('')
    setQuestion('')

    const payload = mode === 'guide'
      ? {
          mode: 'guide',
          screen: context?.screen,
          taskId: context?.taskId,
          scenario: context?.scenario,
          aiOutput: context?.aiOutput,
          currentAnswerSummary: context?.currentAnswerSummary,
          userJudgmentText: context?.userJudgmentText,
          askedQuestion: text,
          goal: profile?.onboarding_goal,
        }
      : {
          mode: 'explain',
          screen: context?.screen,
          videoTitle: context?.chapterTitle,
          notes: context?.notes,
          question: text,
          goal: profile?.onboarding_goal,
        }

    logEvent('llm_call_started', { context_screen: context?.screen, mode: payload.mode })
    const llmResult = await getLLMBuddyFeedback(payload)

    if (llmResult) {
      setPrompt(llmResult.text)
      setThinking(false)
      logEvent('llm_call_succeeded', { source: llmResult.source, mode: payload.mode })
      logEvent('buddy_prompt_shown', { prompt_template_id: llmResult.source, state: payload.mode })
      // Question + answer together in one event (not correlated across two
      // rows by timestamp, which would be fragile) so BuddyScorecardPage.jsx
      // can show the actual response under each question, not just the ask.
      logEvent('buddy_question_answered', { context_screen: context?.screen, mode: payload.mode, question: text, answer: llmResult.text })
      return
    }

    logError('llm_call_failed', 'both providers failed or timed out', 'askQuestion')
    setPrompt("Sorry, I couldn't reach that just now. Try asking again in a moment.")
    setThinking(false)
  }

  // The buddy reacts on its own the moment a verdict comes in. It shouldn't
  // require the user to notice it's clickable to ever get feedback from it.
  useEffect(() => {
    const key = context?.taskId ? `${context.taskId}:${context.isCorrect}` : null
    if (context?.isCorrect !== null && context?.isCorrect !== undefined && key !== lastVerdictKey.current) {
      lastVerdictKey.current = key
      openWithReaction('auto')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context?.isCorrect, context?.taskId])

  function handlePointerDown(e) {
    const pos = position || defaultPos()
    drag.current = { dragging: true, moved: false, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!drag.current.dragging) return
    const dx = e.clientX - drag.current.startX
    const dy = e.clientY - drag.current.startY
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.current.moved = true
    if (drag.current.moved) {
      const newX = Math.min(Math.max(drag.current.origX + dx, 40), window.innerWidth - 40)
      const newY = Math.min(Math.max(drag.current.origY + dy, 40), window.innerHeight - 40)
      setPosition({ x: newX, y: newY })
    }
  }

  function handlePointerUp() {
    if (!drag.current.dragging) return
    const wasMoved = drag.current.moved
    drag.current.dragging = false
    if (!wasMoved) handleToggle()
  }

  function handleToggle() {
    if (!open) {
      openWithReaction('click')
    } else {
      const durationMs = openedAt.current ? Date.now() - openedAt.current : 0
      logEvent('buddy_panel_closed', { duration_open_ms: durationMs })
      setOpen(false)
    }
  }

  const pos = position || defaultPos()
  const containerSize = 64 * petSize

  return (
    <div className="buddy-wrapper" style={{ left: pos.x, top: pos.y }}>
      {open && (
        <div className={`buddy-panel ${mode === 'chapter' || mode === 'guide' ? 'buddy-panel-wide' : ''}`} style={{ bottom: containerSize + 10 }}>
          <button className="buddy-close" onClick={handleToggle} aria-label="Close">×</button>
          <p className="buddy-prompt-text">{thinking ? 'Thinking…' : prompt}</p>
          {(mode === 'chapter' || mode === 'guide') && (
            <div className="buddy-ask-box">
              <textarea
                className="buddy-ask-input"
                rows={2}
                maxLength={280}
                placeholder={mode === 'guide' ? 'Ask for a hint (no spoilers)…' : 'Ask about this chapter…'}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    askQuestion()
                  }
                }}
              />
              <button
                type="button"
                className="buddy-ask-btn"
                disabled={!question.trim() || thinking}
                onClick={askQuestion}
              >
                Ask
              </button>
            </div>
          )}
        </div>
      )}
      <div
        className={`buddy-character ${open ? 'buddy-character-active' : 'buddy-character-idle'} ${waking ? 'buddy-character-waking' : ''}`}
        style={{ width: containerSize, height: containerSize }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="button"
        tabIndex={0}
        aria-label="Your practice buddy"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggle() }}
      >
        <PetIllustration pet={pet} state={waking ? 'waking' : open ? 'active' : 'idle'} size={46 * petSize} />
      </div>
    </div>
  )
}
