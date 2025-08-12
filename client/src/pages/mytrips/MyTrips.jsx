import { useContext, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { GlobalState } from "@/context/GlobalState.jsx"
import TripCard from "@/components/cards/TripCard.jsx"
import FloatingCreateButton from "@/components/FloatingCreateButton.jsx"
import { MOCK_TRIPS } from "@/mocks/trips"

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true"

const MyTrips = () => {
  const navigate = useNavigate()
  const state = useContext(GlobalState)
  const api = state?.userAPI ?? state?.UserAPI
  const [email] = api?.email ?? [""]
  const [isLogged] = api?.isLogged ?? [false]
  const [token] = state?.token ?? [null]

  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      if (USE_MOCKS) {
        setTrips(MOCK_TRIPS)
        setLoading(false)
        return
      }
      if (!email) {
        setTrips([])
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const res = await axios.get("/api/trips/getaway-trip", {
          params: { email },
          signal: controller.signal,
        })
        setTrips(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error(err)
          setError("Failed to load trips.")
          setTrips([])
        }
      } finally {
        setLoading(false)
      }
    }
    run()
    return () => controller.abort()
  }, [email])

  const removePost = async (id) => {
    if (!id) return
    if (!confirm("Do you want to delete this post?")) return
    try {
      const headers = token ? { Authorization: token } : undefined // raw token per your middleware
      const res = await axios.delete(`/api/trips/getaway/${id}`, { headers })
      alert(res.data?.msg ?? "Deleted")
      setTrips((prev) => prev.filter((t) => t._id !== id))
    } catch (err) {
      console.error(err)
      alert("Failed to delete trip.")
    }
  }

  // helpers
  const fmtRange = (start, end) => {
    const s = new Date(start), e = new Date(end)
    const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
    const mo = (d) => d.toLocaleString(undefined, { month: "short" })
    return sameMonth
      ? `${mo(s)} ${s.getDate()}–${e.getDate()}`
      : `${mo(s)} ${s.getDate()} – ${mo(e)} ${e.getDate()}`
  }
  const totalCost = (t) =>
    (Number(t.stay_expense) || 0) + (Number(t.car_expense) || 0) + (Number(t.travel_expense) || 0)

  // compute featured (soonest upcoming by start date), and the rest grouped by year
  const { featured, groups, orderedYears } = useMemo(() => {
    const now = new Date()
    const upcoming = trips
      .filter((t) => {
        const end = new Date(t.trip_end); end.setDate(end.getDate() + 1)
        return !Number.isNaN(end) && end >= now
      })
      .sort((a, b) => new Date(a.trip_start) - new Date(b.trip_start))

    const f = upcoming[0] || null
    const rest = f ? upcoming.slice(1) : upcoming

    const byYear = rest.reduce((acc, t) => {
      const y = new Date(t.trip_end).getFullYear()
      ;(acc[y] ||= []).push(t)
      return acc
    }, {})

    Object.keys(byYear).forEach((y) =>
      byYear[y].sort((a, b) => new Date(a.trip_start) - new Date(b.trip_start))
    )

    const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)
    return { featured: f, groups: byYear, orderedYears: years }
  }, [trips])

  if (!isLogged && !USE_MOCKS) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
          Please log in to view your trips.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          Loading trips…
        </div>
      </div>
    )
  }

  const showEmpty = !featured && orderedYears.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Featured trip */}
        {featured && (
          <section className="mb-10">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
              {/* image */}
              <div className="relative h-64 w-full sm:h-80">
                <img
                  src={featured.image_url}
                  alt={featured.location_address}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
              </div>

              {/* content */}
              <div className="relative -mt-16 px-5 pb-5 sm:-mt-20 sm:px-8">
                <div className="flex flex-col gap-3 rounded-2xl bg-white/90 p-4 backdrop-blur shadow-md ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {featured.location_address}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {fmtRange(featured.trip_start, featured.trip_end)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-50 px-4 py-2 text-indigo-700 ring-1 ring-indigo-200">
                      <span className="text-xs uppercase tracking-wide">Est. Total</span>
                      <div className="text-lg font-bold">
                        {totalCost(featured) > 0 ? `$${totalCost(featured).toFixed(0)}` : "—"}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/trips/${featured._id}`)}
                      className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      View
                    </button>
                    <button
                      onClick={() => removePost(featured._id)}
                      className="rounded-xl bg-rose-600/90 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Rest of upcoming trips (grouped by year) */}
        {!showEmpty ? (
          orderedYears.map((year) => (
            <section key={year} className="mb-10">
              <h3 className="mb-4 text-2xl font-bold text-slate-900">{year}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups[year].map((trip) => (
                  <TripCard key={trip._id} trip={trip} onRemove={removePost} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900">Start planning your trips!</p>
            <p className="mt-1 text-slate-600">You don&apos;t have any upcoming trips yet.</p>
            <Link
              to="/search"
              className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-md transition hover:bg-indigo-700"
            >
              Create your first trip
            </Link>
          </div>
        )}
      </div>

      {/* <FloatingCreateButton to="/search" label="Create" /> */}
    </div>
  )
}

export default MyTrips
