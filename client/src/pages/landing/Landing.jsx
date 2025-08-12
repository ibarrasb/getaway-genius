import { Link } from "react-router-dom"

const CTA = ({ to, children, variant = "primary" }) => {
  const base =
    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2"
  const styles =
    variant === "primary"
      ? "bg-indigo-600 text-white shadow-indigo-500/30 shadow hover:bg-indigo-700 focus:ring-indigo-300"
      : "border border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-slate-300"
  return (
    <Link to={to} className={`${base} ${styles}`}>
      {children}
    </Link>
  )
}

const Stat = ({ label, value }) => (
  <div className="rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
  </div>
)

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50 text-slate-900">
      {/* top bar */}
      <header className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <span className="text-indigo-600">Getaway</span>
          <span>Genius</span>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* bg blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-200/50 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-fuchsia-200/50 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
          {/* copy */}
          <div>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
              Plan Smarter, <span className="text-indigo-600">Travel Further.</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Find, plan, and save your perfect trip—affordable adventures await.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <CTA to="/login">Get Started</CTA>
              <CTA to="/discover" variant="secondary">Explore Destinations</CTA>
            </div>

            {/* mini trust row */}
            <div className="mt-6 flex items-center gap-6 text-sm text-slate-500">
              <span>✓ Budget planner</span>
              <span>✓ Weather insights</span>
              <span>✓ Wishlists</span>
            </div>
          </div>

          {/* preview card */}
          <div className="rounded-3xl bg-white/70 p-6 shadow-xl ring-1 ring-slate-200 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Sample Trip</p>
                <h3 className="mt-1 text-xl font-semibold">Miami Weekend</h3>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                $412 est.
              </span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <Stat label="Flights" value="$220" />
              <Stat label="Hotel" value="$150" />
              <Stat label="Car" value="$42" />
            </div>

            <div className="mt-6 h-28 rounded-2xl bg-gradient-to-r from-indigo-200 via-indigo-100 to-transparent" />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-slate-200 bg-white/60">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold">How It Works</h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">1️⃣ Discover</h3>
              <p className="mt-2 text-sm text-slate-600">
                Filter trips by location, date, and budget.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">2️⃣ Plan &amp; Save</h3>
              <p className="mt-2 text-sm text-slate-600">
                Favorite destinations, set budgets, and get weather insights.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">3️⃣ Go &amp; Enjoy</h3>
              <p className="mt-2 text-sm text-slate-600">
                Seamless trip organization with wishlist &amp; details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold">Ready for Your Next Getaway?</h2>
          <div className="mt-6 flex justify-center">
            <CTA to="/login">Start Planning</CTA>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Landing
