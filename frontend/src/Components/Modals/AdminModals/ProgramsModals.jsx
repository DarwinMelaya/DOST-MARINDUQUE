import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const PROGRAM_TYPES = ["GIA", "CEST", "SSCP", "SETUP"];

const PROJECT_STATUSES = ["Ongoing", "Graduated", "Terminated"];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none ring-[#0054A6] transition placeholder:text-white/35 focus:border-[#0054A6]/50 focus:ring-2";

const labelClass = "mb-1.5 block text-sm font-medium text-white/80";

/**
 * Form panel for adding a project. Location lat/lng are controlled by the parent
 * so the AdminPrograms map can update them when the user clicks the map.
 */
const ProgramsModals = ({
  onClose,
  onSave,
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
}) => {
  const [programType, setProgramType] = useState("");
  const [title, setTitle] = useState("");
  const [amountOfAssistance, setAmountOfAssistance] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [briefDescription, setBriefDescription] = useState("");
  const [projectStatus, setProjectStatus] = useState("Ongoing");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setProgramType("");
    setTitle("");
    setAmountOfAssistance("");
    setBeneficiary("");
    setContactPerson("");
    setBriefDescription("");
    setProjectStatus("Ongoing");
    onLatitudeChange("");
    onLongitudeChange("");
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!programType) {
      toast.error("Please select a program type (GIA, CEST, SSCP, or SETUP).");
      return;
    }
    setSubmitting(true);
    try {
      const latStr = String(latitude ?? "").trim();
      const lngStr = String(longitude ?? "").trim();
      const lat =
        latStr === "" ? null : Number.parseFloat(latStr.replace(",", "."));
      const lng =
        lngStr === "" ? null : Number.parseFloat(lngStr.replace(",", "."));

      if (
        (latStr !== "" && Number.isNaN(lat)) ||
        (lngStr !== "" && Number.isNaN(lng))
      ) {
        toast.error("Latitude and longitude must be valid numbers.");
        return;
      }
      if (
        (latStr !== "" && lngStr === "") ||
        (latStr === "" && lngStr !== "")
      ) {
        toast.error("Provide both latitude and longitude, or leave both empty.");
        return;
      }

      const payload = {
        programType,
        title,
        amountOfAssistance,
        beneficiary,
        contactPerson,
        briefDescription,
        projectStatus,
        location: {
          latitude: lat,
          longitude: lng,
        },
      };
      await onSave(payload);
      toast.success("Project saved to the database.");
      resetForm();
      onClose();
    } catch (err) {
      const message =
        err.response?.data?.message ?? "Could not save project. Try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-slate-950/98">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2
            id="programs-modal-title"
            className="text-lg font-semibold text-white sm:text-xl"
          >
            Add DOST project
          </h2>
          <p className="mt-1 text-xs text-white/55 sm:text-sm">
            Click the map to set the pin, or type coordinates. Saved projects
            appear on the Programs page map.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          Close
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 sm:px-6"
      >
        <div className="space-y-6 pb-4">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/50">
              Program type
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PROGRAM_TYPES.map((type) => (
                <label
                  key={type}
                  className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition sm:px-4 sm:py-3 ${
                    programType === type
                      ? "border-[#0054A6]/70 bg-[#0054A6]/20 text-white shadow-[0_0_0_1px_rgba(0,84,166,.4)_inset]"
                      : "border-white/10 bg-white/[0.04] text-white/75 hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="programType"
                    value={type}
                    checked={programType === type}
                    onChange={() => setProgramType(type)}
                    className="sr-only"
                  />
                  {type}
                </label>
              ))}
            </div>
          </section>

          {programType ? (
            <>
              <div>
                <label htmlFor="modal-project-title" className={labelClass}>
                  Title
                </label>
                <input
                  id="modal-project-title"
                  name="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  placeholder="Project title"
                />
              </div>

              <div>
                <label htmlFor="modal-amount-assistance" className={labelClass}>
                  Amount of assistance
                </label>
                <input
                  id="modal-amount-assistance"
                  name="amountOfAssistance"
                  type="text"
                  inputMode="decimal"
                  value={amountOfAssistance}
                  onChange={(e) => setAmountOfAssistance(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. PHP 500,000"
                />
              </div>

              <div>
                <label htmlFor="modal-beneficiary" className={labelClass}>
                  Beneficiary
                </label>
                <input
                  id="modal-beneficiary"
                  name="beneficiary"
                  type="text"
                  required
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  className={inputClass}
                  placeholder="Name of beneficiary or organization"
                />
              </div>

              <div>
                <label htmlFor="modal-contact-person" className={labelClass}>
                  Contact person
                </label>
                <input
                  id="modal-contact-person"
                  name="contactPerson"
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className={inputClass}
                  placeholder="Name and role if applicable"
                />
              </div>

              <div>
                <label htmlFor="modal-brief-description" className={labelClass}>
                  Brief description
                </label>
                <textarea
                  id="modal-brief-description"
                  name="briefDescription"
                  rows={4}
                  value={briefDescription}
                  onChange={(e) => setBriefDescription(e.target.value)}
                  className={`${inputClass} resize-y min-h-[100px]`}
                  placeholder="Short summary of the project"
                />
              </div>

              <div>
                <label htmlFor="modal-project-status" className={labelClass}>
                  Project status
                </label>
                <select
                  id="modal-project-status"
                  name="projectStatus"
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value)}
                  className={inputClass}
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-slate-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className={labelClass}>Location</p>
                <p className="mb-3 text-xs text-white/45">
                  Click the map on the left (or above on small screens) to drop a
                  pin. You can fine-tune values here.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="modal-latitude"
                      className="mb-1.5 block text-xs font-medium text-white/60"
                    >
                      Latitude
                    </label>
                    <input
                      id="modal-latitude"
                      name="latitude"
                      type="text"
                      inputMode="decimal"
                      value={latitude}
                      onChange={(e) => onLatitudeChange(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 13.4769"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="modal-longitude"
                      className="mb-1.5 block text-xs font-medium text-white/60"
                    >
                      Longitude
                    </label>
                    <input
                      id="modal-longitude"
                      name="longitude"
                      type="text"
                      inputMode="decimal"
                      value={longitude}
                      onChange={(e) => onLongitudeChange(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 122.0837"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-white/45">
              Select a program type to continue.
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap gap-3 border-t border-white/10 pt-5">
          <button
            type="submit"
            disabled={submitting || !programType}
            className="rounded-xl bg-gradient-to-r from-[#0054A6] to-[#0B3B76] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0054A6]/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save project"}
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
            }}
            className="rounded-xl border border-white/15 bg-transparent px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            Reset form
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProgramsModals;
