export default function BookCard({ children, className = '' }) {
  return <div className={`book-card ${className}`}>{children}</div>
}
