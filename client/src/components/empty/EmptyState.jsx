// src/components/empty/EmptyState.jsx
import { Link } from "react-router-dom"

const EmptyState = ({ title, subtitle, ctaHref, ctaLabel }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
      {ctaHref && ctaLabel && (
        <Link
          to={ctaHref}
          className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-md transition hover:bg-indigo-700"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}

export default EmptyState
