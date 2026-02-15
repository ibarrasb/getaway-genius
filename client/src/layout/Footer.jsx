import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="px-3 pb-4 pt-10 sm:px-5">
      <div className="gg-glass mx-auto grid max-w-6xl gap-5 rounded-3xl border border-white/70 px-5 py-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-700">Getaway Genius</p>
          <h3 className="mt-2 text-lg font-bold text-slate-900">From idea to itinerary, with less guesswork.</h3>
          <p className="mt-1 text-sm text-slate-600">
            Build trips around budget, timing, and vibe. Keep the spark, lose the spreadsheet fatigue.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Link to="/about" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
            About
          </Link>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">© {year} Getaway Genius</p>
    </footer>
  );
};

export default Footer;
