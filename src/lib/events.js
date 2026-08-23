import { supabase } from './supabase'

// Fire-and-forget event logging. Never blocks the UI, never throws.
// Covers the core funnel from doc 05 (05_event_tracking_spec.md).
// Add more calls to logEvent() anywhere you want more granular tracking later,
// this function and the events table already support any event_name/payload shape.
export async function logEvent(eventName, payload = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('events').insert({
      user_id: user?.id ?? null,
      event_name: eventName,
      payload,
    })
  } catch (err) {
    // Logging must never break the app. Swallow errors, just note them in the console.
    console.warn('logEvent failed (non-blocking):', eventName, err)
  }
}

// Separate helper for errors: writes to the errors table AND fires a generic event,
// matching doc 05's "error_occurred mirrors the errors table" instruction.
export async function logError(errorType, errorMessage, triggeringAction) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('errors').insert({
      user_id: user?.id ?? null,
      error_type: errorType,
      error_message: errorMessage,
      triggering_action: triggeringAction,
    })
    await logEvent('error_occurred', { errorType, errorMessage, triggeringAction })
  } catch (err) {
    console.warn('logError failed (non-blocking):', err)
  }
}
