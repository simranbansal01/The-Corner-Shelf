import { useState, useRef, useEffect } from 'react'
import { pickBuddyPrompt } from '../lib/buddyPrompts'
import { getLLMBuddyFeedback } from '../lib/buddyLLM'
import { logEvent, logError } from '../lib/events'
import { useAuth } from '../context/AuthContext'
import { usePetBuddy } from '../context/PetBuddyContext'
import PetBuddy from './PetBuddy'

// The buddy is a sprite-sheet mascot (see PetBuddy.jsx), sitting in the
// corner by default, draggable anywhere on screen, with a continuous
// walk-in-place cycle so it feels alive without actually drifting around
// the screen. Which character shows up is profile.buddy_character (see
// BuddyCharacterControl.jsx) — separate from profile.pet_choice (sprout/
// fox/owl/cat), which is still used elsewhere (companion-corner panel, the
// 3D shop's onboarding figurine) and no longer affects this icon at all.
//
// Two independent ways the buddy ends up on screen with something to say:
//  1. Global triggers (usePetBuddy: triggerSuccess/triggerError/triggerGuide,
//     see context/PetBuddyContext.jsx) — called directly from wherever the
//     real event happens (task submission, chapter completion, module
//     intros), with a static message. Auto-opens the panel, no LLM call.
//  2. Manually clicking Niblet — still driven by the `context` prop below
//     (screen/taskId/etc, fed by TaskPage/BookReader), which only ever
//     covers 'guide' (mid-task hint box) and 'chapter' (ask-about-this-
//     chapter box) now; verdict reactions moved to (1) so they're no longer
//     click-gated.
// context shape: { screen, taskId?, quizPending?, scenario?, aiOutput?, userJudgmentText?, currentAnswerSummary?, confidence? }
export default function BuddyPanel({ context }) {
  const { profile } = useAuth()
  const { state: globalState, message: globalMessage, setIdle: setGlobalIdle } = usePetBuddy()
  const petSize = profile?.pet_size ?? 1
  const buddyCharacter = profile?.buddy_character || 'niblet'
  const [open, setOpen] = useState(false)
  const [waking, setWaking] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [question, setQuestion] = useState('')
  const [position, setPosition] = useState(null) // null = default corner position (set via CSS)
  const openedAt = useRef(null)
  const drag = useRef({ dragging: false, moved: false, startX: 0, startY: 0, origX: 0, origY: 0 })
  const openedViaTrigger = useRef(false)

  function defaultPos() {
    return { x: window.innerWidth - 76, y: window.innerHeight - 76 }
  }

  // Just the click-driven modes now — 'reaction' (task verdicts) and
  // 'celebrate_event' (module unlocks) moved to the global trigger system,
  // see the effect below reacting to usePetBuddy()'s state/message.
  //  - 'guide': mid-task, hasn't submitted yet. Helps without ever implying
  //    an answer — gets the ask box below, routed through the server's
  //    GUIDING mode so a typed question gets answered without leaking the
  //    verdict. An unanswered chapter quiz question is guide mode too (see
  //    quizPending below): same no-spoilers rule applies, it's still a
  //    question with a right answer the reader hasn't submitted yet.
  //  - 'chapter': reading a book chapter (video/notes/quiz page). Ask box
  //    routed through the server's EXPLAINING mode, grounded in whatever's
  //    on the current page (see BookReader's per-page-type buddyContext).
  //    Only reached once any quiz question on the page has already been
  //    answered — BookReader withholds its explanation from context until
  //    then, so this mode is never handed something it could spoil.
  //  - 'idle': nothing to react to, e.g. clicked from the dashboard. Static
  //    message, no LLM call needed.
  function resolveMode() {
    if (context?.screen === 'task' && context?.taskId) return 'guide'
    if (context?.screen === 'chapter' && context?.quizPending) return 'guide'
    if (context?.screen === 'chapter') return 'chapter'
    return 'idle'
  }
  const mode = resolveMode()

  // A live global trigger always wins visually over the click-driven mode —
  // it's reacting to something that just actually happened, more important
  // than "you have Niblet's panel open for a hint."
  function resolveVisualState() {
    if (globalState !== 'idle') return globalState
    if (open && mode === 'guide') return 'guiding'
    return 'idle'
  }

  // Click-driven open only (idle/guide/chapter) — reactions to real events
  // now go through the global trigger effect below instead of here.
  async function openWithReaction() {
    openedViaTrigger.current = false
    openedAt.current = Date.now()
    logEvent('buddy_icon_clicked', { context_screen: context?.screen, context_task_id: context?.taskId ?? null, mode })
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

    if (mode === 'chapter') {
      setPrompt("Stuck on something in this chapter? Ask below and I'll explain it using the notes.")
      setThinking(false)
      logEvent('buddy_prompt_shown', { prompt_template_id: 'chapter_invite', state: 'chapter' })
      return
    }

    // mode === 'guide': an invite, the real answer only happens once they
    // type a question (see askQuestion).
    setPrompt("Stuck? Ask below for a hint — I won't give away the answer.")
    setThinking(false)
    logEvent('buddy_prompt_shown', { prompt_template_id: 'guide_invite', state: 'guide' })
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

  // Reacts to global triggers (triggerSuccess/triggerError/triggerGuide,
  // called directly from wherever the real event happens — see
  // PetBuddyContext.jsx). Auto-opens with the static message, no LLM call;
  // auto-closes again once the global state resets to 'idle', but only if
  // this panel is still showing that triggered message (not a manual
  // conversation the user started after the trigger fired).
  useEffect(() => {
    if (globalState === 'idle') {
      if (openedViaTrigger.current) {
        setOpen(false)
        openedViaTrigger.current = false
      }
      return
    }
    openedViaTrigger.current = true
    openedAt.current = Date.now()
    logEvent('buddy_auto_reacted', { trigger_state: globalState })
    setWaking(true)
    setTimeout(() => setWaking(false), 420)
    setOpen(true)
    setThinking(false)
    setPrompt(globalMessage || '')
    logEvent('buddy_prompt_shown', { prompt_template_id: 'global_trigger', state: globalState })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalState, globalMessage])

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
      openWithReaction()
    } else {
      const durationMs = openedAt.current ? Date.now() - openedAt.current : 0
      logEvent('buddy_panel_closed', { duration_open_ms: durationMs })
      setOpen(false)
      // Closing a triggered message (most relevantly a guide tip, which has
      // no auto-timeout) should also clear the global state, or it'd just
      // pop back open on the next render since globalState is still active.
      if (openedViaTrigger.current) {
        openedViaTrigger.current = false
        setGlobalIdle()
      }
    }
  }

  const pos = position || defaultPos()
  const containerSize = 100 * petSize

  return (
    <div className="buddy-wrapper" style={{ left: pos.x, top: pos.y }}>
      {open && (
        <div className={`buddy-panel ${mode === 'chapter' || mode === 'guide' ? 'buddy-panel-wide' : ''}`} style={{ bottom: containerSize + 10 }}>
          <button className="buddy-close" onClick={handleToggle} aria-label="Close">×</button>
          <p className="buddy-prompt-text">{thinking ? 'Thinking…' : prompt}</p>
          {!openedViaTrigger.current && (mode === 'chapter' || mode === 'guide') && (
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
        <PetBuddy character={buddyCharacter} state={resolveVisualState()} position="inline" size={76 * petSize} />
      </div>
    </div>
  )
}
