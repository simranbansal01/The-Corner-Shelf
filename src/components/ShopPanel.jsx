// A single-page parchment overlay for shop content that isn't a book: a
// chart, a table, a form. Same idea as BookReader (backdrop blur over the
// still-live 3D scene, no route change), just one scrollable card instead
// of a two-page spread with a flip animation.
export default function ShopPanel({ title, onClose, children }) {
  return (
    <div className="shop-panel">
      <div className="shop-panel-card">
        <div className="shop-panel-header">
          <h2>{title}</h2>
          <button type="button" className="page-link-btn" onClick={onClose}>Close</button>
        </div>
        <div className="shop-panel-body">{children}</div>
      </div>
    </div>
  )
}
