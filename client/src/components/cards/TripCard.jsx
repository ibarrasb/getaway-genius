import { useContext, useEffect, useMemo, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { GlobalState } from "@/context/GlobalState.jsx"
import WishlistModal from "@/components/modals/WishlistModal"

const TripCard = ({ trip, onRemove, onFavoriteAdded }) => {
  const state = useContext(GlobalState)
  const api = state?.userAPI ?? state?.UserAPI
  const [email] = api?.email ?? [""]
  const [token] = state?.token ?? [null]

  const [isFavorite, setIsFavorite] = useState(Boolean(trip.isFavorite))
  const [showWishlistModal, setShowWishlistModal] = useState(false)

  useEffect(() => {
    setIsFavorite(Boolean(trip.isFavorite))
  }, [trip])

  const start = useMemo(() => new Date(trip.trip_start), [trip.trip_start])
  const end = useMemo(() => new Date(trip.trip_end), [trip.trip_end])
  const rangeLabel = useMemo(() => {
    const fmt = (d) => `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`
    return `${fmt(start)} – ${fmt(end)}`
  }, [start, end])

  const totalCost = useMemo(() => {
    return (
      (Number(trip.stay_expense) || 0) +
      (Number(trip.car_expense) || 0) +
      (Number(trip.travel_expense) || 0)
    )
  }, [trip])

  const handleRemove = useCallback(() => {
    if (!trip._id) return
    onRemove?.(trip._id)
  }, [onRemove, trip?._id])

  const handleFavoriteToggle = useCallback(() => {
    if (isFavorite) handleUnfavorite()
    else setShowWishlistModal(true)
  }, [isFavorite])

  const handleModalClose = () => setShowWishlistModal(false)

  const handleModalSave = async () => {
    try {
      setIsFavorite(true)
      await axios.put(
        `/api/trips/getaway/${trip._id}`,
        { isFavorite: true },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      )
      setShowWishlistModal(false)
      onFavoriteAdded?.() // ✅ Notify parent to refresh wishlist
    } catch (err) {
      console.error("Error updating trip details:", err)
    }
  }

  const handleUnfavorite = async () => {
    if (!trip._id) return
    try {
      const wishlistsRes = await axios.get("/api/wishlist/getlists", {
        params: { email },
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      })

      const wishlists = wishlistsRes.data || []
      const target = wishlists.find((w) => (w.trips || []).some((t) => t._id === trip._id))

      if (target?._id) {
        await axios.delete(
          `/api/wishlist/${target._id}/remove-trip/${trip._id}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        )
      }

      await axios.put(
        `/api/trips/getaway/${trip._id}`,
        { isFavorite: false },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      )

      setIsFavorite(false)
      if (target?.list_name) alert(`Trip removed from ${target.list_name}`)
      onFavoriteAdded?.() // ✅ Also refresh in case of removal
    } catch (err) {
      console.error("Unfavorite failed:", err)
      alert("Failed to remove from favorites.")
    }
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Image / Favorite */}
      <div className="relative">
        <button
          onClick={handleFavoriteToggle}
          aria-label={isFavorite ? "Unfavorite" : "Add to wishlist"}
          className="absolute right-3 top-3 z-10 inline-flex items-center justify-center rounded-full bg-white/90 p-2 shadow ring-1 ring-slate-200 transition hover:bg-white"
        >
          <svg
            className={`h-5 w-5 transition ${isFavorite ? "fill-rose-500 stroke-rose-500" : "stroke-slate-700"}`}
            viewBox="0 0 24 24"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
          >
                      <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 8.25c0-2.347-1.903-4.25-4.25-4.25-1.48 0-2.786.75-3.5 1.875A4.125 4.125 0 006.75 4C4.403 4 2.5 5.903 2.5 8.25c0 6.25 9.5 10 9.5 10s9.5-3.75 9.5-10z"
            />
          </svg>
        </button>

        <img
          src={trip.image_url}
          alt={trip.trip_location || trip.location_address || "Trip photo"}
          className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>

      {/* Trip Details */}
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-lg font-semibold text-slate-900">
            {trip.location_address || trip.trip_location || "Untitled Trip"}
          </h3>
          <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            {rangeLabel}
          </span>
        </div>

        <div className="text-sm text-slate-600">
          {totalCost.toFixed(2) === "0.00" ? (
            <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700 ring-1 ring-amber-200">
              Needs attention
            </span>
          ) : (
            <span className="font-semibold text-slate-900">${totalCost.toFixed(2)}</span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Link
            to={`/trips/${trip._id}`}
            state={{ trip }}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            View
          </Link>
          <button
            onClick={handleRemove}
            className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Delete
          </button>

          {isFavorite && (
            <button
              onClick={handleUnfavorite}
              className="ml-auto inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              title="Remove from wishlist"
            >
              Unfavorite
            </button>
          )}
        </div>
      </div>

      {/* Wishlist modal */}
      <WishlistModal
        show={showWishlistModal}
        onClose={handleModalClose}
        onSave={handleModalSave}
        trip={trip}
      />
    </div>
  )
}

export default TripCard
