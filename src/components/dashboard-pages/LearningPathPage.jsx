import { TIERS, computeStageProgress, computeTierProgress, isTierUnlocked } from '../../lib/roadmap'

// Purely derived from attemptedIds (already computed once by Bookshelf.jsx
// for the 3D scene's own tier-unlock/shelf-wall logic), no new query here.
export default function LearningPathPage({ attemptedIds }) {
  return (
    <>
      <h2 style={{ margin: '4px 0 12px 0' }}>Learning Path</h2>
      {TIERS.map((tier) => {
        const unlocked = isTierUnlocked(tier.order, attemptedIds)
        const tierProgress = computeTierProgress(tier.id, attemptedIds)
        const pct = tierProgress.total > 0 ? Math.round((tierProgress.done / tierProgress.total) * 100) : 0

        return (
          <div key={tier.id} className="learning-path-tier">
            <div className="learning-path-tier-header">
              <div>
                <p className="learning-path-tier-title">{tier.title}</p>
                <p className="learning-path-tier-subtitle">{tier.subtitle}</p>
              </div>
              <span className={`learning-path-tier-badge${unlocked ? '' : ' learning-path-tier-locked'}`}>
                {unlocked ? `${tierProgress.done}/${tierProgress.total}` : 'Locked'}
              </span>
            </div>

            {unlocked && (
              <>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <ul className="learning-path-stage-list">
                  {tier.stages.map((stage) => {
                    const sp = computeStageProgress(stage.id, attemptedIds)
                    return (
                      <li key={stage.id} className="learning-path-stage-row">
                        <span>{stage.title}</span>
                        <span className={sp.complete ? 'learning-path-stage-complete' : ''}>{sp.done}/{sp.total}</span>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>
        )
      })}
    </>
  )
}
