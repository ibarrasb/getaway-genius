// src/components/cards/TripCard.jsx
import { useContext, useEffect, useMemo, useState, useCallback } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { GlobalState } from "@/context/GlobalState.jsx"
import WishlistModal from "@/components/modals/WishlistModal"
import { useDataRefresh } from "@/hooks/useDataRefresh.js"
import { useToast } from "@/context/ToastContext.jsx"

const PLACEHOLDER_IMG = "https://picsum.photos/seed/getaway/1200/800"

const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime())

const makeRange = (startStr, endStr) => {
  const s = startStr ? new Date(startStr) : null
  const e = endStr ? new Date(endStr) : null
  const sOk = isValidDate(s)
  const eOk = isValidDate(e)
  if (!sOk && !eOk) return { hasRange: false, label: "" }
  if (sOk && !eOk) return { hasRange: true, label: s.toLocaleDateString() }
  if (!sOk && eOk) return { hasRange: true, label: e.toLocaleDateString() }
  const fmt = (d) => `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`
  return { hasRange: true, label: `${fmt(s)} – ${fmt(e)}` }
}

const TripCard = ({ trip, onRemove, onFavoriteAdded }) => {
  const state = useContext(GlobalState)
  const api = state?.userAPI ?? state?.UserAPI
  const [email] = api?.email ?? [""]
  const [token] = state?.token ?? [null]
  const navigate = useNavigate()
  const location = useLocation()
  const { refetchTrips, refetchWishlists } = useDataRefresh()
  const { success, error } = useToast()

  const [isFavorite, setIsFavorite] = useState(Boolean(trip.isFavorite))
  const [showWishlistModal, setShowWishlistModal] = useState(false)
  const [imgSrc, setImgSrc] = useState(trip?.image_url || PLACEHOLDER_IMG)
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setIsFavorite(Boolean(trip.isFavorite))
  }, [trip])

  useEffect(() => {
    setImgSrc(trip?.image_url || PLACEHOLDER_IMG)
  }, [trip?.image_url])

  const { hasRange, label: rangeLabel } = useMemo(
    () => makeRange(trip?.trip_start, trip?.trip_end),
    [trip?.trip_start, trip?.trip_end]
  )

  const totalCost = useMemo(() => {
    return (
      (Number(trip?.stay_expense) || 0) +
      (Number(trip?.car_expense) || 0) +
      (Number(trip?.travel_expense) || 0)
    )
  }, [trip])

  const handleRemove = useCallback(async () => {
    if (!trip?._id || isDeleting) return
    
    if (!confirm("Do you want to delete this trip?")) return
    
    setIsDeleting(true)
    
    try {
      const headers = token ? { Authorization: token } : undefined
      await axios.delete(`/api/trips/getaway/${trip._id}`, { headers })
      
      if (location.pathname === `/trips/${trip._id}`) {
        navigate('/explore')
      }
      
      onRemove?.(trip._id)
      
      await Promise.all([refetchTrips(), refetchWishlists()])
      
      success("Trip deleted successfully")
    } catch (err) {
      console.error("Delete failed:", err)
      error("Failed to delete trip. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }, [trip?._id, isDeleting, token, location.pathname, navigate, onRemove, refetchTrips, refetchWishlists, success, error])

  const handleFavoriteToggle = useCallback(() => {
    if (isToggling) return
    if (isFavorite) handleUnfavorite()
    else setShowWishlistModal(true)
  }, [isFavorite, isToggling])

  const handleModalClose = () => setShowWishlistModal(false)

  const handleModalSave = async () => {
    try {
      setIsFavorite(true)
      
      await axios.put(
        `/api/trips/getaway/${trip._id}`,
        { isFavorite: true },
        token ? { headers: { Authorization: token } } : undefined
      )
      
      setShowWishlistModal(false)
      
      await Promise.all([refetchTrips(), refetchWishlists()])
      onFavoriteAdded?.()
      
    } catch (err) {
      console.error("Error updating trip details:", err)
      setIsFavorite(false)
      error("Failed to add trip to wishlist. Please try again.")
    }
  }

  const handleUnfavorite = async () => {
    if (!trip?._id || isToggling) return
    
    setIsToggling(true)
    const originalFavoriteState = isFavorite
    
    try {
      setIsFavorite(false)
      
      const wishlistsRes = await axios.get("/api/wishlist/getlists", {
        params: { email },
        ...(token ? { headers: { Authorization: token } } : {}),
      })
      const wishlists = wishlistsRes.data || []
      const target = wishlists.find((w) => (w.trips || []).some((t) => t._id === trip._id))

      if (target?._id) {
        await axios.delete(
          `/api/wishlist/${target._id}/remove-trip/${trip._id}`,
          token ? { headers: { Authorization: token } } : undefined
        )
      }

      await axios.put(
        `/api/trips/getaway/${trip._id}`,
        { isFavorite: false },
        token ? { headers: { Authorization: token } } : undefined
      )

      await Promise.all([refetchTrips(), refetchWishlists()])
      
      if (target?.list_name) {
        success(`Trip removed from ${target.list_name}`)
      } else {
        success("Trip removed from favorites")
      }
      
      onFavoriteAdded?.()
    } catch (err) {
      console.error("Unfavorite failed:", err)
      setIsFavorite(originalFavoriteState)
      error("Failed to remove from favorites. Please try again.")
    } finally {
      setIsToggling(false)
    }
  }

  const onImgError = () => {
    if (imgSrc !== PLACEHOLDER_IMG) setImgSrc(PLACEHOLDER_IMG)
  }

  const priceLabel = totalCost > 0 ? `$${totalCost.toFixed(2)}` : "Needs attention"
  const isIncomplete = totalCost <= 0

  return (
    <div
      className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      role="article"
    >
      {/* Media */}
      <div className="relative">
        <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
          <img
            src={imgSrc}
            onError={onImgError}
            alt={trip?.trip_location || trip?.location_address || "Trip photo"}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>

        {/* top overlay gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/0 via-black/0 to-black/30" />

        {/* Heart button */}
        <button
          type="button"
          onClick={handleFavoriteToggle}
          disabled={isToggling}
          aria-label={isFavorite ? "Unfavorite" : "Add to wishlist"}
          aria-pressed={isFavorite}
          className={`absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-slate-700 shadow-md ring-1 ring-black/5 transition hover:scale-105 hover:bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
        >
          {isToggling ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg
              className={`h-5 w-5 transition ${isFavorite ? "fill-rose-500 stroke-rose-500" : "stroke-slate-700"}`}
              viewBox="0 0 24 24"
              fill={isFavorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.347-1.903-4.25-4.25-4.25-1.48 0-2.786.75-3.5 1.875A4.125 4.125 0 006.75 4C4.403 4 2.5 5.903 2.5 8.25c0 6.25 9.5 10 9.5 10s9.5-3.75 9.5-10z"
              />
            </svg>
          )}
        </button>

        {/* corner chips */}
        <div className="absolute left-3 top-3 z-10 flex max-w-[75%] flex-wrap items-center gap-2">
          {hasRange && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-800 ring-1 ring-black/5">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" />
              </svg>
              {rangeLabel}
            </span>
          )}
        </div>

        {/* bottom info strip over image */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3">
          <div className="inline-flex max-w-full items-center gap-2 rounded-2xl bg-black/45 px-3 py-1.5 text-white backdrop-blur-md ring-1 ring-white/10">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 1118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate text-sm font-semibold">
              {trip?.location_address || trip?.trip_location || "Untitled Trip"}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Price & status */}
        <div className="mb-2 flex items-center gap-2">
          <span
            className={
              `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ` +
              (isIncomplete
                ? "bg-amber-50 text-amber-700 ring-amber-200"
                : "bg-emerald-50 text-emerald-700 ring-emerald-200")
            }
          >
            {!isIncomplete ? (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1v22M3 6h18M3 12h18M3 18h18" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4" strokeLinecap="round" />
                <circle cx="12" cy="16" r=".5" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            )}
            {priceLabel}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            to={`/trips/${trip?._id}`}
            state={{ trip }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            View
          </Link>

          <button
            type="button"
            onClick={handleRemove}
            disabled={isDeleting}
            className={`inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isDeleting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6v12m8-12v12M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14" strokeLinecap="round" />
                </svg>
                Delete
              </>
            )}
          </button>
        </div>
      </div>

      {/* subtle outer glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
           style={{ boxShadow: "0 0 0 1px rgba(99,102,241,.15), 0 10px 30px rgba(2,6,23,.10)" }}
      />

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
