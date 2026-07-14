import { useContext } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Archive, Home, LayoutDashboard, PlusCircle, User } from "lucide-react";
import { GlobalState } from "@/context/GlobalState.jsx";

const MobileTabBar = () => {
  const state = useContext(GlobalState);
  const api = state?.userAPI ?? state?.UserAPI;
  const [isLogged] = api?.isLogged ?? [false];
  const [userID] = api?.userID ?? [""];
  const [token] = state?.token ?? [null];
  const location = useLocation();
  const isAuthed = Boolean(token) && isLogged;

  const hiddenRoutes = ["/", "/login", "/register", "/not-logged-in", "/about"];
  if (!isAuthed || hiddenRoutes.includes(location.pathname)) return null;

  const tabs = [
    { label: "Mission", to: "/mission", icon: Home },
    { label: "Boards", to: "/workbench", icon: LayoutDashboard, matches: ["/workbench", "/trips"] },
    { label: "New", to: "/search", icon: PlusCircle },
    { label: "Archive", to: "/archive", icon: Archive },
    { label: "Profile", to: `/profile/${userID}`, icon: User, matches: ["/profile"] },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_-24px_rgba(15,23,42,0.65)] backdrop-blur sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isRouteActive = tab.matches?.some((path) => location.pathname.startsWith(path));

          return (
            <NavLink
              key={tab.label}
              to={tab.to}
              end={tab.to === "/mission" || tab.to === "/archive"}
              className={({ isActive }) => {
                const active = isActive || isRouteActive;
                return [
                  "flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-bold transition",
                  active ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ");
              }}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;
