import { useContext } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { GlobalState } from "@/context/GlobalState.jsx";

const NAV = [
  { label: "Mission", to: "/mission" },
  { label: "Workbench", to: "/workbench" },
  { label: "Archive", to: "/archive" },
];

const Header = () => {
  const state = useContext(GlobalState);
  const api = state?.userAPI ?? state?.UserAPI;
  const [isLogged, setIsLogged] = api?.isLogged ?? [false, () => {}];
  const [userID] = api?.userID ?? [""];
  const [token] = state?.token ?? [null];
  const isAuthed = Boolean(token) && isLogged;

  const location = useLocation();
  const navigate = useNavigate();

  const hideExact = ["/", "/login", "/register", "/not-logged-in"];
  const hideLogoExact = [...hideExact, "/about"];
  const hideStartsWith = ["/search", "/trips", "/profile", "/about", "/wishlist-detail", "/view-all"];
  const shouldHideDesktop =
    hideExact.includes(location.pathname) ||
    hideStartsWith.some((p) => location.pathname.startsWith(p));

  if (!isAuthed || hideLogoExact.includes(location.pathname)) return null;

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
    <>
      <div className="px-3 pt-3 sm:hidden">
        <Link to="/mission" className="inline-flex items-center">
          <img
            src="/getaway-genius-logo.png"
            alt="Getaway Genius"
            className="h-14 w-auto max-w-[220px] object-contain"
          />
        </Link>
      </div>

      {!shouldHideDesktop && (
        <header className="sticky top-0 z-50 hidden px-3 pt-3 sm:block sm:px-5">
          <div className="gg-glass mx-auto max-w-6xl rounded-3xl border border-white/70">
        <div className="flex h-[72px] items-center justify-between gap-3 px-3 py-2 sm:h-[76px] sm:px-5">
          <Link to="/mission" className="group inline-flex h-full items-center gap-3 rounded-2xl px-2">
            <img
              src="/getaway-genius-logo.png"
              alt="Getaway Genius"
              className="h-[60px] w-auto max-w-[240px] object-contain sm:h-[68px] sm:max-w-[300px]"
            />
          </Link>

          <div className="hidden items-center gap-1 rounded-full border border-slate-200/70 bg-white/70 p-1 sm:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/mission"}
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
        </div>
          </div>
        </header>
      )}
    </>
  );
};

export default Header;
