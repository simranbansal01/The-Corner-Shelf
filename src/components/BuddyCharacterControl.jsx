import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { logEvent, logError } from '../lib/events'
import { BUDDY_CHARACTERS } from '../lib/buddyCharacters'
import PetBuddy from './PetBuddy'

// Which corner-buddy character shows up (profile.buddy_character) —
// separate from pet_size (PetSizeControl.jsx), which just scales whichever
// one is picked here. Whichever card is selected becomes THE buddy: every
// other screen that renders Niblet/Sir Claws-a-Lot/Glitchy (BuddyPanel,
// PetSizeControl, the onboarding pick) reads this same profile field.
export default function BuddyCharacterControl() {
  const { user, profile, refreshProfile } = useAuth()
  const current = profile?.buddy_character || 'niblet'
  const [saving, setSaving] = useState(null) // id currently being saved, or null

  async function selectCharacter(id) {
    if (id === current || saving) return
    setSaving(id)
    try {
      const { error } = await supabase.from('users').update({ buddy_character: id }).eq('id', user.id)
      if (error) throw error
      logEvent('buddy_character_changed', { buddy_character: id })
      await refreshProfile()
    } catch (err) {
      logError('buddy_character_save_failed', err.message, 'selectCharacter')
      alert('Something went wrong saving that. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <>
      <div className="settings-row">
        <div>
          <h3 style={{ margin: 0 }}>Your buddy</h3>
          <p style={{ margin: 0 }}>Pick who shows up in the corner and reacts as you go.</p>
        </div>
      </div>
      <div className="buddy-card-grid">
        {BUDDY_CHARACTERS.map((opt) => {
          const isSelected = opt.id === current
          return (
            <div
              className={`buddy-card${isSelected ? ' buddy-card-selected' : ''}`}
              key={opt.id}
              style={{ '--buddy-accent': opt.accent }}
            >
              <div className="buddy-card-header">
                <p className="buddy-card-name">{opt.name}</p>
                <p className="buddy-card-epithet">{opt.epithet}</p>
              </div>
              <div className="buddy-card-body">
                <PetBuddy character={opt.id} state="idle" position="inline" size={64} />
                <p className="buddy-card-quote">&ldquo;{opt.quote}&rdquo;</p>
                <p className="buddy-card-blurb">{opt.blurb}</p>
                {isSelected ? (
                  <span className="buddy-card-selected-tag">Selected</span>
                ) : (
                  <button
                    type="button"
                    className="buddy-card-select-btn"
                    onClick={() => selectCharacter(opt.id)}
                    disabled={saving !== null}
                  >
                    {saving === opt.id ? 'Saving…' : 'Select'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
