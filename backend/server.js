require("dotenv").config();
const cors = require("cors");
const express = require("express");
const multer = require("multer");
const connectDB = require("./config/db");
const adminAuthRoutes = require("./routes/adminAuth");
const requireAdmin = require("./middleware/requireAdmin");
const {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} = require("./controllers/projectsController");
const {
  getFeaturedAnnouncement,
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("./controllers/announcementsController");

const announcementImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024, files: 15 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.mimetype);
    cb(null, ok);
  },
}).fields([{ name: "images", maxCount: 12 }]);

const projectImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024, files: 15 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.mimetype);
    cb(null, ok);
  },
}).fields([{ name: "images", maxCount: 12 }]);

function projectMultipart(req, res, next) {
  const ct = req.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    return projectImages(req, res, next);
  }
  next();
}

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

function parseAllowedOrigins(v) {
  if (!v) return [];
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins(CLIENT_ORIGIN);

function isOriginAllowed(origin, allowed) {
  if (!origin) return true;
  if (!Array.isArray(allowed) || allowed.length === 0) return false;
  if (allowed.includes("*")) return true;

  // Exact match (most secure / recommended)
  if (allowed.includes(origin)) return true;

  // Wildcards / suffix allow:
  // - "*.vercel.app" allows any subdomain of vercel.app
  // - ".vercel.app" same as above
  // - "vercel.app" allows that domain + subdomains
  let hostname;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return false;
  }
  const host = hostname.toLowerCase();

  return allowed.some((rule) => {
    const r = String(rule || "").trim().toLowerCase();
    if (!r || r === origin.toLowerCase()) return false;

    // If rule includes protocol, treat as exact origin only.
    if (r.includes("://")) return false;

    const suffix = r.startsWith("*.") ? r.slice(1) : r; // "*.x.com" -> ".x.com"
    if (suffix.startsWith(".")) {
      return host.endsWith(suffix);
    }
    // "vercel.app" should match "vercel.app" and "*.vercel.app"
    return host === suffix || host.endsWith(`.${suffix}`);
  });
}

if (!JWT_SECRET) {
  console.error("Missing JWT_SECRET in environment.");
  process.exit(1);
}

app.use(
  cors({
    origin(origin, cb) {
      // Non-browser requests (curl, server-to-server) have no origin.
      if (!origin) return cb(null, true);
      if (isOriginAllowed(origin, allowedOrigins)) return cb(null, true);
      const err = new Error("Not allowed by CORS");
      err.code = "CORS_NOT_ALLOWED";
      return cb(err);
    },
    credentials: true,
  })
);

// Make CORS failures explicit (avoid confusing 500s).
app.use((err, _req, res, next) => {
  if (err && err.code === "CORS_NOT_ALLOWED") {
    return res.status(403).json({
      message:
        "CORS blocked this request. Set CLIENT_ORIGIN to your frontend URL (comma-separated allowed).",
    });
  }
  next(err);
});
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth/admin", adminAuthRoutes);

// Register on `app` directly so POST /api/projects is always found (nested
// Router + Express 5 can miss POST on some setups).
app.get("/api/projects", listProjects);
app.post("/api/projects", requireAdmin, projectMultipart, createProject);
app.patch("/api/projects/:id", requireAdmin, projectMultipart, updateProject);
app.delete("/api/projects/:id", requireAdmin, deleteProject);

app.get("/api/announcements/featured", getFeaturedAnnouncement);
app.get("/api/announcements", requireAdmin, listAnnouncements);
app.post(
  "/api/announcements",
  requireAdmin,
  announcementImages,
  createAnnouncement
);
app.patch(
  "/api/announcements/:id",
  requireAdmin,
  announcementImages,
  updateAnnouncement
);
app.delete("/api/announcements/:id", requireAdmin, deleteAnnouncement);

app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res
      .status(400)
      .json({ message: err.message || "File upload error." });
  }
  next(err);
});

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
    console.log("  GET  /api/projects  (public)");
    console.log(
      "  POST /api/projects  (JSON or multipart + images, Authorization: Bearer <admin JWT>)"
    );
    console.log(
      "  PATCH /api/projects/:id  (JSON or multipart + keptImagesJson, Authorization: Bearer <admin JWT>)"
    );
    console.log("  DELETE /api/projects/:id  (admin JWT)");
    console.log("  GET  /api/announcements/featured  (public)");
    console.log("  GET  /api/announcements  (admin JWT)");
    console.log(
      "  POST /api/announcements  (multipart, Authorization: Bearer <admin JWT>)"
    );
    console.log(
      "  PATCH /api/announcements/:id  (multipart, Authorization: Bearer <admin JWT>)"
    );
    console.log("  DELETE /api/announcements/:id  (admin JWT)");
  });
})();
