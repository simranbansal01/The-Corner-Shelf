const OPTIONS = [
  { id: 'not_sure', label: 'Not sure' },
  { id: 'somewhat_sure', label: 'Somewhat sure' },
  { id: 'very_sure', label: 'Very sure' },
]

export default function ConfidenceSelector({ value, onChange }) {
  return (
    <div className="confidence-selector">
      <p className="confidence-label">How confident are you?</p>
      <div className="confidence-options">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`confidence-btn ${value === opt.id ? 'confidence-btn-selected' : ''}`}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
