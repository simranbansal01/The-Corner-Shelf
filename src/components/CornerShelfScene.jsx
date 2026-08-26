import { useEffect, useRef, useState } from 'react'
import { createCornerShelfScene } from '../lib/cornerShelfScene'
import { BUDDY_CHARACTERS } from '../lib/buddyCharacters'
import PetBuddy from './PetBuddy'

// Host for the ported "Corner Shelf" walkable 3D scene. Renders the fixed
// DOM shell the scene script expects (canvas-wrap/hud/overlays, matched by
// id) and hands off to createCornerShelfScene for the actual Three.js
// setup/teardown, so this component stays a thin React <-> imperative-scene
// bridge rather than reimplementing any of the scene logic itself.
//
// onboarding (optional): { active, phase, dialogue, options, showTextInput,
// textInputPlaceholder }, drives the shopkeeper conversation. 3D answers
// (pet figurines, option tiles) are handled inside the scene and reported
// via onOnboardingPick; the one free-text step and the final "start
// exploring" confirmation are plain DOM, handled right here.
export default function CornerShelfScene({
  books,
  signSubtitle,
  plaqueLabels,
  onOpenStage,
  onboarding,
  onOnboardingPick,
  onOnboardingTextSubmit,
  onOnboardingConfirm,
  bookOpen,
  panelOpen,
  onOpenPanel,
  unlockMessage,
  directions,
  onDirectionsPick,
  pointTarget,
}) {
  const sceneRef = useRef(null)
  const onOpenStageRef = useRef(onOpenStage)
  onOpenStageRef.current = onOpenStage
  const onOnboardingPickRef = useRef(onOnboardingPick)
  onOnboardingPickRef.current = onOnboardingPick
  const onOpenPanelRef = useRef(onOpenPanel)
  onOpenPanelRef.current = onOpenPanel

  const [textValue, setTextValue] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  function openPanelAndCollapse(panelType) {
    onOpenPanel?.(panelType)
    setMenuOpen(false)
  }

  useEffect(() => {
    const scene = createCornerShelfScene({
      books,
      signSubtitle,
      plaqueLabels,
      onOpenStage: (stageId, coverDataURL) => onOpenStageRef.current(stageId, coverDataURL),
      onboarding,
      onOnboardingPick: (value) => onOnboardingPickRef.current?.(value),
      onOpenPanel: (panelType) => onOpenPanelRef.current?.(panelType),
    })
    sceneRef.current = scene
    return () => {
      sceneRef.current = null
      scene.dispose()
    }
    // Deliberately mount once: books/signSubtitle/plaqueLabels describe the
    // shop's shelves, changing them mid-session would need a full scene
    // rebuild anyway, which a route change already gives us for free.
    // Onboarding phase changes are handled by the effect below instead, so
    // the scene doesn't get torn down and rebuilt on every answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    sceneRef.current?.setOnboarding(onboarding)
    setTextValue('')
  }, [onboarding])

  useEffect(() => {
    if (!pointTarget) {
      sceneRef.current?.clearPointer()
    } else if (pointTarget.kind === 'stage') {
      sceneRef.current?.pointToStage(pointTarget.id)
    } else if (pointTarget.kind === 'wall') {
      sceneRef.current?.pointToWall(pointTarget.id)
    } else if (pointTarget.kind === 'nook') {
      sceneRef.current?.pointToNook()
    }
  }, [pointTarget])

  // WASD/click-to-walk pause while a book reader or shop panel overlay is
  // open on top of the scene, same idea as the onboarding movement gate below.
  useEffect(() => {
    sceneRef.current?.setSceneActive(!bookOpen && !panelOpen)
  }, [bookOpen, panelOpen])

  // Whichever book popped out of the shelf to open the reader animates back
  // into place the moment the reader closes, so a closed book never stays
  // stranded floating in the room.
  const wasBookOpen = useRef(bookOpen)
  useEffect(() => {
    if (wasBookOpen.current && !bookOpen) sceneRef.current?.putBookBack()
    wasBookOpen.current = bookOpen
  }, [bookOpen])

  function submitText() {
    const value = textValue.trim()
    if (!value) return
    onOnboardingTextSubmit(value)
    setTextValue('')
  }

  return (
    <div className="corner-shelf">
      <div id="canvas-wrap" />

      {/* One menu button, collapsed by default; the options underneath open
          the same panels the in-scene props/shopkeeper desk already do (see
          cornerShelfScene.js's shopProps), just also reachable without
          walking over to them. #sound-toggle keeps its id/behavior
          (cornerShelfScene.js wires it up imperatively once on mount), so
          it stays mounted and is only hidden via CSS when collapsed, never
          unmounted, or its click handler would be lost on reopen. */}
      <div id="hud-toggles">
        <button
          type="button"
          className="hud-toggle-btn hud-menu-btn"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          ☰ Menu
        </button>
        <div className={`hud-menu-panel${menuOpen ? ' open' : ''}`}>
          <button type="button" className="hud-toggle-btn" onClick={() => openPanelAndCollapse('dashboard')}>📖 My Dashboard</button>
          <button type="button" className="hud-toggle-btn" onClick={() => openPanelAndCollapse('settings')}>⚙️ Settings</button>
          <button id="sound-toggle" type="button" className="hud-toggle-btn">🔊 Sound on</button>
        </div>
      </div>

      <div id="hud">
        <strong>WASD</strong>&nbsp;move &nbsp;·&nbsp; <strong>drag</strong>&nbsp;to look &nbsp;·&nbsp; <strong>click ground</strong>&nbsp;to walk there &nbsp;·&nbsp; <strong>esc</strong>&nbsp;pause
      </div>

      <div id="book-hint" className="book-hint">✨ Click a glowing book to pick it up</div>

      {/* Compass-style "this way!" arrow for the tour's wall/nook steps
          (see pointToWall/pointToNook in cornerShelfScene.js) — always
          anchored on screen, rotated every frame to point toward the
          target regardless of which way the player is currently facing.
          Hidden via CSS (no 'visible' class) whenever nothing's pointed at. */}
      <div id="tour-arrow" className="tour-arrow">
        <div className="tour-arrow-shape" />
      </div>

      {unlockMessage && <div className="unlock-toast">✨ {unlockMessage}</div>}

      <div id="pause-overlay" className="overlay hidden">
        <div className="card">
          <p className="eyebrow">Paused</p>
          <h1>Taking a breather</h1>
          <p className="tagline">Click anywhere to step back into the shelves.</p>
        </div>
      </div>

      <div id="start-overlay" className="overlay">
        <div className="card">
          <p className="eyebrow">{onboarding?.active ? 'Storybook Lane' : 'Your learning path'}</p>
          <h1>The Corner Shelf</h1>
          <p className="tagline">
            {onboarding?.active
              ? "Step inside, the shopkeeper's expecting you."
              : 'Walk the shelves and pick up a glowing book to start that stage.'}
          </p>
          <div className="controls-row">
            <span className="key">WASD to move</span>
            <span className="key">click + drag to look</span>
          </div>
          <div className="enter-prompt">Click to step inside</div>
        </div>
      </div>

      {onboarding?.active && onboarding.phase === 'placement' && (
        // Full DOM quiz card rather than the 3D question-board + tiny
        // world-space tiles the other onboarding phases use (see
        // applyOnboardingPhase in cornerShelfScene.js, which skips building
        // those for this phase) — placement questions/options run much
        // longer than a goal/level label, and needed room to actually be
        // read comfortably plus a real progress indicator.
        <div className="shopkeeper-dialogue shopkeeper-dialogue-wide placement-quiz">
          <div className="placement-progress">
            <span className="placement-progress-label">
              Question {onboarding.questionNumber} of {onboarding.questionTotal}
            </span>
            <div className="placement-progress-track">
              <div
                className="placement-progress-fill"
                style={{ width: `${(onboarding.questionNumber / onboarding.questionTotal) * 100}%` }}
              />
            </div>
          </div>
          <p className="placement-question-text">{onboarding.questionText}</p>
          <div className="placement-options">
            {onboarding.options.map((opt, i) => (
              <button
                key={opt.id}
                type="button"
                className="placement-option-btn"
                onClick={() => onOnboardingPick(opt.id)}
              >
                <span className="placement-option-marker">{String.fromCharCode(65 + i)}</span>
                <span className="placement-option-label">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {onboarding?.active && onboarding.phase === 'pet' && (
        // Real DOM box per buddy (sprite, name, epithet, in-character quote,
        // personality blurb) rather than relying only on the tiny 3D
        // figurines' click targets to carry that much copy — same reasoning
        // as the placement quiz's DOM card above. The 3D figurines (see
        // cornerShelfScene.js) still work too, both call onOnboardingPick
        // with the same character id, so whichever one gets clicked becomes
        // profile.buddy_character exactly the same way.
        <div className="shopkeeper-dialogue shopkeeper-dialogue-wide buddy-pick">
          <p className="shopkeeper-dialogue-line">{onboarding.dialogue}</p>
          <div className="buddy-pick-grid">
            {BUDDY_CHARACTERS.map((b) => (
              <button key={b.id} type="button" className="buddy-pick-card" onClick={() => onOnboardingPick(b.id)}>
                <PetBuddy character={b.id} state="idle" position="inline" size={64} />
                <span className="buddy-pick-name">{b.name}</span>
                <span className="buddy-pick-epithet">{b.epithet}</span>
                <span className="buddy-pick-quote">&ldquo;{b.quote}&rdquo;</span>
                <span className="buddy-pick-blurb">{b.blurb}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {onboarding?.active && onboarding.phase !== 'placement' && onboarding.phase !== 'pet' && (
        <div className="shopkeeper-dialogue">
          <p className="shopkeeper-dialogue-line">{onboarding.dialogue}</p>

          {onboarding.options && onboarding.options.length > 0 && (
            // Same lettered-badge treatment as the placement quiz (see the
            // 'placement' branch above) — "Confident, use it daily and know
            // prompting well" doesn't read comfortably as a plain unmarked
            // stack of buttons any more than a placement question's options do.
            <div className="placement-options">
              {onboarding.options.map((opt, i) => (
                <button
                  key={opt.id}
                  type="button"
                  className="placement-option-btn"
                  onClick={() => onOnboardingPick(opt.id)}
                >
                  <span className="placement-option-marker">{String.fromCharCode(65 + i)}</span>
                  <span className="placement-option-label">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {onboarding.showTextInput && (
            <div className="shopkeeper-dialogue-input">
              <textarea
                className="judgment-textarea"
                rows={2}
                maxLength={280}
                autoFocus
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder={onboarding.textInputPlaceholder || ''}
              />
              <button type="button" className="btn btn-primary" disabled={!textValue.trim()} onClick={submitText}>
                Continue
              </button>
            </div>
          )}

          {onboarding.phase === 'reveal' && (
            <button type="button" className="btn btn-primary" onClick={onOnboardingConfirm}>
              Start exploring
            </button>
          )}
        </div>
      )}

      {!onboarding?.active && directions?.active && (
        <div className="shopkeeper-dialogue">
          <button
            type="button"
            className="shopkeeper-dialogue-close"
            aria-label="Close"
            onClick={() => onDirectionsPick('close')}
          >
            ×
          </button>
          <p className="shopkeeper-dialogue-line">{directions.dialogue}</p>
          {directions.options ? (
            <div className="shopkeeper-dialogue-options">
              {directions.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={opt.id === 'close' ? 'btn btn-secondary' : 'btn btn-primary'}
                  onClick={() => onDirectionsPick(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => onDirectionsPick('close')}>
              Thanks!
            </button>
          )}
        </div>
      )}
    </div>
  )
}
