import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import ThemeToggle from '../components/ThemeToggle'
import { logEvent, logError } from '../lib/events'

// Landing page's own tiny auth flow: pick a path (Google / email sign up /
// email sign in) from 'home', then a form. Both the email/password paths
// and Google create a session immediately on success — no OTP/email-
// confirmation step for any of them (relies on "Confirm email" being off
// in Supabase's Auth settings, otherwise signUpWithPassword won't return a
// session right away). A session existing at all is what moves someone on,
// RootGate handles the redirect once it does.
export default function Landing() {
  const { signInWithGoogle, signUpWithPassword, signInWithPassword } = useAuth()

  const [mode, setMode] = useState('home') // 'home' | 'signup' | 'signin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Stashed for App.jsx's RootGate to resolve into `referred_by` on this
  // visitor's first-ever login (see add_referrals.sql). localStorage (not
  // just the URL) survives the Google OAuth redirect away from and back to
  // this origin; the email path never leaves the page at all.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref) localStorage.setItem('pendingReferralCode', ref)
  }, [])

  function reset(nextMode) {
    setMode(nextMode)
    setError(null)
  }

  function handleGoogle() {
    logEvent('cta_clicked', { screen: 'landing', button_label: 'continue_with_google' })
    signInWithGoogle()
  }

  async function handleSignUp() {
    if (!email.trim() || password.length < 6) {
      setError(password.length < 6 ? 'Password needs to be at least 6 characters.' : 'Enter your email.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { error: signUpError } = await signUpWithPassword(email.trim(), password)
      if (signUpError) throw signUpError
      logEvent('signup_submitted', { screen: 'landing' })
      // Session now exists, RootGate takes it from here.
    } catch (err) {
      logError('signup_failed', err.message, 'handleSignUp')
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { error: signInError } = await signInWithPassword(email.trim(), password)
      if (signInError) throw signInError
      logEvent('signin_submitted', { screen: 'landing' })
      // Session now exists, RootGate takes it from here.
    } catch (err) {
      logError('signin_failed', err.message, 'handleSignIn')
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
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
          <button type="button" className="landing-google-link" onClick={handleGoogle}>
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
            autoFocus
          />
          <label className="field-label landing-field-label">Password</label>
          <input
            type="password"
            className="text-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="landing-error">{error}</p>}
          <div className="judgment-row">
            <Button disabled={submitting} onClick={handleSignUp}>
              {submitting ? 'Signing up…' : 'Sign up'}
            </Button>
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
            autoFocus
          />
          <label className="field-label landing-field-label">Password</label>
          <input
            type="password"
            className="text-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="landing-error">{error}</p>}
          <div className="judgment-row">
            <Button disabled={submitting} onClick={handleSignIn}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
            <Button variant="secondary" onClick={() => reset('home')}>Back</Button>
          </div>
        </div>
      )}
    </div>
  )
}
