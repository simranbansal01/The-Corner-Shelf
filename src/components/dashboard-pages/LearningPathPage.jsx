import { TIERS, computeStageProgress, computeTierProgress, isTierUnlocked } from '../../lib/roadmap'

// Purely derived from attemptedIds (already computed once by Bookshelf.jsx
// for the 3D scene's own tier-unlock/shelf-wall logic), no new query here.
//
// Rendered as a single trail: a diamond waypoint per tier, then a numbered
// stop per stage in that tier, connected by one continuous line (see
// .path-trail::before). Locked tiers still show their stops instead of
// collapsing to just a badge, so the whole path ahead stays visible, same
// as the shelf's own locked walls, just dimmed and un-clickable.
export default function LearningPathPage({ attemptedIds }) {
  return (
    <>
      <h2 style={{ margin: '4px 0 16px 0' }}>Learning Path</h2>
      <ol className="path-trail">
        {TIERS.map((tier) => {
          const unlocked = isTierUnlocked(tier.order, attemptedIds)
          const tierProgress = computeTierProgress(tier.id, attemptedIds)
          const pct = tierProgress.total > 0 ? Math.round((tierProgress.done / tierProgress.total) * 100) : 0

          return (
            <li className="path-tier-group" key={tier.id}>
              <div className="path-waypoint">
                <div className={`path-waypoint-marker${unlocked ? '' : ' path-marker-locked'}`} aria-hidden="true" />
                <div className="path-waypoint-card">
                  <p className="path-waypoint-kicker">Tier {tier.order}</p>
                  <h3 className="path-waypoint-title">{tier.title}</h3>
                  <p className="path-waypoint-subtitle">{tier.subtitle}</p>
                  {unlocked ? (
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  ) : (
                    <span className="path-locked-badge">Locked</span>
                  )}
                </div>
              </div>

              <ol className="path-stops">
                {tier.stages.map((stage, i) => {
                  const sp = computeStageProgress(stage.id, attemptedIds)
                  return (
                    <li className={`path-stop${unlocked ? '' : ' path-stop-locked'}`} key={stage.id}>
                      <div className={`path-stop-marker${sp.complete ? ' path-stop-complete' : ''}`}>{i + 1}</div>
                      <div className="path-stop-card">
                        <div className="path-stop-text">
                          <p className="path-stop-title">{stage.title}</p>
                          <p className="path-stop-desc">{stage.description}</p>
                        </div>
                        {unlocked && (
                          <span className={`path-stop-status${sp.complete ? ' path-stop-status-complete' : ''}`}>
                            {sp.done}/{sp.total}
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </li>
          )
        })}
      </ol>
    </>
  )
}
