import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BuddyPanel from './BuddyPanel'
import ThemeToggle from './ThemeToggle'

// floatingNav: the shop wants its header embedded over the 3D scene like
// the scene's own toggle buttons (semi-transparent pill, no full-width
// bar) instead of a solid bar pushing the canvas down. Everywhere else
// keeps the plain opaque nav.
export default function Layout({ children, buddyContext, buddyPetOverride, floatingNav = false }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <nav className={`top-nav${floatingNav ? ' top-nav-floating' : ''}`}>
        <Link to="/bookshelf" className="nav-brand">The Corner Shelf</Link>
        {/* The shop's own top-right icon cluster (Ledger/Noticeboard/
            Settings, see CornerShelfScene.jsx) covers sign-out and theme
            from inside the Settings panel now, so the plain nav links only
            render outside the shop, where there's no in-scene equivalent. */}
        {!floatingNav && (
          <div className="nav-links">
            <button className="nav-signout" onClick={handleSignOut}>Sign out</button>
            <ThemeToggle />
          </div>
        )}
      </nav>
      <main className="app-main">{children}</main>
      <BuddyPanel context={buddyContext ?? { screen: 'unknown' }} petOverride={buddyPetOverride} />
    </div>
  )
}
