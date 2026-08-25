import { createContext, useContext, useRef, useState } from 'react'

// Global "make Niblet react" triggers, callable from anywhere in the app
// (task submission, chapter completion, module intros) without threading a
// context object through props for every new kind of moment. This is
// separate from BuddyPanel's own click-driven ask-box (guide/chapter Q&A,
// still fed by the existing per-screen `context` prop) — this only covers
// "Niblet reacts on its own to something that just happened."
const PetBuddyCtx = createContext(null)

const AUTO_RESET_MS = 3500

export function PetBuddyProvider({ children }) {
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState(null)
  const resetTimer = useRef(null)

  function clearResetTimer() {
    if (resetTimer.current) {
      clearTimeout(resetTimer.current)
      resetTimer.current = null
    }
  }

  function triggerSuccess(msg) {
    clearResetTimer()
    setState('celebrate')
    setMessage(msg)
    resetTimer.current = setTimeout(() => {
      setState('idle')
      setMessage(null)
    }, AUTO_RESET_MS)
  }

  function triggerError(msg) {
    clearResetTimer()
    setState('alert')
    setMessage(msg)
    resetTimer.current = setTimeout(() => {
      setState('idle')
      setMessage(null)
    }, AUTO_RESET_MS)
  }

  // No auto-reset timer: a tip/explanation is worth reading at your own
  // pace, not a quick pass/fail flash — stays up until the next trigger or
  // an explicit setIdle() (BuddyPanel calls this when its panel is closed).
  function triggerGuide(msg) {
    clearResetTimer()
    setState('guiding')
    setMessage(msg)
  }

  function setIdle(msg) {
    clearResetTimer()
    setState('idle')
    setMessage(msg || null)
  }

  const value = { state, message, triggerSuccess, triggerError, triggerGuide, setIdle }
  return <PetBuddyCtx.Provider value={value}>{children}</PetBuddyCtx.Provider>
}

export function usePetBuddy() {
  const ctx = useContext(PetBuddyCtx)
  if (!ctx) throw new Error('usePetBuddy must be used inside PetBuddyProvider')
  return ctx
}
