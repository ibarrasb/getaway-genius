// src/components/empty/EmptyState.jsx
import { Link } from "react-router-dom"

const EmptyState = ({ title, subtitle, ctaHref, ctaLabel }) => {
  return (
    <div className="gg-card rounded-2xl p-10 text-center">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
      {ctaHref && ctaLabel && (
        <Link to={ctaHref} className="gg-btn-primary mt-6">
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}

export default EmptyState
