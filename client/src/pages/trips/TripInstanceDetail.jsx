// src/pages/trips/TripInstanceDetail.jsx
import { useState, useEffect, useContext, useMemo } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import axios from "axios";
import {
  Edit2,
  Save,
  X,
  Calendar as CalendarIcon,
  Clock3,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import TripDateRange from "@/components/TripDateRange";
import BackButton from "@/components/BackButton";
import {
  toYmdLocal,
  formatMMDDYYYYLocal,
  fmtRangeShort,
  nightsBetween,
} from "../utils/localDates";
import { GlobalState } from "@/context/GlobalState.jsx";

const TripInstanceDetail = () => {
  const globalState = useContext(GlobalState);
  const token = globalState?.token?.[0] ?? null;
  const globalLoading = globalState?.loading?.[0] ?? false;
  const { tripId, instanceId } = useParams();
  const locationState = useLocation();
  const stateData = locationState.state || {};
  const authHeaders = useMemo(
    () => (token ? { Authorization: token } : undefined),
    [token]
  );

  const [trip, setTrip] = useState(stateData.trip || null);
  const [instance, setInstance] = useState(stateData.instance || null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!stateData.trip || !stateData.instance);

  const [formData, setFormData] = useState({
    option_title: "",
    destination: "",
    status: "considering",
    trip_start: "",
    trip_end: "",
    stay_expense: 0,
    travel_expense: 0,
    car_expense: 0,
    other_expense: 0,
    cost_items: [],
    notes: "",
    activities: [],
  });

  const itemCategories = [
    { value: "lodging", label: "Lodging" },
    { value: "flight", label: "Flight" },
    { value: "car", label: "Car" },
    { value: "tickets", label: "Tickets" },
    { value: "food", label: "Food" },
    { value: "other", label: "Other" },
  ];

  const statusLabels = {
    considering: "Considering",
    top_choice: "Top Choice",
    eliminated: "Eliminated",
    booked: "Booked",
  };

  const formatCurrency0 = (val) =>
    Number(val || 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  const formatFixed2 = (val) => (val === "" ? "" : Number(val || 0).toFixed(2));
  const handleExpenseChange = (key, value) => {
    if (!isNaN(value) || value === "") setFormData((p) => ({ ...p, [key]: value }));
  };

  const updateCostItem = (index, key, value) => {
    setFormData((prev) => ({
      ...prev,
      cost_items: (prev.cost_items || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const addCostItem = () => {
    setFormData((prev) => ({
      ...prev,
      cost_items: [
        ...(prev.cost_items || []),
        { category: "other", name: "", url: "", price: "", quantity: 1, start_date: "", end_date: "", notes: "" },
      ],
    }));
  };

  const removeCostItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      cost_items: (prev.cost_items || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const nights = nightsBetween(formData.trip_start, formData.trip_end);
  const legacyTotal =
    (Number(formData.stay_expense) || 0) +
    (Number(formData.travel_expense) || 0) +
    (Number(formData.car_expense) || 0) +
    (Number(formData.other_expense) || 0);
  const lineItemTotal = (formData.cost_items || []).reduce(
    (sum, item) =>
      sum + (Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1),
    0
  );
  const total = lineItemTotal || legacyTotal;
  const boardStartYmd = toYmdLocal(trip?.board_start || trip?.trip_start);
  const boardEndYmd = toYmdLocal(trip?.board_end || trip?.trip_end);

  // -------- fetch --------
  useEffect(() => {
    const fetchTripInstance = async () => {
      if (globalLoading) return;
      if (!token) {
        setFetchLoading(false);
        return;
      }

      if (!trip || !instance) {
        try {
          setFetchLoading(true);
          const { data } = await axios.get(`/api/trips/getaway/${tripId}/instances/${instanceId}`, {
            headers: authHeaders,
          });
          setTrip(data.trip);
          setInstance(data.instance);
        } catch (err) {
          console.error("Error fetching trip instance:", err);
        } finally {
          setFetchLoading(false);
        }
      }
    };
    fetchTripInstance();
  }, [tripId, instanceId, trip, instance, token, globalLoading, authHeaders]);

  // normalize instance -> form (as yyyy-MM-dd strings; no UTC conversion)
  useEffect(() => {
    if (instance) {
      setFormData({
        option_title: instance.option_title || "",
        destination: instance.destination || "",
        status: instance.status || "considering",
        trip_start: toYmdLocal(instance.trip_start),
        trip_end: toYmdLocal(instance.trip_end),
        stay_expense: instance.stay_expense ?? 0,
        travel_expense: instance.travel_expense ?? 0,
        car_expense: instance.car_expense ?? 0,
        other_expense: instance.other_expense ?? 0,
        cost_items: (instance.cost_items || []).map((item) => ({
          ...item,
          start_date: toYmdLocal(item.start_date),
          end_date: toYmdLocal(item.end_date),
        })),
        notes: instance.notes || "",
        activities: instance.activities || [],
      });
      setFetchLoading(false);
    }
  }, [instance]);

  // -------- submit --------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Keep dates as 'yyyy-MM-dd' strings; let the server decide how to store them.
      const normalizedFormData = {
        ...formData,
        cost_items: (formData.cost_items || []).filter(
          (item) => item.name || item.url || Number(item.price) > 0
        ),
      };

      if (trip && Array.isArray(trip.instances)) {
        const updatedInstances = trip.instances.map((inst, idx) =>
          (inst._id === instanceId || String(idx) === String(instanceId))
            ? { ...inst, ...normalizedFormData }
            : inst
        );
        await axios.put(
          `/api/trips/getaway/${tripId}`,
          { ...trip, instances: updatedInstances },
          { headers: authHeaders }
        );
      } else {
        await axios.put(`/api/trips/getaway/${tripId}`, normalizedFormData, {
          headers: authHeaders,
        });
      }
      setInstance((prev) => ({ ...prev, ...normalizedFormData }));
      setEditMode(false);
    } catch (error) {
      console.error("Error updating trip instance:", error);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4" />
          <p className="text-slate-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (!trip || !instance) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Trip instance not found</h2>
        <Link to="/explore" className="text-indigo-600 hover:text-indigo-700">Return to Explore</Link>
        </div>
      </div>
    );
  }

  // -------- UI --------
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <BackButton label="Back" />
        </div>

        <div className="relative rounded-[28px] bg-white shadow-[0_10px_40px_-10px_rgba(2,6,23,0.12)] ring-1 ring-slate-100 overflow-hidden">
          {/* Banner */}
          <div className="relative h-48">
            <img
              src={instance.image_url || trip.image_url || "/getaway-genius-logo.png"}
              alt={formData.destination || trip.location_address}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Edit toggle */}
            <div className="absolute top-4 right-4 flex gap-2">
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="rounded-xl bg-white/20 p-2 text-white backdrop-blur hover:bg-white/30"
                  title="Edit"
                  type="button"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setEditMode(false)}
                  className="rounded-xl bg-white/20 p-2 text-white backdrop-blur hover:bg-white/30"
                  title="Cancel"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Title + total */}
            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
              <div className="text-white">
                <p className="text-xs tracking-[0.18em] font-semibold opacity-80">TRIP OPTION</p>
                <h1 className="mt-1 text-2xl md:text-3xl font-bold leading-tight">
                  {formData.destination || formData.option_title || trip.board_title || trip.location_address}
                </h1>
                <p className="mt-1 text-sm opacity-90">
                  {trip.board_title || trip.location_address}
                </p>
              </div>
              <div className="hidden md:block">
                <span className="rounded-full bg-indigo-50/90 px-4 py-2 text-indigo-700 text-sm font-semibold shadow-sm">
                  {formatCurrency0(total)} est.
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            {/* Mobile total */}
            <div className="md:hidden mb-4">
              <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-indigo-700 text-sm font-semibold shadow-sm">
                {formatCurrency0(total)} est.
              </span>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-[1fr_1fr_180px]">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Destination</span>
                {!editMode ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 font-semibold text-slate-900">
                    {formData.destination || "Not set"}
                  </p>
                ) : (
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, destination: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="Orlando, New York, Los Angeles..."
                  />
                )}
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Option name</span>
                {!editMode ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 font-semibold text-slate-900">
                    {formData.option_title || "Untitled option"}
                  </p>
                ) : (
                  <input
                    type="text"
                    value={formData.option_title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, option_title: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="Airbnb near Disney, Midtown hotel..."
                  />
                )}
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
                {!editMode ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 font-semibold text-slate-900">
                    {statusLabels[formData.status] || "Considering"}
                  </p>
                ) : (
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            </div>

            {/* ===== Dates section ===== */}
            <div className="rounded-2xl ring-1 ring-slate-100 bg-gradient-to-r from-indigo-50 to-white p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white shadow flex items-center justify-center ring-1 ring-slate-100">
                    <CalendarIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Trip Dates</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatMMDDYYYYLocal(formData.trip_start)} — {formatMMDDYYYYLocal(formData.trip_end)}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Clock3 className="h-4 w-4" />
                      <span>
                        {nights !== null ? `${nights} ${nights === 1 ? "night" : "nights"}` : "Duration unknown"}
                      </span>
                    </div>
                  </div>
                </div>

                {editMode && (
                  <div className="w-full md:w-auto md:min-w-[420px]">
                    {/* This component already writes yyyy-MM-dd strings into setNewInstance */}
                    <TripDateRange
                      newInstance={formData}
                      setNewInstance={setFormData}
                      minDate={boardStartYmd}
                      maxDate={boardEndYmd}
                      label="Option Dates"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ===== Saved links and costs ===== */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">Saved links and costs</h2>
                  <p className="text-sm text-slate-500">
                    Keep hotels, Airbnbs, flights, tickets, rentals, and other links here.
                  </p>
                </div>
                {editMode && (
                  <button
                    type="button"
                    onClick={addCostItem}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {(formData.cost_items || []).map((item, index) => (
                  <div key={item._id || index} className="rounded-xl bg-slate-50 p-3">
                    {!editMode ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {item.name || itemCategories.find((c) => c.value === item.category)?.label || "Item"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {itemCategories.find((c) => c.value === item.category)?.label || "Other"}
                            {Number(item.quantity) > 1 ? ` x ${item.quantity}` : ""}
                          </p>
                          {(item.start_date || item.end_date) && (
                            <p className="mt-1 text-xs font-medium text-slate-500">
                              {fmtRangeShort(item.start_date, item.end_date)}
                            </p>
                          )}
                          {item.notes && <p className="mt-1 text-sm text-slate-600">{item.notes}</p>}
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Open link
                            </a>
                          )}
                        </div>
                        <p className="font-semibold text-slate-900">
                          {formatCurrency0((Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1))}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-3 md:grid-cols-[150px_1fr_120px_80px_40px]">
                          <select
                            value={item.category}
                            onChange={(e) => updateCostItem(index, "category", e.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                          >
                            {itemCategories.map((category) => (
                              <option key={category.value} value={category.value}>
                                {category.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateCostItem(index, "name", e.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Name"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateCostItem(index, "price", e.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Price"
                          />
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => updateCostItem(index, "quantity", e.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Qty"
                          />
                          <button
                            type="button"
                            onClick={() => removeCostItem(index)}
                            className="grid h-10 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div className="grid gap-3 md:col-span-2 sm:grid-cols-2">
                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold text-slate-500">
                                Item start
                              </span>
                              <input
                                type="date"
                                min={boardStartYmd || undefined}
                                max={item.end_date || boardEndYmd || undefined}
                                value={item.start_date || ""}
                                onChange={(e) => updateCostItem(index, "start_date", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold text-slate-500">
                                Item end
                              </span>
                              <input
                                type="date"
                                min={item.start_date || boardStartYmd || undefined}
                                max={boardEndYmd || undefined}
                                value={item.end_date || ""}
                                onChange={(e) => updateCostItem(index, "end_date", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                              />
                            </label>
                          </div>
                          <input
                            type="url"
                            value={item.url}
                            onChange={(e) => updateCostItem(index, "url", e.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Link"
                          />
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => updateCostItem(index, "notes", e.target.value)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Notes"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {!(formData.cost_items || []).length && (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    No saved links yet.
                  </p>
                )}
              </div>
            </div>

            {/* ===== Expense cards ===== */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Flights */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
                <p className="text-sm text-slate-500 mb-1">Flights</p>
                {!editMode ? (
                  <p className="text-2xl font-semibold text-slate-900">{formatFixed2(formData.travel_expense)}</p>
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    value={formData.travel_expense}
                    onChange={(e) => handleExpenseChange("travel_expense", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="0.00"
                  />
                )}
              </div>

              {/* Hotel */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
                <p className="text-sm text-slate-500 mb-1">Hotel</p>
                {!editMode ? (
                  <p className="text-2xl font-semibold text-slate-900">{formatFixed2(formData.stay_expense)}</p>
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stay_expense}
                    onChange={(e) => handleExpenseChange("stay_expense", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="0.00"
                  />
                )}
              </div>

              {/* Car */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
                <p className="text-sm text-slate-500 mb-1">Car</p>
                {!editMode ? (
                  <p className="text-2xl font-semibold text-slate-900">{formatFixed2(formData.car_expense)}</p>
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    value={formData.car_expense}
                    onChange={(e) => handleExpenseChange("car_expense", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="0.00"
                  />
                )}
              </div>
            </div>

            {/* Other + Notes panel */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
                <p className="text-sm text-slate-500 mb-1">Other</p>
                {!editMode ? (
                  <p className="text-2xl font-semibold text-slate-900">{formatFixed2(formData.other_expense)}</p>
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    value={formData.other_expense}
                    onChange={(e) => handleExpenseChange("other_expense", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="0.00"
                  />
                )}
              </div>

              <div className="md:col-span-2 rounded-2xl p-6 ring-1 ring-slate-100 shadow-sm bg-gradient-to-r from-indigo-100 to-white">
                <p className="mb-2 text-sm font-medium text-slate-700">Notes</p>
                {!editMode ? (
                  <p className="whitespace-pre-wrap text-sm text-slate-600">
                    {formData.notes || "No notes yet."}
                  </p>
                ) : (
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Tradeoffs, cancellation policy, fees, location notes..."
                  />
                )}
              </div>
            </div>

            {/* Actions */}
            {editMode && (
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="flex-1 rounded-xl border border-slate-300 py-2.5 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default TripInstanceDetail;
