import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PetBuddyProvider } from './context/PetBuddyContext'
import { supabase } from './lib/supabase'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

import Landing from './screens/Landing'
import Bookshelf from './screens/Bookshelf'
import Admin from './screens/Admin'

// Resolves a referral code Landing.jsx stashed (see its `?ref=` capture)
// into the inviter's id via the resolve_referral_code RPC (a users-table
// SELECT policy would leak every column to any signed-in caller, see
// add_referrals.sql), then writes it onto the new user's own row — allowed
// since it's their own row (RLS: auth.uid() = id). Always clears the
// localStorage flag, even on failure, so a stale/invalid code doesn't keep
// retrying forever.
async function resolvePendingReferral(userId) {
  const code = localStorage.getItem('pendingReferralCode')
  if (!code) return
  localStorage.removeItem('pendingReferralCode')
  try {
    const { data: referrerId } = await supabase.rpc('resolve_referral_code', { code })
    if (referrerId && referrerId !== userId) {
      await supabase.from('users').update({ referred_by: referrerId }).eq('id', userId)
    }
  } catch {
    // Non-critical: worst case, this signup just isn't attributed.
  }
}

// Handles the root "/" route. Logged-out users see Landing.
// Logged-in users get routed onward based on how far they've gotten.
// this is what makes the Google OAuth redirect (which lands back on "/")
// send people to the right next screen automatically.
function RootGate() {
  const { session, user, loading, refreshProfile } = useAuth()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function ensureProfile() {
      if (!user) {
        setChecking(false)
        return
      }
      // First-ever login: no `users` row yet. Create one now.
      const { data: existing } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle()
      if (!existing) {
        await supabase.from('users').insert({ id: user.id, email: user.email })
        await resolvePendingReferral(user.id)
        await refreshProfile()
      }
      setChecking(false)
    }
    if (!loading) ensureProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user])

  if (loading || checking) return <div className="page-center">Loading…</div>
  if (!session) return <Landing />
  // Everything (onboarding, lessons, tasks, trust score, history, profile,
  // pets) now lives inside the shop itself; Bookshelf branches internally
  // on profile.tier between onboarding and free exploration.
  return <Navigate to="/bookshelf" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootGate />} />
      <Route path="/bookshelf" element={<ProtectedRoute><Bookshelf /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminRoute><Admin /></AdminRoute></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <PetBuddyProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </PetBuddyProvider>
    </AuthProvider>
  )
}
