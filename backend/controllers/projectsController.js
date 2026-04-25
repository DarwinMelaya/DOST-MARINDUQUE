const mongoose = require("mongoose");
const Project = require("../models/Project");
const {
  uploadImageFilesToSupabase,
  removeSupabaseObjectsByUrls,
} = require("../utils/storageUpload");

function serialize(doc) {
  const o =
    doc && typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  const imgs = o.images;
  return {
    id: String(o._id),
    programType: o.programType,
    title: o.title,
    amountOfAssistance: o.amountOfAssistance ?? "",
    beneficiary: o.beneficiary,
    contactPerson: o.contactPerson ?? "",
    briefDescription: o.briefDescription ?? "",
    projectStatus: o.projectStatus,
    location: {
      latitude:
        o.location?.latitude != null && !Number.isNaN(Number(o.location.latitude))
          ? Number(o.location.latitude)
          : null,
      longitude:
        o.location?.longitude != null &&
        !Number.isNaN(Number(o.location.longitude))
          ? Number(o.location.longitude)
          : null,
    },
    images: Array.isArray(imgs) ? imgs.filter(Boolean) : [],
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

function normalizeProjectBody(req) {
  const ct = req.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const b = req.body;
    let location = null;
    const locRaw = b.location;
    if (typeof locRaw === "string" && locRaw.trim()) {
      try {
        location = JSON.parse(locRaw);
      } catch {
        location = null;
      }
    } else if (locRaw && typeof locRaw === "object") {
      location = locRaw;
    }
    return {
      programType: b.programType,
      title: b.title,
      amountOfAssistance: b.amountOfAssistance,
      beneficiary: b.beneficiary,
      contactPerson: b.contactPerson,
      briefDescription: b.briefDescription,
      projectStatus: b.projectStatus,
      location,
    };
  }
  return req.body;
}

function parseLocation(location) {
  let latitude = null;
  let longitude = null;
  if (location && typeof location === "object") {
    const { latitude: lat, longitude: lng } = location;
    if (lat != null && lng != null) {
      const ln = Number(lat);
      const le = Number(lng);
      if (Number.isNaN(ln) || Number.isNaN(le)) {
        return {
          error: "Latitude and longitude must be valid numbers when provided.",
        };
      }
      latitude = ln;
      longitude = le;
    } else if (lat != null || lng != null) {
      return {
        error: "Provide both latitude and longitude, or omit location.",
      };
    }
  }
  return { latitude, longitude };
}

function validateCoreFields(body) {
  const {
    programType,
    title,
    beneficiary,
    projectStatus,
    location,
  } = body;

  if (!programType || !String(title || "").trim() || !String(beneficiary || "").trim()) {
    return { error: "Program type, title, and beneficiary are required." };
  }

  const allowedPrograms = ["GIA", "CEST", "SSCP", "SETUP"];
  if (!allowedPrograms.includes(programType)) {
    return { error: "Invalid program type." };
  }

  const allowedStatus = ["Ongoing", "Graduated", "Terminated"];
  if (!projectStatus || !allowedStatus.includes(projectStatus)) {
    return { error: "Invalid project status." };
  }

  const loc = parseLocation(location);
  if (loc.error) return { error: loc.error };

  return {
    values: {
      programType,
      title: String(title).trim(),
      amountOfAssistance: String(body.amountOfAssistance ?? "").trim(),
      beneficiary: String(beneficiary).trim(),
      contactPerson: String(body.contactPerson ?? "").trim(),
      briefDescription: String(body.briefDescription ?? "").trim(),
      projectStatus,
      location: { latitude: loc.latitude, longitude: loc.longitude },
    },
  };
}

function parsePositiveInt(v, { min = 0, max = 1000, fallback = 0 } = {}) {
  const n = Number.parseInt(String(v ?? ""), 10);
  if (Number.isNaN(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function truthyQueryFlag(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y";
}

async function listProjects(req, res) {
  try {
    const view = String(req.query.view ?? "").trim().toLowerCase();
    const pinnedOnly = truthyQueryFlag(req.query.pinnedOnly);
    let limit = parsePositiveInt(req.query.limit, { min: 0, max: 2000, fallback: 0 });

    // Safe default for the map page: don't accidentally ship thousands of rows.
    if (view === "map" && limit === 0) limit = 600;

    const filter = {};
    if (pinnedOnly) {
      filter["location.latitude"] = { $ne: null };
      filter["location.longitude"] = { $ne: null };
    }

    let q = Project.find(filter).sort({ createdAt: -1 });
    if (view === "map") {
      // Minimal fields needed by the public map + filters.
      q = q.select(
        "programType title beneficiary projectStatus briefDescription location createdAt updatedAt"
      );
    }
    if (limit > 0) q = q.limit(limit);

    const docs = await q.lean();
    res.json(docs.map((d) => serialize({ ...d, _id: d._id })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load projects." });
  }
}

async function createProject(req, res) {
  try {
    const fileList = req.files?.images;
    const files = Array.isArray(fileList) ? fileList : [];

    let imageUrls = [];
    if (files.length > 0) {
      try {
        imageUrls = await uploadImageFilesToSupabase(files, "projects");
      } catch (e) {
        console.error(e);
        const msg =
          e.message?.includes("Missing SUPABASE") || e.message?.includes("Supabase")
            ? e.message
            : "Image upload failed. Check Supabase bucket and credentials.";
        return res.status(503).json({ message: msg });
      }
    }

    const body = normalizeProjectBody(req);
    const v = validateCoreFields(body);
    if (v.error) {
      return res.status(400).json({ message: v.error });
    }

    const doc = await Project.create({
      ...v.values,
      images: imageUrls,
    });

    res.status(201).json(serialize(doc));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save project." });
  }
}

async function updateProject(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid project id." });
    }
    const doc = await Project.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "Project not found." });
    }

    const multipart = (req.get("content-type") || "").includes(
      "multipart/form-data"
    );

    if (multipart) {
      let kept = [];
      try {
        kept = JSON.parse(String(req.body.keptImagesJson ?? "[]"));
      } catch {
        return res.status(400).json({ message: "Invalid keptImagesJson." });
      }
      if (!Array.isArray(kept)) {
        return res.status(400).json({ message: "keptImagesJson must be an array." });
      }
      const allowed = new Set(doc.images || []);
      for (const u of kept) {
        if (typeof u !== "string" || !allowed.has(u)) {
          return res.status(400).json({
            message: "Kept images must match existing project image URLs.",
          });
        }
      }
      const fileList = req.files?.images;
      const files = Array.isArray(fileList) ? fileList : [];
      if (kept.length + files.length > 12) {
        return res.status(400).json({ message: "Too many images (max 12)." });
      }
      let newUrls = [];
      if (files.length > 0) {
        try {
          newUrls = await uploadImageFilesToSupabase(files, "projects");
        } catch (e) {
          console.error(e);
          const msg =
            e.message?.includes("Missing SUPABASE") || e.message?.includes("Supabase")
              ? e.message
              : "Image upload failed. Check Supabase bucket and credentials.";
          return res.status(503).json({ message: msg });
        }
      }
      const finalImages = [...kept, ...newUrls];
      const oldUrls = [...(doc.images || [])];
      const finalSet = new Set(finalImages);
      const urlsToRemove = oldUrls.filter((u) => !finalSet.has(u));
      await removeSupabaseObjectsByUrls(urlsToRemove);
      doc.images = finalImages;

      const body = normalizeProjectBody(req);
      const v = validateCoreFields(body);
      if (v.error) {
        return res.status(400).json({ message: v.error });
      }
      Object.assign(doc, v.values);
    } else {
      const v = validateCoreFields(req.body);
      if (v.error) {
        return res.status(400).json({ message: v.error });
      }
      Object.assign(doc, v.values);
    }

    await doc.save();
    res.json(serialize(doc));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update project." });
  }
}

async function deleteProject(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid project id." });
    }
    const doc = await Project.findById(id).lean();
    if (!doc) {
      return res.status(404).json({ message: "Project not found." });
    }
    await removeSupabaseObjectsByUrls(doc.images || []);
    await Project.deleteOne({ _id: id });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not delete project." });
  }
}

module.exports = {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  serialize,
};
