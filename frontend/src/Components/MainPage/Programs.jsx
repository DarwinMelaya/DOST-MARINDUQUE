const Programs = () => {
  const programs = [
    {
      code: "SSCP",
      name: "Small Enterprise Technology Upgrading Program (SETUP) — Community/Cluster Support (SSCP)",
      color: "#22D3EE",
      blurb:
        "Support for community-based / cluster initiatives with tech-enabled systems and capability building.",
    },
    {
      code: "CEST",
      name: "Community Empowerment through Science and Technology (CEST)",
      color: "#FDB913",
      blurb:
        "Science and technology interventions to uplift communities through appropriate, sustainable solutions.",
    },
    {
      code: "SETUP",
      name: "Small Enterprise Technology Upgrading Program (SETUP)",
      color: "#A78BFA",
      blurb:
        "Technology upgrading assistance for MSMEs to improve productivity, quality, and competitiveness.",
    },
    {
      code: "GIA",
      name: "Grants-in-Aid (GIA)",
      color: "#34D399",
      blurb:
        "Financial support for S&T projects that enable innovation, resiliency, and inclusive development.",
    },
  ];

  const projects = [
    {
      id: "proj-sscp-001",
      program: "SSCP",
      title: "Digital Inventory + QR Tracking for Community Producers",
      municipality: "Boac",
      year: 2025,
      status: "Ongoing",
      tags: ["QR", "Inventory", "Training"],
    },
    {
      id: "proj-sscp-002",
      program: "SSCP",
      title: "Process Improvement for Food Processing Cluster",
      municipality: "Mogpog",
      year: 2024,
      status: "Completed",
      tags: ["QA", "Workflow", "Equipment"],
    },
    {
      id: "proj-cest-001",
      program: "CEST",
      title: "Tech-based Community Learning Hub & Tools",
      municipality: "Gasan",
      year: 2025,
      status: "Ongoing",
      tags: ["STEM", "Community", "Capacity"],
    },
    {
      id: "proj-setup-001",
      program: "SETUP",
      title: "MSME Facility Upgrade (Packaging + Quality Control)",
      municipality: "Santa Cruz",
      year: 2024,
      status: "Ongoing",
      tags: ["Packaging", "QC", "Productivity"],
    },
    {
      id: "proj-gia-001",
      program: "GIA",
      title: "S&T Assistance for Resilient Livelihood Systems",
      municipality: "Torrijos",
      year: 2025,
      status: "Pipeline",
      tags: ["Resiliency", "Innovation", "Pilot"],
    },
    {
      id: "proj-setup-002",
      program: "SETUP",
      title: "Automation Starter Kit for Production Monitoring",
      municipality: "Buenavista",
      year: 2023,
      status: "Completed",
      tags: ["Monitoring", "Sensors", "Analytics"],
    },
  ];

  const programMeta = Object.fromEntries(programs.map((p) => [p.code, p]));

  const statusClass = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/20";
      case "Ongoing":
        return "bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-400/20";
      case "Pipeline":
        return "bg-violet-400/10 text-violet-200 ring-1 ring-violet-400/20";
      default:
        return "bg-white/5 text-white/80 ring-1 ring-white/10";
    }
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden border-y border-white/10 bg-black/40 py-10 backdrop-blur sm:py-14">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(34,211,238,.20)_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,.12),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-left">
            <div className="text-xs font-medium tracking-wide text-white/60">
              Programs
            </div>
            <div className="mt-1 text-xl font-semibold text-white sm:text-2xl">
              DOST-MARINDUQUE Programs & Sample Projects
            </div>
            <div className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
              Below is a starter list of core programs and example projects for UI/demo
              purposes. You can replace these with real records from your database later.
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
            <span className="relative inline-flex h-3 w-3 items-center justify-center">
              <span
                aria-hidden="true"
                className="absolute inline-flex h-3 w-3 rounded-full bg-cyan-300/60 opacity-40 motion-safe:animate-ping"
              />
              <span className="relative h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.65)] motion-safe:animate-pulse" />
            </span>
            Tech-styled cards
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {programs.map((p) => (
            <div
              key={p.code}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
            >
              <div
                className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full blur-2xl"
                style={{ background: `${p.color}33` }}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold tracking-wide text-white">
                      {p.code}
                    </span>
                    <span className="text-white/40">•</span>
                    <span className="text-sm font-semibold text-white/90">
                      {p.name}
                    </span>
                  </div>
                  <div className="mt-2 text-sm leading-relaxed text-white/70">
                    {p.blurb}
                  </div>
                </div>

                <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center">
                  <span
                    aria-hidden="true"
                    className="absolute inline-flex h-3.5 w-3.5 rounded-full opacity-40 motion-safe:animate-ping"
                    style={{ backgroundColor: p.color }}
                  />
                  <span
                    className="relative h-3 w-3 rounded-full shadow-[0_0_18px_rgba(255,255,255,.12)] motion-safe:animate-pulse"
                    style={{ backgroundColor: p.color }}
                  />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <div className="text-left text-sm font-semibold text-white/90">
            Sample projects
          </div>
          <div className="text-xs text-white/55">
            {projects.length} items • demo data
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((proj) => {
            const meta = programMeta[proj.program];
            const accent = meta?.color ?? "#22D3EE";
            return (
              <article
                key={proj.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 backdrop-blur transition hover:border-white/20"
              >
                <div
                  className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full blur-3xl opacity-60 transition group-hover:opacity-80"
                  style={{ background: `${accent}33` }}
                />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-white/85"
                      >
                        <span className="relative inline-flex h-3 w-3 items-center justify-center">
                          <span
                            aria-hidden="true"
                            className="absolute inline-flex h-3 w-3 rounded-full opacity-40 motion-safe:animate-ping"
                            style={{ backgroundColor: accent }}
                          />
                          <span
                            className="relative h-2.5 w-2.5 rounded-full motion-safe:animate-pulse"
                            style={{ backgroundColor: accent }}
                          />
                        </span>
                        {proj.program}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(proj.status)}`}>
                        {proj.status}
                      </span>
                    </div>

                    <h3 className="mt-3 text-pretty text-sm font-semibold text-white">
                      {proj.title}
                    </h3>

                    <div className="mt-2 text-xs text-white/65">
                      {proj.municipality} • {proj.year}
                    </div>
                  </div>

                  <div
                    className="mt-1 h-10 w-10 rounded-2xl border border-white/10 bg-white/5"
                    style={{
                      boxShadow: `0 0 0 1px rgba(255,255,255,.06), 0 18px 40px ${accent}22`,
                    }}
                  />
                </div>

                <div className="relative mt-4 flex flex-wrap gap-2">
                  {proj.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] font-medium text-white/70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Programs;
