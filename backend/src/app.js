const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const fileRoutes = require("./routes/file.routes");

const app = express();

// Security & logging
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan("dev"));

// Parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173,https://smart-vault-livid.vercel.app")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

  const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

// 404 handler
app.use((req,  res) => res.status(404).json({ success: false, message: "Route not found" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, message: "File too large (max 100MB)" });
  }
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal server error" });
});

module.exports = app;
