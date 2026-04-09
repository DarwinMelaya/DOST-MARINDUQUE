import Head from "../../Components/MainPage/Head";
import Main from "../../Components/MainPage/Main";
import Map from "../../Components/MainPage/Map";
import Programs from "../../Components/MainPage/Programs";

const LandingPage = () => {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="w-full">
        <Head />

        <section className="w-full border-y border-white/10 bg-white/[0.03]">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="text-left">
              <div className="text-xs font-medium tracking-wide text-white/60">
                Overview
              </div>
              <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
                <Map />
              </div>
            </div>
          </div>
        </section>

        <section
          id="map"
          className="mt-0 w-full scroll-mt-24 border-b border-white/10 bg-white/[0.02]"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="text-left">
              <div className="text-xs font-medium tracking-wide text-white/60">
                Location
              </div>
              <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
                <Main />
              </div>
            </div>
          </div>
        </section>

        <section
          id="programs"
          className="mt-0 w-full scroll-mt-24 bg-white/[0.02]"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="text-left">
              <div className="text-xs font-medium tracking-wide text-white/60">
                Programs
              </div>
              <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
                <Programs />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default LandingPage;
