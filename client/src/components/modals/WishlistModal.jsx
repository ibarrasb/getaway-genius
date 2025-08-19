// src/components/modals/WishlistModal.jsx
import { useContext, useEffect, useMemo, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import axios from "axios"
import { GlobalState } from "@/context/GlobalState.jsx"

const initialState = { list_name: "", trips: [], email: "" }

const WishlistModal = ({ show, onClose, onSave, trip }) => {
  const state = useContext(GlobalState)
  const api = state?.userAPI ?? state?.UserAPI
  const [email] = api?.email ?? [""]
  const [token] = state?.token ?? [null]

  const [wishlists, setWishlists] = useState([])
  const [newWishlistName, setNewWishlistName] = useState("")
  const [selectedWishlistId, setSelectedWishlistId] = useState("")
  const [selectedWishlistName, setSelectedWishlistName] = useState("")
  const [sentObject, setSentObject] = useState(initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // lock body scroll when open
  useEffect(() => {
    if (!show) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [show])

  // global ESC to close
  useEffect(() => {
    if (!show) return
    const onKey = (e) => e.key === "Escape" && onClose?.()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [show, onClose])

  // load wishlists when opening
  useEffect(() => {
    if (!show) return
    setNewWishlistName("")
    setSelectedWishlistId("")
    setSelectedWishlistName("")
    setSentObject(initialState)
    setError(null)

    const controller = new AbortController()
    const fetchWishlists = async () => {
      try {
        setLoading(true)
        const res = await axios.get("/api/wishlist/getlists", {
          params: { email },
          signal: controller.signal,
          ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
        })
        setWishlists(res.data || [])
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error("Error fetching wishlists:", err)
          setError("Failed to load your wishlists.")
        }
      } finally {
        setLoading(false)
      }
    }
    fetchWishlists()
    return () => controller.abort()
  }, [show, email, token])

  const canSave = useMemo(
    () => Boolean(selectedWishlistId || newWishlistName.trim().length > 0),
    [selectedWishlistId, newWishlistName]
  )

  const handlePickExisting = (id, name) => {
    setSelectedWishlistId(id)
    setSelectedWishlistName(name)
    setNewWishlistName("") // clear create field if picking existing
  }

  const handleClear = () => {
    setSelectedWishlistId("")
    setSelectedWishlistName("")
    setNewWishlistName("")
  }

  const handleSave = useCallback(async () => {
    if (!trip?._id) return
    try {
      setError(null)
      if (selectedWishlistId) {
        // add to existing list
        await axios.post(
          `/api/wishlist/addtrip/${selectedWishlistId}`,
          trip,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        )
        onSave?.()
        alert(`Trip has been added to ${selectedWishlistName}`)
      } else if (newWishlistName.trim()) {
        // create list then add trip
        const setObj = {
          list_name: newWishlistName.trim(),
          trips: [trip],
          email: trip.user_email || email,
        }
        setSentObject(setObj)
        await axios.post(
          "/api/wishlist/createlist",
          setObj,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        )
        onSave?.()
        alert(`Trip has been added to ${newWishlistName.trim()}`)
      }
      onClose?.()
    } catch (err) {
      console.error("Error handling wishlist operation:", err)
      setError("Could not save to wishlist. Please try again.")
    }
  }, [trip, selectedWishlistId, selectedWishlistName, newWishlistName, token, email, onSave, onClose])

  // mount nothing when hidden
  if (!show) return null

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center"
      aria-modal="true"
      role="dialog"
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* panel */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:mx-4">
        <h2 className="text-xl font-semibold text-slate-900">Add to wishlist</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose an existing list or create a new one.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 space-y-5">
          {/* Existing wishlists */}
          {loading ? (
            <div className="animate-pulse rounded-lg border border-slate-200 bg-white px-3 py-4 text-sm text-slate-600">
              Loading lists…
            </div>
          ) : wishlists.length > 0 ? (
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-700">Your lists</h3>
              <div className="flex flex-wrap gap-2">
                {wishlists.map((w) => {
                  const active = selectedWishlistId === w._id
                  return (
                    <button
                      key={w._id}
                      type="button"
                      onClick={() => handlePickExisting(w._id, w.list_name)}
                      className={`rounded-full px-3 py-1.5 text-sm ring-1 transition ${
                        active
                          ? "bg-indigo-600 text-white ring-indigo-600"
                          : "bg-white text-slate-800 ring-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {w.list_name}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              You don’t have any wishlists yet — create one below.
            </div>
          )}

          {/* Create new */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-700">Create new wishlist</h3>
            <input
              type="text"
              placeholder="Wishlist name"
              value={newWishlistName}
              onChange={(e) => {
                setNewWishlistName(e.target.value)
                if (e.target.value) setSelectedWishlistId("") // clear existing selection if typing
              }}
              disabled={Boolean(selectedWishlistId)}
              className={`block w-full rounded-xl border bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 ${
                selectedWishlistId ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400" : "border-slate-300"
              }`}
            />
            {selectedWishlistId && (
              <p className="mt-1 text-xs text-slate-500">
                Clear your selection to create a new list.
              </p>
            )}
          </div>
        </div>

        {/* actions */}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-transparent bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default WishlistModal
