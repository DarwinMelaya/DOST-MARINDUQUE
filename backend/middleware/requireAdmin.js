const jwt = require("jsonwebtoken");

module.exports = function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required." });
  }
  const token = header.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "Server configuration error." });
  }
  try {
    const payload = jwt.verify(token, secret);
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required." });
    }
    req.adminId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session." });
  }
};
