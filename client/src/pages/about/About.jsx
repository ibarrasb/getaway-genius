// src/pages/about/About.jsx
import { useNavigate, Link } from "react-router-dom"

const About = () => {
  const navigate = useNavigate()
  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate("/", { replace: true })
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-indigo-50 via-white to-slate-50">
      {/* top gradient accent */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full blur-3xl
                   hidden sm:block
                   sm:-top-24 sm:h-[320px] sm:w-[560px]
                   md:-top-40 md:h-[450px] md:w-[850px]
                   bg-[radial-gradient(closest-side,rgba(99,102,241,0.25),transparent)]"
        aria-hidden
      />

      {/* Header bar */}
      <header className="mx-auto w-full max-w-6xl px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" />
            </svg>
            Back
          </button>
          <span />
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-2 pb-8 sm:pt-4 sm:pb-10">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-4 sm:p-6 md:p-8 shadow-xl ring-1 ring-slate-200 backdrop-blur">
          <div className="grid min-w-0 items-center gap-6 sm:gap-8 md:grid-cols-2">
            {/* Text */}
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                <span className="inline-block h-2 w-2 rounded-full bg-indigo-600" />
                Travel smarter, spend wiser
              </div>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:mt-4 sm:text-3xl md:text-4xl">
                Getaway <span className="text-indigo-600">Genius</span>
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                Your go-to companion for planning budget-friendly getaways. Track and compare the
                total cost of trips—flights, stays, cars, and everything in between—so you can
                choose the most cost-effective adventure with confidence.
              </p>

              {/* trust badges */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 sm:mt-6 sm:gap-3 sm:text-xs">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M12 1v22M3 6h18M3 12h18M3 18h18" />
                  </svg>
                  Cost breakdowns
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 1118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Smart comparisons
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M12 7v5l3 2" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                  Date-flex insights
                </span>
              </div>
            </div>

            {/* Illustration */}
            <div className="relative mx-auto w-full max-w-[420px] sm:max-w-[520px] md:max-w-none">
              {/* hide glow blobs on mobile to avoid overflow */}
              <div className="pointer-events-none absolute -right-6 -top-6 hidden h-40 w-40 rounded-full bg-fuchsia-300/20 blur-2xl md:block" />
              <div className="pointer-events-none absolute -bottom-8 -left-6 hidden h-44 w-44 rounded-full bg-sky-300/20 blur-2xl md:block" />

              <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-600 to-fuchsia-600 p-1 shadow-lg">
                <div className="rounded-xl bg-white/95 p-3 sm:p-5">
                  <div className="grid gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="h-14 w-20 flex-none overflow-hidden rounded-lg bg-slate-100" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="truncate text-sm font-semibold text-slate-900">Weekend Escape #{i}</span>
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                              ${100 * i + 249}
                            </span>
                          </div>
                          <p className="truncate text-xs text-slate-500">Fri — Sun · Flights + Stay</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Best value this month</span>
                      <span className="text-xs text-emerald-700">−18%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-slate-500">Preview mockup — not real data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:py:8">
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Compare Everything", desc: "Flights, stays, cars, fees—see the real total and avoid surprises.",
              icon: <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" /> },
            { title: "Date Flex Magic", desc: "Slide a date range and instantly spot cheaper windows.",
              icon: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" /></>) },
            { title: "Wishlist & Favorites", desc: "Collect ideas, share with friends, and plan together.",
              icon: (<path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.09 4.81 13.76 4 15.5 4 18 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />) },
            { title: "Clean, Fast UI", desc: "Modern, responsive design that feels great on any device.",
              icon: <path d="M3 6h18M9 6v12m6-12v12M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14" strokeLinecap="round" /> },
            { title: "Privacy First", desc: "Only you control your trip data. Log out anytime.",
              icon: (<><path d="M12 12v6" strokeLinecap="round" /><circle cx="12" cy="8" r="3" /><path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 1118 0z" /></>) },
            { title: "Quick Add", desc: "Add trips in seconds. Refine details when you’re ready.",
              icon: (<><path d="M12 5v14M5 12h14" strokeLinecap="round" /><circle cx="12" cy="12" r="9" /></>) },
          ].map((f, i) => (
            <div key={i} className="group rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 transition group-hover:scale-105">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    {f.icon}
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
              </div>
              <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-8">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 sm:p-8 text-center shadow-xl ring-1 ring-slate-200 backdrop-blur">
          <p className="text-base font-medium text-slate-900 sm:text-lg">
            “I used to juggle tabs and spreadsheets. Now I see the full cost picture in one place—
            and I’ve already saved on my last two trips.”
          </p>
          <p className="mt-2 text-sm text-slate-600">— A happy traveler</p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-2 sm:pb-16 sm:pt-4">
        <div className="flex flex-col items-center gap-3 sm:gap-4 rounded-3xl border border-slate-200 bg-white/70 p-6 sm:p-8 text-center shadow-xl ring-1 ring-slate-200 backdrop-blur">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Ready to explore smarter?</h2>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            Start planning with clear totals, flexible dates, and a clean UI that makes travel fun again.
          </p>
          <div className="mt-2 grid w-full grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div className="flex flex-col items-center">
              <span className="text-lg">📊</span>
              <p>Track total trip costs</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg">🗓</span>
              <p>Find cheapest travel dates</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
