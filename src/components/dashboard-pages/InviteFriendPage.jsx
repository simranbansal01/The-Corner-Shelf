import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { logEvent, logError } from '../../lib/events'
import Button from '../Button'

const APP_NAME = 'The Corner Shelf'
const APP_FEATURE = "learning to spot mistakes in AI answers before you trust them"

// The literal template asked for: "Hi [Friend's Name]! Come join me on
// [App Name]. It's super handy for [short feature]. Check it out here:
// [Insert Invite Link]". [Friend's Name] is left as a literal, editable
// placeholder on purpose: the app has no way to know who a share link will
// end up going to, but WhatsApp/SMS/Email/Telegram all open with this text
// pre-filled and still editable before sending, so swapping in the actual
// name takes one edit.
function directMessage(link, { includeLink = true } = {}) {
  const base = `Hi [Friend's Name]! Come join me on ${APP_NAME}. It's super handy for ${APP_FEATURE}.`
  return includeLink ? `${base} Check it out here: ${link}` : base
}

// No name placeholder here, a public post isn't addressed to one person.
function publicMessage(link) {
  return `Come join me on ${APP_NAME}. It's super handy for ${APP_FEATURE}. Check it out here: ${link}`
}

// Two different kinds of "share", not one grid: platforms split by what
// their public share-URL actually does, not by icon familiarity, since
// mixing them is exactly what looked broken (see the comment on
// buildPublicPlatforms below).
//
// navigator.share (the "Share…" button above these grids, when the browser
// supports it) already covers "any app available" on mobile via the OS's
// own share sheet, letting the user pick a specific contact in whichever
// app they choose, with the same prefilled text; these grids are what
// stand in for that on desktop browsers that don't support it at all.
//
// Telegram (and nativeShare below) get a separate url field, so their text
// drops the trailing "Check it out here: <link>" to avoid showing the link
// twice; WhatsApp/SMS/Email only have one text field, so the link has to be
// inline.
function buildDirectPlatforms(link) {
  const encodedLink = encodeURIComponent(link)
  const fullMessage = encodeURIComponent(directMessage(link))
  const messageNoLink = encodeURIComponent(directMessage(link, { includeLink: false }))
  return [
    { key: 'whatsapp', label: 'WhatsApp', icon: '💬', href: `https://wa.me/?text=${fullMessage}` },
    { key: 'telegram', label: 'Telegram', icon: '✈️', href: `https://t.me/share/url?url=${encodedLink}&text=${messageNoLink}` },
    { key: 'sms', label: 'Text message', icon: '💬', href: `sms:?&body=${fullMessage}` },
    { key: 'email', label: 'Email', icon: '✉️', href: `mailto:?subject=${encodeURIComponent(`Join me on ${APP_NAME}`)}&body=${fullMessage}` },
  ]
}

// Facebook's and LinkedIn's public share-URL widgets are feed/post
// composers by design: neither platform's link-based share intent supports
// prefilled custom text or picking a specific person to message, that's a
// platform restriction (Facebook dropped the old "quote" param years ago;
// LinkedIn's share-offsite endpoint never had one). Sending someone a DM
// with the prebuilt message needs the "Message a friend" tiles above, or
// the native Share… button on mobile. What these two DO pick up is the
// page's Open Graph title/description/image (see index.html's <meta
// property="og:*"> tags), so the post itself still looks intentional.
function buildPublicPlatforms(link) {
  const encodedLink = encodeURIComponent(link)
  return [
    { key: 'twitter', label: 'X', icon: '𝕏', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(publicMessage(link))}` },
    { key: 'facebook', label: 'Facebook', icon: '📘', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}` },
    { key: 'linkedin', label: 'LinkedIn', icon: '💼', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}` },
  ]
}

// referral_code/referred_by + the resolve_referral_code/get_my_referrals
// RPCs come from add_referrals.sql. Capture-on-signup side lives in
// Landing.jsx (stashes ?ref=) and App.jsx's RootGate (resolves + writes
// referred_by on first login).
export default function InviteFriendPage() {
  const { profile } = useAuth()
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const link = profile?.referral_code ? `${window.location.origin}/?ref=${profile.referral_code}` : null
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_my_referrals')
    if (error) logError('get_my_referrals_failed', error.message, 'InviteFriendPage.load')
    setFriends(data || [])
    setLoading(false)
  }

  async function copyLink() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      logEvent('invite_link_copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission denied/unavailable, nothing else to fall back to.
    }
  }

  async function nativeShare() {
    if (!link) return
    try {
      await navigator.share({ title: APP_NAME, text: directMessage(link, { includeLink: false }), url: link })
      logEvent('invite_link_shared', { method: 'native' })
    } catch {
      // User cancelled the share sheet, or the call failed mid-flight — nothing to do either way.
    }
  }

  return (
    <>
      <h2 style={{ margin: '4px 0 12px 0' }}>Invite a Friend</h2>
      <p>Share your link. When a friend signs up through it, they'll show up here.</p>

      {link ? (
        <>
          <div className="invite-link-row">
            <input className="text-input" readOnly value={link} onFocus={(e) => e.target.select()} />
            <Button onClick={copyLink}>{copied ? 'Copied!' : 'Copy'}</Button>
            {canNativeShare && <Button variant="secondary" onClick={nativeShare}>Share…</Button>}
          </div>

          <p className="field-label" style={{ marginTop: 20 }}>Message a friend directly</p>
          <div className="share-tile-grid">
            {buildDirectPlatforms(link).map((p) => (
              <a
                key={p.key}
                className="share-tile"
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => logEvent('invite_link_shared', { method: p.key })}
              >
                <span className="share-tile-icon">{p.icon}</span>
                <span>{p.label}</span>
              </a>
            ))}
          </div>

          <p className="field-label" style={{ marginTop: 20 }}>Post publicly instead</p>
          <p style={{ marginTop: 4, fontSize: 13, color: 'var(--color-text-muted)' }}>
            These open each site's own post composer, not a direct message to one person — that's how Facebook and LinkedIn's share links work, not something a link can change.
          </p>
          <div className="share-tile-grid">
            {buildPublicPlatforms(link).map((p) => (
              <a
                key={p.key}
                className="share-tile"
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => logEvent('invite_link_shared', { method: p.key })}
              >
                <span className="share-tile-icon">{p.icon}</span>
                <span>{p.label}</span>
              </a>
            ))}
          </div>
        </>
      ) : (
        <p>Your invite link isn't ready yet — check back in a moment.</p>
      )}

      <h3 style={{ margin: '24px 0 8px 0' }}>Friends you've invited</h3>
      {loading ? (
        <p>Loading…</p>
      ) : friends.length === 0 ? (
        <p>No one yet — share your link above.</p>
      ) : (
        <ul className="dashboard-stat-list">
          {friends.map((f, i) => (
            <li key={i}>
              <span>{f.display_name || 'A new learner'}</span>
              <span>{new Date(f.created_at).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
