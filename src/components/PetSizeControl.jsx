import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { logEvent, logError } from '../lib/events'
import PetBuddy from './PetBuddy'

// pet_size scales whichever character is picked (profile.buddy_character,
// see BuddyCharacterControl.jsx) — BuddyPanel.jsx reads both the same way.
export default function PetSizeControl() {
  const { user, profile, refreshProfile } = useAuth()
  const character = profile?.buddy_character || 'niblet'
  const [size, setSize] = useState(profile?.pet_size ?? 1)
  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    setSize(Number(e.target.value))
  }

  async function handleCommit() {
    setSaving(true)
    try {
      const { error } = await supabase.from('users').update({ pet_size: size }).eq('id', user.id)
      if (error) throw error
      logEvent('pet_size_changed', { pet_size: size })
      await refreshProfile()
    } catch (err) {
      logError('pet_size_save_failed', err.message, 'handleCommit')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="pets-appearance-row">
        <div>
          <h3 style={{ margin: 0 }}>Buddy size</h3>
          <p style={{ margin: 0 }}>Adjust how big your buddy shows up.</p>
        </div>
        <span className="pets-size-preview">
          <PetBuddy character={character} state="idle" position="inline" size={40 * size} />
        </span>
      </div>
      <input
        type="range"
        min="0.7"
        max="1.6"
        step="0.05"
        value={size}
        onChange={handleChange}
        onMouseUp={handleCommit}
        onTouchEnd={handleCommit}
        className="pets-size-slider"
      />
      {saving && <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Saving…</p>}
    </>
  )
}
