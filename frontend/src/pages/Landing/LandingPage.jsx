import Head from "../../Components/MainPage/Head";
import Map from "../../Components/MainPage/Map";
import Programs from "../../Components/MainPage/Programs";
import OrganizationalStructure from "../../Components/MainPage/OrganizationalStructure";

const LandingPage = () => {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="w-full">
        <Head />

        <section id="map" className="w-full scroll-mt-24 bg-black">
          <Map />
        </section>

        <section id="programs" className="w-full scroll-mt-24 bg-black">
          <Programs />
        </section>
      </div>
    </main>
  );
};

export default LandingPage;
