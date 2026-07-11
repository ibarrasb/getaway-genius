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
import { useToast } from "@/context/ToastContext.jsx";
import { useConfirm } from "@/context/useConfirm";
import AppSelect from "@/components/ui/AppSelect";
import TripDateRange from "@/components/TripDateRange"; // shared component
import SkeletonBlock, { TripBoardSkeleton } from "@/components/skeletons/AppSkeletons.jsx";
import { fmtRangeShort, toYmdLocal } from "../utils/localDates"; // ✅ local date utils (no TZ shift)

const TripOverview = () => {
  const state = useContext(GlobalState);
  const { error: showError } = useToast();
  const { confirm } = useConfirm();
  const token = state.token[0];
  const globalLoading = state.loading?.[0] ?? false;
  const { tripId } = useParams();
  const autocompleteSessionRef = useRef(null);

  const [trip, setTrip] = useState(null);
  const [tripInstances, setTripInstances] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [funPlaces, setFunPlaces] = useState(null);
  const [tripSuggestions, setTripSuggestions] = useState([]);
  const [tripSuggestionsWarning, setTripSuggestionsWarning] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [funPlacesLoading, setFunPlacesLoading] = useState(false);
  const [tripSuggestionsLoading, setTripSuggestionsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectionLoadingId, setSelectionLoadingId] = useState(null);
  const [viewMode, setViewMode] = useState("cards");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createError, setCreateError] = useState("");
  const [creatingOption, setCreatingOption] = useState(false);
  const [destinationSearch, setDestinationSearch] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [placePredictions, setPlacePredictions] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [destinationImageLoading, setDestinationImageLoading] = useState(false);
  const [newInstance, setNewInstance] = useState({
    option_title: "",
    destination: "",
    image_url: "",
    image_provider: "",
    image_attribution: {},
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
    image_provider: "",
    image_attribution: {},
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
        sum +
        (item.is_selected === false
          ? 0
          : (Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1)),
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
          sum +
          (item.is_selected === false
            ? 0
            : (Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1)),
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

  const getDestinationImage = useCallback(async ({ placeid, location }) => {
    if (!location) return null;

    const queryParams = new URLSearchParams({ location });
    if (placeid) queryParams.append("placeid", placeid);

    const response = await fetch(`/api/destination-image?${queryParams.toString()}`, {
      headers: authHeaders,
    });
    if (!response.ok) return null;

    return response.json();
  }, [authHeaders]);

  useEffect(() => {
    if (!showCreateModal) return;
    if (!window.google?.maps?.places?.AutocompleteSessionToken) return;

    autocompleteSessionRef.current ||= new window.google.maps.places.AutocompleteSessionToken();
  }, [showCreateModal]);

  const normalizeAutocompleteSuggestion = (suggestion) => {
    const prediction = suggestion?.placePrediction || suggestion;
    if (!prediction) return null;

    const mainText =
      prediction.mainText?.text ||
      prediction.structured_formatting?.main_text ||
      prediction.text?.text ||
      prediction.description ||
      "";
    const secondaryText =
      prediction.secondaryText?.text ||
      prediction.structured_formatting?.secondary_text ||
      "";
    const description =
      prediction.text?.text ||
      prediction.description ||
      [mainText, secondaryText].filter(Boolean).join(", ");
    const placeId = prediction.placeId || prediction.place_id || "";

    if (!description || !placeId) return null;

    return {
      place_id: placeId,
      description,
      structured_formatting: {
        main_text: mainText || description,
        secondary_text: secondaryText,
      },
      placePrediction: prediction,
    };
  };

  const fetchPlacePredictions = useCallback((query, onComplete) => {
    const places = window.google?.maps?.places;
    if (!places) {
      onComplete([]);
      return;
    }

    if (places.AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
      places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query,
        includedPrimaryTypes: [
          'locality',
          'administrative_area_level_1',
          'administrative_area_level_2',
          'country',
        ],
        sessionToken: autocompleteSessionRef.current,
      })
        .then(({ suggestions = [] } = {}) => {
          onComplete(
            suggestions
              .map(normalizeAutocompleteSuggestion)
              .filter(Boolean)
              .slice(0, 5)
          );
        })
        .catch((error) => {
          console.error("Autocomplete suggestion lookup failed:", error);
          onComplete([]);
        });
      return;
    }

    if (!places.AutocompleteService) {
      onComplete([]);
      return;
    }

    const legacyService = new places.AutocompleteService();
    legacyService.getPlacePredictions(
      {
        input: query,
        types: ["(regions)"],
        sessionToken: autocompleteSessionRef.current,
      },
      (predictions, status) => {
        if (
          status !== places.PlacesServiceStatus.OK ||
          !Array.isArray(predictions)
        ) {
          onComplete([]);
          return;
        }
        onComplete(predictions.slice(0, 5));
      }
    );
  }, []);

  useEffect(() => {
    if (!showCreateModal) return;
    const query = destinationSearch.trim();

    if (query && query === selectedDestination) {
      setPlacePredictions([]);
      setPlacesLoading(false);
      return;
    }

    if (!query || query.length < 2) {
      setPlacePredictions([]);
      setPlacesLoading(false);
      return;
    }

    let canceled = false;
    setPlacesLoading(true);

    const timer = window.setTimeout(() => {
      fetchPlacePredictions(query, (predictions) => {
        if (canceled) return;
        setPlacesLoading(false);
        setPlacePredictions(predictions);
      });
    }, 180);

    return () => {
      canceled = true;
      window.clearTimeout(timer);
    };
  }, [destinationSearch, selectedDestination, showCreateModal, fetchPlacePredictions]);

  const handleSelectPlacePrediction = async (prediction) => {
    const destination = prediction.description || prediction.structured_formatting?.main_text || "";

    setDestinationSearch(destination);
    setSelectedDestination(destination);
    setPlacePredictions([]);
    setPlacesLoading(false);
    setNewInstance((prev) => ({
      ...prev,
      destination,
      image_url: "",
      image_provider: "",
      image_attribution: {},
    }));

    try {
      setDestinationImageLoading(true);
      const image = await getDestinationImage({
        placeid: prediction.place_id,
        location: destination,
      });
      if (image?.url) {
        setNewInstance((prev) => ({
          ...prev,
          image_url: image.url,
          image_provider: image.provider || "",
          image_attribution: image.attribution || {},
        }));
      }
    } catch (error) {
      console.error("Destination image lookup failed:", error);
      setCreateError("Destination saved, but the place photo could not be loaded.");
    } finally {
      setDestinationImageLoading(false);
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

      const response = await fetch(`/api/weather?${queryParams.toString()}`, {
        headers: authHeaders,
      });
      if (response.ok) {
        const data = await response.json();
        setWeatherData(data);
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
    } finally {
      setWeatherLoading(false);
    }
  }, [authHeaders]);

  const fetchFunPlaces = useCallback(async (locationAddress) => {
    setFunPlacesLoading(true);
    try {
      const { city, state: locState, country } =
        parseLocationAddress(locationAddress);
      const location = [city, locState, country].filter(Boolean).join(", ");

      const response = await fetch("/api/chatgpt/fun-places", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeaders || {}) },
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
  }, [authHeaders]);

  const fetchTripSuggestions = useCallback(async (locationAddress, sourceTrip = {}, sourceInstances = []) => {
    setTripSuggestionsLoading(true);
    setTripSuggestionsWarning("");
    try {
      const { city, state: locState, country } =
        parseLocationAddress(locationAddress);
      const location = [city, locState, country].filter(Boolean).join(", ");
      const optionTotal = (instance = {}) => {
        const lineItems = (instance.cost_items || []).reduce(
          (sum, item) =>
            sum +
            (item?.is_selected === false
              ? 0
              : (Number(item?.price) || 0) * Math.max(1, Number(item?.quantity) || 1)),
          0
        );
        return (
          lineItems ||
          (Number(instance.stay_expense) || 0) +
            (Number(instance.travel_expense) || 0) +
            (Number(instance.car_expense) || 0) +
            (Number(instance.other_expense) || 0)
        );
      };
      const optionSummaries = (sourceInstances || []).slice(0, 6).map((instance) => ({
        title: instance.option_title || "",
        destination: instance.destination || "",
        status: instance.status || "",
        total: optionTotal(instance),
      }));

      const response = await fetch("/api/chatgpt/trip-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeaders || {}) },
        body: JSON.stringify({
          location,
          board: {
            start: toYmdLocal(sourceTrip?.board_start || sourceTrip?.trip_start),
            end: toYmdLocal(sourceTrip?.board_end || sourceTrip?.trip_end),
            travelers: sourceTrip?.travelers || 1,
          },
          options: optionSummaries,
        }),
      });

      if (!response.ok) {
        setTripSuggestions([]);
        const errorPayload = await response.json().catch(() => ({}));
        setTripSuggestionsWarning(errorPayload?.warning || "Trip Intel is unavailable right now.");
        return;
      }

      const data = await response.json();
      setTripSuggestionsWarning(data?.warning || "");
      const suggestions = Array.isArray(data?.cards)
        ? data.cards
        : Array.isArray(data?.suggestions)
          ? data.suggestions.map((item) => ({
              type: "timing",
              title: item.season || "Best Time To Go",
              summary: item.monthIntervals || "",
              details: item.reason || "",
              recommendation: item.description || "",
            }))
          : [];
      setTripSuggestions(suggestions);
    } catch (error) {
      console.error("Error fetching trip suggestions:", error);
      setTripSuggestions([]);
      setTripSuggestionsWarning("Trip Intel is unavailable right now.");
    } finally {
      setTripSuggestionsLoading(false);
    }
  }, [authHeaders]);

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
        const tripRes = await axios.get(`/api/trips/boards/${tripId}`, {
          headers: authHeaders,
        });
        applyTripData(tripRes.data);

      if (tripRes.data.location_address) {
          const instances = tripRes.data.instances || [];
          const optionDestination =
            instances.find((inst) => inst.status === "top_choice" && inst.destination)?.destination ||
            instances.find((inst) => inst.isCommitted && inst.destination)?.destination ||
            instances.find((inst) => inst.destination)?.destination;
          if (optionDestination) {
            fetchWeatherData(optionDestination);
            fetchFunPlaces(optionDestination);
            fetchTripSuggestions(optionDestination, tripRes.data, instances);
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
    const ok = await confirm({
      title: "Delete this option?",
      description: "This removes the option and all saved items inside it. This cannot be undone.",
      confirmLabel: "Delete Option",
    });
    if (!ok) return;

    try {
      // optimistic UI
      setTripInstances((prev) =>
        prev.filter((i) => (i._id || "").toString() !== instanceId.toString())
      );

      const { data } = await axios.delete(`/api/trips/boards/${tripId}/options/${instanceId}`, {
        headers: authHeaders,
      });
      if (Array.isArray(data?.instances)) {
        setTripInstances(data.instances);
        setTrip((prev) => (prev ? { ...prev, instances: data.instances } : prev));
      }
    } catch (err) {
      console.error("Error deleting instance:", err?.response?.data || err.message);
      setTripInstances((prev) => [...prev]); // optional revert
      showError("Failed to delete option. Try again.");
    }
  };

  const handleCreateInstance = async () => {
    setCreateError("");
    setCreatingOption(true);
    try {
      const payload = {
        // Keep local calendar dates exactly as selected (yyyy-MM-dd; no UTC conversion)
        trip_start: newInstance.trip_start || null,
        trip_end: newInstance.trip_end || null,
        option_title: newInstance.option_title,
        destination: newInstance.destination,
        image_url: newInstance.image_url,
        image_provider: newInstance.image_provider,
        image_attribution: newInstance.image_attribution,
        status: newInstance.status,
        stay_expense: Number(newInstance.stay_expense || 0),
        travel_expense: Number(newInstance.travel_expense || 0),
        car_expense: Number(newInstance.car_expense || 0),
        other_expense: Number(newInstance.other_expense || 0),
        cost_items: (newInstance.cost_items || []).filter(
          (item) => item.name || item.url || Number(item.price) > 0
        ),
        notes: "",
      };

      const { data: refreshedTrip } = await axios.post(
        `/api/trips/boards/${tripId}/options`,
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
    const pricedOptions = rankedInstances
      .map((instance) => ({ id: instance._id, total: calculateTotalCost(instance) }))
      .filter((item) => item.total > 0);
    const totals = pricedOptions.map((item) => item.total);
    const cheapest = totals.length ? Math.min(...totals) : 0;
    const highest = totals.length ? Math.max(...totals) : 0;
    const travelers = Math.max(1, Number(trip?.travelers) || 1);
    const cheapestOptionId = pricedOptions.find((item) => item.total === cheapest)?.id || null;

    return {
      cheapest,
      highest,
      perPerson: cheapest ? cheapest / travelers : 0,
      cheapestOptionId,
    };
  }, [rankedInstances, trip?.travelers]);

  const handleToggleOptionSelection = async (instance) => {
    const instanceId = instance?._id;
    if (!instanceId || selectionLoadingId) return;

    setSelectionLoadingId(instanceId);

    try {
      const requestConfig = {
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders || {}),
        },
      };

      const { data } = instance.isCommitted
        ? await axios.delete(
            `/api/trips/boards/${tripId}/options/${instanceId}/selection`,
            requestConfig
          )
        : await axios.patch(
            `/api/trips/boards/${tripId}/options/${instanceId}/select`,
            {},
            requestConfig
          );

      setTrip(data.trip);
      setTripInstances(data.trip.instances || []);
    } catch (err) {
      console.error("Error updating option selection:", err);
      showError(err.response?.data?.msg || "Failed to update option selection. Try again.");
    } finally {
      setSelectionLoadingId(null);
    }
  };

  // -------- UI --------
  if (loading) {
    return <TripBoardSkeleton />;
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {fetchError || "Trip not found"}
          </h2>
          <Link
            to={fetchError ? "/login" : "/workbench"}
            className="text-teal-700 hover:text-teal-800"
          >
            {fetchError ? "Go to Login" : "Return to Workbench"}
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
            to="/workbench"
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workbench
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
                  <p className="text-slate-500">Planned</p>
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
                    <div className="flex items-center gap-4" aria-label="Loading weather">
                      <SkeletonBlock className="h-14 w-14 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <SkeletonBlock className="h-5 w-40" />
                        <SkeletonBlock className="h-7 w-24" />
                      </div>
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
                    <div className="space-y-2" aria-label="Loading suggestions">
                      <SkeletonBlock className="h-4 w-full" />
                      <SkeletonBlock className="h-4 w-11/12" />
                      <SkeletonBlock className="h-4 w-4/5" />
                      <SkeletonBlock className="h-4 w-2/3" />
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

        <div className="gg-glass rounded-3xl border border-white/70 p-4 sm:p-6">
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
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1 sm:inline-flex">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition sm:py-1.5 ${
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
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition sm:py-1.5 ${
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-4 py-2.5 font-semibold text-white transition hover:brightness-105 sm:w-auto sm:py-2"
                type="button"
              >
                <Plus className="h-4 w-4" />
                Add Option
              </button>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">Lowest total</p>
              <p className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                {formatMoney(boardStats.cheapest)}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">Per person</p>
              <p className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                {formatMoney(boardStats.perPerson)}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">Spread</p>
              <p className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                {formatMoney(boardStats.highest - boardStats.cheapest)}
              </p>
            </div>
          </div>

          <div className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
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
          </div>

          {viewMode === "cards" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleInstances.map((instance, index) => (
              <div
                key={instance._id || index}
                className={`gg-card relative overflow-hidden rounded-3xl transition hover:-translate-y-0.5 hover:shadow-lg ${
                  instance.status === "eliminated" ? "opacity-70" : ""
                }`}
              >
                <div className="relative aspect-[16/9] bg-slate-100">
                  {instance.image_url ? (
                    <img
                      src={instance.image_url}
                      alt={instance.destination || "Destination"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src = "/getaway-genius-logo.png";
                        event.currentTarget.classList.remove("object-cover");
                        event.currentTarget.classList.add("object-contain", "p-8");
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-slate-400">
                      {instance.destination || instance.option_title || `Option ${index + 1}`}
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold ring-1 backdrop-blur ${
                        statusStyles[instance.status || "considering"]
                      }`}
                    >
                      {statusLabels[instance.status || "considering"]}
                    </span>
                    {boardStats.cheapestOptionId && instance._id === boardStats.cheapestOptionId && (
                      <span className="inline-flex rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                        Best price
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteInstance(instance._id || index)}
                    className="absolute right-3 top-3 rounded-full bg-white/95 p-2 text-slate-500 shadow-sm ring-1 ring-black/5 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Delete option"
                    title="Delete option"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-4">
                  <h3 className="text-xl font-bold leading-tight text-slate-900">
                    {instance.destination || instance.option_title || `Option ${index + 1}`}
                  </h3>
                  {instance.option_title && instance.destination && (
                    <p className="mt-1 text-sm font-medium text-slate-500">{instance.option_title}</p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                        Total
                      </div>
                      <p className="mt-1 text-lg font-bold text-slate-950">
                        {formatMoney(calculateTotalCost(instance))}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        Dates
                      </div>
                      <p className="mt-1 truncate text-sm font-bold text-slate-950">
                        {fmtRangeShort(instance.trip_start, instance.trip_end) || "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                    {[
                      ["Stay", categoryTotal(instance, "lodging")],
                      ["Flight", categoryTotal(instance, "flight")],
                      ["Car", categoryTotal(instance, "car")],
                      ["Other", categoryTotal(instance, "tickets") + categoryTotal(instance, "food") + categoryTotal(instance, "other")],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-white px-2 py-2 text-center ring-1 ring-slate-100">
                        <p className="font-semibold text-slate-500">{label}</p>
                        <p className="mt-0.5 font-bold text-slate-900">{formatMoney(value)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2">
                    {(instance.cost_items || []).slice(0, 2).map((item, itemIndex) => (
                      <div
                        key={item._id || `${item.name}-${itemIndex}`}
                        className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-800">
                            {item.name || itemCategories.find((c) => c.value === item.category)?.label || "Item"}
                          </p>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-0.5 inline-flex max-w-full items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800"
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
                    {(instance.cost_items || []).length > 2 && (
                      <p className="text-xs font-semibold text-slate-500">
                        +{instance.cost_items.length - 2} more saved item
                        {instance.cost_items.length - 2 === 1 ? "" : "s"}
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

                  <div className="mt-4 grid gap-2">
                    <button
                      onClick={() => handleToggleOptionSelection(instance)}
                      disabled={selectionLoadingId === instance._id}
                      className={`block min-h-11 w-full rounded-xl text-center font-semibold transition-colors ${
                        instance.isCommitted
                          ? "bg-green-100 text-green-700 ring-1 ring-green-300 hover:bg-green-200"
                          : "bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:brightness-105"
                      } ${selectionLoadingId === instance._id ? "cursor-wait opacity-50" : ""}`}
                      type="button"
                    >
                      {selectionLoadingId === instance._id
                        ? "Saving..."
                        : instance.isCommitted
                        ? "Clear Plan"
                        : "Set as Plan"}
                    </button>
                    <Link
                      to={`/trips/${tripId}/options/${instance._id || index}`}
                      state={{ trip, instance }}
                      className="block min-h-11 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      View / Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            </div>
          ) : (
            <div>
              <div className="grid gap-3 md:hidden">
                {visibleInstances.map((instance, index) => {
                  const total = calculateTotalCost(instance);
                  const travelers = Math.max(1, Number(trip?.travelers) || 1);
                  const links = (instance.cost_items || []).filter((item) => item.url);

                  return (
                    <article
                      key={instance._id || index}
                      className={`rounded-2xl border border-slate-200 bg-white p-4 ${
                        instance.status === "eliminated" ? "opacity-70" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-lg font-bold text-slate-900">
                            {instance.destination || instance.option_title || `Option ${index + 1}`}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {fmtRangeShort(instance.trip_start, instance.trip_end) || "Dates not set"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                            statusStyles[instance.status || "considering"]
                          }`}
                        >
                          {statusLabels[instance.status || "considering"]}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-xs font-semibold text-slate-500">Total</p>
                          <p className="mt-1 font-bold text-slate-950">{formatMoney(total)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-xs font-semibold text-slate-500">Per person</p>
                          <p className="mt-1 font-bold text-slate-950">{formatMoney(total / travelers)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-xs font-semibold text-slate-500">Stay + Flight</p>
                          <p className="mt-1 font-bold text-slate-950">
                            {formatMoney(categoryTotal(instance, "lodging") + categoryTotal(instance, "flight"))}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2">
                          <p className="text-xs font-semibold text-slate-500">Links</p>
                          <p className="mt-1 font-bold text-slate-950">{links.length}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Link
                          to={`/trips/${tripId}/options/${instance._id || index}`}
                          state={{ trip, instance }}
                          className="rounded-xl border border-slate-200 bg-white py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleOptionSelection(instance)}
                          disabled={selectionLoadingId === instance._id}
                          className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                            instance.isCommitted
                              ? "bg-green-100 text-green-700 ring-1 ring-green-300 hover:bg-green-200"
                              : "bg-slate-900 text-white hover:bg-slate-800"
                          } ${selectionLoadingId === instance._id ? "opacity-50" : ""}`}
                        >
                          {instance.isCommitted ? "Clear Plan" : "Set Plan"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
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
                                to={`/trips/${tripId}/options/${instance._id || index}`}
                                state={{ trip, instance }}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Edit
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleToggleOptionSelection(instance)}
                                disabled={selectionLoadingId === instance._id}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                  instance.isCommitted
                                    ? "bg-green-100 text-green-700 ring-1 ring-green-300 hover:bg-green-200"
                                    : "bg-slate-900 text-white hover:bg-slate-800"
                                } ${selectionLoadingId === instance._id ? "opacity-50" : ""}`}
                              >
                                {instance.isCommitted ? "Clear Plan" : "Set Plan"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteInstance(instance._id)}
                                className="rounded-lg px-2 py-1.5 text-rose-600 transition hover:bg-rose-50"
                                aria-label="Delete option"
                                title="Delete option"
                              >
                                <Trash2 className="h-4 w-4" />
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
          <h2 className="text-2xl font-bold text-slate-800">Trip Intel</h2>
          <p className="mt-1 text-sm text-slate-600">
            Timing, better-value alternatives, and a quick fit check for this board.
          </p>

          {tripSuggestionsLoading ? (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <SkeletonBlock className="h-3 w-24" />
                  <SkeletonBlock className="mt-3 h-5 w-32" />
                  <SkeletonBlock className="mt-4 h-4 w-full" />
                  <SkeletonBlock className="mt-2 h-4 w-5/6" />
                  <SkeletonBlock className="mt-4 h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : tripSuggestions.length ? (
            <>
              {tripSuggestionsWarning && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {tripSuggestionsWarning}
                </div>
              )}
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {tripSuggestions.map((item, idx) => (
                  <article key={`${item.type || item.title}-${idx}`} className="gg-card rounded-2xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                      {item.type === "better_value"
                        ? "Better Value"
                        : item.type === "fit_check"
                          ? "Fit Check"
                          : "Timing"}
                    </p>
                    <h3 className="mt-1 text-base font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{item.summary}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.details}</p>
                    <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                      {item.recommendation}
                    </p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              {tripSuggestionsWarning || "Trip Intel is unavailable right now."}
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
                          setSelectedDestination("");
                          setDestinationImageLoading(false);
                          setNewInstance((prev) => ({
                            ...prev,
                            destination: value,
                            image_url: value === prev.destination ? prev.image_url : "",
                            image_provider: value === prev.destination ? prev.image_provider : "",
                            image_attribution: value === prev.destination ? prev.image_attribution : {},
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
                    {destinationImageLoading ? (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                        <div className="relative grid aspect-[16/9] w-full place-items-center">
                          <div className="absolute inset-0 gg-skeleton rounded-none border-0" />
                          <div className="relative z-10 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                            Loading destination image...
                          </div>
                        </div>
                      </div>
                    ) : newInstance.image_url && (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                        <div className="relative aspect-[16/9] w-full">
                          <img
                            src={newInstance.image_url}
                            alt={newInstance.destination || "Selected destination"}
                            className="absolute inset-0 h-full w-full object-cover"
                            onError={() =>
                              setNewInstance((prev) => ({
                                ...prev,
                                image_url: "",
                                image_provider: "",
                              }))
                            }
                          />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent p-3">
                            <p className="truncate text-sm font-semibold text-white">
                              {newInstance.destination || "Selected destination"}
                            </p>
                            {newInstance.image_provider && (
                              <p className="mt-0.5 text-xs capitalize text-white/80">
                                Image from {newInstance.image_provider}
                              </p>
                            )}
                          </div>
                        </div>
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
                    <AppSelect
                      value={newInstance.status}
                      onChange={(value) =>
                        setNewInstance((prev) => ({ ...prev, status: value }))
                      }
                      options={Object.entries(statusLabels).map(([value, label]) => ({
                        value,
                        label,
                      }))}
                    />
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
