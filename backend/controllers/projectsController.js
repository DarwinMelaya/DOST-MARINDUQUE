const Project = require("../models/Project");

function serialize(doc) {
  const o =
    doc && typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
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
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

async function listProjects(req, res) {
  try {
    const docs = await Project.find().sort({ createdAt: -1 }).lean();
    res.json(docs.map((d) => serialize({ ...d, _id: d._id })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load projects." });
  }
}

async function createProject(req, res) {
  try {
    const {
      programType,
      title,
      amountOfAssistance,
      beneficiary,
      contactPerson,
      briefDescription,
      projectStatus,
      location,
    } = req.body;

    if (!programType || !title?.trim() || !beneficiary?.trim()) {
      return res.status(400).json({
        message: "Program type, title, and beneficiary are required.",
      });
    }

    const allowedPrograms = ["GIA", "CEST", "SSCP", "SETUP"];
    if (!allowedPrograms.includes(programType)) {
      return res.status(400).json({ message: "Invalid program type." });
    }

    const allowedStatus = ["Ongoing", "Graduated", "Terminated"];
    if (!projectStatus || !allowedStatus.includes(projectStatus)) {
      return res.status(400).json({ message: "Invalid project status." });
    }

    let latitude = null;
    let longitude = null;
    if (location && typeof location === "object") {
      const { latitude: lat, longitude: lng } = location;
      if (lat != null && lng != null) {
        const ln = Number(lat);
        const le = Number(lng);
        if (Number.isNaN(ln) || Number.isNaN(le)) {
          return res.status(400).json({
            message: "Latitude and longitude must be valid numbers when provided.",
          });
        }
        latitude = ln;
        longitude = le;
      } else if (lat != null || lng != null) {
        return res.status(400).json({
          message: "Provide both latitude and longitude, or omit location.",
        });
      }
    }

    const doc = await Project.create({
      programType,
      title: title.trim(),
      amountOfAssistance: String(amountOfAssistance ?? "").trim(),
      beneficiary: beneficiary.trim(),
      contactPerson: String(contactPerson ?? "").trim(),
      briefDescription: String(briefDescription ?? "").trim(),
      projectStatus,
      location: { latitude, longitude },
    });

    res.status(201).json(serialize(doc));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save project." });
  }
}

module.exports = { listProjects, createProject, serialize };
