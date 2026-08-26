import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { logEvent, logError } from '../lib/events'
import { BUDDY_CHARACTERS } from '../lib/buddyCharacters'
import PetBuddy from './PetBuddy'

// Which corner-buddy character shows up (profile.buddy_character) —
// separate from pet_size (PetSizeControl.jsx), which just scales whichever
// one is picked here. A dropdown picks the character, and one compact
// preview tile below always shows whichever one is currently selected.
// Whichever one that is becomes THE buddy: every other screen that renders
// Niblet/Sir Claws-a-Lot/Glitchy (BuddyPanel, PetSizeControl, the
// onboarding pick) reads this same profile field.
export default function BuddyCharacterControl() {
  const { user, profile, refreshProfile } = useAuth()
  const current = profile?.buddy_character || 'niblet'
  const selected = BUDDY_CHARACTERS.find((b) => b.id === current) || BUDDY_CHARACTERS[0]
  const [saving, setSaving] = useState(false)

  async function selectCharacter(id) {
    if (id === current || saving) return
    setSaving(true)
    try {
      const { error } = await supabase.from('users').update({ buddy_character: id }).eq('id', user.id)
      if (error) throw error
      logEvent('buddy_character_changed', { buddy_character: id })
      await refreshProfile()
    } catch (err) {
      logError('buddy_character_save_failed', err.message, 'selectCharacter')
      alert('Something went wrong saving that. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="settings-row">
        <div>
          <h3 style={{ margin: 0 }}>Your buddy</h3>
          <p style={{ margin: 0 }}>Pick who shows up in the corner and reacts as you go.</p>
        </div>
        <select
          className="buddy-select"
          aria-label="Choose your buddy"
          value={current}
          disabled={saving}
          onChange={(e) => selectCharacter(e.target.value)}
        >
          {BUDDY_CHARACTERS.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
      </div>

      <div className="buddy-preview" style={{ '--buddy-accent': selected.accent }}>
        <div className="buddy-preview-header">
          <p className="buddy-preview-name">{selected.name}</p>
          <p className="buddy-preview-epithet">{selected.epithet}</p>
        </div>
        <div className="buddy-preview-body">
          {/* Fixed-size slot: idle-animation frames are individually cropped
              images with slightly different aspect ratios, and PetBuddy's
              <img> is height:auto, so an unconstrained sprite would resize
              this tile every frame tick (see the earlier fix for the same
              issue on the old per-character cards). */}
          <div className="buddy-preview-sprite">
            <PetBuddy character={selected.id} state="idle" position="inline" size={44} />
          </div>
          <div className="buddy-preview-text">
            <p className="buddy-preview-quote">&ldquo;{selected.quote}&rdquo;</p>
            <p className="buddy-preview-blurb">{selected.blurb}</p>
          </div>
        </div>
      </div>
    </>
  )
}
