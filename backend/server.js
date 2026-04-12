require("dotenv").config();
const cors = require("cors");
const express = require("express");
const connectDB = require("./config/db");
const adminAuthRoutes = require("./routes/adminAuth");
const requireAdmin = require("./middleware/requireAdmin");
const {
  listProjects,
  createProject,
} = require("./controllers/projectsController");

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

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
    console.log("  GET  /api/projects  (public)");
    console.log("  POST /api/projects  (Authorization: Bearer <admin JWT>)");
  });
})();
