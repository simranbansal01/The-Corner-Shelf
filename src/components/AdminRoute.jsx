import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Gates /admin on top of ProtectedRoute's session check. AuthContext's
// `loading` only flips false once the initial getSession()+loadProfile()
// round-trip finishes (see AuthContext.jsx), so by the time loading is
// false, profile.is_admin is already known — no extra "checking" state
// needed here the way RootGate needs one for first-ever-login row creation.
export default function AdminRoute({ children }) {
  const { session, profile, loading } = useAuth()

  if (loading) return <div className="page-center">Loading…</div>
  if (!session) return <Navigate to="/" replace />
  if (!profile?.is_admin) return <Navigate to="/bookshelf" replace />

  return children
}
