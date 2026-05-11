import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import chatRoutes from "./routes/chat.js";
import authOtpRoutes from "./routes/authOtpRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import authGstRoutes from "./routes/authGstRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

// ✅ Security middlewares
app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// ✅ Health route
app.get("/", (req, res) => {
  res.status(200).send("🚀 AgroMitra Backend Running");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is alive ✅",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ✅ Rate limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { message: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
});

app.use(globalLimiter);
app.use("/api/auth", authLimiter);

// ✅ Static uploads
app.use("/uploads", express.static("uploads"));

// ✅ Routes
app.use("/api/chat", chatRoutes);
app.use("/api/auth", authOtpRoutes);
app.use("/api/auth/seller", authGstRoutes);
app.use("/api/auth/legacy", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// ✅ 404 route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ✅ Error handler last
app.use(errorHandler);

export default app;