import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import OverviewTiles from '../components/admin-pages/OverviewTiles'
import GrowthSection from '../components/admin-pages/GrowthSection'
import TierSection from '../components/admin-pages/TierSection'
import TaskSection from '../components/admin-pages/TaskSection'
import BuddySection from '../components/admin-pages/BuddySection'
import ReferralSection from '../components/admin-pages/ReferralSection'
import ErrorsSection from '../components/admin-pages/ErrorsSection'

// A plain, modern dashboard, deliberately NOT wrapped in the shop's own
// <Layout> (that pulls in the 3D-scene-oriented BuddyPanel and floating
// nav, the wrong persona for an operator screen). Gated by AdminRoute at
// the router level; every section fetches through an admin_* RPC gated
// server-side by assert_admin() (see supabase/add_admin_analytics.sql), so
// even a direct API call from a non-admin account gets refused.
export default function Admin() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">The Corner Shelf</p>
          <h1 className="admin-title">Admin Dashboard</h1>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="page-link-btn" onClick={() => navigate('/bookshelf')}>← Back to shop</button>
          <button type="button" className="page-link-btn" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      <OverviewTiles />

      <div className="admin-grid">
        <div className="admin-fade-in" style={{ animationDelay: '40ms' }}><GrowthSection /></div>
        <div className="admin-fade-in" style={{ animationDelay: '80ms' }}><TierSection /></div>
        <div className="admin-fade-in admin-grid-wide" style={{ animationDelay: '120ms' }}><TaskSection /></div>
        <div className="admin-fade-in" style={{ animationDelay: '160ms' }}><BuddySection /></div>
        <div className="admin-fade-in" style={{ animationDelay: '200ms' }}><ReferralSection /></div>
        <div className="admin-fade-in admin-grid-wide" style={{ animationDelay: '240ms' }}><ErrorsSection /></div>
      </div>
    </div>
  )
}
