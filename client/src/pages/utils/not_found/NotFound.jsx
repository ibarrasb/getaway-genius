// src/utils/NotFound.jsx
import { Link } from "react-router-dom"

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-slate-50 px-4">
      <h1 className="text-6xl font-extrabold text-slate-900">404</h1>
      <p className="mt-2 text-lg text-slate-600">Oops! The page you’re looking for doesn’t exist.</p>

      <div className="mt-6 flex gap-4">
        <Link
          to="/mytrips"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-white shadow-sm transition hover:bg-indigo-700"
        >
          My Trips
        </Link>
      
      </div>
    </div>
  )
}

export default NotFound
