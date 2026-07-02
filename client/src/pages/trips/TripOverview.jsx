// src/pages/trips/TripOverview.jsx
import { useState, useEffect, useCallback, useContext, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  WiDaySunny,
  WiCloud,
  WiRain,
  WiSnow,
  WiThunderstorm,
} from "react-icons/wi";
import {
  Plus,
  Calendar as CalendarIcon,
  DollarSign,
  ArrowLeft,
  ExternalLink,
  Link as LinkIcon,
  Trash2,
  LayoutGrid,
  Table2,
} from "lucide-react";
import { GlobalState } from "../../context/GlobalState";
import TripDateRange from "@/components/TripDateRange"; // shared component
import { fmtRangeShort, toYmdLocal } from "../utils/localDates"; // ✅ local date utils (no TZ shift)

const TripOverview = () => {
  const state = useContext(GlobalState);
  const token = state.token[0];
  const globalLoading = state.loading?.[0] ?? false;
  const { tripId } = useParams();
  const autocompleteServiceRef = useRef(null);
  const autocompleteSessionRef = useRef(null);

  const [trip, setTrip] = useState(null);
  const [tripInstances, setTripInstances] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [funPlaces, setFunPlaces] = useState(null);
  const [tripSuggestions, setTripSuggestions] = useState([]);
  const [fetchError, setFetchError] = useState("");
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [funPlacesLoading, setFunPlacesLoading] = useState(false);
  const [tripSuggestionsLoading, setTripSuggestionsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [committingId, setCommittingId] = useState(null);
  const [viewMode, setViewMode] = useState("cards");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createError, setCreateError] = useState("");
  const [creatingOption, setCreatingOption] = useState(false);
  const [destinationSearch, setDestinationSearch] = useState("");
  const [placePredictions, setPlacePredictions] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [newInstance, setNewInstance] = useState({
    option_title: "",
    destination: "",
    image_url: "",
    status: "considering",
    trip_start: "",
    trip_end: "",
    stay_expense: 0,
    travel_expense: 0,
    car_expense: 0,
    other_expense: 0,
    cost_items: [
      { category: "lodging", name: "", url: "", price: "", quantity: 1, notes: "" },
    ],
    notes: "",
  });

  const itemCategories = [
    { value: "lodging", label: "Lodging" },
    { value: "flight", label: "Flight" },
    { value: "car", label: "Car" },
    { value: "tickets", label: "Tickets" },
    { value: "food", label: "Food" },
    { value: "other", label: "Other" },
  ];

  const statusStyles = {
    considering: "bg-sky-50 text-sky-700 ring-sky-200",
    top_choice: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    eliminated: "bg-slate-100 text-slate-600 ring-slate-200",
    booked: "bg-violet-50 text-violet-700 ring-violet-200",
  };

  const statusLabels = {
    considering: "Considering",
    top_choice: "Top Choice",
    eliminated: "Eliminated",
    booked: "Booked",
  };

  const buildEmptyInstance = (sourceTrip = trip) => ({
    option_title: "",
    destination: "",
    image_url: "",
    status: "considering",
    trip_start: toYmdLocal(sourceTrip?.board_start || sourceTrip?.trip_start),
    trip_end: toYmdLocal(sourceTrip?.board_end || sourceTrip?.trip_end),
    stay_expense: 0,
    travel_expense: 0,
    car_expense: 0,
    other_expense: 0,
    cost_items: [
      { category: "lodging", name: "", url: "", price: "", quantity: 1, start_date: "", end_date: "", notes: "" },
    ],
    notes: "",
  });

  // -------- utils --------
  const parseLocationAddress = (address = "") => {
    const parts = address
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const [city = "", locState = "", country = ""] = parts;
    return { city, state: locState, country };
  };

  const getWeatherIcon = (description = "") => {
    const d = description.toLowerCase();
    if (d.includes("clear")) return <WiDaySunny size={50} color="#f39c12" />;
    if (d.includes("cloud")) return <WiCloud size={50} color="#95a5a6" />;
    if (d.includes("rain")) return <WiRain size={50} color="#3498db" />;
    if (d.includes("snow")) return <WiSnow size={50} color="#ecf0f1" />;
    if (d.includes("thunderstorm")) return <WiThunderstorm size={50} color="#e74c3c" />;
    return <WiCloud size={50} color="#7f8c8d" />;
  };

  const lineItemTotal = (instance) =>
    (instance.cost_items || []).reduce(
      (sum, item) =>
        sum + (Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1),
      0
    );

  const legacyBucketTotal = (instance) =>
    (Number(instance.stay_expense) || 0) +
    (Number(instance.travel_expense) || 0) +
    (Number(instance.car_expense) || 0) +
    (Number(instance.other_expense) || 0);

  const calculateTotalCost = (instance) =>
    lineItemTotal(instance) || legacyBucketTotal(instance);

  const categoryTotal = (instance, category) => {
    const lineItems = (instance.cost_items || []).filter((item) => item.category === category);
    if (lineItems.length) {
      return lineItems.reduce(
        (sum, item) =>
          sum + (Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1),
        0
      );
    }

    if (category === "lodging") return Number(instance.stay_expense) || 0;
    if (category === "flight") return Number(instance.travel_expense) || 0;
    if (category === "car") return Number(instance.car_expense) || 0;
    if (category === "other") return Number(instance.other_expense) || 0;
    return 0;
  };

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  const authHeaders = useMemo(
    () => (token ? { Authorization: token } : undefined),
    [token]
  );

  const boardStartYmd = toYmdLocal(trip?.board_start || trip?.trip_start);
  const boardEndYmd = toYmdLocal(trip?.board_end || trip?.trip_end);

  const applyTripData = useCallback((nextTrip) => {
    setTrip(nextTrip);
    setNewInstance((prev) => ({
      ...prev,
      trip_start: prev.trip_start || toYmdLocal(nextTrip.board_start || nextTrip.trip_start),
      trip_end: prev.trip_end || toYmdLocal(nextTrip.board_end || nextTrip.trip_end),
    }));
    setTripInstances(Array.isArray(nextTrip.instances) ? nextTrip.instances : []);
  }, []);

  const getPlacePhotoURL = useCallback(async (placeid) => {
    if (!placeid) return "";

    const detailsRes = await fetch(
      `/api/places-details?placeid=${encodeURIComponent(placeid)}`
    );
    if (!detailsRes.ok) return "";

    const details = await detailsRes.json();
    const photoRef = details?.photos?.[0]?.name;
    if (!photoRef) return "";

    const photoRes = await fetch(
      `/api/places-pics?photoreference=${encodeURIComponent(photoRef)}`
    );
    if (!photoRes.ok) return "";

    const photoData = await photoRes.json();
    return photoData?.url || "";
  }, []);

  useEffect(() => {
    if (!showCreateModal) return;
    if (!window.google?.maps?.places?.AutocompleteService) return;

    autocompleteServiceRef.current ||= new window.google.maps.places.AutocompleteService();
    autocompleteSessionRef.current ||= new window.google.maps.places.AutocompleteSessionToken();
  }, [showCreateModal]);

  useEffect(() => {
    if (!showCreateModal) return;
    const query = destinationSearch.trim();

    if (!query || query.length < 2 || !autocompleteServiceRef.current) {
      setPlacePredictions([]);
      setPlacesLoading(false);
      return;
    }

    let canceled = false;
    setPlacesLoading(true);

    const timer = window.setTimeout(() => {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: query,
          types: ["(cities)"],
          componentRestrictions: { country: "us" },
          sessionToken: autocompleteSessionRef.current,
        },
        (predictions, status) => {
          if (canceled) return;
          setPlacesLoading(false);
          if (
            status !== window.google.maps.places.PlacesServiceStatus.OK ||
            !Array.isArray(predictions)
          ) {
            setPlacePredictions([]);
            return;
          }
          setPlacePredictions(predictions.slice(0, 5));
        }
      );
    }, 180);

    return () => {
      canceled = true;
      window.clearTimeout(timer);
    };
  }, [destinationSearch, showCreateModal]);

  const handleSelectPlacePrediction = async (prediction) => {
    const destination = prediction.description || prediction.structured_formatting?.main_text || "";

    setDestinationSearch(destination);
    setPlacePredictions([]);
    setNewInstance((prev) => ({
      ...prev,
      destination,
    }));

    try {
      const imageUrl = await getPlacePhotoURL(prediction.place_id);
      if (imageUrl) {
        setNewInstance((prev) => ({
          ...prev,
          image_url: imageUrl,
        }));
      }
    } catch (error) {
      console.error("Places photo lookup failed:", error);
      setCreateError("Destination saved, but the place photo could not be loaded.");
    } finally {
      autocompleteSessionRef.current = window.google?.maps?.places?.AutocompleteSessionToken
        ? new window.google.maps.places.AutocompleteSessionToken()
        : null;
    }
  };

  // -------- fetchers --------
  const fetchWeatherData = useCallback(async (locationAddress) => {
    setWeatherLoading(true);
    try {
      const { city, state: locState, country } =
        parseLocationAddress(locationAddress);
      const queryParams = new URLSearchParams();
      if (city) queryParams.append("city", city);
      if (locState) queryParams.append("state", locState);
      if (country) queryParams.append("country", country);
      queryParams.append("units", "metric");

      const response = await fetch(`/api/weather?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setWeatherData(data);
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const fetchFunPlaces = useCallback(async (locationAddress) => {
    setFunPlacesLoading(true);
    try {
      const { city, state: locState, country } =
        parseLocationAddress(locationAddress);
      const location = [city, locState, country].filter(Boolean).join(", ");

      const response = await fetch("/api/chatgpt/fun-places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location }),
      });

      if (response.ok) {
        const data = await response.json();
        setFunPlaces(data.funPlaces);
      }
    } catch (error) {
      console.error("Error fetching fun places:", error);
    } finally {
      setFunPlacesLoading(false);
    }
  }, []);

  const fetchTripSuggestions = useCallback(async (locationAddress) => {
    setTripSuggestionsLoading(true);
    try {
      const { city, state: locState, country } =
        parseLocationAddress(locationAddress);
      const location = [city, locState, country].filter(Boolean).join(", ");

      const response = await fetch("/api/chatgpt/trip-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location }),
      });

      if (!response.ok) {
        setTripSuggestions([]);
        return;
      }

      const data = await response.json();
      const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
      setTripSuggestions(suggestions);
    } catch (error) {
      console.error("Error fetching trip suggestions:", error);
      setTripSuggestions([]);
    } finally {
      setTripSuggestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchTripData = async () => {
      if (globalLoading) return;
      if (!token) {
        setFetchError("Your session expired. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        setFetchError("");
        const tripRes = await axios.get(`/api/trips/getaway/${tripId}`, {
          headers: authHeaders,
        });
        applyTripData(tripRes.data);

      if (tripRes.data.location_address) {
          const optionDestination = tripRes.data.instances?.find((inst) => inst.destination)?.destination;
          if (optionDestination) {
            fetchWeatherData(optionDestination);
            fetchFunPlaces(optionDestination);
            fetchTripSuggestions(optionDestination);
          }
        }
      } catch (error) {
        console.error("Error fetching trip data:", error);
        if (error?.response?.status === 401) {
          setFetchError("Your session expired. Please log in again.");
        } else {
          setFetchError("Could not load this trip right now.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId, token, globalLoading, authHeaders, applyTripData, fetchWeatherData, fetchFunPlaces, fetchTripSuggestions]);

  // -------- actions --------
  const handleDeleteInstance = async (instanceId) => {
    if (!instanceId) return;
    const ok = window.confirm("Delete this instance? This cannot be undone.");
    if (!ok) return;

    try {
      // optimistic UI
      setTripInstances((prev) =>
        prev.filter((i) => (i._id || "").toString() !== instanceId.toString())
      );

      await axios.delete(`/api/trips/getaway/${tripId}/instances/${instanceId}`, {
        headers: authHeaders,
      });
    } catch (err) {
      console.error("Error deleting instance:", err?.response?.data || err.message);
      setTripInstances((prev) => [...prev]); // optional revert
      alert("Failed to delete instance. Try again.");
    }
  };

  const handleCreateInstance = async () => {
    setCreateError("");
    setCreatingOption(true);
    try {
      const payload = {
        // Keep local calendar dates exactly as chosen (yyyy-MM-dd; no UTC conversion)
        trip_start: newInstance.trip_start || null,
        trip_end: newInstance.trip_end || null,
        option_title: newInstance.option_title,
        destination: newInstance.destination,
        image_url: newInstance.image_url,
        status: newInstance.status,
        stay_expense: Number(newInstance.stay_expense || 0),
        travel_expense: Number(newInstance.travel_expense || 0),
        car_expense: Number(newInstance.car_expense || 0),
        other_expense: Number(newInstance.other_expense || 0),
        cost_items: (newInstance.cost_items || []).filter(
          (item) => item.name || item.url || Number(item.price) > 0
        ),
        notes: newInstance.notes,
      };

      const { data: refreshedTrip } = await axios.post(
        `/api/trips/getaway/${tripId}/instances`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            ...(authHeaders || {}),
          },
        }
      );
      applyTripData(refreshedTrip);

      setShowCreateModal(false);
      setNewInstance(buildEmptyInstance(refreshedTrip));
    } catch (err) {
      const message = err?.response?.data?.msg || err.message || "Failed to save option.";
      setCreateError(message);
      console.error("Error creating trip instance:", {
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
        method: err.config?.method,
        payload: err.config?.data,
      });
    } finally {
      setCreatingOption(false);
    }
  };

  const rankedInstances = useMemo(() => {
    const rank = { top_choice: 0, booked: 1, considering: 2, eliminated: 3 };
    return [...tripInstances].sort((a, b) => {
      const statusDiff = (rank[a.status] ?? 2) - (rank[b.status] ?? 2);
      if (statusDiff !== 0) return statusDiff;
      return calculateTotalCost(a) - calculateTotalCost(b);
    });
  }, [tripInstances]);

  const visibleInstances = useMemo(() => {
    if (statusFilter === "all") return rankedInstances;
    return rankedInstances.filter((instance) => (instance.status || "considering") === statusFilter);
  }, [rankedInstances, statusFilter]);

  const boardStats = useMemo(() => {
    const totals = rankedInstances.map((instance) => calculateTotalCost(instance)).filter((total) => total > 0);
    const cheapest = totals.length ? Math.min(...totals) : 0;
    const highest = totals.length ? Math.max(...totals) : 0;
    const travelers = Math.max(1, Number(trip?.travelers) || 1);

    return {
      cheapest,
      highest,
      perPerson: cheapest ? cheapest / travelers : 0,
    };
  }, [rankedInstances, trip?.travelers]);

  const handleCommitInstance = async (instanceId) => {
    if (!instanceId || committingId) return;

    setCommittingId(instanceId);

    try {
      const { data } = await axios.patch(
        `/api/trips/getaway/${tripId}/instances/${instanceId}/commit`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            ...(authHeaders || {}),
          },
        }
      );

      setTrip(data.trip);
      setTripInstances(data.trip.instances || []);
    } catch (err) {
      console.error("Error committing instance:", err);
      alert(err.response?.data?.msg || "Failed to commit instance. Try again.");
    } finally {
      setCommittingId(null);
    }
  };

  // -------- UI --------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></div>
          <p className="text-slate-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {fetchError || "Trip not found"}
          </h2>
          <Link
            to={fetchError ? "/login" : "/explore"}
            className="text-teal-700 hover:text-teal-800"
          >
            {fetchError ? "Go to Login" : "Return to Explore"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-3 pb-12 pt-4 sm:px-5">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            to="/explore"
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Explore
          </Link>

          <div className="gg-glass overflow-hidden rounded-3xl border border-white/70 p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
                  Planning Board
                </p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
                  {trip.board_title || trip.location_address || "Untitled Board"}
                </h1>
                <p className="mt-2 text-slate-600">
                  {fmtRangeShort(trip.board_start || trip.trip_start, trip.board_end || trip.trip_end) || "Dates not set"}
                  {trip.travelers ? ` · ${trip.travelers} traveler${trip.travelers === 1 ? "" : "s"}` : ""}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                  <p className="text-slate-500">Options</p>
                  <p className="text-xl font-bold text-slate-900">{tripInstances.length}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                  <p className="text-slate-500">Top choice</p>
                  <p className="truncate text-xl font-bold text-slate-900">
                    {tripInstances.find((inst) => inst.status === "top_choice")?.destination || "None"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                  <p className="text-slate-500">Chosen</p>
                  <p className="text-xl font-bold text-slate-900">
                    {trip.committedInstanceId ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>

            {(weatherData || funPlaces || weatherLoading || funPlacesLoading) && (
              <div className="mt-6 grid md:grid-cols-2 gap-8 border-t border-slate-200 pt-6">
                <div>
                  <h3 className="mb-4 text-xl font-semibold text-slate-800">
                    Current Weather
                  </h3>
                  {weatherLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
                      <span className="text-slate-600">Loading weather...</span>
                    </div>
                  ) : weatherData ? (
                    <div className="flex items-center gap-4">
                      {getWeatherIcon(weatherData.weather?.[0]?.description)}
                      <div>
                        <p className="text-lg font-medium text-slate-800">
                          {(weatherData.weather?.[0]?.description || "")
                            .split(" ")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ")}
                        </p>
                        <p className="text-2xl font-bold text-slate-700">
                          {Number(weatherData.main?.temp || 0).toFixed(1)}°C
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-600">Weather data unavailable</p>
                  )}
                </div>

                <div>
                  <h3 className="mb-4 text-xl font-semibold text-slate-800">
                    Suggestions
                  </h3>
                  {funPlacesLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
                      <span className="text-slate-600">Loading suggestions...</span>
                    </div>
                  ) : funPlaces ? (
                    <div className="text-slate-700 space-y-1">
                      {funPlaces
                        .split("\n")
                        .slice(0, 5)
                        .map((place, index) => (
                          <p key={index} className="text-sm">
                            {place}
                          </p>
                        ))}
                    </div>
                  ) : (
                    <p className="text-slate-600">Suggestions unavailable</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="gg-glass rounded-3xl border border-white/70 p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                Comparison Board
              </p>
              <h2 className="text-2xl font-bold text-slate-800">Trip Options</h2>
              <p className="mt-1 text-sm text-slate-600">
                Compare places, links, dates, and totals before choosing what to book.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    viewMode === "cards"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("compare")}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    viewMode === "compare"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Table2 className="h-4 w-4" />
                  Compare
                </button>
              </div>
              <button
                onClick={() => {
                  setCreateError("");
                  const nextInstance = {
                    ...buildEmptyInstance(trip),
                  };
                  setNewInstance(nextInstance);
                  setDestinationSearch(nextInstance.destination);
                  setPlacePredictions([]);
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-4 py-2 text-white transition hover:brightness-105"
                type="button"
              >
                <Plus className="h-4 w-4" />
                Add Option
              </button>
            </div>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Lowest total</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {boardStats.cheapest ? formatMoney(boardStats.cheapest) : "Add prices"}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Lowest per person</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {boardStats.perPerson ? formatMoney(boardStats.perPerson) : "Add travelers"}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Price spread</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {boardStats.highest && boardStats.cheapest
                  ? formatMoney(boardStats.highest - boardStats.cheapest)
                  : "Need 2 totals"}
              </p>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["considering", "Considering"],
              ["top_choice", "Top Choice"],
              ["eliminated", "Eliminated"],
              ["booked", "Booked"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition ${
                  statusFilter === value
                    ? "bg-slate-900 text-white ring-slate-900"
                    : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {viewMode === "cards" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleInstances.map((instance, index) => (
              <div
                key={instance._id || index}
                className={`gg-card relative rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${
                  instance.status === "eliminated" ? "opacity-70" : ""
                }`}
              >
                {instance.image_url && (
                  <div className="-mx-4 -mt-4 mb-4 h-36 overflow-hidden rounded-t-2xl bg-slate-100">
                    <img
                      src={instance.image_url}
                      alt={instance.destination || "Destination"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <button
                  onClick={() => handleDeleteInstance(instance._id || index)}
                  className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Delete option"
                  title="Delete option"
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="pr-8">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                      statusStyles[instance.status || "considering"]
                    }`}
                  >
                    {statusLabels[instance.status || "considering"]}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-slate-900">
                    {instance.destination || instance.option_title || `Option ${index + 1}`}
                  </h3>
                  {instance.option_title && instance.destination && (
                    <p className="mt-1 text-sm text-slate-500">{instance.option_title}</p>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600">
                    {fmtRangeShort(instance.trip_start, instance.trip_end)}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span className="text-lg font-semibold text-slate-800">
                    {formatMoney(calculateTotalCost(instance))}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {(instance.cost_items || []).slice(0, 3).map((item, itemIndex) => (
                    <div
                      key={item._id || `${item.name}-${itemIndex}`}
                      className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">
                          {item.name || itemCategories.find((c) => c.value === item.category)?.label || "Item"}
                        </p>
                        {(item.start_date || item.end_date) && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {fmtRangeShort(item.start_date, item.end_date)}
                          </p>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 inline-flex max-w-full items-center gap-1 text-xs text-teal-700 hover:text-teal-800"
                          >
                            <LinkIcon className="h-3 w-3 shrink-0" />
                            <span className="truncate">Open link</span>
                          </a>
                        )}
                      </div>
                      <span className="shrink-0 font-semibold text-slate-700">
                        {formatMoney((Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1))}
                      </span>
                    </div>
                  ))}
                  {(instance.cost_items || []).length > 3 && (
                    <p className="text-xs text-slate-500">
                      +{instance.cost_items.length - 3} more saved item
                      {instance.cost_items.length - 3 === 1 ? "" : "s"}
                    </p>
                  )}
                  {!(instance.cost_items || []).length && (
                    <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700 ring-1 ring-amber-100">
                      Add links and prices to compare this option.
                    </p>
                  )}
                </div>

                {instance.notes && (
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">{instance.notes}</p>
                )}

                <Link
                  to={`/trips/${tripId}/instances/${instance._id || index}`}
                  state={{ trip, instance }}
                  className="mt-4 block w-full rounded-xl border border-slate-200 bg-white py-2 text-center text-slate-700 transition hover:bg-slate-50"
                >
                  View / Edit
                </Link>

                <button
                  onClick={() => handleCommitInstance(instance._id)}
                  disabled={committingId === instance._id || instance.isCommitted}
                  className={`block w-full text-center py-2 rounded-lg transition-colors ${
                    instance.isCommitted
                      ? "bg-green-100 text-green-700 ring-1 ring-green-300 cursor-default"
                      : "bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:brightness-105"
                  } ${committingId === instance._id ? "opacity-50 cursor-wait" : ""}`}
                  type="button"
                >
                  {committingId === instance._id
                    ? "Saving..."
                    : instance.isCommitted
                    ? "Chosen"
                    : "Choose This Option"}
                </button>
              </div>
            ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-[960px] w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Destination</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Dates</th>
                      <th className="px-4 py-3 text-right font-semibold">Lodging</th>
                      <th className="px-4 py-3 text-right font-semibold">Flight</th>
                      <th className="px-4 py-3 text-right font-semibold">Car</th>
                      <th className="px-4 py-3 text-right font-semibold">Tickets</th>
                      <th className="px-4 py-3 text-right font-semibold">Other</th>
                      <th className="px-4 py-3 text-right font-semibold">Total</th>
                      <th className="px-4 py-3 text-right font-semibold">Per Person</th>
                      <th className="px-4 py-3 font-semibold">Links</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleInstances.map((instance, index) => {
                      const total = calculateTotalCost(instance);
                      const travelers = Math.max(1, Number(trip?.travelers) || 1);
                      const links = (instance.cost_items || []).filter((item) => item.url);

                      return (
                        <tr
                          key={instance._id || index}
                          className={instance.status === "eliminated" ? "bg-slate-50/70 text-slate-500" : ""}
                        >
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">
                              {instance.destination || instance.option_title || `Option ${index + 1}`}
                            </p>
                            {instance.option_title && instance.destination && (
                              <p className="mt-0.5 text-xs text-slate-500">{instance.option_title}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                                statusStyles[instance.status || "considering"]
                              }`}
                            >
                              {statusLabels[instance.status || "considering"]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {fmtRangeShort(instance.trip_start, instance.trip_end) || "Not set"}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{formatMoney(categoryTotal(instance, "lodging"))}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatMoney(categoryTotal(instance, "flight"))}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatMoney(categoryTotal(instance, "car"))}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatMoney(categoryTotal(instance, "tickets"))}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatMoney(categoryTotal(instance, "food") + categoryTotal(instance, "other"))}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">{formatMoney(total)}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatMoney(total / travelers)}</td>
                          <td className="px-4 py-3">
                            {links.length ? (
                              <div className="flex flex-wrap gap-1.5">
                                {links.slice(0, 3).map((item, itemIndex) => (
                                  <a
                                    key={item._id || `${item.url}-${itemIndex}`}
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100 hover:bg-teal-100"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    {item.name || itemCategories.find((cat) => cat.value === item.category)?.label || "Link"}
                                  </a>
                                ))}
                                {links.length > 3 && (
                                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                                    +{links.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">No links</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/trips/${tripId}/instances/${instance._id || index}`}
                                state={{ trip, instance }}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Edit
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleCommitInstance(instance._id)}
                                disabled={committingId === instance._id || instance.isCommitted}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                  instance.isCommitted
                                    ? "bg-green-100 text-green-700 ring-1 ring-green-300"
                                    : "bg-slate-900 text-white hover:bg-slate-800"
                                } ${committingId === instance._id ? "opacity-50" : ""}`}
                              >
                                {instance.isCommitted ? "Chosen" : "Choose"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!visibleInstances.length && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
              <p className="font-semibold text-slate-900">
                {rankedInstances.length ? "No options match this filter" : "No options yet"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {rankedInstances.length
                  ? "Switch filters to see the rest of your options."
                  : "Add the first hotel, Airbnb, flight, or full destination option to start comparing."}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 gg-glass rounded-3xl border border-white/70 p-6">
          <h2 className="text-2xl font-bold text-slate-800">Best Time Windows (AI)</h2>
          <p className="mt-1 text-sm text-slate-600">
            Seasonal timing suggestions based on cost, experience, and crowd levels.
          </p>

          {tripSuggestionsLoading ? (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="gg-skeleton h-36" />
              ))}
            </div>
          ) : tripSuggestions.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {tripSuggestions.map((item, idx) => (
                <article key={`${item.season}-${idx}`} className="gg-card rounded-2xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                    {item.season}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{item.monthIntervals}</p>
                  <p className="mt-2 text-sm text-slate-700">{item.reason}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.description}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              AI suggestions are unavailable right now.
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="gg-glass max-h-[85vh] w-full max-w-3xl -translate-y-2 overflow-y-auto rounded-xl border border-white/70 shadow-xl transition-transform duration-200 ease-out sm:-translate-y-4 md:-translate-y-8 md:rounded-2xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Add Trip Option
              </h3>

              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Destination
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        value={destinationSearch}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDestinationSearch(value);
                          setNewInstance((prev) => ({
                            ...prev,
                            destination: value,
                            image_url: value === prev.destination ? prev.image_url : "",
                          }));
                        }}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                        placeholder="Search or type a destination"
                        autoComplete="off"
                      />

                      {(placePredictions.length > 0 || placesLoading) && (
                        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[95] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                          {placesLoading && (
                            <div className="px-4 py-3 text-sm text-slate-500">
                              Searching destinations...
                            </div>
                          )}
                          {!placesLoading &&
                            placePredictions.map((prediction) => (
                              <button
                                key={prediction.place_id}
                                type="button"
                                onClick={() => handleSelectPlacePrediction(prediction)}
                                className="block w-full px-4 py-3 text-left transition hover:bg-teal-50 focus:bg-teal-50 focus:outline-none"
                              >
                                <span className="block text-sm font-semibold text-slate-900">
                                  {prediction.structured_formatting?.main_text || prediction.description}
                                </span>
                                {prediction.structured_formatting?.secondary_text && (
                                  <span className="mt-0.5 block text-xs text-slate-500">
                                    {prediction.structured_formatting.secondary_text}
                                  </span>
                                )}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Pick a Google result for a cleaner name and photo, or keep your typed destination.
                    </p>
                    {newInstance.image_url && (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        <img
                          src={newInstance.image_url}
                          alt={newInstance.destination || "Selected destination"}
                          className="h-36 w-full object-cover"
                        />
                      </div>
                    )}
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Option name
                    </span>
                    <input
                      type="text"
                      value={newInstance.option_title}
                      onChange={(e) =>
                        setNewInstance((prev) => ({ ...prev, option_title: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      placeholder="Downtown plan, beach option, family pick..."
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-700">
                      Status
                    </span>
                    <select
                      value={newInstance.status}
                      onChange={(e) =>
                        setNewInstance((prev) => ({ ...prev, status: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {boardStartYmd && boardEndYmd && (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    This option will use the board dates:{" "}
                    <span className="font-semibold text-slate-900">
                      {fmtRangeShort(boardStartYmd, boardEndYmd)}
                    </span>
                  </div>
                )}

                <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  After saving this option, open it to add hotels, Airbnbs, flights, tickets, rental cars, links, prices, and the exact dates for each item.
                </div>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">
                    Notes
                  </span>
                  <textarea
                    value={newInstance.notes}
                    onChange={(e) =>
                      setNewInstance((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    placeholder="Why this option is good, tradeoffs, cancellation notes, parking, fees..."
                  />
                </label>

                {createError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {createError}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError("");
                    const nextInstance = buildEmptyInstance(trip);
                    setNewInstance(nextInstance);
                    setDestinationSearch(nextInstance.destination);
                    setPlacePredictions([]);
                  }}
                  className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateInstance}
                  disabled={
                    creatingOption ||
                    !newInstance.destination ||
                    !newInstance.trip_start ||
                    !newInstance.trip_end
                  }
                  className="flex-1 rounded-lg bg-gradient-to-r from-teal-600 to-blue-600 py-2 text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingOption ? "Saving..." : "Save Option"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TripOverview;
