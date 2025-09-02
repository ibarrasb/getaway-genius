// src/components/grids/WishlistGrid.jsx
import { useContext, useEffect, useState } from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import { GlobalState } from "@/context/GlobalState"
import EmptyState from "@/components/empty/EmptyState"

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true"

// Simple mock wishlists (optional): adjust to your schema as needed
const MOCK_WISHLISTS = [
  {
    _id: "wl_tokyo",
    list_name: "Tokyo 2026",
    trips: [
      { _id: "t1", location_address: "Shinjuku, Tokyo", image_url: "https://picsum.photos/seed/tky/400/300" },
      { _id: "t2", location_address: "Shibuya, Tokyo", image_url: "https://picsum.photos/seed/tky2/400/300" },
    ],
  },
  {
    _id: "wl_beach",
    list_name: "Beach Ideas",
    trips: [{ _id: "t3", location_address: "Cancún", image_url: "https://picsum.photos/seed/cancun/400/300" }],
  },
]

const WishlistGrid = () => {
  const state = useContext(GlobalState)
  const api = state?.userAPI ?? state?.UserAPI
  const [email] = api?.email ?? [""]

  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    const run = async () => {
      if (USE_MOCKS) {
        setLists(MOCK_WISHLISTS)
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const res = await axios.get("/api/wishlist/getlists", {
          params: { email },
          signal: controller.signal,
        })
        setLists(Array.isArray(res.data) ? res.data : [])
      } catch (e) {
        if (e.name !== "CanceledError") {
          console.error(e)
          setError("Failed to load wishlists.")
          setLists([])
        }
      } finally {
        setLoading(false)
      }
    }

    run()
    return () => controller.abort()
  }, [email])

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
    )
  }

  if (error) {
    return <EmptyState title="Couldn’t load wishlists" subtitle={error} />
  }

  if (lists.length === 0) {
    return (
      <EmptyState
        title="No wishlists yet"
        subtitle="Create a wishlist to save ideas for later."
        ctaHref="/search"
        ctaLabel="Start exploring"
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {lists.map((wl) => (
        <div
          key={wl._id}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="p-4">
            <h3 className="text-lg font-semibold text-slate-900">{wl.list_name}</h3>
            <p className="mt-1 text-sm text-slate-600">
              {wl.trips?.length ?? 0} trip{(wl.trips?.length ?? 0) === 1 ? "" : "s"}
            </p>
          </div>
          {wl.trips?.length > 0 && (
            <div className="grid grid-cols-3 gap-1 px-4 pb-4">
              {wl.trips.slice(0, 3).map((t) => (
                <img
                  key={t._id}
                  src={t.image_url}
                  alt={t.location_address}
                  className="h-16 w-full rounded-lg object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <Link
              to={`/wishlist-detail/${wl._id}`}
              className="rounded-xl bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              View
            </Link>
            <span className="text-xs text-slate-500">Updated just now</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default WishlistGrid
