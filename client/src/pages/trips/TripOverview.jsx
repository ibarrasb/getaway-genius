import { useState, useEffect, useCallback, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { parse } from "date-fns";
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

const TripOverview = () => {
  const state = useContext(GlobalState);
  const token = state.token[0];
  const { tripId } = useParams();

  const [trip, setTrip] = useState(null);
  const [tripInstances, setTripInstances] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [funPlaces, setFunPlaces] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [funPlacesLoading, setFunPlacesLoading] = useState(false);
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

  // Displays both legacy ISO strings and new yyyy-MM-dd strings correctly (no TZ shift)
  const formatDate = (dateInput) => {
    if (!dateInput) return "Not set";
  
    // If it's a string, grab the leading YYYY-MM-DD (works for both 'yyyy-MM-dd'
    // and ISO like 'yyyy-MM-ddTHH:mm:ssZ'). This avoids timezone shifts.
    if (typeof dateInput === "string") {
      const match = dateInput.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) {
        const asLocal = parse(match[1], "yyyy-MM-dd", new Date());
        return asLocal.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    }
  
    // Fallback for Date objects or other formats.
    const d = new Date(dateInput);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

  useEffect(() => {
    const fetchTripData = async () => {
      try {
        const tripRes = await axios.get(`/api/trips/getaway/${tripId}`);
        setTrip(tripRes.data);

        const instances =
          tripRes.data.instances && tripRes.data.instances.length > 0
            ? tripRes.data.instances
            : [];
        setTripInstances(instances);

        if (tripRes.data.location_address) {
          fetchWeatherData(tripRes.data.location_address);
          fetchFunPlaces(tripRes.data.location_address);
        }
      } catch (error) {
        console.error("Error fetching trip data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [tripId, fetchWeatherData, fetchFunPlaces]);

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

      await axios.delete(`/api/trips/getaway/${tripId}/instances/${instanceId}`);
    } catch (err) {
      console.error("Error deleting instance:", err?.response?.data || err.message);
      setTripInstances((prev) => [...prev]); // optional revert
      alert("Failed to delete instance. Try again.");
    }
  };

  const handleCreateInstance = async () => {
    try {
      const payload = {
        // Keep local calendar dates exactly as chosen (no UTC conversion)
        trip_start: newInstance.trip_start || null, // 'yyyy-MM-dd'
        trip_end: newInstance.trip_end || null,     // 'yyyy-MM-dd'
        stay_expense: Number(newInstance.stay_expense || 0),
        travel_expense: Number(newInstance.travel_expense || 0),
        car_expense: Number(newInstance.car_expense || 0),
        other_expense: Number(newInstance.other_expense || 0),
      };

      const { data: createdInstance } = await axios.post(
        `/api/trips/getaway/${tripId}/instances`,
        payload,
        { headers: { "Content-Type": "application/json" } }
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
            ...(token ? { Authorization: token } : {}),
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
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Trip not found</h2>
          <Link to="/explore" className="text-indigo-600 hover:text-indigo-700">
            Return to Explore
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Explore
          </Link>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
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
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">
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
                            .map(
                              (w) => w.charAt(0).toUpperCase() + w.slice(1)
                            )
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
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">
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

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Trip Instances</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
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
                className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow relative"
              >
                {/* top-right delete button */}
                <button
                  onClick={() => handleDeleteInstance(instance._id || index)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-red-600"
                  aria-label="Delete instance"
                  title="Delete instance"
                  type="button"
                >
                  ✕
                </button>

                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600">
                    {formatDate(instance.trip_start + 1)} - {formatDate(instance.trip_end + 1)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-semibold text-slate-800">
                    ${calculateTotalCost(instance).toFixed(2)}
                  </span>
                </div>

                <Link
                  to={`/trips/${tripId}/instances/${instance._id || index}`}
                  state={{ trip, instance }}
                  className="block w-full text-center bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 transition-colors mb-2"
                >
                  View Details
                </Link>

                <button
                  onClick={() => handleCommitInstance(instance._id)}
                  disabled={committingId === instance._id || instance.isCommitted}
                  className={`block w-full text-center py-2 rounded-lg transition-colors ${
                    instance.isCommitted
                      ? "bg-green-100 text-green-700 ring-1 ring-green-300 cursor-default"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
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
      </div>

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="
              bg-white rounded-xl md:rounded-2xl shadow-xl ring-1 ring-black/5
              w-full max-w-sm sm:max-w-md md:max-w-lg
              transform transition-transform duration-200 ease-out
              -translate-y-2 sm:-translate-y-4 md:-translate-y-8
              max-h-[85vh] overflow-y-auto
            "
          >
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
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
