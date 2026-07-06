import { useContext, useEffect, useMemo, useState } from "react"
import axios from "axios"
import TripCard from "@/components/cards/TripCard"
import { GlobalState } from "@/context/GlobalState"
import EmptyState from "@/components/empty/EmptyState"
import { CardGridSkeleton } from "@/components/skeletons/AppSkeletons.jsx"
import { MOCK_TRIPS } from "@/mocks/trips"
import { toLocalDate } from "@/pages/utils/localDates"

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true"

const ExploreGrid = ({ onFavoriteAdded }) => {
  const state = useContext(GlobalState)
  const api = state?.userAPI ?? state?.UserAPI
  const [email] = api?.email ?? [""]
  const [userLoading] = api?.loading ?? [false]
  const [userError] = api?.error ?? [null]
  const [token] = state?.token ?? [null]
  const [globalLoading] = state?.loading ?? [false]

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    const run = async () => {
      if (USE_MOCKS) {
        console.log("📦 Mock trips:", MOCK_TRIPS)
        setItems(MOCK_TRIPS)
        setLoading(false)
        return
      }

      if (globalLoading || userLoading || (token && !email && !userError)) {
        setLoading(true)
        return
      }

      if (!email && token && state?.userAPI?.refresh) {
        try {
          await state.userAPI.refresh()
        } catch (refreshError) {
          console.error("Failed to refresh user before loading trips:", refreshError)
        }
      }

      if (!email) {
        setItems([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const headers = token ? { Authorization: token } : undefined
        const res = await axios.get("/api/trips/boards", {
          params: { email },
          headers,
          signal: controller.signal,
        })
        const all = Array.isArray(res.data) ? res.data : []
        setItems(all)
      } catch (e) {
        if (e.name !== "CanceledError") {
          console.error("❌ Failed to load trips:", e)
          setError("Failed to load trips.")
          setItems([])
        }
      } finally {
        setLoading(false)
      }
    }

    run()
    return () => controller.abort()
  }, [email, token, globalLoading, userLoading, userError, state?.userAPI])

  const removeDeletedTrip = (id) => {
    if (!id) return
    setItems((prev) => prev.filter((t) => t._id !== id))
  }

  const sorted = useMemo(() => {
    return [...items].sort(
      (a, b) =>
        (toLocalDate(a.board_start || a.trip_start)?.getTime() ?? 0) -
        (toLocalDate(b.board_start || b.trip_start)?.getTime() ?? 0)
    )
  }, [items])

  if (loading) {
    return <CardGridSkeleton count={6} />
  }

  if (error) {
    return <EmptyState title="Couldn’t load trips" subtitle={error} />
  }

  if (sorted.length === 0) {
    return (
      <EmptyState
        title="No trips yet"
        subtitle="Create a date window, then compare destinations inside it."
        ctaHref="/search"
        ctaLabel="Create a board"
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((trip) => (
        <TripCard
          key={trip._id}
          trip={trip}
          onRemove={removeDeletedTrip}
          onFavoriteAdded={onFavoriteAdded} // ✅ Pass down the callback
        />
      ))}
    </div>
  )
}

export default ExploreGrid
