import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null) // row from `users` table
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId) {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
    if (error) {
      console.warn('loadProfile error:', error)
      return null
    }
    return data
  }

  useEffect(() => {
    // On first load, check if a session already exists (e.g. page refresh).
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        const p = await loadProfile(session.user.id)
        setProfile(p)
      }
      setLoading(false)
    })

    // Listen for future auth changes (login, logout, token refresh).
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session?.user) {
        const p = await loadProfile(session.user.id)
        setProfile(p)
      } else {
        setProfile(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function refreshProfile() {
    if (session?.user) {
      const p = await loadProfile(session.user.id)
      setProfile(p)
    }
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  // Email/password signup: Supabase creates the (unconfirmed) account and
  // emails a confirmation code. The session doesn't exist yet, the caller
  // moves on to the OTP step and calls verifySignupOtp to finish.
  async function signUpWithPassword(email, password) {
    return supabase.auth.signUp({ email, password })
  }

  // Confirms the code from that email, which is what actually creates the
  // session, onAuthStateChange picks it up from here same as any sign-in.
  async function verifySignupOtp(email, token) {
    return supabase.auth.verifyOtp({ email, token, type: 'signup' })
  }

  async function resendSignupOtp(email) {
    return supabase.auth.resend({ type: 'signup', email })
  }

  // Returning users who signed up with a password (already confirmed).
  async function signInWithPassword(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signInWithGoogle,
    signUpWithPassword,
    verifySignupOtp,
    resendSignupOtp,
    signInWithPassword,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
