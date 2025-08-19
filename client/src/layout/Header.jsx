import { useContext, useState } from "react"
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import { GlobalState } from "@/context/GlobalState.jsx"

const NAV = [
  {
    label: "My Trips",
    to: "/mytrips",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 7h18M3 12h18M3 17h18" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Explore",
    to: "/explore",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="11" cy="11" r="7" strokeWidth="2" />
        <path d="M21 21l-3.6-3.6" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Past",
    to: "/previous-trips",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="9" strokeWidth="2" />
        <path d="M12 7v5l3 2" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
]

const Header = () => {
  const state = useContext(GlobalState)
  const api = state?.userAPI ?? state?.UserAPI
  const [isLogged, setIsLogged] = api?.isLogged ?? [false, () => {}]
  const [userID] = api?.userID ?? [""]
  const [token] = state?.token ?? [null]
  const isAuthed = Boolean(token) && isLogged
  // if (!isAuthed || shouldHide) return null
  

  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // hide on these routes
  const hideExact = ["/"]
  const hideStartsWith = ["/search", "/trips", "/profile", "/about", "/wishlist-detail", "/view-all",]
  const shouldHide =
  hideExact.includes(location.pathname) ||
  hideStartsWith.some((p) => location.pathname.startsWith(p))
  if (!isAuthed || shouldHide) return null
// Header.jsx
const logoutUser = async () => {
  try {
    // drop auth in memory first so routes re-evaluate immediately
    const setIsLogged = (state?.userAPI ?? state?.UserAPI)?.isLogged?.[1]
    setIsLogged?.(false)
    state?.setToken?.(null)            // <-- ensure GlobalState exposes setToken

    await axios.get("/api/user/logout", { withCredentials: true })
  } catch {}
  localStorage.clear()
  navigate("/login", { replace: true }) // send to login to avoid race with other pages
}


  
  return (
    <header className="sticky top-0 z-50 w-full">
      {/* glowing gradient bar */}
      <div className="pointer-events-none h-[2px] w-full bg-gradient-to-r from-indigo-500 via-sky-400 to-fuchsia-500 opacity-80" />

      {/* glass top bar */}
      <div className="border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* brand */}
          <Link
            to="/mytrips"
            className="group relative inline-flex items-center gap-2 rounded-2xl px-2 py-1"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white shadow-md ring-1 ring-black/5 transition-transform duration-300 group-hover:rotate-6 group-active:scale-95">
              {/* compass-ish mark */}
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="12" r="5" strokeWidth="2" />
              </svg>
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                Getaway
              </span>
              <span className="text-lg font-extrabold text-slate-900">Genius</span>
            </div>
            {/* subtle glow */}
            <span className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-indigo-600/0 via-indigo-600/0 to-fuchsia-600/0 blur-xl transition-opacity duration-300 group-hover:from-indigo-600/20 group-hover:to-fuchsia-600/20" />
          </Link>

          {/* right actions (desktop) */}
          <nav className="hidden items-center gap-2 sm:flex">
            <Link
              to="/about"
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-transparent transition hover:bg-slate-100 hover:ring-slate-200"
            >
              About
            </Link>
            <Link
              to={`/profile/${userID}`}
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-transparent transition hover:bg-slate-100 hover:ring-slate-200"
            >
              Profile
            </Link>
            <button
              onClick={logoutUser}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 ring-1 ring-transparent transition hover:bg-rose-50 hover:ring-rose-200"
            >
              Logout
            </button>
          </nav>

          {/* mobile menu button */}
          <button
            className="sm:hidden rounded-xl p-2 text-slate-700 ring-1 ring-slate-200/60 transition hover:bg-slate-50"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* nav strip with animated active pill */}
      <div className="border-b border-slate-200/60 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4">
          <ul className="relative flex items-center gap-1 py-2">
            {/* gradient underline across strip */}
            <li className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-slate-300/80 to-transparent" />
            {NAV.map(({ to, label, icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === "/mytrips"}
                  className={({ isActive }) =>
                    [
                      "group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100",
                    ].join(" ")
                  }
                >
                  <span
                    className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-current ring-1 ring-black/5 transition-all group-hover:scale-105"
                    aria-hidden
                  >
                    {icon}
                  </span>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* mobile drawer */}
      {open && (
        <div className="sm:hidden border-b border-slate-200/60 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-4 py-4 space-y-2">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/mytrips"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  [
                    "block rounded-2xl px-4 py-3 text-sm font-semibold ring-1 transition",
                    isActive
                      ? "bg-slate-900 text-white ring-slate-900/10"
                      : "text-slate-700 ring-slate-200 hover:bg-slate-100",
                  ].join(" ")
                }
              >
                {label}
              </NavLink>
            ))}
            <div className="mt-3 flex gap-2">
              <Link
                to="/about"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-2xl px-4 py-3 text-center text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                About
              </Link>
              <Link
                to={`/profile/${userID}`}
                onClick={() => setOpen(false)}
                className="flex-1 rounded-2xl px-4 py-3 text-center text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  setOpen(false)
                  logoutUser()
                }}
                className="flex-1 rounded-2xl px-4 py-3 text-center text-sm font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
