// src/pages/mytrips/MyTrips.jsx
import { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { parse } from "date-fns";
import { GlobalState } from "@/context/GlobalState.jsx";
import TripCard from "@/components/cards/TripCard.jsx";
import { useDataRefresh } from "@/hooks/useDataRefresh.js";
import { useToast } from "@/context/ToastContext.jsx";
import { MOCK_TRIPS } from "@/mocks/trips";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

// Parse server values as LOCAL calendar dates (no UTC shift).
const toLocalDate = (input) => {
  if (!input) return null;
  if (typeof input === "string") {
    const m = input.match(/^(\d{4}-\d{2}-\d{2})/); // matches 'yyyy-MM-dd' or ISO leading part
    if (m) return parse(m[1], "yyyy-MM-dd", new Date());
  }
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
};

const MyTrips = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = useContext(GlobalState);
  const api = state?.userAPI ?? state?.UserAPI;
  const [email] = api?.email ?? [""];
  const [isLogged] = api?.isLogged ?? [false];
  const [token] = state?.token ?? [null];
  const { refetchTrips, refetchWishlists } = useDataRefresh();
  const { success, error: showError } = useToast();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      if (USE_MOCKS) {
        setTrips(MOCK_TRIPS);
        setLoading(false);
        return;
      }
      if (!email) {
        setTrips([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get("/api/trips/getaway-trip", {
          params: { email },
          signal: controller.signal,
        });
        const allTrips = Array.isArray(res.data) ? res.data : [];
        const committedTrips = allTrips.filter((t) => t.committedInstanceId);
        setTrips(committedTrips);
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error(err);
          setError("Failed to load trips.");
          setTrips([]);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [email]);

  const removePost = async (id) => {
    if (!id || deletingIds.has(id)) return;
    if (!confirm("Do you want to delete this trip?")) return;

    setDeletingIds((prev) => new Set([...prev, id]));

    try {
      setTrips((prev) => prev.filter((t) => t._id !== id));

      const headers = token ? { Authorization: token } : undefined;
      await axios.delete(`/api/trips/getaway/${id}`, { headers });

      if (location.pathname === `/trips/${id}`) {
        navigate("/explore");
      }

      await Promise.all([refetchTrips(), refetchWishlists()]);
      success("Trip deleted successfully");
    } catch (err) {
      console.error(err);
      try {
        const headers = token ? { Authorization: token } : undefined;
        const res = await axios.get("/api/trips/getaway-trip", { headers });
        setTrips(res.data || []);
      } catch (refetchError) {
        console.error("Error refetching trips:", refetchError);
      }
      showError("Failed to delete trip. Please try again.");
    } finally {
      setDeletingIds((prev) => {
        const ns = new Set(prev);
        ns.delete(id);
        return ns;
      });
    }
  };

  // helpers
  const fmtRange = (start, end) => {
    const s = toLocalDate(start);
    const e = toLocalDate(end);
    if (!s || !e) return "Not set";
    const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    const mo = (d) => d.toLocaleString(undefined, { month: "short" });
    return sameMonth
      ? `${mo(s)} ${s.getDate()}–${e.getDate()}`
      : `${mo(s)} ${s.getDate()} – ${mo(e)} ${e.getDate()}`;
  };

  const totalCost = (t) =>
    (Number(t.stay_expense) || 0) +
    (Number(t.car_expense) || 0) +
    (Number(t.travel_expense) || 0) +
    (Number(t.other_expense) || 0);

  const nextTripCountdown = (start, end) => {
    const now = new Date();
    const s = toLocalDate(start);
    const e = toLocalDate(end);
    if (!s || !e) return null;

    // treat end date as inclusive (add one day at local midnight)
    const eInclusive = new Date(e);
    eInclusive.setDate(eInclusive.getDate() + 1);

    if (now >= s && now < eInclusive) {
      return { label: "Happening now", tone: "emerald" };
    }

    const ms = s - now;
    const oneHour = 1000 * 60 * 60;
    const oneDay = oneHour * 24;

    if (ms > 0 && ms < oneDay) {
      const hours = Math.max(1, Math.ceil(ms / oneHour));
      return { label: `In ${hours} hour${hours === 1 ? "" : "s"}`, tone: "indigo" };
    }

    const days = Math.ceil(ms / oneDay);
    if (days === 0) return { label: "Today", tone: "indigo" };
    if (days === 1) return { label: "Tomorrow", tone: "indigo" };
    if (days > 1) return { label: `${days} days until your next trip`, tone: "indigo" };

    return { label: "Starts soon", tone: "indigo" };
  };

  // compute featured (soonest upcoming), and the rest grouped by year — all using local dates
  const { featured, groups, orderedYears } = useMemo(() => {
    const now = new Date();

    const tripsWithCommittedInstance = trips
      .map((t) => {
        const committedInstance = t.instances.find(
          (inst) => inst._id?.toString() === t.committedInstanceId?.toString()
        );
        return { ...t, committedInstance };
      })
      .filter((t) => t.committedInstance);

    // sort by local start date
    tripsWithCommittedInstance.sort((a, b) => {
      const as = toLocalDate(a.committedInstance.trip_start);
      const bs = toLocalDate(b.committedInstance.trip_start);
      return (as?.getTime() ?? 0) - (bs?.getTime() ?? 0);
    });

    // keep upcoming: end date inclusive
    const upcoming = tripsWithCommittedInstance.filter((t) => {
      const end = toLocalDate(t.committedInstance.trip_end);
      if (!end) return false;
      const endInclusive = new Date(end);
      endInclusive.setDate(endInclusive.getDate() + 1);
      return endInclusive >= now;
    });

    const f = upcoming[0] || null;
    const rest = f ? upcoming.slice(1) : upcoming;

    // group others by end-year (local)
    const byYear = rest.reduce((acc, t) => {
      const end = toLocalDate(t.committedInstance.trip_end);
      if (!end) return acc;
      const y = end.getFullYear();
      (acc[y] ||= []).push(t);
      return acc;
    }, {});

    Object.keys(byYear).forEach((y) =>
      byYear[y].sort((a, b) => {
        const as = toLocalDate(a.committedInstance.trip_start);
        const bs = toLocalDate(b.committedInstance.trip_start);
        return (as?.getTime() ?? 0) - (bs?.getTime() ?? 0);
      })
    );

    const years = Object.keys(byYear)
      .map(Number)
      .sort((a, b) => b - a);

    return { featured: f, groups: byYear, orderedYears: years };
  }, [trips]);

  // if not logged in (and not using mocks), show prompt
  if (!isLogged && !USE_MOCKS) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
          Please log in to view your trips.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          Loading trips…
        </div>
      </div>
    );
  }

  const showEmpty = !featured && orderedYears.length === 0;
  const countdown = featured
    ? nextTripCountdown(
        featured.committedInstance.trip_start,
        featured.committedInstance.trip_end
      )
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 via-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Countdown above featured */}
        {featured && countdown && (
          <div className="mb-3 flex items-center gap-2">
            <span
              className={
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ring-1 " +
                (countdown.tone === "emerald"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-indigo-50 text-indigo-700 ring-indigo-200")
              }
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" />
              </svg>
              {countdown.label}
            </span>
          </div>
        )}

        {/* Featured trip */}
        {featured && (
          <section className="mb-10">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
              {/* image */}
              <div className="relative h-64 w-full sm:h-80">
                <img
                  src={featured.image_url}
                  alt={featured.location_address}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
              </div>

              {/* content */}
              <div className="relative -mt-16 px-5 pb-5 sm:-mt-20 sm:px-8">
                <div className="flex flex-col gap-3 rounded-2xl bg-white/90 p-4 backdrop-blur shadow-md ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {featured.location_address}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {fmtRange(
                        featured.committedInstance.trip_start,
                        featured.committedInstance.trip_end
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-50 px-4 py-2 text-indigo-700 ring-1 ring-indigo-200">
                      <span className="text-xs uppercase tracking-wide">Est. Total</span>
                      <div className="text-lg font-bold">
                        {totalCost(featured.committedInstance) > 0
                          ? `$${totalCost(featured.committedInstance).toFixed(0)}`
                          : "—"}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        navigate(
                          `/trips/${featured._id}/instances/${featured.committedInstance._id}`
                        )
                      }
                      className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      View
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Do you want to delete this committed instance?")) return;
                        setDeletingIds((prev) => new Set([...prev, featured._id]));
                        try {
                          const headers = token ? { Authorization: token } : undefined;
                          await axios.delete(
                            `/api/trips/getaway/${featured._id}/instances/${featured.committedInstance._id}`,
                            { headers }
                          );
                          setTrips((prev) => prev.filter((t) => t._id !== featured._id));
                          await Promise.all([refetchTrips(), refetchWishlists()]);
                          success("Instance deleted successfully");
                          navigate("/mytrips");
                        } catch (err) {
                          console.error(err);
                          showError("Failed to delete instance. Please try again.");
                        } finally {
                          setDeletingIds((prev) => {
                            const ns = new Set(prev);
                            ns.delete(featured._id);
                            return ns;
                          });
                        }
                      }}
                      disabled={deletingIds.has(featured._id)}
                      className={`rounded-xl bg-rose-600/90 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-rose-600 ${
                        deletingIds.has(featured._id) ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {deletingIds.has(featured._id) ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Rest of upcoming trips (grouped by year) */}
        {orderedYears.length ? (
          orderedYears.map((year) => (
            <section key={year} className="mb-10">
              <h3 className="mb-4 text-2xl font-bold text-slate-900">{year}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups[year].map((trip) => (
                  <TripCard
                    key={trip._id}
                    trip={trip}
                    instance={trip.committedInstance}
                    onRemove={removePost}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          !featured && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-semibold text-slate-900">Start planning your trips!</p>
              <p className="mt-1 text-slate-600">You don&apos;t have any upcoming committed trips yet.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MyTrips;
