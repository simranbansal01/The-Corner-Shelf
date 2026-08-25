import { useEffect, useState } from 'react'

// Pre-cropped individual frame images per character (public/{folder}/{state}-
// {1..frameCount}.png), generated once from that character's source sheet
// via a crop script using the exact pixel boxes measured from it (see git
// history for the scripts) — deliberately NOT a shared-sheet + CSS
// background-position setup. That approach kept hitting real rendering bugs
// (misaligned crops, then a filter/overflow interaction that leaked a
// sliver of the neighboring frame into drop-shadow's silhouette) that a
// plain <img> per frame can't have at all: each file already IS just that
// one frame, tightly cropped, real alpha transparency, nothing else on the
// canvas to bleed in.
//
// frameCount is per-state (not one number per character) because Glitchy's
// sheet has a different pose count in each row — 4 idle, 7 guiding, 4
// alert, 3 celebrate — unlike Niblet/Sir Claws-a-Lot, which happen to have
// the same count in every row.
//
// frameIntervalMs: ms between frames, same relative pacing across states
// (idle calmest, celebrate fastest/most energetic) as originally tuned for
// Niblet's 3-frame sheets; other characters' intervals are scaled so a
// full animation cycle (frameCount * interval) takes roughly as long as
// Niblet's, not visibly faster just because a state has more frames to
// get through.
const CHARACTERS = {
  niblet: {
    folder: 'niblet',
    frameCount: { idle: 3, guiding: 3, alert: 3, celebrate: 3 },
    frameIntervalMs: { idle: 770, guiding: 590, alert: 500, celebrate: 420 },
  },
  'sir-claws-a-lot': {
    folder: 'sir-claws-a-lot',
    frameCount: { idle: 5, guiding: 5, alert: 5, celebrate: 5 },
    frameIntervalMs: { idle: 460, guiding: 350, alert: 310, celebrate: 250 },
  },
  glitchy: {
    folder: 'glitchy',
    frameCount: { idle: 4, guiding: 7, alert: 4, celebrate: 3 },
    frameIntervalMs: { idle: 580, guiding: 250, alert: 380, celebrate: 420 },
  },
}
const DEFAULT_CHARACTER = 'niblet'

const POSITION_CLASSES = {
  'bottom-right': 'pet-buddy-fixed pet-buddy-bottom-right',
  'bottom-left': 'pet-buddy-fixed pet-buddy-bottom-left',
  inline: '',
}

// character: which buddy (see CHARACTERS above) — profile.buddy_character,
// see PetBuddyCharacterControl.jsx for where that's set.
// size: on-screen width, in px. Height isn't set explicitly — each frame
// image has its own real intrinsic aspect ratio (rows in the source sheets
// weren't all the same height), and a plain <img> with only `width` set
// preserves that automatically, no per-row math needed on this end.
// flip: mirrors the character horizontally, applied on the wrapper (not the
// <img> itself) so it composes with that wrapper's own drop-shadow filter
// and the sprite's bounce animation instead of any one of them clobbering
// the others.
export default function PetBuddy({ character = DEFAULT_CHARACTER, state = 'idle', message, position = 'inline', size = 96, flip = false }) {
  const config = CHARACTERS[character] || CHARACTERS[DEFAULT_CHARACTER]
  const [frame, setFrame] = useState(1)

  // Restart the cycle at frame 1 whenever the state or character changes,
  // so switching from e.g. celebrate back to idle (or swapping characters
  // in Settings) doesn't briefly show a stale later frame.
  useEffect(() => {
    setFrame(1)
    const intervalMs = config.frameIntervalMs[state] || config.frameIntervalMs.idle
    const frameCount = config.frameCount[state] || config.frameCount.idle
    const id = setInterval(() => {
      setFrame((f) => (f % frameCount) + 1)
    }, intervalMs)
    return () => clearInterval(id)
  }, [character, state, config])

  return (
    <div className={`pet-buddy ${POSITION_CLASSES[position] || ''}`}>
      <div className="pet-buddy-flip" style={{ transform: flip ? 'scaleX(-1)' : 'none' }}>
        <img
          src={`/${config.folder}/${state}-${frame}.png`}
          alt=""
          className={`pet-buddy-sprite pet-buddy-sprite-${state}`}
          style={{ width: size, height: 'auto', display: 'block' }}
        />
      </div>
      {message && (
        // Keyed so a changed message re-mounts the bubble and re-plays the
        // bounce entrance, not just its first appearance.
        <div key={message} className="pet-buddy-bubble">{message}</div>
      )}
    </div>
  )
}
