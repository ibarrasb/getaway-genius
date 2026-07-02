import { Link } from "react-router-dom";

const CTA = ({ to, children, primary = false }) => (
  <Link
    to={to}
    className={[
      "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition active:scale-[0.98]",
      primary
        ? "bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-lg shadow-cyan-900/20 hover:brightness-105"
        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    ].join(" ")}
  >
    {children}
  </Link>
);

const Metric = ({ label, value }) => (
  <div className="gg-card p-4">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
  </div>
);

const Landing = () => {
  return (
    <div className="gg-page relative overflow-hidden">
      <section className="gg-container grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="gg-glass gg-fade-up rounded-[2rem] border border-white/70 p-7 sm:p-10">
          <img
            src="/getaway-genius-logo.png"
            alt="Getaway Genius"
            className="mb-5 h-auto w-full max-w-xs object-contain sm:max-w-sm"
          />
          <p className="gg-pill inline-flex">Trip intelligence for real people</p>
          <h1 className="gg-hero-title gg-title-xl mt-5 text-slate-900">
            Your next getaway
            <span className="block bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
              starts with clarity.
            </span>
          </h1>
          <p className="gg-lead gg-fade-up gg-fade-up-delay-1 mt-5 max-w-xl">
            Getaway Genius helps you shape trips around budget, timing, and mood. Compare the full
            cost, keep contenders in one workspace, and lock in the option that feels right.
          </p>
          <div className="gg-fade-up gg-fade-up-delay-2 mt-8 flex flex-wrap gap-3">
            <CTA to="/login" primary>
              Start Planning
            </CTA>
            <CTA to="/about">See How It Works</CTA>
          </div>
          <div className="gg-fade-up gg-fade-up-delay-3 mt-6 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Cost-first planning</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Weather signals</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Shortlist + wishlist</span>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="gg-glass gg-fade-up gg-fade-up-delay-1 rounded-[2rem] border border-white/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Live Scenario</p>
            <div className="mt-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-teal-200">Potential getaway</p>
                  <h3 className="mt-1 text-2xl font-bold">San Diego, CA</h3>
                </div>
                <p className="rounded-full bg-teal-300/20 px-3 py-1 text-xs font-semibold text-teal-100">
                  Best-value window
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-slate-200">Flights</p>
                  <p className="mt-1 text-xl font-bold">$238</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-slate-200">Stay</p>
                  <p className="mt-1 text-xl font-bold">$410</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-slate-200">Transit</p>
                  <p className="mt-1 text-xl font-bold">$72</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-slate-200">Extra</p>
                  <p className="mt-1 text-xl font-bold">$95</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Metric label="Saved Comparisons" value="42+" />
            <Metric label="Avg. Budget Delta" value="-17%" />
          </div>
        </div>
      </section>

      <section className="gg-container mt-7 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Scout options",
            desc: "Search places, pull photos, and snapshot quick cost assumptions.",
          },
          {
            title: "Pressure-test plans",
            desc: "Stack trip variants and see when shifting dates lowers total spend.",
          },
          {
            title: "Commit with confidence",
            desc: "Lock your chosen instance and keep the rest as future playbooks.",
          },
        ].map((item, idx) => (
          <article key={item.title} className={`gg-card gg-fade-up p-5 ${idx ? "gg-fade-up-delay-1" : ""}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Step {idx + 1}</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
          </article>
        ))}
      </section>
    </div>
  );
};

export default Landing;
