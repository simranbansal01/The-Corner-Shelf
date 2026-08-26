import { useEffect, useRef, useState } from 'react'

// The book chrome shared by every "opens like a book" overlay in the shop:
// the cover-flap open animation, the two-page spread (a static left title
// card, a scrollable right content page), prev/next arrows, and the
// Contents/Close nav row. Originally built for BookReader (lesson content),
// extracted here so DashboardBook (menu content) can reuse the exact same
// chrome instead of duplicating the animation-timing-sensitive JSX.
//
// contentKey: any value that changes when the visible page changes (e.g. a
// page index), so the scroll-to-top / "scroll for more" hint effect resets
// correctly per page even though this component doesn't know what a "page"
// means to its caller.
export default function OpenBookShell({
  eyebrow,
  title,
  subtitle,
  seriesLabel = 'The Corner Shelf',
  pageLabel,
  coverImage,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onClose,
  showContentsLink = false,
  onContents,
  contentKey,
  children,
}) {
  const [opening, setOpening] = useState(false)
  const [showScrollHint, setShowScrollHint] = useState(false)
  const contentRef = useRef(null)

  // Which way the page should turn, derived from contentKey moving up or
  // down (both callers pass a numeric page index) — React's documented
  // "adjust state during render" pattern rather than a ref read during
  // render. Stays null across the very first render (prevContentKey starts
  // equal to contentKey), so the very first page doesn't animate on top of
  // the cover-opening animation.
  const [prevContentKey, setPrevContentKey] = useState(contentKey)
  const [turnDirection, setTurnDirection] = useState(null)
  if (contentKey !== prevContentKey) {
    setTurnDirection(contentKey > prevContentKey ? 'next' : 'prev')
    setPrevContentKey(contentKey)
  }

  // Double rAF so the browser paints the closed cover first, then the CSS
  // transition on .book-cover-flap actually animates instead of snapping,
  // same trick the artifact's openReader() used.
  useEffect(() => {
    let raf1, raf2
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setOpening(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [])

  // The "scroll for more" hint: recomputed on page change and on scroll.
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    el.scrollTop = 0
    function update() {
      const hasOverflow = el.scrollHeight > el.clientHeight + 4
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 12
      setShowScrollHint(hasOverflow && !nearBottom)
    }
    update()
    el.addEventListener('scroll', update)
    return () => el.removeEventListener('scroll', update)
  }, [contentKey])

  return (
    <div id="book-reader" className="open">
      <div className={`open-book ${opening ? 'opening' : ''}`}>
        <button
          id="reader-prev"
          className="book-nav-btn"
          type="button"
          aria-label="Previous page"
          onClick={onPrev}
          disabled={!canGoPrev}
        >
          ‹
        </button>
        <button
          id="reader-next"
          className="book-nav-btn"
          type="button"
          aria-label="Next page"
          onClick={onNext}
          disabled={!canGoNext}
        >
          ›
        </button>

        <div className="book-pages">
          <div className="book-reader-page page-left">
            <div className="page-left-icon">✦</div>
            <div className="page-left-module">{eyebrow}</div>
            <h2 className="page-left-title">{title}</h2>
            <div className="page-left-rule" />
            <p className="page-left-tagline">{subtitle}</p>
            <p className="page-left-series">{seriesLabel}</p>
            {pageLabel && <p className="page-num">{pageLabel}</p>}
          </div>

          <div className="book-reader-page page-right">
            <div className="page-controls">
              {showContentsLink && (
                <button type="button" className="page-link-btn" onClick={onContents}>Contents</button>
              )}
              <button type="button" className="page-link-btn" onClick={onClose}>Close book</button>
            </div>
            <div
              key={contentKey}
              id="reader-page-content"
              ref={contentRef}
              className={turnDirection ? `page-turn-${turnDirection}` : ''}
            >
              {children}
            </div>
            {showScrollHint && <div className="reader-scroll-hint">↓ Scroll for more</div>}
          </div>
        </div>

        <div className="book-cover-flap" style={coverImage ? { backgroundImage: `url(${coverImage})` } : undefined} />
      </div>
    </div>
  )
}
