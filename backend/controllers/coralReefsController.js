const mongoose = require("mongoose");
const CoralReef = require("../models/CoralReef");
const {
  uploadImageFilesToSupabase,
  removeSupabaseObjectsByUrls,
} = require("../utils/storageUpload");

function serialize(doc) {
  const o =
    doc && typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  return {
    id: String(o._id),
    coralName: o.coralName,
    coralType: o.coralType,
    description: o.description ?? "",
    coralStatus: o.coralStatus,
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
    areaCoordinates: Array.isArray(o.areaCoordinates)
      ? o.areaCoordinates
          .map((point) => {
            const latitude = Number(point?.latitude);
            const longitude = Number(point?.longitude);
            if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
            return { latitude, longitude };
          })
          .filter(Boolean)
      : [],
    photo: o.photo ?? "",
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

function normalizeBody(req) {
  const ct = req.get("content-type") || "";
  if (!ct.includes("multipart/form-data")) {
    return req.body;
  }
  let location = null;
  let areaCoordinates = [];
  if (typeof req.body.location === "string" && req.body.location.trim()) {
    try {
      location = JSON.parse(req.body.location);
    } catch {
      location = null;
    }
  } else if (req.body.location && typeof req.body.location === "object") {
    location = req.body.location;
  }
  if (
    typeof req.body.areaCoordinates === "string" &&
    req.body.areaCoordinates.trim()
  ) {
    try {
      areaCoordinates = JSON.parse(req.body.areaCoordinates);
    } catch {
      areaCoordinates = [];
    }
  } else if (Array.isArray(req.body.areaCoordinates)) {
    areaCoordinates = req.body.areaCoordinates;
  }
  return {
    coralName: req.body.coralName,
    coralType: req.body.coralType,
    description: req.body.description,
    coralStatus: req.body.coralStatus,
    location,
    areaCoordinates,
  };
}

function parseLocation(location) {
  let latitude = null;
  let longitude = null;
  if (location && typeof location === "object") {
    const { latitude: lat, longitude: lng } = location;
    if (lat != null && lng != null) {
      const parsedLat = Number(lat);
      const parsedLng = Number(lng);
      if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
        return {
          error: "Latitude and longitude must be valid numbers when provided.",
        };
      }
      latitude = parsedLat;
      longitude = parsedLng;
    } else if (lat != null || lng != null) {
      return { error: "Provide both latitude and longitude, or omit location." };
    }
  }
  return { latitude, longitude };
}

function validateBody(body) {
  const coralName = String(body.coralName ?? "").trim();
  const coralType = String(body.coralType ?? "").trim();
  const description = String(body.description ?? "").trim();
  const coralStatus = String(body.coralStatus ?? "").trim();

  if (!coralName || !coralType) {
    return { error: "Coral name and coral type are required." };
  }

  const allowedStatus = ["Healthy", "Bleached Damaged", "Recovering", "Dead"];
  if (!allowedStatus.includes(coralStatus)) {
    return { error: "Invalid coral status." };
  }

  const loc = parseLocation(body.location);
  if (loc.error) return { error: loc.error };
  const area = parseAreaCoordinates(body.areaCoordinates);
  if (area.error) return { error: area.error };

  return {
    values: {
      coralName,
      coralType,
      description,
      coralStatus,
      location: { latitude: loc.latitude, longitude: loc.longitude },
      areaCoordinates: area.coordinates,
    },
  };
}

function parseAreaCoordinates(areaCoordinates) {
  if (areaCoordinates == null || areaCoordinates === "") {
    return { coordinates: [] };
  }
  if (!Array.isArray(areaCoordinates)) {
    return { error: "Area coordinates must be an array of latitude/longitude points." };
  }
  const coordinates = [];
  for (const point of areaCoordinates) {
    const latitude = Number(point?.latitude);
    const longitude = Number(point?.longitude);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return { error: "Each area point must have valid latitude and longitude." };
    }
    coordinates.push({ latitude, longitude });
  }
  if (coordinates.length > 0 && coordinates.length < 3) {
    return { error: "Drawn area must have at least 3 points." };
  }
  return { coordinates };
}

async function listCoralReefs(_req, res) {
  try {
    const docs = await CoralReef.find().sort({ createdAt: -1 }).lean();
    res.json(docs.map((d) => serialize({ ...d, _id: d._id })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load coral reef records." });
  }
}

async function createCoralReef(req, res) {
  try {
    const body = normalizeBody(req);
    const v = validateBody(body);
    if (v.error) {
      return res.status(400).json({ message: v.error });
    }

    const fileList = req.files?.photo;
    const photoFile = Array.isArray(fileList) ? fileList[0] : null;
    let photoUrl = "";
    if (photoFile) {
      try {
        const uploaded = await uploadImageFilesToSupabase([photoFile], "coral-reefs");
        photoUrl = uploaded[0] || "";
      } catch (e) {
        console.error(e);
        return res.status(503).json({
          message: "Image upload failed. Check Supabase bucket and credentials.",
        });
      }
    }

    const doc = await CoralReef.create({
      ...v.values,
      photo: photoUrl,
    });
    res.status(201).json(serialize(doc));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save coral reef record." });
  }
}

async function deleteCoralReef(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid coral reef id." });
    }
    const doc = await CoralReef.findById(id).lean();
    if (!doc) {
      return res.status(404).json({ message: "Coral reef record not found." });
    }
    await removeSupabaseObjectsByUrls(doc.photo ? [doc.photo] : []);
    await CoralReef.deleteOne({ _id: id });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not delete coral reef record." });
  }
}

module.exports = {
  listCoralReefs,
  createCoralReef,
  deleteCoralReef,
};
