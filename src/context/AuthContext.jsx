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

  // emailHint pre-fills Google's own login screen (login_hint) when the
  // user typed their email on our landing page first — Google still does
  // all identity verification, so this needs no SMTP/confirmation email.
  async function signInWithGoogle(emailHint) {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        ...(emailHint ? { queryParams: { login_hint: emailHint } } : {}),
      },
    })
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
