import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { logEvent, logError } from '../../lib/events'
import PetIllustration, { PET_OPTIONS } from '../PetIllustration'

// Ported from the old routed Pets.jsx, same fields/writes, rendered inside
// ShopPanel instead of a full page (opened from the companion corner,
// reusing the same pet figurine art onboarding already introduced). Sizing
// used to live here too, but pet_size now scales Niblet (the corner buddy
// icon, unrelated to which figurine is picked below) — see Settings ->
// PetSizeControl.jsx instead.
export default function PetsPanel() {
  const { user, profile, refreshProfile } = useAuth()
  const currentPet = profile?.pet_choice || 'sprout'
  const [savingPet, setSavingPet] = useState(null) // id currently being saved, or null

  async function selectPet(id) {
    if (id === currentPet || savingPet) return
    setSavingPet(id)
    try {
      const { error } = await supabase.from('users').update({ pet_choice: id }).eq('id', user.id)
      if (error) throw error
      logEvent('pet_changed', { pet_choice: id })
      await refreshProfile()
    } catch (err) {
      logError('pet_select_failed', err.message, 'selectPet')
      alert('Something went wrong saving that. Please try again.')
    } finally {
      setSavingPet(null)
    }
  }

  return (
    <>
      <p style={{ color: 'var(--color-text-muted)', marginTop: '-4px' }}>
        Pick a pet. This is who shows up in the corner and reacts to your practice.
      </p>

      <div className="pets-list">
        {PET_OPTIONS.map((opt) => {
          const isSelected = opt.id === currentPet
          return (
            <div className="pets-list-row" key={opt.id}>
              <span className="pets-list-icon-bg">
                <PetIllustration pet={opt.id} state="idle" size={38} />
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
                  onClick={() => selectPet(opt.id)}
                  disabled={savingPet !== null}
                >
                  {savingPet === opt.id ? 'Saving…' : 'Select'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
