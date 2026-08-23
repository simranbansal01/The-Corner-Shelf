import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { logEvent, logError } from '../../lib/events'
import PetIllustration, { PET_OPTIONS } from '../PetIllustration'

// Ported from the old routed Pets.jsx, same fields/writes, rendered inside
// ShopPanel instead of a full page (opened from the companion corner,
// reusing the same pet figurine art onboarding already introduced).
export default function PetsPanel() {
  const { user, profile, refreshProfile } = useAuth()
  const currentPet = profile?.pet_choice || 'sprout'
  const [savingPet, setSavingPet] = useState(null) // id currently being saved, or null
  const [size, setSize] = useState(profile?.pet_size ?? 1)
  const [savingSize, setSavingSize] = useState(false)

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

  function handleSizeChange(e) {
    setSize(Number(e.target.value))
  }

  async function handleSizeCommit() {
    setSavingSize(true)
    try {
      const { error } = await supabase.from('users').update({ pet_size: size }).eq('id', user.id)
      if (error) throw error
      logEvent('pet_size_changed', { pet_size: size })
      await refreshProfile()
    } catch (err) {
      logError('pet_size_save_failed', err.message, 'handleSizeCommit')
    } finally {
      setSavingSize(false)
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

      <h3 style={{ margin: '24px 0 4px 0' }}>Appearance</h3>
      <div className="pets-appearance-row">
        <div>
          <h3 style={{ margin: 0 }}>Pet size</h3>
          <p style={{ margin: 0 }}>Adjust how big your buddy shows up.</p>
        </div>
        <span className="pets-size-preview">
          <PetIllustration pet={currentPet} state="idle" size={38 * size} />
        </span>
      </div>
      <input
        type="range"
        min="0.7"
        max="1.6"
        step="0.05"
        value={size}
        onChange={handleSizeChange}
        onMouseUp={handleSizeCommit}
        onTouchEnd={handleSizeCommit}
        className="pets-size-slider"
      />
      {savingSize && <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Saving…</p>}
    </>
  )
}
