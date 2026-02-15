import { useContext, useEffect, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { GlobalState } from "@/context/GlobalState.jsx";

const NAV = [
  { label: "Mission", to: "/mytrips" },
  { label: "Workbench", to: "/explore" },
  { label: "Archive", to: "/previous-trips" },
];

const Header = () => {
  const state = useContext(GlobalState);
  const api = state?.userAPI ?? state?.UserAPI;
  const [isLogged, setIsLogged] = api?.isLogged ?? [false, () => {}];
  const [userID] = api?.userID ?? [""];
  const [token] = state?.token ?? [null];
  const isAuthed = Boolean(token) && isLogged;

  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const hideExact = ["/", "/login", "/register"];
  const hideStartsWith = ["/search", "/trips", "/profile", "/about", "/wishlist-detail", "/view-all"];
  const shouldHide =
    hideExact.includes(location.pathname) ||
    hideStartsWith.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  if (!isAuthed || shouldHide) return null;

  const logoutUser = async () => {
    try {
      setIsLogged?.(false);
      state?.setToken?.(null);
      await axios.get("/api/user/logout", { withCredentials: true });
    } catch {
      // ignore logout response errors; local cleanup still executes
    }
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5">
      <div className="gg-glass mx-auto max-w-6xl rounded-3xl border border-white/70">
        <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-5">
          <Link to="/mytrips" className="group inline-flex items-center gap-3 rounded-2xl px-2 py-1">
            <span className="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-700/30">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7h10l2 3h6" strokeLinecap="round" />
                <path d="M8 17h.01M17 17h.01" strokeLinecap="round" />
                <path d="M7 17h-1a2 2 0 01-2-2V7a2 2 0 012-2h3l2 2h7a2 2 0 012 2v6a2 2 0 01-2 2h-1" strokeLinecap="round" />
              </svg>
            </span>
            <div className="leading-none">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-700">Getaway</p>
              <p className="text-lg font-extrabold text-slate-900">Genius</p>
            </div>
          </Link>

          <div className="hidden items-center gap-1 rounded-full border border-slate-200/70 bg-white/70 p-1 sm:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/mytrips"}
                className={({ isActive }) =>
                  [
                    "rounded-full px-3 py-1.5 text-sm font-semibold transition",
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <Link
              to={`/profile/${userID}`}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Profile
            </Link>
            <button
              onClick={logoutUser}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Logout
            </button>
          </div>

          <button
            className="sm:hidden rounded-xl border border-slate-200 bg-white p-2 text-slate-700"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {open && (
          <div className="border-t border-slate-200/70 px-3 pb-3 pt-2 sm:hidden">
            <div className="grid gap-2">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/mytrips"}
                  className={({ isActive }) =>
                    [
                      "rounded-xl px-4 py-2 text-sm font-semibold transition",
                      isActive
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-700 hover:bg-slate-100",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to={`/profile/${userID}`}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-700"
              >
                Profile
              </Link>
              <button
                onClick={logoutUser}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
