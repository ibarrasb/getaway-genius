import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  const problemPoints = [
    "You may compare five hotels, but only one should count toward the trip total.",
    "You may split a stay across two places, and both should count when that is the real plan.",
    "Flights, tickets, cars, and extras all need different pricing logic.",
    "Once a plan is picked, it should be easy to see the actual trip details without digging.",
  ];

  const productLens = [
    {
      title: "Compare without corrupting the budget",
      desc: "Workbench lets you keep contenders side by side while marking which items actually count toward the plan.",
    },
    {
      title: "Plan around real travel shapes",
      desc: "A trip can have one hotel, split lodging, multiple ticket choices, flight alternatives, rental cars, and notes.",
    },
    {
      title: "Separate planning from the real plan",
      desc: "Mission shows what is actually planned. Archive keeps past missions out of the way.",
    },
  ];

  const workflow = [
    {
      title: "Workbench",
      desc: "Create planning boards, add trip options, compare categories, and decide what should count in the estimate.",
    },
    {
      title: "Mission",
      desc: "Set one option as the plan and see the trip image, dates, destination, travelers, cost breakdown, links, and notes.",
    },
    {
      title: "Archive",
      desc: "Completed planned trips move out of the active view so the app stays focused on current travel decisions.",
    },
  ];

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
            Travel planning breaks when
            <span className="block bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              comparison becomes the plan.
            </span>
          </h1>
          <p className="gg-lead mt-4">
            Getaway Genius is built for the messy middle of trip planning: comparing hotels,
            flights, tickets, cars, dates, and ideas without accidentally adding every possibility
            into the final total. It gives you a Workbench for decisions, a Mission view for the
            actual plan, and an Archive for trips that are done.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {problemPoints.map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="gg-glass rounded-[2rem] border border-white/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Product Lens</p>
          <div className="mt-4 space-y-3">
            {productLens.map((item) => (
              <article key={item.title} className="gg-card rounded-2xl p-4">
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="gg-container mt-7 grid gap-4 md:grid-cols-3">
        {workflow.map((item) => (
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
