import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import userRoutes from "./routes/user.route.js";
import campgroundRoutes from "./routes/campground.route.js";
import reviewRoutes from "./routes/review.route.js";
import authRoutes from "./routes/auth.route.js";
import bookingRouter from "./routes/booking.route.js";
import conversationRoutes from "./routes/conversation.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/campgrounds", campgroundRoutes);
app.use("/api/campgrounds/:id/reviews", reviewRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/bookings", bookingRouter);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(frontendDistPath));

  app.get("/{*splat}", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "File is too large. Maximum file size is 5 MB.",
      });
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. You can upload a maximum of 8 files.",
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field or too many uploaded files",
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid resource id",
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Access token expired",
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid access token",
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
