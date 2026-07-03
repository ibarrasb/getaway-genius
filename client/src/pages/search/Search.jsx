import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CalendarDays, Users, ArrowLeft } from "lucide-react";
import { GlobalState } from "@/context/GlobalState.jsx";
import TripDateRange from "@/components/TripDateRange";
import { fmtRangeShort } from "../utils/localDates";

const Search = () => {
  const navigate = useNavigate();
  const state = useContext(GlobalState);
  const api = state?.userAPI ?? state?.UserAPI;
  const [email] = api?.email ?? [""];
  const [token] = state?.token ?? [null];
  const [setCallback] = api?.callback?.slice(1) ?? [() => {}];

  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);
  const [board, setBoard] = useState({
    board_title: "",
    trip_start: "",
    trip_end: "",
    travelers: 1,
  });

  const dateLabel = fmtRangeShort(board.trip_start, board.trip_end);

  const handleCreateBoard = async () => {
    if (!email) {
      setCreateMsg("Please log in to create a planning board.");
      return;
    }

    if (!board.trip_start || !board.trip_end) {
      setCreateMsg("Choose the dates you want to compare.");
      return;
    }

    try {
      setCreating(true);
      setCreateMsg(null);

      const fallbackTitle = dateLabel ? `${dateLabel} Trip` : "New Planning Board";
      const payload = {
        user_email: email,
        board_title: board.board_title.trim() || fallbackTitle,
        board_start: board.trip_start,
        board_end: board.trip_end,
        travelers: Math.max(1, Number(board.travelers) || 1),
        location_address: board.board_title.trim() || fallbackTitle,
        trip_start: board.trip_start,
        trip_end: board.trip_end,
        image_url: "",
        isFavorite: false,
        instances: [],
      };

      const { data } = await axios.post("/api/trips/boards", payload, {
        ...(token ? { headers: { Authorization: token } } : {}),
      });

      setCallback?.((v) => !v);
      navigate(data?.trip?._id ? `/trips/${data.trip._id}` : "/workbench", { replace: true });
    } catch (err) {
      console.error(err);
      setCreateMsg(err?.response?.data?.msg || "Error creating planning board");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="gg-page min-h-screen">
      <header className="gg-container py-4">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/workbench", { replace: true }))}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </header>

      <section className="gg-container">
        <div className="gg-glass rounded-3xl border border-white/70 p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
                Planning Board
              </p>
              <h1 className="gg-title-lg mt-3 text-slate-900">When are you trying to travel?</h1>
              <p className="gg-lead mt-2 max-w-2xl">
                Start with your travel window, then compare Orlando, New York, Los Angeles,
                hotels, Airbnbs, flights, tickets, and rentals inside the same board.
              </p>

              <div className="mt-8 grid gap-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Board name
                  </span>
                  <input
                    type="text"
                    value={board.board_title}
                    onChange={(e) =>
                      setBoard((prev) => ({ ...prev, board_title: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    placeholder="January birthday trip, Spring break ideas..."
                  />
                </label>

                <TripDateRange newInstance={board} setNewInstance={setBoard} />

                <label className="block max-w-xs">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Travelers
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={board.travelers}
                    onChange={(e) =>
                      setBoard((prev) => ({ ...prev, travelers: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </label>

                {createMsg && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {createMsg}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCreateBoard}
                  disabled={creating || !board.trip_start || !board.trip_end}
                  className="inline-flex w-full max-w-xs items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create Planning Board"}
                </button>
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                <CalendarDays className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                {board.board_title || "New Planning Board"}
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  <span>{dateLabel || "Dates not selected"}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
                  <Users className="h-4 w-4 text-slate-500" />
                  <span>
                    {Math.max(1, Number(board.travelers) || 1)} traveler
                    {Math.max(1, Number(board.travelers) || 1) === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                After creating this, add destination options and paste the links you are comparing.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Search;
