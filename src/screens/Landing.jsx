import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import ThemeToggle from '../components/ThemeToggle'
import { logEvent } from '../lib/events'

// Landing page's own tiny auth flow: pick a path ('home' -> 'signup' or
// 'signin'), optionally type an email as a hint, then continue with
// Google. Google does all identity verification — no password, no
// confirmation email, no SMTP needed. A session existing at all is what
// moves someone on, RootGate handles the redirect once it does.
export default function Landing() {
  const { signInWithGoogle } = useAuth()

  const [mode, setMode] = useState('home') // 'home' | 'signup' | 'signin'
  const [email, setEmail] = useState('')

  // Stashed for App.jsx's RootGate to resolve into `referred_by` on this
  // visitor's first-ever login (see add_referrals.sql). localStorage
  // survives the Google OAuth redirect away from and back to this origin.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) localStorage.setItem('pendingReferralCode', ref)
  }, [])

  function reset(nextMode) {
    setMode(nextMode)
  }

  function handleGoogle(source) {
    logEvent('cta_clicked', { screen: 'landing', button_label: 'continue_with_google', source })
    signInWithGoogle(email.trim() || undefined)
  }

  return (
    <div className="page-center landing">
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 2 }}>
        <ThemeToggle />
      </div>

      {mode === 'home' && (
        <>
          <h1>Welcome to your AI library world.</h1>
          <p className="landing-subtitle">Get ready to do some magic.</p>
          <div className="landing-actions">
            <Button onClick={() => reset('signup')}>Sign up</Button>
            <Button variant="secondary" onClick={() => reset('signin')}>Sign in</Button>
          </div>
          <button type="button" className="landing-google-link" onClick={() => handleGoogle('home')}>
            or continue with Google
          </button>
        </>
      )}

      {mode === 'signup' && (
        <div className="landing-auth-card">
          <h2>Create your account</h2>
          <label className="field-label landing-field-label">Email</label>
          <input
            type="email"
            className="text-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoFocus
          />
          <div className="judgment-row">
            <Button onClick={() => handleGoogle('signup')}>Continue with Google</Button>
            <Button variant="secondary" onClick={() => reset('home')}>Back</Button>
          </div>
        </div>
      )}

      {mode === 'signin' && (
        <div className="landing-auth-card">
          <h2>Sign in</h2>
          <label className="field-label landing-field-label">Email</label>
          <input
            type="email"
            className="text-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoFocus
          />
          <div className="judgment-row">
            <Button onClick={() => handleGoogle('signin')}>Continue with Google</Button>
            <Button variant="secondary" onClick={() => reset('home')}>Back</Button>
          </div>
        </div>
      )}
    </div>
  )
}
