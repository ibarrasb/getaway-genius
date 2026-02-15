import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/", { replace: true });
  };

  return (
    <div className="gg-page min-h-screen">
      <header className="gg-container py-4">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" />
          </svg>
          Back
        </button>
      </header>

      <section className="gg-container grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="gg-glass rounded-[2rem] border border-white/70 p-7 sm:p-10">
          <p className="gg-pill inline-flex">Why Getaway Genius Exists</p>
          <h1 className="gg-hero-title gg-title-lg mt-4 text-slate-900">
            Planning should feel
            <span className="block bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              like momentum, not friction.
            </span>
          </h1>
          <p className="gg-lead mt-4">
            Getaway Genius is built for travelers who want clear tradeoffs. It brings trip ideas,
            cost structure, weather context, and shortlist thinking into one workspace so you can
            decide faster and with more confidence.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Compare total spend across options",
              "Experiment with different date windows",
              "Promote best instances into active missions",
              "Keep inspiration organized in wishlists",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="gg-glass rounded-[2rem] border border-white/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Product Lens</p>
          <div className="mt-4 space-y-3">
            {[
              { title: "Clarity over noise", desc: "The UI prioritizes decision-making signals first." },
              { title: "Real constraints", desc: "Budget and dates are first-class citizens, not afterthoughts." },
              { title: "Iterative planning", desc: "You can branch, compare, then commit with intent." },
            ].map((item) => (
              <article key={item.title} className="gg-card rounded-2xl p-4">
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="gg-container mt-7 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Discover",
            desc: "Search destinations and quickly create candidate trips.",
          },
          {
            title: "Design",
            desc: "Create multiple trip instances and stress-test budget assumptions.",
          },
          {
            title: "Decide",
            desc: "Commit the best option and move it into your active mission view.",
          },
        ].map((item) => (
          <article key={item.title} className="gg-card rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Workflow</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
          </article>
        ))}
      </section>
    </div>
  );
};

export default About;
