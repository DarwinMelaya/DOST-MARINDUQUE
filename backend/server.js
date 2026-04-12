require("dotenv").config();
const cors = require("cors");
const express = require("express");
const connectDB = require("./config/db");
const adminAuthRoutes = require("./routes/adminAuth");

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

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
})();
