import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { logEvent, logError } from '../lib/events'
import PetBuddy from './PetBuddy'

const CHARACTER_OPTIONS = [
  { id: 'niblet', name: 'Niblet', blurb: 'A steady, hard-hat-wearing hamster.' },
  { id: 'sir-claws-a-lot', name: 'Sir Claws-a-Lot', blurb: 'A pompous, monocled lobster.' },
  { id: 'glitchy', name: 'Glitchy', blurb: 'A derpy, endlessly wobbly slime.' },
]

// Which corner-buddy character shows up (profile.buddy_character) —
// separate from pet_size (PetSizeControl.jsx), which just scales whichever
// one is picked here.
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
      <div className="pets-list">
        {CHARACTER_OPTIONS.map((opt) => {
          const isSelected = opt.id === current
          return (
            <div className="pets-list-row" key={opt.id}>
              <span className="pets-list-icon-bg">
                <PetBuddy character={opt.id} state="idle" position="inline" size={38} />
              </span>
              <div className="pets-list-text">
                <h3 style={{ margin: 0 }}>{opt.name}</h3>
                <p style={{ margin: 0 }}>{opt.blurb}</p>
              </div>
              {isSelected ? (
                <span className="pets-list-selected">Selected</span>
              ) : (
                <button
                  type="button"
                  className="pets-list-select-btn"
                  onClick={() => selectCharacter(opt.id)}
                  disabled={saving !== null}
                >
                  {saving === opt.id ? 'Saving…' : 'Select'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
