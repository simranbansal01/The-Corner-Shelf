import { supabase } from './supabase'

// Calls the buddy-feedback Edge Function (Groq primary, Gemini fallback,
// see supabase/functions/buddy-feedback). Resolves to null on any failure:
// network error, function error, or timeout, so BuddyPanel can fall back
// to the static templates in buddyPrompts.js. Buddy should never go silent
// just because a live API call failed.
//
// 35s covers the worst case, not the common one: Groq is typically a
// couple seconds. The margin exists for when Groq fails and it falls
// through to Gemini, whose gemini-3.6-flash model always runs a mandatory
// hidden "thinking" pass before producing visible text (15-27s observed,
// no way to disable it via the API).
const TIMEOUT_MS = 35000

function timeoutAfter(ms) {
  return new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), ms))
}

export async function getLLMBuddyFeedback(payload) {
  try {
    const result = await Promise.race([
      supabase.functions.invoke('buddy-feedback', { body: payload }),
      timeoutAfter(TIMEOUT_MS),
    ])
    if (result?.timedOut) return null
    const { data, error } = result
    if (error || !data?.text) return null
    return { text: data.text, source: data.source }
  } catch {
    return null
  }
}
