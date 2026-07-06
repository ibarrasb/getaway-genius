// src/pages/mission/MyTrips.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { GlobalState } from "@/context/GlobalState.jsx";
import { useDataRefresh } from "@/hooks/useDataRefresh.js";
import { useToast } from "@/context/ToastContext.jsx";
import { useConfirm } from "@/context/useConfirm";
import { MissionSkeleton } from "@/components/skeletons/AppSkeletons.jsx";
import { MOCK_TRIPS } from "@/mocks/trips";
import { toLocalDate, addDays, fmtRangeShort } from "../utils/localDates";
import { getTripImageSrc } from "../utils/image";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Car,
  ExternalLink,
  MapPin,
  Plane,
  ReceiptText,
  Ticket,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

const formatMoney = (value) => {
  const amount = Number(value) || 0;
  if (!amount) return "$0";
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
};

const selectedCostItems = (instance = {}) =>
  (instance.cost_items || []).filter((item) => item && item.is_selected !== false);

const costItemTotal = (item) =>
  (Number(item?.price) || 0) * Math.max(1, Number(item?.quantity) || 1);

const categoryTotal = (instance, categories) =>
  selectedCostItems(instance).reduce((sum, item) => {
    return categories.includes(item.category) ? sum + costItemTotal(item) : sum;
  }, 0);

const fallbackCategoryTotal = (instance, categories, fallbackValue) => {
  const total = categoryTotal(instance, categories);
  return total || Number(fallbackValue) || 0;
};

const getMissionImageSrc = (trip) =>
  trip?.committedInstance?.image_url?.trim()
    ? trip.committedInstance.image_url
    : getTripImageSrc(trip);

const missionTitle = (trip) =>
  trip?.board_title || trip?.committedInstance?.destination || trip?.location_address || "Planned Trip";

const missionSubtitle = (trip) =>
  trip?.committedInstance?.option_title ||
  trip?.committedInstance?.destination ||
  trip?.location_address ||
  "Trip option";

const tripNightCount = (start, end) => {
  const s = toLocalDate(start);
  const e = toLocalDate(end);
  if (!s || !e) return null;
  const nights = Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
  return nights;
};

const MyTrips = () => {
  const navigate = useNavigate();
  const state = useContext(GlobalState);
  const api = state?.userAPI ?? state?.UserAPI;
  const [email] = api?.email ?? [""];
  const [isLogged] = api?.isLogged ?? [false];
  const [userLoading] = api?.loading ?? [false];
  const [userError] = api?.error ?? [null];
  const [token] = state?.token ?? [null];
  const [globalLoading] = state?.loading ?? [false];
  const { refetchTrips, refetchWishlists } = useDataRefresh();
  const { success, error: showError } = useToast();
  const { confirm } = useConfirm();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedTrips, setHasLoadedTrips] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setHasLoadedTrips(false);

    const run = async () => {
      if (USE_MOCKS) {
        setTrips(MOCK_TRIPS);
        setHasLoadedTrips(true);
        setLoading(false);
        return;
      }
      if (globalLoading || userLoading || (token && !email && !userError)) {
        setLoading(true);
        return;
      }
      if (!email) {
        setTrips([]);
        setHasLoadedTrips(false);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const headers = token ? { Authorization: token } : undefined;
        const res = await axios.get("/api/trips/boards", {
          params: { email },
          headers,
          signal: controller.signal,
        });
        const allTrips = Array.isArray(res.data) ? res.data : [];
        setTrips(allTrips);
        setHasLoadedTrips(true);
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error(err);
          setError("Failed to load trips.");
          setTrips([]);
          setHasLoadedTrips(false);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [email, token, globalLoading, userLoading, userError]);

  const totalCost = (t) =>
    (Number(t.stay_expense) || 0) +
    (Number(t.car_expense) || 0) +
    (Number(t.travel_expense) || 0) +
    (Number(t.other_expense) || 0);

  const optionTotal = (instance) => {
    const lineItems = selectedCostItems(instance).reduce((sum, item) => sum + costItemTotal(item), 0);
    return lineItems || totalCost(instance);
  };

  const handleImageError = (event) => {
    const fallback = getTripImageSrc({});
    if (event.currentTarget.src !== fallback) {
      event.currentTarget.src = fallback;
    }
  };

  const nextTripCountdown = (start, end) => {
    const now = new Date();
    const s = toLocalDate(start);
    const eInclusive = addDays(end, 1); // treat end as inclusive
    if (!s || !eInclusive) return null;

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
        const committedInstance = (t.instances || []).find(
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
      const endInclusive = addDays(t.committedInstance.trip_end, 1);
      return endInclusive && endInclusive >= now;
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

  const authPending =
    !USE_MOCKS &&
    (globalLoading || userLoading || (token && !email && !userError) || (isLogged && !token));

  if (loading || authPending || (!hasLoadedTrips && Boolean(email))) {
    return <MissionSkeleton />;
  }

  // if not logged in (and not using mocks), show prompt
  if (!isLogged && !token && !USE_MOCKS) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
          Please log in to view your trips.
        </p>
      </div>
    );
  }

  const countdown = featured
    ? nextTripCountdown(
        featured.committedInstance.trip_start,
        featured.committedInstance.trip_end
      )
    : null;
  const planningBoards = trips.filter((trip) => !trip.committedInstanceId);

  const handleDeletePlannedOption = async (trip) => {
    if (!trip?._id || !trip?.committedInstance?._id) return;

    const ok = await confirm({
      title: "Delete planned option?",
      description: "This removes the planned option from this board. This cannot be undone.",
      confirmLabel: "Delete Option",
    });
    if (!ok) return;

    setDeletingIds((prev) => new Set([...prev, trip._id]));
    try {
      const headers = token ? { Authorization: token } : undefined;
      const { data } = await axios.delete(
        `/api/trips/boards/${trip._id}/options/${trip.committedInstance._id}`,
        { headers }
      );

      setTrips((prev) =>
        prev.map((item) =>
          item._id === trip._id
            ? { ...item, committedInstanceId: null, instances: data.instances || [] }
            : item
        )
      );
      await Promise.all([refetchTrips(), refetchWishlists()]);
      success("Option deleted successfully");
    } catch (err) {
      console.error(err);
      showError("Failed to delete option. Please try again.");
    } finally {
      setDeletingIds((prev) => {
        const ns = new Set(prev);
        ns.delete(trip._id);
        return ns;
      });
    }
  };

  return (
    <div className="gg-page min-h-screen">
      <div className="mx-auto max-w-6xl">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {planningBoards.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                  Planning
                </p>
                <h2 className="text-2xl font-bold text-slate-900">Comparison Boards</h2>
              </div>
              <Link
                to="/workbench"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Add Destination
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {planningBoards.map((trip) => {
                const options = trip.instances || [];
                const totals = options.map(optionTotal).filter((value) => value > 0);
                const lowest = totals.length ? Math.min(...totals) : 0;
                const topChoice = options.find((option) => option.status === "top_choice");

                return (
                  <Link
                    key={trip._id}
                    to={`/trips/${trip._id}`}
                    className="gg-card overflow-hidden rounded-2xl transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="aspect-[16/9] bg-slate-100">
                      <img
                        src={getTripImageSrc(trip)}
                        alt={trip.board_title || trip.location_address || "Planning board"}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={handleImageError}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-bold text-slate-900">
                            {trip.board_title || trip.location_address}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {fmtRangeShort(trip.board_start || trip.trip_start, trip.board_end || trip.trip_end) || "Dates not set"}
                          </p>
                        </div>
                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                          Comparing
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-slate-500">Lowest total</p>
                          <p className="font-bold text-slate-900">
                            {lowest
                              ? lowest.toLocaleString("en-US", {
                                  style: "currency",
                                  currency: "USD",
                                  maximumFractionDigits: 0,
                                })
                              : "Add prices"}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-slate-500">Top choice</p>
                          <p className="truncate font-bold text-slate-900">
                            {topChoice?.destination || topChoice?.option_title || "Not picked"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Featured trip */}
        {featured && (() => {
          const option = featured.committedInstance;
          const rangeLabel = fmtRangeShort(option.trip_start, option.trip_end) || "Dates not set";
          const nights = tripNightCount(option.trip_start, option.trip_end);
          const travelers = Math.max(1, Number(featured.travelers) || 1);
          const total = optionTotal(option);
          const links = selectedCostItems(option).filter((item) => item.url).slice(0, 4);
          const breakdown = [
            {
              label: "Lodging",
              value: fallbackCategoryTotal(option, ["lodging"], option.stay_expense),
              Icon: BedDouble,
            },
            {
              label: "Flights",
              value: fallbackCategoryTotal(option, ["flight"], option.travel_expense),
              Icon: Plane,
            },
            {
              label: "Car",
              value: fallbackCategoryTotal(option, ["car"], option.car_expense),
              Icon: Car,
            },
            {
              label: "Tickets",
              value: categoryTotal(option, ["tickets"]),
              Icon: Ticket,
            },
            {
              label: "Other",
              value: fallbackCategoryTotal(option, ["food", "other"], option.other_expense),
              Icon: ReceiptText,
            },
          ];

          return (
            <section className="mb-10">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                    Active Mission
                  </p>
                  <h1 className="text-3xl font-bold text-slate-950">Your Planned Trip</h1>
                </div>
                {countdown && (
                  <span
                    className={
                      "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 " +
                      (countdown.tone === "emerald"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : "bg-sky-50 text-sky-700 ring-sky-200")
                    }
                  >
                    <CalendarDays className="h-4 w-4" />
                    {countdown.label}
                  </span>
                )}
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
                  <div className="relative min-h-[300px] bg-slate-100 lg:min-h-[560px]">
                    <img
                      src={getMissionImageSrc(featured)}
                      alt={missionTitle(featured)}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                      onError={handleImageError}
                    />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-black/10 backdrop-blur">
                        <MapPin className="h-4 w-4 shrink-0 text-teal-700" />
                        <span className="truncate">
                          {option.destination || featured.location_address || featured.board_title || "Destination not set"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-7">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                        Planned
                      </span>
                      {option.status && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700 ring-1 ring-slate-200">
                          {String(option.status).replace("_", " ")}
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <h2 className="text-3xl font-extrabold leading-tight text-slate-950">
                        {missionTitle(featured)}
                      </h2>
                      <p className="mt-2 text-lg font-semibold text-slate-700">
                        {missionSubtitle(featured)}
                      </p>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                          <CalendarDays className="h-4 w-4" />
                          Dates
                        </div>
                        <p className="mt-2 font-bold text-slate-950">{rangeLabel}</p>
                        {nights !== null && (
                          <p className="mt-1 text-sm text-slate-500">
                            {nights} night{nights === 1 ? "" : "s"}
                          </p>
                        )}
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                          <Users className="h-4 w-4" />
                          Travelers
                        </div>
                        <p className="mt-2 font-bold text-slate-950">
                          {travelers} traveler{travelers === 1 ? "" : "s"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {total ? `${formatMoney(total / travelers)} per person` : "Cost pending"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                          <WalletCards className="h-4 w-4" />
                          Estimated Total
                        </div>
                        <p className="text-2xl font-extrabold text-teal-900">
                          {total ? formatMoney(total) : "Add prices"}
                        </p>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {breakdown.map(({ label, value, Icon }) => (
                          <div key={label} className="rounded-xl bg-white px-3 py-2 ring-1 ring-teal-100">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                              <Icon className="h-3.5 w-3.5" />
                              {label}
                            </div>
                            <p className="mt-1 font-bold text-slate-900">{value ? formatMoney(value) : "$0"}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {(links.length > 0 || option.notes) && (
                      <div className="mt-5 space-y-3">
                        {links.length > 0 && (
                          <div>
                            <p className="mb-2 text-sm font-semibold text-slate-700">Saved details</p>
                            <div className="flex flex-wrap gap-2">
                              {links.map((item, index) => (
                                <a
                                  key={item._id || `${item.url}-${index}`}
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{item.name || item.category || "Saved link"}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        {option.notes && (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-sm font-semibold text-slate-700">Notes</p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">{option.notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        onClick={() => navigate(`/trips/${featured._id}/options/${option._id}`)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-slate-800"
                      >
                        View Details
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlannedOption(featured)}
                        disabled={deletingIds.has(featured._id)}
                        className={`inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 font-semibold text-rose-700 transition hover:bg-rose-50 ${
                          deletingIds.has(featured._id) ? "cursor-not-allowed opacity-50" : ""
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingIds.has(featured._id) ? "Deleting..." : "Delete Option"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

        {/* Rest of upcoming trips (grouped by year) */}
        {orderedYears.length ? (
          orderedYears.map((year) => (
            <section key={year} className="mb-10">
              <h3 className="mb-4 text-2xl font-bold text-slate-900">{year}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups[year].map((trip) => {
                  const option = trip.committedInstance;
                  const total = optionTotal(option);
                  const travelers = Math.max(1, Number(trip.travelers) || 1);
                  const links = selectedCostItems(option).filter((item) => item.url).length;

                  return (
                    <article
                      key={trip._id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="relative aspect-[16/10] bg-slate-100">
                        <img
                          src={getMissionImageSrc(trip)}
                          alt={missionTitle(trip)}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={handleImageError}
                        />
                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                          Planned
                        </span>
                      </div>
                      <div className="p-4">
                        <h4 className="line-clamp-1 text-lg font-bold text-slate-950">
                          {missionTitle(trip)}
                        </h4>
                        <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-600">
                          {missionSubtitle(trip)}
                        </p>

                        <div className="mt-4 space-y-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-slate-400" />
                            <span>{fmtRangeShort(option.trip_start, option.trip_end) || "Dates not set"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span className="truncate">
                              {option.destination || trip.location_address || "Destination not set"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <div className="rounded-xl bg-slate-50 p-2">
                            <p className="text-[11px] font-semibold text-slate-500">Total</p>
                            <p className="mt-0.5 font-bold text-slate-950">{total ? formatMoney(total) : "$0"}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-2">
                            <p className="text-[11px] font-semibold text-slate-500">Per Person</p>
                            <p className="mt-0.5 font-bold text-slate-950">
                              {total ? formatMoney(total / travelers) : "$0"}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-2">
                            <p className="text-[11px] font-semibold text-slate-500">Links</p>
                            <p className="mt-0.5 font-bold text-slate-950">{links}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/trips/${trip._id}/options/${option._id}`)}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            View
                            <ArrowRight className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePlannedOption(trip)}
                            disabled={deletingIds.has(trip._id)}
                            className={`inline-flex items-center justify-center rounded-xl border border-rose-200 px-3 py-2 text-rose-700 hover:bg-rose-50 ${
                              deletingIds.has(trip._id) ? "cursor-not-allowed opacity-50" : ""
                            }`}
                            aria-label="Delete planned option"
                            title="Delete planned option"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          hasLoadedTrips && !featured && planningBoards.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-semibold text-slate-900">Start planning your trips!</p>
              <p className="mt-1 text-slate-600">Add a destination to start comparing options.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MyTrips;
