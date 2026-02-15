// src/pages/search/Search.jsx
import { useState, useEffect, useCallback, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GlobalState } from "@/context/GlobalState.jsx";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'><rect width='100%' height='100%' fill='#e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial' font-size='32' fill='#6b7280'>No photo available</text></svg>`
  );

const Search = () => {
  const navigate = useNavigate();

  // auth / global
  const state = useContext(GlobalState);
  const api = state?.userAPI ?? state?.UserAPI;
  const [email] = api?.email ?? [""];
  const [token] = state?.token ?? [null];
  const [setCallback] = api?.callback?.slice(1) ?? [() => {}];

  // ui state
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [photoURL, setPhotoURL] = useState(""); // <-- this will be a stable backend URL
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [locationBrief, setLocationBrief] = useState(null);
  const [briefMsg, setBriefMsg] = useState(null);
  const autocompleteHostRef = useRef(null);

  // Returns a stable URL string for a random photo of the place
  const getPlacePhotoURL = useCallback(async (placeid, signal) => {
    const res = await fetch(
      `/api/places-details?placeid=${encodeURIComponent(placeid)}`,
      { signal }
    );
    if (!res.ok) throw new Error("Failed to fetch place details");
    const data = await res.json();

    const photos = data?.photos || [];
    if (!photos.length) return "";

    const random = photos[Math.floor(Math.random() * photos.length)];
    const randomRef = random?.name; // e.g. "places/XXX/photos/YYY"
    if (!randomRef) return "";

    const photoRes = await fetch(
      `/api/places-pics?photoreference=${encodeURIComponent(randomRef)}`,
      { signal }
    );
    if (!photoRes.ok) throw new Error("Failed to fetch photo URL");
    const photoData = await photoRes.json();
    
    return photoData.url || "";
  }, []);

  // load a preview photo when the place changes
  useEffect(() => {
    if (!selectedPlace?.place_id) return;
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      try {
        setLoadingPhoto(true);
        setError(null);
        const url = await getPlacePhotoURL(selectedPlace.place_id, signal);
        setPhotoURL(url || PLACEHOLDER);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setError("Couldn’t load photos for this place.");
          setPhotoURL(PLACEHOLDER);
        }
      } finally {
        setLoadingPhoto(false);
      }
    })();

    return () => controller.abort();
  }, [selectedPlace?.place_id, getPlacePhotoURL]);

  // selection handler
  const handlePlaceSelected = (place) => {
    setSelectedPlace(place || null);
    setError(null);
    setCreateMsg(null);
    setLocationBrief(null);
    setBriefMsg(null);
  };

  useEffect(() => {
    const host = autocompleteHostRef.current;
    if (!host || !window.google?.maps?.places?.PlaceAutocompleteElement) return;

    const placeAutocomplete = new window.google.maps.places.PlaceAutocompleteElement({
      includedPrimaryTypes: ["locality"],
    });

    placeAutocomplete.setAttribute("requested-region", "US");
    placeAutocomplete.setAttribute("placeholder", "Search for a city");
    placeAutocomplete.style.width = "100%";
    placeAutocomplete.style.display = "block";
    placeAutocomplete.style.color = "#0f172a";
    placeAutocomplete.style.background = "#ffffff";
    placeAutocomplete.style.setProperty("--gmpx-color-surface", "#ffffff");
    placeAutocomplete.style.setProperty("--gmpx-color-on-surface", "#0f172a");
    placeAutocomplete.style.setProperty("--gmpx-color-on-surface-variant", "#334155");
    placeAutocomplete.style.setProperty("--gmpx-color-outline", "#cbd5e1");
    placeAutocomplete.style.setProperty("--gmpx-color-primary", "#0f766e");
    placeAutocomplete.style.setProperty("--gmpx-font-family-base", "Sora, ui-sans-serif, system-ui, sans-serif");
    placeAutocomplete.style.setProperty("--gmpx-font-size-base", "14px");
    placeAutocomplete.className =
      "w-full rounded-xl border border-slate-300 bg-white shadow-sm outline-none transition focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-300";

    const onSelect = async (event) => {
      try {
        const prediction = event.placePrediction;
        if (!prediction?.toPlace) return;
        const place = prediction.toPlace();
        await place.fetchFields({
          fields: ["id", "displayName", "formattedAddress"],
        });

        handlePlaceSelected({
          place_id: place.id || "",
          name: place.displayName || "",
          formatted_address: place.formattedAddress || "",
        });
      } catch (e) {
        console.error("Places selection failed:", e);
        setError("Couldn’t load place details. Try another city.");
      }
    };

    placeAutocomplete.addEventListener("gmp-select", onSelect);
    host.innerHTML = "";
    host.appendChild(placeAutocomplete);

    return () => {
      placeAutocomplete.removeEventListener("gmp-select", onSelect);
      host.innerHTML = "";
    };
  }, []);

  // display name for selected city
  const locationName =
    selectedPlace?.formatted_address ||
    selectedPlace?.name ||
    selectedPlace?.vicinity ||
    "";

  // ---- create trip directly from Search ----
  const handleCreateTrip = async () => {
    if (!selectedPlace) return;
    if (!email) {
      setCreateMsg("Please log in to create a trip.");
      return;
    }
    try {
      setCreating(true);
      setCreateMsg(null);

      // ✅ save the exact URL we used for the preview
      const payload = {
        user_email: email,
        location_address: locationName,
        image_url: photoURL || "", // <-- stable backend URL
        isFavorite: false,
      };

      await axios.post("/api/trips/getaway-trip", payload, {
        ...(token ? { headers: { Authorization: token } } : {}),
      });

      setCallback?.((v) => !v);
      navigate("/explore", { replace: true });
    } catch (err) {
      console.error(err);
      setCreateMsg(err?.response?.data?.msg || "Error creating trip");
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateBrief = async () => {
    if (!locationName || briefLoading) return;

    try {
      setBriefLoading(true);
      setBriefMsg(null);
      const response = await fetch("/api/chatgpt/location-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: locationName }),
      });

      if (!response.ok) {
        setLocationBrief(null);
        const errText = await response.text();
        setBriefMsg(errText || "Couldn’t generate a trip brief right now.");
        return;
      }

      const data = await response.json();
      setLocationBrief(data);
      if (data?.warning) setBriefMsg(data.warning);
    } catch (err) {
      console.error("Failed to generate location brief:", err);
      setLocationBrief(null);
      setBriefMsg("Couldn’t generate a trip brief right now.");
    } finally {
      setBriefLoading(false);
    }
  };

  return (
    <div className="gg-page min-h-screen">
      {/* Top bar */}
      <header className="gg-container py-4">
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

          <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
            <span className="inline-block h-2 w-2 rounded-full bg-teal-600" />
            City search
          </span>
        </div>
      </header>

      {/* Search hero */}
      <section className="gg-container">
        <div className="gg-glass overflow-visible rounded-3xl border border-white/70 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left: input */}
            <div>
              <h1 className="gg-title-lg text-slate-900">
                Where are you going?
              </h1>
              <p className="gg-lead mt-2">
                Type a <span className="font-semibold">city name</span> and we’ll show a quick visual so you can get a feel for it.
              </p>

              <div className="mt-5">
                <label htmlFor="place-search" className="mb-2 block text-sm font-medium text-slate-700">
                  City
                </label>
                <div
                  id="place-search"
                  ref={autocompleteHostRef}
                  className="gg-place-autocomplete-host relative z-30 text-slate-900"
                />
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
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateBrief}
                disabled={!selectedPlace || briefLoading}
                className="gg-btn-soft text-sm"
              >
                {briefLoading ? "Generating brief..." : "AI Trip Brief"}
              </button>
              <button
                type="button"
                onClick={handleCreateTrip}
                disabled={!selectedPlace || creating}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-105 disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create Trip"}
              </button>
            </div>
          </div>

          {createMsg && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {createMsg}
            </div>
          )}

          {locationBrief && (
            <div className="mt-4 gg-card rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                AI Destination Brief
              </p>
              <p className="mt-2 text-sm text-slate-700">{locationBrief.summary}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {(locationBrief.bestMonths || []).map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                  >
                    {m}
                  </span>
                ))}
              </div>

              <ul className="mt-3 space-y-1 text-sm text-slate-700">
                {(locationBrief.budgetTips || []).map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-teal-600" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {briefMsg && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {briefMsg}
            </div>
          )}
        </div>
      </section>

      {/* Spacer / subtle tip */}
      <section className="gg-container py-8">
        <div className="gg-card rounded-2xl p-5 text-center">
          <p className="text-sm text-slate-600">
            Pro tip: try nearby cities too — prices and vibes can change a lot with short hops.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Search;
