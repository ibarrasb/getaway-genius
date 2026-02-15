// src/pages/trips/TripOverview.jsx
import { useState, useEffect, useCallback, useContext, useMemo } from "react";
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
} from "lucide-react";
import { GlobalState } from "../../context/GlobalState";
import TripDateRange from "@/components/TripDateRange"; // shared component
import { fmtRangeShort } from "../utils/localDates"; // ✅ local date utils (no TZ shift)

const TripOverview = () => {
  const state = useContext(GlobalState);
  const token = state.token[0];
  const globalLoading = state.loading?.[0] ?? false;
  const { tripId } = useParams();

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
  const [newInstance, setNewInstance] = useState({
    trip_start: "",
    trip_end: "",
    stay_expense: 0,
    travel_expense: 0,
    car_expense: 0,
    other_expense: 0,
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

  const calculateTotalCost = (instance) =>
    (Number(instance.stay_expense) || 0) +
    (Number(instance.travel_expense) || 0) +
    (Number(instance.car_expense) || 0) +
    (Number(instance.other_expense) || 0);

  const authHeaders = useMemo(
    () => (token ? { Authorization: token } : undefined),
    [token]
  );

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
        setTrip(tripRes.data);

        const instances =
          tripRes.data.instances && tripRes.data.instances.length > 0
            ? tripRes.data.instances
            : [];
        setTripInstances(instances);

        if (tripRes.data.location_address) {
          fetchWeatherData(tripRes.data.location_address);
          fetchFunPlaces(tripRes.data.location_address);
          fetchTripSuggestions(tripRes.data.location_address);
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
  }, [tripId, token, globalLoading, authHeaders, fetchWeatherData, fetchFunPlaces, fetchTripSuggestions]);

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
    try {
      const payload = {
        // Keep local calendar dates exactly as chosen (yyyy-MM-dd; no UTC conversion)
        trip_start: newInstance.trip_start || null,
        trip_end: newInstance.trip_end || null,
        stay_expense: Number(newInstance.stay_expense || 0),
        travel_expense: Number(newInstance.travel_expense || 0),
        car_expense: Number(newInstance.car_expense || 0),
        other_expense: Number(newInstance.other_expense || 0),
      };

      const { data: createdInstance } = await axios.post(
        `/api/trips/getaway/${tripId}/instances`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            ...(authHeaders || {}),
          },
        }
      );

      setTripInstances((prev) => [createdInstance, ...prev]);

      setShowCreateModal(false);
      setNewInstance({
        trip_start: "",
        trip_end: "",
        stay_expense: 0,
        travel_expense: 0,
        car_expense: 0,
        other_expense: 0,
      });
    } catch (err) {
      console.error("Error creating trip instance:", {
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
        method: err.config?.method,
        payload: err.config?.data,
      });
    }
  };

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

          <div className="gg-glass overflow-hidden rounded-3xl border border-white/70">
            <div className="relative h-64 md:h-80">
              <img
                src={trip.image_url}
                alt={trip.location_address}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {trip.location_address}
                </h1>
              </div>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
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
            </div>
          </div>
        </div>

        <div className="gg-glass rounded-3xl border border-white/70 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Trip Instances</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-4 py-2 text-white transition hover:brightness-105"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Create New Instance
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tripInstances.map((instance, index) => (
              <div
                key={instance._id || index}
                className="gg-card relative rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {/* top-right delete button */}
                <button
                  onClick={() => handleDeleteInstance(instance._id || index)}
                  className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Delete instance"
                  title="Delete instance"
                  type="button"
                >
                  ✕
                </button>

                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600">
                    {fmtRangeShort(instance.trip_start, instance.trip_end)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span className="text-lg font-semibold text-slate-800">
                    ${calculateTotalCost(instance).toFixed(2)}
                  </span>
                </div>

                <Link
                  to={`/trips/${tripId}/instances/${instance._id || index}`}
                  state={{ trip, instance }}
                  className="mb-2 block w-full rounded-xl border border-slate-200 bg-white py-2 text-center text-slate-700 transition hover:bg-slate-50"
                >
                  View Details
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
                    ? "Committing..."
                    : instance.isCommitted
                    ? "Committed ✓"
                    : "Commit Trip"}
                </button>
              </div>
            ))}
          </div>
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
          <div className="gg-glass max-h-[85vh] w-full max-w-sm -translate-y-2 overflow-y-auto rounded-xl border border-white/70 shadow-xl transition-transform duration-200 ease-out sm:max-w-md sm:-translate-y-4 md:max-w-lg md:-translate-y-8 md:rounded-2xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Create New Trip Instance
              </h3>

              <div className="space-y-4">
                {/* Date range (shared component) */}
                <TripDateRange
                  newInstance={newInstance}
                  setNewInstance={setNewInstance}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateInstance}
                  disabled={!newInstance.trip_start || !newInstance.trip_end}
                  className="flex-1 rounded-lg bg-gradient-to-r from-teal-600 to-blue-600 py-2 text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Create
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
