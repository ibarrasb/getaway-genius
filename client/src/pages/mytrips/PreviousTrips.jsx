import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { CalendarDays, MapPin, ArrowRight } from "lucide-react";
import { GlobalState } from "@/context/GlobalState.jsx";
import { fmtRangeShort, toLocalDate, addDays } from "../utils/localDates";
import { getTripImageSrc } from "../utils/image";

const formatMoney = (value) =>
  (Number(value) || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const optionTotal = (option = {}) => {
  const itemTotal = (option.cost_items || []).reduce((sum, item) => {
    if (!item || item.is_selected === false) return sum;
    return sum + (Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1);
  }, 0);

  return (
    itemTotal ||
    (Number(option.stay_expense) || 0) +
      (Number(option.travel_expense) || 0) +
      (Number(option.car_expense) || 0) +
      (Number(option.other_expense) || 0)
  );
};

const plannedOption = (trip) =>
  (trip.instances || []).find(
    (option) => option._id?.toString() === trip.committedInstanceId?.toString()
  );

const PreviousTrips = () => {
  const state = useContext(GlobalState);
  const api = state?.userAPI ?? state?.UserAPI;
  const [email] = api?.email ?? [""];
  const [token] = state?.token ?? [null];

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      if (!email) {
        setTrips([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const headers = token ? { Authorization: token } : undefined;
        const { data } = await axios.get("/api/trips/boards", {
          params: { email },
          headers,
          signal: controller.signal,
        });
        setTrips(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error(err);
          setError("Failed to load archive.");
        }
      } finally {
        setLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [email, token]);

  const archivedTrips = useMemo(() => {
    const now = new Date();

    return trips
      .map((trip) => ({ ...trip, plannedOption: plannedOption(trip) }))
      .filter((trip) => {
        if (!trip.plannedOption) return false;
        const endInclusive = addDays(trip.plannedOption.trip_end, 1);
        return endInclusive && endInclusive < now;
      })
      .sort((a, b) => {
        const aEnd = toLocalDate(a.plannedOption.trip_end)?.getTime() || 0;
        const bEnd = toLocalDate(b.plannedOption.trip_end)?.getTime() || 0;
        return bEnd - aEnd;
      });
  }, [trips]);

  if (loading) {
    return (
      <div className="gg-page">
        <div className="gg-container">
          <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            Loading archive...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gg-page">
      <div className="gg-container space-y-8">
        <section className="gg-glass rounded-[2rem] border border-white/70 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Archive</p>
          <h1 className="gg-hero-title gg-title-lg mt-3 text-slate-900">Past missions.</h1>
          <p className="gg-lead mt-2 max-w-2xl">
            Completed planned trips live here so Mission stays focused on what is active and upcoming.
          </p>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {archivedTrips.length ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archivedTrips.map((trip) => {
              const option = trip.plannedOption;
              const image = option.image_url || getTripImageSrc(trip);
              const title = trip.board_title || option.destination || trip.location_address || "Archived Trip";
              const subtitle = option.option_title || option.destination || trip.location_address || "Planned option";
              const total = optionTotal(option);

              return (
                <article
                  key={trip._id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="aspect-[16/10] bg-slate-100">
                    <img
                      src={image}
                      alt={title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <h2 className="line-clamp-1 text-lg font-bold text-slate-950">{title}</h2>
                    <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-600">{subtitle}</p>

                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                        <span>{fmtRangeShort(option.trip_start, option.trip_end) || "Dates not set"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="truncate">{option.destination || trip.location_address || "Destination not set"}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-sm font-semibold text-slate-500">Estimated total</span>
                      <span className="font-bold text-slate-950">{total ? formatMoney(total) : "$0"}</span>
                    </div>

                    <Link
                      to={`/trips/${trip._id}/options/${option._id}`}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      View Details
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900">No archived missions yet.</p>
            <p className="mt-1 text-slate-600">Past planned trips will appear here after their travel dates pass.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviousTrips;
