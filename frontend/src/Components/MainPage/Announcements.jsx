import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchFeaturedAnnouncement } from "../../api/announcementsApi";
import { getApiErrorMessage } from "../../api/client";

const FALLBACK_SLIDES = [
  {
    src: `/Assets/Scholarship/${encodeURIComponent("Scholarship 1.jpg")}`,
    alt: "DOST scholarship campaign — JLSS outreach photo 1",
  },
  {
    src: `/Assets/Scholarship/${encodeURIComponent("Scholarship 2.jpg")}`,
    alt: "DOST scholarship campaign — JLSS outreach photo 2",
  },
  {
    src: `/Assets/Scholarship/${encodeURIComponent("Scholarship 3.jpg")}`,
    alt: "DOST scholarship campaign — JLSS outreach photo 3",
  },
];

const FALLBACK_HASHTAGS = [
  "DOSTMIMAROPA",
  "dostmarinduque",
  "OneDOST4U",
  "onesolutionsopportunitiesforall",
  "AghamnaRamdam",
  "DOSTSEI",
  "MagingDOSTIskolarKa",
];

function getFacebookEmbedUrl(rawUrl) {
  const input = String(rawUrl ?? "").trim();
  if (!input) return "";
  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    return "";
  }
  const host = parsed.hostname.toLowerCase();
  const allowedHosts = new Set([
    "facebook.com",
    "www.facebook.com",
    "web.facebook.com",
    "m.facebook.com",
    "fb.watch",
    "www.fb.watch",
  ]);
  if (!allowedHosts.has(host)) return "";
  const clean = parsed.toString();
  const path = parsed.pathname.toLowerCase();
  const useVideoPlugin =
    path.includes("/reel/") || path.includes("/videos/") || host.includes("fb.watch");
  if (useVideoPlugin) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(clean)}&show_text=true&width=500&t=0`;
  }
  return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(clean)}&show_text=true&width=500`;
}

function ApiArticleBody({ post }) {
  const ctaOk = post.ctaLabel?.trim() && post.ctaUrl?.trim();
  const paragraphs = Array.isArray(post.bodyParagraphs) ? post.bodyParagraphs : [];
  const hashtags = Array.isArray(post.hashtags) ? post.hashtags : [];
  return (
    <>
      {paragraphs.length > 0 ? (
        <div className="space-y-4 text-left text-sm leading-relaxed text-white/80">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {p}
            </p>
          ))}
        </div>
      ) : null}

      {ctaOk ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href={post.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-[#0054A6] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,84,166,.35)] transition hover:bg-[#0A5EC0] focus:outline-none focus:ring-2 focus:ring-cyan-300/60 focus:ring-offset-2 focus:ring-offset-[#0a1628]"
          >
            {post.ctaLabel.trim()}
          </a>
        </div>
      ) : null}

      {hashtags.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {hashtags.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-medium text-white/65 transition hover:border-white/20 hover:text-white/80"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}

function StaticJlssArticleBody() {
  return (
    <>
      <div className="space-y-4 text-left text-sm leading-relaxed text-white/80">
        <p>
          The{" "}
          <strong className="font-semibold text-white">
            Department of Science and Technology (DOST) Marinduque
          </strong>{" "}
          continues the{" "}
          <strong className="font-semibold text-cyan-200/95">
            2026 DOST-Science Education Institute (SEI) Junior Level Science Scholarship (JLSS)
            Campaign
          </strong>{" "}
          at{" "}
          <strong className="font-semibold text-white">
            Marinduque State University (MarSU) Santa Cruz and Torrijos
          </strong>{" "}
          on <strong className="text-white">April 7, 2026</strong>, engaging incoming third-year
          students.
        </p>
        <p>
          Following its campaign at MarSU Boac and Gasan campuses on{" "}
          <strong className="text-white">April 6, 2026</strong>, the session provided an overview
          of the scholarship. This includes eligibility, benefits, document requirements and
          application details, helping students better understand the opportunity.
        </p>
        <p>
          The{" "}
          <strong className="font-semibold text-[#FDB913]/95">JLSS</strong> is a scholarship
          program that supports deserving students in pursuing degrees in science and technology,
          helping ease financial burdens while encouraging academic excellence.
        </p>
        <p className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-white/85">
          <strong className="font-semibold text-cyan-200">Registration</strong> opens on{" "}
          <strong className="text-white">April 13, 2026</strong> through the official portal:
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href="https://jlss.science-scholarships.ph/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-[#0054A6] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,84,166,.35)] transition hover:bg-[#0A5EC0] focus:outline-none focus:ring-2 focus:ring-cyan-300/60 focus:ring-offset-2 focus:ring-offset-[#0a1628]"
        >
          Open JLSS portal
        </a>
        <span className="text-xs text-white/45 break-all sm:break-normal">
          jlss.science-scholarships.ph
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FALLBACK_HASHTAGS.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-medium text-white/65 transition hover:border-white/20 hover:text-white/80"
          >
            #{tag}
          </span>
        ))}
      </div>
    </>
  );
}

const Announcements = () => {
  const [apiPost, setApiPost] = useState(null);
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const announcement = await fetchFeaturedAnnouncement();
        if (!cancelled) {
          setApiPost(announcement);
          setFetchFailed(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn(getApiErrorMessage(err, "Announcement fetch failed."));
          setApiPost(null);
          setFetchFailed(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const post = apiPost;
  const useApi = Boolean(post);

  const slides = useMemo(() => {
    if (!useApi) return FALLBACK_SLIDES;
    if (!Array.isArray(post.images) || post.images.length === 0) return FALLBACK_SLIDES;
    return post.images.map((img) => ({
      src: img.url,
      alt: img.alt?.trim() || post.title || "Announcement image",
    }));
  }, [useApi, post]);

  const highlightLabel = useApi
    ? post.highlightLabel || "Today's highlight"
    : "Today's highlight";
  const title = useApi
    ? post.title?.trim() || "Latest DOST Marinduque announcement"
    : "2026 DOST-SEI JLSS Campaign Reaches MarSU Santa Cruz and Torrijos";
  const subtitle = useApi
    ? post.subtitle?.trim()
    : "Science education outreach • Scholarship information session";
  const displayDate = useApi ? post.displayDate?.trim() || "—" : "April 7, 2026";
  const badge = useApi ? post.badge?.trim() || "Announcement" : "DOST-SEI • JLSS 2026";
  const carouselCaption = useApi
    ? post.carouselCaption?.trim() ||
      "Marinduque State University — Santa Cruz & Torrijos campuses"
    : "Marinduque State University — Santa Cruz & Torrijos campuses";
  const facebookEmbedUrl = useApi ? getFacebookEmbedUrl(post.facebookPostUrl) : "";

  const [slideIndex, setSlideIndex] = useState(0);
  const total = slides.length;

  useEffect(() => {
    setSlideIndex((i) => (total > 0 ? Math.min(i, total - 1) : 0));
  }, [total]);

  const goNext = useCallback(() => {
    setSlideIndex((i) => (i + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setSlideIndex((i) => (i - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    const id = window.setInterval(goNext, 6000);
    return () => window.clearInterval(id);
  }, [goNext]);

  return (
    <div className="relative min-h-0 w-full overflow-hidden border-y border-white/10 bg-black/40 py-10 backdrop-blur sm:py-14">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(99,179,237,.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,179,237,.18)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(253,185,19,.14),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(0,84,166,.18),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {fetchFailed ? (
          <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-100/90 sm:text-left">
            Could not load the latest highlight from the server; showing the default story.
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#FDB913]/30 bg-[#FDB913]/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#FDB913] backdrop-blur">
              <span className="relative inline-flex h-2.5 w-2.5 items-center justify-center">
                <span
                  aria-hidden="true"
                  className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-[#FDB913] opacity-40 motion-safe:animate-ping"
                />
                <span className="relative h-2 w-2 rounded-full bg-[#FDB913] shadow-[0_0_14px_rgba(253,185,19,.7)]" />
              </span>
              {highlightLabel}
            </div>
            <h2 className="mt-3 text-pretty text-xl font-semibold tracking-tight text-white sm:text-2xl lg:text-3xl">
              <span className="bg-gradient-to-r from-white via-cyan-100 to-white/90 bg-clip-text text-transparent">
                {title}
              </span>
            </h2>
            {subtitle ? (
              <p className="mt-2 max-w-2xl text-sm text-white/60">{subtitle}</p>
            ) : null}
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/75 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,.55)]" />
            {displayDate}
          </div>
        </div>

        <article className="relative mt-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl opacity-70"
            style={{ background: "rgba(34, 211, 238, 0.2)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full blur-3xl opacity-50"
            style={{ background: "rgba(253, 185, 19, 0.15)" }}
          />

          <div className="relative grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <div
              className="group/carousel relative min-h-[220px] lg:min-h-[320px]"
              aria-roledescription="carousel"
              aria-label="Highlight photos"
            >
              <div className="absolute inset-0 overflow-hidden">
                <div
                  className="flex h-full w-full transition-transform duration-500 ease-out motion-reduce:transition-none"
                  style={{ transform: `translateX(-${slideIndex * 100}%)` }}
                >
                  {slides.map((slide) => (
                    <div
                      key={slide.src}
                      className="relative h-full min-h-[220px] w-full min-w-full shrink-0 lg:min-h-[320px]"
                    >
                      <img
                        src={slide.src}
                        alt={slide.alt}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading={slideIndex === 0 ? "eager" : "lazy"}
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a1628]/95 via-[#0A2E5C]/70 to-[#0054A6]/35" />
              <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(34,211,238,.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,.2)_1px,transparent_1px)] [background-size:24px_24px]" />

              <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-200/90 backdrop-blur sm:left-4 sm:top-4 sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,.8)] motion-safe:animate-pulse" />
                Gallery
                <span className="text-white/50">•</span>
                <span className="tabular-nums text-white/80">
                  {slideIndex + 1}/{total}
                </span>
              </div>

              <button
                type="button"
                onClick={goPrev}
                className="pointer-events-auto absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-white/15 bg-black/50 text-white/90 backdrop-blur transition hover:border-cyan-300/40 hover:bg-black/65 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/50 sm:left-3 sm:h-10 sm:w-10"
                aria-label="Previous slide"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M15 6l-6 6 6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={goNext}
                className="pointer-events-auto absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-white/15 bg-black/50 text-white/90 backdrop-blur transition hover:border-cyan-300/40 hover:bg-black/65 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/50 sm:right-3 sm:h-10 sm:w-10"
                aria-label="Next slide"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M9 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="pointer-events-auto absolute bottom-14 left-0 right-0 z-20 flex justify-center gap-1.5 px-4 sm:bottom-16">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlideIndex(i)}
                    className={`h-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-cyan-300/50 focus:ring-offset-2 focus:ring-offset-transparent ${
                      i === slideIndex
                        ? "w-6 bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,.5)]"
                        : "w-1.5 bg-white/35 hover:bg-white/55"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === slideIndex ? "true" : undefined}
                  />
                ))}
              </div>

              <div className="pointer-events-none relative z-10 flex h-full flex-col justify-end p-6 sm:p-8">
                <div className="rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-200/90 backdrop-blur">
                  {badge}
                </div>
                <p className="mt-3 text-sm font-medium leading-relaxed text-white/90">
                  {carouselCaption}
                </p>
              </div>
            </div>

            <div className="relative border-t border-white/10 p-6 sm:p-8 lg:border-l lg:border-t-0">
              {useApi ? <ApiArticleBody post={post} /> : <StaticJlssArticleBody />}
              {facebookEmbedUrl ? (
                <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-cyan-200/85">
                    Facebook post
                  </p>
                  <iframe
                    title="Embedded Facebook post"
                    src={facebookEmbedUrl}
                    width="100%"
                    height="620"
                    style={{ border: "none", overflow: "hidden" }}
                    scrolling="no"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : null}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default Announcements;
