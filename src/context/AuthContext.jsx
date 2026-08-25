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

  // Email/password signup. With "Confirm email" off in Supabase's Auth
  // settings, this returns a session immediately, same instant feel as
  // Google — no confirmation email/OTP step in between.
  async function signUpWithPassword(email, password) {
    return supabase.auth.signUp({ email, password })
  }

  // Returning users who signed up with a password. Creates a session
  // immediately on success, same as signUpWithPassword/Google.
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
