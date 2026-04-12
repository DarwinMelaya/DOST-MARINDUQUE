import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { getApiErrorMessage } from "../../api/client";
import { createProject, fetchProjects } from "../../api/projectsApi";
import AdminProgramMap from "../../Components/Admin/AdminProgramMap";
import ProgramsModals from "../../Components/Modals/AdminModals/ProgramsModals";

const AdminPrograms = () => {
  const [projects, setProjects] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pickLat, setPickLat] = useState("");
  const [pickLng, setPickLng] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchProjects();
        if (!cancelled) {
          setProjects(list);
          setLoadError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = getApiErrorMessage(
            err,
            "Could not load projects from the server."
          );
          setLoadError(msg);
          toast.error(msg);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pickerPosition = useMemo(() => {
    const lat = Number.parseFloat(String(pickLat).replace(",", "."));
    const lng = Number.parseFloat(String(pickLng).replace(",", "."));
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  }, [pickLat, pickLng]);

  const withoutMapPin = useMemo(
    () =>
      projects.filter((p) => {
        const lat = p.location?.latitude;
        const lng = p.location?.longitude;
        return (
          lat == null ||
          lng == null ||
          Number.isNaN(lat) ||
          Number.isNaN(lng)
        );
      }),
    [projects]
  );

  const handleSave = async (payload) => {
    const created = await createProject(payload);
    setProjects((prev) => [created, ...prev]);
  };

  const openModal = () => {
    setPickLat("");
    setPickLng("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setPickLat("");
    setPickLng("");
  };

  const handlePickOnMap = (lat, lng) => {
    setPickLat(lat.toFixed(6));
    setPickLng(lng.toFixed(6));
    toast.success("Location set from map.");
  };

  return (
    <div className="w-full max-w-none">
      {loadError ? (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
          {loadError}
        </p>
      ) : null}

      {!modalOpen ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Programs
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/55">
                Projects are stored in the database. Use{" "}
                <span className="text-white/75">Add project</span> to open the
                form — click the map there to place a pin, or type coordinates.
              </p>
            </div>
            <button
              type="button"
              onClick={openModal}
              className="shrink-0 rounded-xl bg-gradient-to-r from-[#0054A6] to-[#0B3B76] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0054A6]/25 transition hover:brightness-110"
            >
              Add project
            </button>
          </div>

          <div className="mt-8">
            <AdminProgramMap projects={projects} />
          </div>

          {withoutMapPin.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
              <p className="font-medium text-amber-50/95">
                {withoutMapPin.length} project
                {withoutMapPin.length === 1 ? "" : "s"} without map coordinates
              </p>
              <p className="mt-1 text-xs text-amber-100/70">
                Add latitude and longitude when creating a project to show a pin
                on the map. Saved entries:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-1 text-white/85">
                {withoutMapPin.map((p) => (
                  <li key={p.id}>
                    <span className="font-semibold">{p.title}</span> (
                    {p.programType})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <div className="fixed inset-0 z-[100] flex h-full min-h-0 flex-col bg-slate-950 md:flex-row">
          <div className="relative flex min-h-[36vh] w-full flex-[1.2] flex-col md:min-h-0 md:overflow-hidden">
            <AdminProgramMap
              className="h-full min-h-[36vh] rounded-none border-x-0 border-t-0 md:min-h-0"
              splitLayout
              projects={projects}
              pickMode
              onPickLocation={handlePickOnMap}
              pickerPosition={pickerPosition}
            />
          </div>
          <div className="flex min-h-0 w-full min-w-0 flex-[0.95] flex-col border-t border-white/10 md:max-w-xl md:border-l md:border-t-0 lg:max-w-lg">
            <ProgramsModals
              onClose={closeModal}
              onSave={handleSave}
              latitude={pickLat}
              longitude={pickLng}
              onLatitudeChange={setPickLat}
              onLongitudeChange={setPickLng}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPrograms;
