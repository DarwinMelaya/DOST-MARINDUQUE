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

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

if (!JWT_SECRET) {
  console.error("Missing JWT_SECRET in environment.");
  process.exit(1);
}

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth/admin", adminAuthRoutes);

// Register on `app` directly so POST /api/projects is always found (nested
// Router + Express 5 can miss POST on some setups).
app.get("/api/projects", listProjects);
app.post("/api/projects", requireAdmin, createProject);

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
    console.log("  POST /api/projects  (Authorization: Bearer <admin JWT>)");
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
