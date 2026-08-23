import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { logEvent, logError } from '../../lib/events'
import Button from '../Button'

const GOAL_LABELS = {
  current_role: 'Get better at my current role',
  switch_fields: 'Prepare to switch fields',
  general: 'Learn to use AI tools generally',
  other: 'Other',
}

const LEVEL_LABELS = {
  beginner: 'Just starting',
  comfortable: 'Comfortable, use it sometimes',
  confident: 'Confident, use it daily and know prompting well',
}

// Ported from the old routed Profile.jsx, same fields/writes, rendered
// inside ShopPanel instead of a full page (opened by talking to the
// shopkeeper at the desk).
export default function ProfilePanel() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [jobRole, setJobRole] = useState(profile?.job_role_label || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ display_name: displayName, job_role_label: jobRole })
        .eq('id', user.id)
      if (error) throw error
      logEvent('profile_field_updated', { field_name: 'display_name_or_job_role' })
      await refreshProfile()
    } catch (err) {
      logError('profile_save_failed', err.message, 'handleSave')
      alert('Something went wrong saving. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const goalLabel = profile?.onboarding_goal === 'other'
    ? profile?.onboarding_goal_other
    : GOAL_LABELS[profile?.onboarding_goal]

  return (
    <>
      <label className="field-label">Email</label>
      <p>{user?.email}</p>

      <label className="field-label">Display name</label>
      <input className="text-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />

      <label className="field-label">Job role</label>
      <input className="text-input" value={jobRole} onChange={(e) => setJobRole(e.target.value)} />

      <div className="judgment-row">
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        <Button variant="secondary" onClick={handleSignOut}>Sign out</Button>
      </div>

      <h3 style={{ margin: '24px 0 4px 0' }}>Your onboarding answers</h3>
      <p style={{ color: 'var(--color-text-muted)', marginTop: '-4px' }}>
        What you told us when you started. This is what shaped your starting tier.
      </p>

      <label className="field-label">Why you're here</label>
      <p>{profile?.onboarding_why || '-'}</p>

      <label className="field-label">Your goal</label>
      <p>{goalLabel || '-'}</p>

      <label className="field-label">Self-rated AI knowledge</label>
      <p>{LEVEL_LABELS[profile?.self_rated_level] || '-'}</p>

      <label className="field-label">Starting tier</label>
      <p>{profile?.tier ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1) : '-'}</p>

      {profile?.path_message && (
        <>
          <label className="field-label">Your path</label>
          <p>{profile.path_message}</p>
        </>
      )}
    </>
  )
}
