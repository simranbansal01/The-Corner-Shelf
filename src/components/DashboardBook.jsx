import { useMemo, useState } from 'react'
import OpenBookShell from './OpenBookShell'
import { TocPage } from './book-pages/ChapterPages'
import ProfilePanel from './shop-panels/ProfilePanel'
import LearningPathPage from './dashboard-pages/LearningPathPage'
import TaskScorecardPage from './dashboard-pages/TaskScorecardPage'
import BuddyScorecardPage from './dashboard-pages/BuddyScorecardPage'
import InviteFriendPage from './dashboard-pages/InviteFriendPage'
import JourneyPage from './dashboard-pages/JourneyPage'

const SECTIONS = [
  { key: 'profile', kicker: 'ACCOUNT', title: 'Profile', icon: '🧑' },
  { key: 'learning-path', kicker: 'PROGRESS', title: 'Learning Path', icon: '🧭' },
  { key: 'scorecard', kicker: 'PERFORMANCE', title: 'Task Scorecard', icon: '🏆' },
  { key: 'buddy', kicker: 'COMPANION', title: 'Buddy Scorecard', icon: '🤖' },
  { key: 'invite', kicker: 'GROW', title: 'Invite a Friend', icon: '🔗' },
  { key: 'journey', kicker: 'ACTIVITY', title: 'Your Journey', icon: '📈' },
]

// The Menu's "book version of the dashboard": same OpenBookShell chrome as
// a lesson book (see BookReader.jsx), a table of contents first, then one
// page per section. initialPage lets a caller open straight to a section
// (the shopkeeper-desk click opens straight to Profile) or 'toc'/anything
// unrecognized for the contents list (the generic Menu button).
export default function DashboardBook({ initialPage, onClose, attemptedIds }) {
  const pages = useMemo(() => [{ key: 'toc' }, ...SECTIONS], [])
  const startIndex = Math.max(0, pages.findIndex((p) => p.key === initialPage))
  const [pageIndex, setPageIndex] = useState(startIndex)
  const page = pages[pageIndex]
  const isToc = page.key === 'toc'

  const tocEntries = useMemo(
    () => SECTIONS.map((s, i) => ({ kicker: s.kicker, title: s.title, icon: s.icon, pageIndex: i + 1 })),
    [],
  )

  function goNext() {
    setPageIndex((i) => Math.min(i + 1, pages.length - 1))
  }
  function goPrev() {
    setPageIndex((i) => Math.max(i - 1, 0))
  }
  function jumpTo(index) {
    setPageIndex(Math.max(0, Math.min(index, pages.length - 1)))
  }

  return (
    <OpenBookShell
      eyebrow={isToc ? 'CONTENTS' : page.kicker}
      title={isToc ? 'Dashboard' : page.title}
      subtitle="Your account, at a glance"
      pageLabel={`Page ${pageIndex + 1} of ${pages.length}`}
      canGoPrev={pageIndex > 0}
      canGoNext={pageIndex < pages.length - 1}
      onPrev={goPrev}
      onNext={goNext}
      onClose={onClose}
      showContentsLink
      onContents={() => jumpTo(0)}
      contentKey={pageIndex}
    >
      {isToc && <TocPage tocEntries={tocEntries} onJump={jumpTo} />}
      {page.key === 'profile' && <ProfilePanel />}
      {page.key === 'learning-path' && <LearningPathPage attemptedIds={attemptedIds} />}
      {page.key === 'scorecard' && <TaskScorecardPage />}
      {page.key === 'buddy' && <BuddyScorecardPage />}
      {page.key === 'invite' && <InviteFriendPage />}
      {page.key === 'journey' && <JourneyPage />}
    </OpenBookShell>
  )
}
