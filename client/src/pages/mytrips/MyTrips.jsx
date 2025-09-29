// src/pages/mytrips/MyTrips.jsx
import { useContext, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { GlobalState } from "@/context/GlobalState.jsx"
import TripCard from "@/components/cards/TripCard.jsx"
import { useDataRefresh } from "@/hooks/useDataRefresh.js"
import { useToast } from "@/context/ToastContext.jsx"
// import FloatingCreateButton from "@/components/FloatingCreateButton.jsx"
import { MOCK_TRIPS } from "@/mocks/trips"

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true"

const MyTrips = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = useContext(GlobalState)
  const api = state?.userAPI ?? state?.UserAPI
  const [email] = api?.email ?? [""]
  const [isLogged] = api?.isLogged ?? [false]
  const [token] = state?.token ?? [null]
  const { refetchTrips, refetchWishlists } = useDataRefresh()
  const { success, error: showError } = useToast()

  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingIds, setDeletingIds] = useState(new Set())
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
        const allTrips = Array.isArray(res.data) ? res.data : []
        const committedTrips = allTrips.filter(t => t.committedInstanceId)
        setTrips(committedTrips)
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
    if (!id || deletingIds.has(id)) return
    if (!confirm("Do you want to delete this trip?")) return
    
    setDeletingIds(prev => new Set([...prev, id]))
    
    try {
      setTrips((prev) => prev.filter((t) => t._id !== id))
      
      const headers = token ? { Authorization: token } : undefined
      await axios.delete(`/api/trips/getaway/${id}`, { headers })
      
      if (location.pathname === `/trips/${id}`) {
        navigate('/explore')
      }
      
      await Promise.all([refetchTrips(), refetchWishlists()])
      
      success("Trip deleted successfully")
    } catch (err) {
      console.error(err)
      try {
        const headers = token ? { Authorization: token } : undefined
        const res = await axios.get("/api/trips/getaway-trip", { headers })
        setTrips(res.data || [])
      } catch (refetchError) {
        console.error("Error refetching trips:", refetchError)
      }
      showError("Failed to delete trip. Please try again.")
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
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
    (Number(t.stay_expense) || 0) + (Number(t.car_expense) || 0) + (Number(t.travel_expense) || 0) + (Number(t.other_expense) || 0)

  // countdown helper
  const nextTripCountdown = (start, end) => {
    const now = new Date()
    const s = new Date(start)
    const e = new Date(end)

    if (Number.isNaN(s) || Number.isNaN(e)) return null

    if (now >= s && now <= e) {
      return { label: "Happening now", tone: "emerald" }
    }

    const ms = s - now
    const oneHour = 1000 * 60 * 60
    const oneDay = oneHour * 24

    if (ms > 0 && ms < oneDay) {
      const hours = Math.max(1, Math.ceil(ms / oneHour))
      return { label: `In ${hours} hour${hours === 1 ? "" : "s"}`, tone: "indigo" }
    }

    const days = Math.ceil(ms / oneDay)
    if (days === 0) return { label: "Today", tone: "indigo" }
    if (days === 1) return { label: "Tomorrow", tone: "indigo" }
    if (days > 1) return { label: `${days} days until your next trip`, tone: "indigo" }

    return { label: "Starts soon", tone: "indigo" }
  }

  // compute featured (soonest upcoming by start date), and the rest grouped by year
  const { featured, groups, orderedYears } = useMemo(() => {
    const now = new Date()
    const tripsWithCommittedInstance = trips
      .map((t) => {
        const committedInstance = t.instances.find(
          (inst) => inst._id?.toString() === t.committedInstanceId?.toString()
        )
        return { ...t, committedInstance }
      })
      .filter((t) => t.committedInstance)
      .sort((a, b) => new Date(a.committedInstance.trip_start) - new Date(b.committedInstance.trip_start))

    const upcoming = tripsWithCommittedInstance.filter((t) => {
      const end = new Date(t.committedInstance.trip_end); end.setDate(end.getDate() + 1)
      return !Number.isNaN(end) && end >= now
    })

    const f = upcoming[0] || null
    const rest = f ? upcoming.slice(1) : upcoming

    const byYear = rest.reduce((acc, t) => {
      const y = new Date(t.committedInstance.trip_end).getFullYear()
      ;(acc[y] ||= []).push(t)
      return acc
    }, {})

    Object.keys(byYear).forEach((y) =>
      byYear[y].sort((a, b) => new Date(a.committedInstance.trip_start) - new Date(b.committedInstance.trip_start))
    )

    const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)
    return { featured: f, groups: byYear, orderedYears: years }
  }, [trips])

  // if not logged in (and not using mocks), show prompt
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
  const countdown = featured ? nextTripCountdown(featured.committedInstance.trip_start, featured.committedInstance.trip_end) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Countdown above featured */}
        {featured && countdown && (
          <div className="mb-3 flex items-center gap-2">
            <span
              className={
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ring-1 " +
                (countdown.tone === "emerald"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-indigo-50 text-indigo-700 ring-indigo-200")
              }
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" />
              </svg>
              {countdown.label}
            </span>
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
                      {fmtRange(featured.committedInstance.trip_start, featured.committedInstance.trip_end)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-50 px-4 py-2 text-indigo-700 ring-1 ring-indigo-200">
                      <span className="text-xs uppercase tracking-wide">Est. Total</span>
                      <div className="text-lg font-bold">
                        {totalCost(featured.committedInstance) > 0 ? `$${totalCost(featured.committedInstance).toFixed(0)}` : "—"}
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/trips/${featured._id}/instances/${featured.committedInstance._id}`)}
                      className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      View
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Do you want to delete this committed instance?")) return
                        setDeletingIds(prev => new Set([...prev, featured._id]))
                        try {
                          const headers = token ? { Authorization: token } : undefined
                          await axios.delete(`/api/trips/getaway/${featured._id}/instances/${featured.committedInstance._id}`, { headers })
                          setTrips((prev) => prev.filter((t) => t._id !== featured._id))
                          await Promise.all([refetchTrips(), refetchWishlists()])
                          success("Instance deleted successfully")
                          navigate('/mytrips')
                        } catch (err) {
                          console.error(err)
                          showError("Failed to delete instance. Please try again.")
                        } finally {
                          setDeletingIds(prev => {
                            const newSet = new Set(prev)
                            newSet.delete(featured._id)
                            return newSet
                          })
                        }
                      }}
                      disabled={deletingIds.has(featured._id)}
                      className={`rounded-xl bg-rose-600/90 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-rose-600 ${deletingIds.has(featured._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {deletingIds.has(featured._id) ? 'Deleting...' : 'Delete'}
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
                  <TripCard key={trip._id} trip={trip} instance={trip.committedInstance} onRemove={removePost} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900">Start planning your trips!</p>
            <p className="mt-1 text-slate-600">You don&apos;t have any upcoming commited trips yet.</p>
            {/* <Link
              to="/search"
              className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-md transition hover:bg-indigo-700"
            >
              Create your first trip
            </Link> */}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyTrips
