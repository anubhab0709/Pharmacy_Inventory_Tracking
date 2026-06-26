import dotenv from "dotenv";
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
import profileRoutes from "./routes/profileRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change_me_in_production") {
  if (process.env.NODE_ENV === "production") {
    console.error("FATAL: Set a strong JWT_SECRET before running in production");
    process.exit(1);
  }
  console.warn("⚠️  Using default JWT_SECRET — set JWT_SECRET in .env for production");
}

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001,http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.get("/health", (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/stock-out", stockOutRoutes);
app.use("/api/profile", profileRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
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

  const shutdown = (signal) => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}).catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
