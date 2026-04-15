import { useEffect, useRef, useState } from "react";
import Head from "../../Components/MainPage/Head";
import About from "../../Components/MainPage/About";
import ContactUs from "../../Components/MainPage/ContactUs";
import Map from "../../Components/MainPage/Map";
import Programs from "../../Components/MainPage/Programs";
import Announcements from "../../Components/MainPage/Announcements";
import ChatBot from "../../Components/Modals/ChatBot/ChatBot";

const scrollToSection = (id) => {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

const LandingPage = () => {
  const mapSectionRef = useRef(null);
  const [mapNavVisible, setMapNavVisible] = useState(false);
  const [chatBotOpen, setChatBotOpen] = useState(false);

  useEffect(() => {
    const el = mapSectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show controls habang malinaw na nakatingin sa map section (hindi lang dumaan).
        setMapNavVisible(
          entry.isIntersecting && entry.intersectionRatio >= 0.2
        );
      },
      { threshold: [0, 0.2, 0.35, 0.5, 0.75, 1] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="w-full">
        <Head />

        <section id="announcements" className="w-full scroll-mt-24 bg-black">
          <Announcements />
        </section>

        <section
          id="map"
          ref={mapSectionRef}
          className="relative w-full scroll-mt-24 bg-black"
        >
          <Map />
        </section>

        <section id="programs" className="w-full scroll-mt-24 bg-black">
          <Programs />
        </section>

        <section id="about" className="w-full scroll-mt-24 bg-black">
          <About />
        </section>

        <section id="contact" className="w-full scroll-mt-24 bg-black">
          <ContactUs />
        </section>
      </div>

      {/* Up/Down: kapag nasa map section, may explicit na scroll para hindi ma-trap ng map */}
      <div
        className={`pointer-events-none fixed right-4 top-1/2 z-[1000] flex -translate-y-1/2 flex-col gap-2 transition-opacity duration-200 sm:right-6 ${
          mapNavVisible ? "opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!mapNavVisible}
      >
        <div className="pointer-events-auto flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950/90 shadow-[0_8px_30px_rgba(0,0,0,.45)] backdrop-blur-md">
          <button
            type="button"
            onClick={() => scrollToSection("announcements")}
            className="flex h-11 w-11 items-center justify-center text-white/90 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 sm:h-12 sm:w-12"
            aria-label="Pumunta sa Announcements (taas)"
            title="Taas — Announcements"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M11.47 7.72a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 1 1-1.06 1.06L12 9.31l-4.72 4.72a.75.75 0 0 1-1.06-1.06l5.25-5.25Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <span className="mx-2 h-px bg-white/10" />
          <button
            type="button"
            onClick={() => scrollToSection("programs")}
            className="flex h-11 w-11 items-center justify-center text-white/90 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 sm:h-12 sm:w-12"
            aria-label="Pumunta sa Programs (ibaba)"
            title="Ibaba — Programs"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M12.53 16.28a.75.75 0 0 1-1.06 0l-5.25-5.25a.75.75 0 0 1 1.06-1.06L12 14.69l4.72-4.72a.75.75 0 1 1 1.06 1.06l-5.25 5.25Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ChatBot launcher */}
      <button
        type="button"
        onClick={() => setChatBotOpen(true)}
        className="fixed bottom-5 right-5 z-[1050] inline-flex h-12 items-center gap-2 rounded-full border border-white/10 bg-slate-950/85 px-4 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(0,0,0,.45)] backdrop-blur-md transition hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 sm:bottom-7 sm:right-7"
        aria-label="Open ChatBot"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#0054A6] to-[#0B3B76] shadow-lg shadow-[#0054A6]/25">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M7.5 8.25a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM7.5 12a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 7.5 12Z" />
            <path
              fillRule="evenodd"
              d="M12 2.25c-5.385 0-9.75 3.97-9.75 8.864 0 2.592 1.246 4.918 3.25 6.52v2.357a1.5 1.5 0 0 0 2.33 1.252l2.259-1.506c.612.1 1.25.152 1.911.152 5.385 0 9.75-3.97 9.75-8.864C21.75 6.22 17.385 2.25 12 2.25Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <span className="hidden sm:inline">ChatBot</span>
      </button>

      <ChatBot open={chatBotOpen} onClose={() => setChatBotOpen(false)} />
    </main>
  );
};

export default LandingPage;
