import ExploreGrid from "@/components/grids/ExploreGrid";
import WishlistGrid from "@/components/grids/WishlistGrid";
import { Link } from "react-router-dom";

const ExplorePage = () => {
  return (
    <div className="gg-page">
      <div className="gg-container space-y-8">
        <section className="gg-glass rounded-[2rem] border border-white/70 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Planning Studio</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="gg-hero-title gg-title-lg text-slate-900">
                Compare trips by date.
              </h1>
              <p className="gg-lead mt-2 max-w-2xl">
                Start with a travel window, add destination options, and compare the real links and prices side by side.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800 lg:block">
                Tip: set one option as the plan when you are ready to move it into your active trips.
              </div>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:brightness-105"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                Create Board
              </Link>
            </div>
          </div>
        </section>

        <section>
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Planning Boards</h2>
          </header>
          <ExploreGrid />
        </section>

        <section>
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Saved Shortlists</h2>
          </header>
          <WishlistGrid />
        </section>
      </div>
    </div>
  );
};

export default ExplorePage;
