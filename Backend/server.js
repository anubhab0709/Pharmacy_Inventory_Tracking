import "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import medicineRoutes from "./routes/medicineRoutes.js";
import stockOutRoutes from "./routes/stockOutRoutes.js";
import disposalRoutes from "./routes/disposalRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

const isProd = process.env.NODE_ENV === "production";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change_me_in_production") {
  if (isProd) {
    console.error("FATAL: Set a strong JWT_SECRET before running in production");
    process.exit(1);
  }
  console.warn("⚠️  Using default JWT_SECRET — set JWT_SECRET in .env for production");
}

if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === process.env.JWT_SECRET) {
  if (isProd) {
    console.error("FATAL: Set a distinct JWT_REFRESH_SECRET (must differ from JWT_SECRET)");
    process.exit(1);
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    console.warn("⚠️  JWT_REFRESH_SECRET missing — using JWT_SECRET. Set a distinct value before production.");
  } else {
    console.warn("⚠️  JWT_REFRESH_SECRET matches JWT_SECRET — use a distinct secret before production.");
  }
}

const app = express();

// Required when behind nginx/load balancer so rate-limit sees real client IPs
if (process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true" || isProd) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS) || 1);
}

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(helmet());
app.use(morgan(isProd ? "combined" : "dev"));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 200 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, try again later" },
});
app.use("/api", apiLimiter);

const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 80 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many write requests, slow down" },
});
app.use("/api/bills", mutationLimiter);
app.use("/api/medicines", mutationLimiter);
app.use("/api/disposals", mutationLimiter);
app.use("/api/stock-out", mutationLimiter);

app.get("/health", (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/stock-out", stockOutRoutes);
app.use("/api/disposals", disposalRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/contact", contactRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error(`   Run: lsof -ti tcp:${PORT} | xargs kill -9`);
      console.error(`   Then restart with: npm run dev\n`);
      process.exit(1);
    }
    console.error("Server error:", err.message);
    process.exit(1);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}).catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
