import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const CORAL_STATUSES = ["Healthy", "Bleached Damaged", "Recovering", "Dead"];
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none ring-[#0054A6] transition placeholder:text-white/35 focus:border-[#0054A6]/50 focus:ring-2";

const labelClass = "mb-1.5 block text-sm font-medium text-white/80";

const AddCoralReefModal = ({
  onClose,
  onSave,
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
}) => {
  const [coralName, setCoralName] = useState("");
  const [coralType, setCoralType] = useState("");
  const [description, setDescription] = useState("");
  const [coralStatus, setCoralStatus] = useState("Healthy");
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const previewUrl = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : ""),
    [photoFile]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, submitting]);

  const resetForm = () => {
    setCoralName("");
    setCoralType("");
    setDescription("");
    setCoralStatus("Healthy");
    onLatitudeChange("");
    onLongitudeChange("");
    setPhotoFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const latStr = String(latitude || "").trim();
      const lngStr = String(longitude || "").trim();
      const lat =
        latStr === "" ? null : Number.parseFloat(latStr.replace(",", "."));
      const lng =
        lngStr === "" ? null : Number.parseFloat(lngStr.replace(",", "."));

      if ((latStr !== "" && Number.isNaN(lat)) || (lngStr !== "" && Number.isNaN(lng))) {
        toast.error("Latitude and longitude must be valid numbers.");
        return;
      }
      if ((latStr !== "" && lngStr === "") || (latStr === "" && lngStr !== "")) {
        toast.error("Provide both latitude and longitude, or leave both empty.");
        return;
      }

      await onSave({
        coralName,
        coralType,
        description,
        coralStatus,
        location: {
          latitude: lat,
          longitude: lng,
        },
        photoFile,
      });

      toast.success("Coral reef entry added.");
      resetForm();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save coral reef entry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-slate-950/98">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Add coral reef record
          </h2>
          <p className="mt-1 text-xs text-white/55 sm:text-sm">
            Save coral details, status, photo, and map coordinates.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white disabled:opacity-60"
        >
          Close
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 sm:px-6">
        <div className="space-y-5 pb-4">
          <div>
            <label className={labelClass} htmlFor="coral-name">
              Coral name
            </label>
            <input
              id="coral-name"
              required
              value={coralName}
              onChange={(e) => setCoralName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Acropora millepora"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="coral-type">
              Coral type
            </label>
            <input
              id="coral-type"
              required
              value={coralType}
              onChange={(e) => setCoralType(e.target.value)}
              className={inputClass}
              placeholder="e.g. Branching coral"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="coral-description">
              Description
            </label>
            <textarea
              id="coral-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} resize-y min-h-[100px]`}
              placeholder="Short notes about this reef area"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="coral-status">
              Coral status
            </label>
            <select
              id="coral-status"
              value={coralStatus}
              onChange={(e) => setCoralStatus(e.target.value)}
              className={inputClass}
            >
              {CORAL_STATUSES.map((status) => (
                <option key={status} value={status} className="bg-slate-900">
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="coral-photo">
              Coral photo <span className="font-normal text-white/45">(optional)</span>
            </label>
            <p className="mb-2 text-xs text-white/45">
              JPEG, PNG, WebP, or GIF. Max {Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.
            </p>
            <input
              id="coral-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block w-full text-sm text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0054A6]/30 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#0054A6]/45"
              onChange={(e) => {
                const picked = e.target.files?.[0] || null;
                e.target.value = "";
                if (!picked) return;
                if (picked.size > MAX_IMAGE_BYTES) {
                  toast.error(
                    `Image must be under ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`
                  );
                  return;
                }
                setPhotoFile(picked);
              }}
            />
            {previewUrl ? (
              <div className="mt-3 w-full max-w-xs overflow-hidden rounded-xl border border-white/10 bg-black/30">
                <img src={previewUrl} alt="" className="aspect-[4/3] w-full object-cover" />
              </div>
            ) : null}
          </div>

          <div>
            <p className={labelClass}>Location</p>
            <p className="mb-3 text-xs text-white/45">
              Click the map on the left to drop a pin, or type coordinates.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60" htmlFor="coral-latitude">
                  Latitude
                </label>
                <input
                  id="coral-latitude"
                  type="text"
                  inputMode="decimal"
                  value={latitude}
                  onChange={(e) => onLatitudeChange(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 13.4769"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/60" htmlFor="coral-longitude">
                  Longitude
                </label>
                <input
                  id="coral-longitude"
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
        </div>

        <div className="mt-auto flex flex-wrap gap-3 border-t border-white/10 pt-5">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-gradient-to-r from-[#0054A6] to-[#0B3B76] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0054A6]/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save record"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            disabled={submitting}
            className="rounded-xl border border-white/15 bg-transparent px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-60"
          >
            Reset form
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCoralReefModal;
