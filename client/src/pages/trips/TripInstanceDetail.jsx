// src/pages/trips/TripInstanceDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { parse, format as formatFn } from "date-fns";
import { ArrowLeft, Edit2, Save, X, Calendar as CalendarIcon, Clock3 } from "lucide-react";
import TripDateRange from "@/components/TripDateRange";
import BackButton from "@/components/BackButton";

/** -------- date helpers: parse & format as LOCAL calendar dates -------- */
const pickYmd = (s) => (typeof s === "string" ? (s.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? null) : null);
const toLocalDate = (input) => {
  if (!input) return null;
  // works for 'yyyy-MM-dd' and for ISO like 'yyyy-MM-ddTHH:mm:ssZ'
  const ymd = pickYmd(input);
  if (ymd) return parse(ymd, "yyyy-MM-dd", new Date());
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
};
const toYmdLocal = (input) => {
  const d = toLocalDate(input);
  return d ? formatFn(d, "yyyy-MM-dd") : "";
};
const toMMDDYYYY = (input) => {
  const d = toLocalDate(input);
  if (!d) return "Not set";
  // strict MM/DD/YYYY for your UI
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};
const daysBetween = (startYmd, endYmd) => {
  const s = toLocalDate(startYmd);
  const e = toLocalDate(endYmd);
  if (!s || !e) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  // difference in *nights* (end - start)
  return Math.round((e - s) / msPerDay);
};

const TripInstanceDetail = () => {
  const { tripId, instanceId } = useParams();
  const locationState = useLocation();
  const stateData = locationState.state || {};

  const [trip, setTrip] = useState(stateData.trip || null);
  const [instance, setInstance] = useState(stateData.instance || null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!stateData.trip || !stateData.instance);

  const [formData, setFormData] = useState({
    trip_start: "",
    trip_end: "",
    stay_expense: 0,
    travel_expense: 0,
    car_expense: 0,
    other_expense: 0,
    activities: [],
  });

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

  const nights = daysBetween(formData.trip_start, formData.trip_end);
  const total =
    (Number(formData.stay_expense) || 0) +
    (Number(formData.travel_expense) || 0) +
    (Number(formData.car_expense) || 0) +
    (Number(formData.other_expense) || 0);

  // -------- fetch --------
  useEffect(() => {
    const fetchTripInstance = async () => {
      if (!trip || !instance) {
        try {
          setFetchLoading(true);
          const { data } = await axios.get(`/api/trips/getaway/${tripId}/instances/${instanceId}`);
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
  }, [tripId, instanceId, trip, instance]);

  // normalize instance -> form (as yyy-mm-dd strings; no UTC conversion)
  useEffect(() => {
    if (instance) {
      setFormData({
        trip_start: toYmdLocal(instance.trip_start), // <- local date string
        trip_end: toYmdLocal(instance.trip_end),     // <- local date string
        stay_expense: instance.stay_expense ?? 0,
        travel_expense: instance.travel_expense ?? 0,
        car_expense: instance.car_expense ?? 0,
        other_expense: instance.other_expense ?? 0,
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
      if (trip && Array.isArray(trip.instances)) {
        const updatedInstances = trip.instances.map((inst, idx) =>
          (inst._id === instanceId || String(idx) === String(instanceId))
            ? { ...inst, ...formData }
            : inst
        );
        await axios.put(`/api/trips/getaway/${tripId}`, { ...trip, instances: updatedInstances });
      } else {
        await axios.put(`/api/trips/getaway/${tripId}`, formData);
      }
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
            <img src={trip.image_url} alt={trip.location_address} className="h-full w-full object-cover" />
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
                <p className="text-xs tracking-[0.18em] font-semibold opacity-80">SAMPLE TRIP</p>
                <h1 className="mt-1 text-2xl md:text-3xl font-bold leading-tight">{trip.location_address}</h1>
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
                      {toMMDDYYYY(formData.trip_start)} — {toMMDDYYYY(formData.trip_end)}
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
                    <TripDateRange newInstance={formData} setNewInstance={setFormData} />
                  </div>
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
                <p className="text-slate-500 text-sm">
                  Notes / activities (coming soon). Keep confirmation numbers, must-do spots, or reminders here.
                </p>
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
