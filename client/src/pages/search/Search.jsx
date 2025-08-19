// src/pages/search/Search.jsx
import { useState, useEffect, useCallback, useContext } from "react"
import { useNavigate } from "react-router-dom"
import Autocomplete from "react-google-autocomplete"
import axios from "axios"
import { GlobalState } from "@/context/GlobalState.jsx"

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'><rect width='100%' height='100%' fill='#e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial' font-size='32' fill='#6b7280'>No photo available</text></svg>`
  )

const Search = () => {
  const navigate = useNavigate()

  // auth / global
  const state = useContext(GlobalState)
  const api = state?.userAPI ?? state?.UserAPI
  const [email] = api?.email ?? [""]
  const [token] = state?.token ?? [null]
  const [setCallback] = api?.callback?.slice(1) ?? [() => {}]

  // ui state
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [photoURL, setPhotoURL] = useState("")
  const [searchValue, setSearchValue] = useState("")
  const [loadingPhoto, setLoadingPhoto] = useState(false)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState(null)

  // suggestions state
  const [suggestions, setSuggestions] = useState([])
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [suggestionError, setSuggestionError] = useState(null)

  // ---- photo fetching helpers ----
  const getPhoto = useCallback(async (photoreference, signal) => {
    const res = await fetch(
      `/api/places-pics?photoreference=${encodeURIComponent(photoreference)}`,
      { signal }
    )
    if (!res.ok) throw new Error("Failed to fetch photo")
    const data = await res.json()
    return data?.photoUri ?? ""
  }, [])

  const getPlacePhotos = useCallback(
    async (placeid, signal) => {
      const res = await fetch(
        `/api/places-details?placeid=${encodeURIComponent(placeid)}`,
        { signal }
      )
      if (!res.ok) throw new Error("Failed to fetch place details")
      const data = await res.json()
      const photos = data?.photos || []
      if (!photos.length) return ""
      const random = photos[Math.floor(Math.random() * photos.length)]
      const randomRef = random?.name
      if (!randomRef) return ""
      return await getPhoto(randomRef, signal)
    },
    [getPhoto]
  )

  // load a preview photo when the place changes (same trigger logic you had before)
  useEffect(() => {
    if (!selectedPlace?.place_id) return
    const controller = new AbortController()
    const { signal } = controller
    ;(async () => {
      try {
        setLoadingPhoto(true)
        setError(null)
        const uri = await getPlacePhotos(selectedPlace.place_id, signal)
        setPhotoURL(uri || PLACEHOLDER)
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e)
          setError("Couldn’t load photos for this place.")
          setPhotoURL(PLACEHOLDER)
        }
      } finally {
        setLoadingPhoto(false)
      }
    })()
    return () => controller.abort()
  }, [selectedPlace?.place_id, getPlacePhotos])

  // selection handler (simple & reliable)
  const handlePlaceSelected = (place) => {
    setSelectedPlace(place || null)
    setSearchValue("")
    setError(null)
    setCreateMsg(null)
  }

  // display name for selected city
  const locationName =
    selectedPlace?.formatted_address ||
    selectedPlace?.name ||
    selectedPlace?.vicinity ||
    ""

  // ---- create trip directly from Search ----
  const handleCreateTrip = async () => {
    if (!selectedPlace) return
    if (!email) {
      setCreateMsg("Please log in to create a trip.")
      return
    }
    try {
      setCreating(true)
      setCreateMsg(null)
      const payload = {
        user_email: email,
        location_address: locationName,
        within_trips: [],
        image_url: photoURL || "",
        isFavorite: false,
      }
      await axios.post("/api/trips/getaway-trip", payload, {
        ...(token ? { headers: { Authorization: token } } : {}),
      })
      setCallback?.((v) => !v) // notify listeners if any
      navigate("/explore", { replace: true })
    } catch (err) {
      console.error(err)
      setCreateMsg(err?.response?.data?.msg || "Error creating trip")
    } finally {
      setCreating(false)
    }
  }

  // ---- optional: AI suggestions for the selected city ----
  useEffect(() => {
    const city = (locationName || "").trim()
    if (!city) {
      setSuggestions([])
      setSuggestionError(null)
      return
    }
    const controller = new AbortController()
    const { signal } = controller
    ;(async () => {
      try {
        setSuggestionLoading(true)
        setSuggestionError(null)
        const res = await fetch("/api/chatgpt/trip-suggestion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location: city }),
          signal,
        })
        if (!res.ok) throw new Error("Failed to fetch suggestions")
        const data = await res.json()
        setSuggestions(Array.isArray(data?.tripSuggestions) ? data.tripSuggestions : [])
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e)
          setSuggestionError("Couldn’t load ideas right now.")
          setSuggestions([])
        }
      } finally {
        setSuggestionLoading(false)
      }
    })()
    return () => controller.abort()
  }, [locationName])

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50">
      {/* Top bar */}
      <header className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() =>
              window.history.length > 1 ? navigate(-1) : navigate("/", { replace: true })
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" />
            </svg>
            Back
          </button>

          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-600" />
            City search
          </span>
        </div>
      </header>

      {/* Search hero */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl ring-1 ring-slate-200 backdrop-blur">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left: input */}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Where are you going?
              </h1>
              <p className="mt-2 text-slate-600">
                Type a <span className="font-semibold">city name</span> and we’ll show a quick visual so you can get a feel for it.
              </p>

              <div className="mt-5">
                <label htmlFor="place-search" className="mb-2 block text-sm font-medium text-slate-700">
                  City
                </label>
                <Autocomplete
                  id="place-search"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
                  onPlaceSelected={handlePlaceSelected}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  options={{ types: ["(cities)"] }} // hint cities in the dropdown
                />
                <p className="mt-2 text-xs text-slate-500">Pick a city from the dropdown suggestions.</p>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Right: single preview (photo + static location name) */}
            <div className="relative">
              <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                {loadingPhoto ? (
                  <div className="h-full w-full animate-pulse bg-slate-200" />
                ) : selectedPlace ? (
                  <img
                    src={photoURL || PLACEHOLDER}
                    alt={locationName || "Selected place"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    Choose a city to see a preview
                  </div>
                )}
              </div>

              {/* Static location label overlay */}
              {locationName ? (
                <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-xl bg-white/85 px-3 py-2 text-center text-sm font-semibold text-slate-900 backdrop-blur ring-1 ring-slate-200">
                  {locationName}
                </div>
              ) : null}
            </div>
          </div>

          {/* Action row under the preview */}
          <div className="mt-6 flex items-center justify-end">
            <button
              type="button"
              onClick={handleCreateTrip}
              disabled={!selectedPlace || creating}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create Trip"}
            </button>
          </div>

          {createMsg && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {createMsg}
            </div>
          )}

          {/* Optional: Ideas for this trip */}
          {selectedPlace && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Ideas for this trip</h3>
                {suggestionLoading && <span className="text-xs text-slate-500">Loading…</span>}
              </div>

              {suggestionError && (
                <p className="mt-2 text-sm text-rose-600">{suggestionError}</p>
              )}

              {!suggestionLoading && !suggestionError && suggestions?.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {suggestions.slice(0, 6).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}

              {!suggestionLoading && !suggestionError && (!suggestions || suggestions.length === 0) && (
                <p className="mt-2 text-sm text-slate-500">We’ll show ideas for {locationName} here.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Spacer / subtle tip */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <p className="text-sm text-slate-600">
            Pro tip: try nearby cities too — prices and vibes can change a lot with short hops.
          </p>
        </div>
      </section>
    </div>
  )
}

export default Search
