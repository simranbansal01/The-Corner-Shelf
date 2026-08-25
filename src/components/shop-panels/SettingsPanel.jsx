import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ThemeToggle from '../ThemeToggle'
import Button from '../Button'
import PetSizeControl from '../PetSizeControl'
import BuddyCharacterControl from '../BuddyCharacterControl'

// The shop's own settings menu, opened from the top-right HUD icon instead
// of a nav bar (the floating header has no room for a full nav once it's
// embedded over the scene, see Layout.jsx's floatingNav). Sign out already
// lives in ProfilePanel too, it's repeated here since a settings menu is
// exactly where people expect to find it.
export default function SettingsPanel() {
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <>
      <div className="settings-row">
        <div>
          <h3 style={{ margin: 0 }}>Theme</h3>
          <p style={{ margin: 0 }}>Switch between light and dark.</p>
        </div>
        <ThemeToggle />
      </div>

      <BuddyCharacterControl />
      <PetSizeControl />

      <div className="settings-row">
        <div>
          <h3 style={{ margin: 0 }}>Account</h3>
          <p style={{ margin: 0 }}>Sign out of this device.</p>
        </div>
        <Button variant="secondary" onClick={handleSignOut}>Sign out</Button>
      </div>

      {/* Only ever renders for the one account with is_admin=true (see
          add_admin_analytics.sql), invisible to everyone else — this is
          the only entry point into /admin anywhere in the app. */}
      {profile?.is_admin && (
        <div className="settings-row">
          <div>
            <h3 style={{ margin: 0 }}>🛠 Admin</h3>
            <p style={{ margin: 0 }}>Platform-wide analytics dashboard.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/admin')}>Open</Button>
        </div>
      )}
    </>
  )
}
