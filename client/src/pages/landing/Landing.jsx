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
  const problemCards = [
    {
      label: "Hotel contenders",
      value: "5",
      detail: "Only the planned stay counts",
    },
    {
      label: "Split stay",
      value: "2",
      detail: "Count both when that is the plan",
    },
    {
      label: "Trip total",
      value: "$2,184",
      detail: "Built from selected items",
    },
  ];

  return (
    <div className="gg-page relative overflow-hidden">
      <section className="gg-container grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="gg-glass gg-fade-up rounded-[2rem] border border-white/70 p-7 sm:p-10">
          <img
            src="/getaway-genius-logo.png"
            alt="Getaway Genius"
            className="mb-5 h-auto w-full max-w-xs object-contain sm:max-w-sm"
          />
          <p className="gg-pill inline-flex">Trip planning without budget confusion</p>
          <h1 className="gg-hero-title gg-title-xl mt-5 text-slate-900">
            Compare every idea.
            <span className="block bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Plan only what counts.
            </span>
          </h1>
          <p className="gg-lead gg-fade-up gg-fade-up-delay-1 mt-5 max-w-xl">
            Getaway Genius helps you compare hotels, flights, tickets, cars, dates, and notes
            without accidentally adding every contender to the final trip total. Use Workbench to
            compare, Mission to see the real plan, and Archive to keep past trips out of the way.
          </p>
          <div className="gg-fade-up gg-fade-up-delay-2 mt-8 flex flex-wrap gap-3">
            <CTA to="/login" primary>
              Open Mission
            </CTA>
            <CTA to="/about">See How It Works</CTA>
          </div>
          <div className="gg-fade-up gg-fade-up-delay-3 mt-6 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Workbench comparisons</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Planned item totals</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5">Mission-ready details</span>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="gg-glass gg-fade-up gg-fade-up-delay-1 rounded-[2rem] border border-white/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Planning Problem</p>
            <div className="mt-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-teal-200">Orlando family trip</p>
                  <h3 className="mt-1 text-2xl font-bold">Compare vs. Commit</h3>
                </div>
                <p className="rounded-full bg-teal-300/20 px-3 py-1 text-xs font-semibold text-teal-100">
                  Planned
                </p>
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                {problemCards.map((item) => (
                  <div key={item.label} className="rounded-xl bg-white/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-slate-200">{item.label}</p>
                      <p className="text-xl font-bold">{item.value}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Metric label="Primary Views" value="3" />
            <Metric label="Comparison Noise" value="0" />
          </div>
        </div>
      </section>

      <section className="gg-container mt-7 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Workbench",
            desc: "Build planning boards, add trip options, and compare category-specific costs.",
          },
          {
            title: "Mission",
            desc: "Set one option as the plan and see the image, dates, destination, travelers, links, notes, and total.",
          },
          {
            title: "Archive",
            desc: "Move completed planned trips out of the active view while keeping the details accessible.",
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
