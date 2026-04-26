require("dotenv").config();
const compression = require("compression");
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
const {
  listCoralReefs,
  createCoralReef,
  updateCoralReef,
  deleteCoralReef,
} = require("./controllers/coralReefsController");
const { getAdminDashboard } = require("./controllers/adminDashboardController");

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

const coralReefPhotos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.mimetype);
    cb(null, ok);
  },
}).fields([{ name: "photos", maxCount: 3 }]);

function projectMultipart(req, res, next) {
  const ct = req.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    return projectImages(req, res, next);
  }
  next();
}

function coralReefMultipart(req, res, next) {
  const ct = req.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    return coralReefPhotos(req, res, next);
  }
  next();
}

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const RESPONSE_CACHE_TTL_MS = Number(process.env.RESPONSE_CACHE_TTL_MS) || 30000;

app.disable("x-powered-by");
// Render/Reverse proxies: allow correct IP/secure cookies when needed.
app.set("trust proxy", 1);

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
// Compress JSON responses (big impact when collections grow).
app.use(
  compression({
    level: 6,
    threshold: 1024, // don't bother for tiny payloads
  })
);

app.use(express.json({ limit: "1mb" }));

const responseCache = new Map();

function getCacheEntry(key) {
  const hit = responseCache.get(key);
  if (!hit) return null;
  if (Date.now() >= hit.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return hit;
}

function setCacheEntry(key, body) {
  responseCache.set(key, {
    body,
    expiresAt: Date.now() + RESPONSE_CACHE_TTL_MS,
  });
}

function invalidateCacheByPrefix(prefix) {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }
}

function publicCachedJson(handler, { maxAgeSeconds = 15, swrSeconds = 45 } = {}) {
  return async (req, res, next) => {
    const key = req.originalUrl;
    const cached = getCacheEntry(key);
    const cacheControl = `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${swrSeconds}`;
    if (cached) {
      res.set("Cache-Control", cacheControl);
      res.set("X-Cache", "HIT");
      return res.json(cached.body);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCacheEntry(key, body);
      }
      res.set("Cache-Control", cacheControl);
      res.set("X-Cache", "MISS");
      return originalJson(body);
    };

    try {
      return await handler(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
}

function invalidateCacheOnSuccess(handler, prefixes = []) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    const originalEnd = res.end.bind(res);
    let invalidated = false;
    const flush = () => {
      if (invalidated) return;
      if (res.statusCode >= 200 && res.statusCode < 300) {
        for (const prefix of prefixes) invalidateCacheByPrefix(prefix);
        invalidated = true;
      }
    };

    res.json = (body) => {
      flush();
      return originalJson(body);
    };
    res.end = (...args) => {
      flush();
      return originalEnd(...args);
    };

    try {
      return await handler(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth/admin", adminAuthRoutes);

// Register on `app` directly so POST /api/projects is always found (nested
// Router + Express 5 can miss POST on some setups).
app.get("/api/projects", publicCachedJson(listProjects));
app.post(
  "/api/projects",
  requireAdmin,
  projectMultipart,
  invalidateCacheOnSuccess(createProject, ["/api/projects"])
);
app.patch(
  "/api/projects/:id",
  requireAdmin,
  projectMultipart,
  invalidateCacheOnSuccess(updateProject, ["/api/projects"])
);
app.delete(
  "/api/projects/:id",
  requireAdmin,
  invalidateCacheOnSuccess(deleteProject, ["/api/projects"])
);

app.get("/api/coral-reefs", publicCachedJson(listCoralReefs));
app.post(
  "/api/coral-reefs",
  requireAdmin,
  coralReefMultipart,
  invalidateCacheOnSuccess(createCoralReef, ["/api/coral-reefs"])
);
app.patch(
  "/api/coral-reefs/:id",
  requireAdmin,
  coralReefMultipart,
  invalidateCacheOnSuccess(updateCoralReef, ["/api/coral-reefs"])
);
app.delete(
  "/api/coral-reefs/:id",
  requireAdmin,
  invalidateCacheOnSuccess(deleteCoralReef, ["/api/coral-reefs"])
);

app.get("/api/admin/dashboard", requireAdmin, getAdminDashboard);

app.get("/api/announcements/featured", publicCachedJson(getFeaturedAnnouncement));
app.get("/api/announcements", requireAdmin, listAnnouncements);
app.post(
  "/api/announcements",
  requireAdmin,
  announcementImages,
  invalidateCacheOnSuccess(createAnnouncement, ["/api/announcements/featured"])
);
app.patch(
  "/api/announcements/:id",
  requireAdmin,
  announcementImages,
  invalidateCacheOnSuccess(updateAnnouncement, ["/api/announcements/featured"])
);
app.delete(
  "/api/announcements/:id",
  requireAdmin,
  invalidateCacheOnSuccess(deleteAnnouncement, ["/api/announcements/featured"])
);

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
