import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { connectRedis } from "./config/redis.js";
import { getSessionMiddleware } from "./utils/session.js";

import ApiErrorMiddleware from "./middleware/ApiError.middleware.js";
import requestValidator from "./middleware/requestValidator.middleware.js";
import router from "./router/index.js";

const app = express();

const startServer = async () => {
  try {
    await connectRedis(); // ✅ Redis connected

    // ✅ Middleware setup
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(getSessionMiddleware()); // ✅ Session middleware from utils

    app.use(requestValidator);
    app.use("/", router);
    app.use(ApiErrorMiddleware);

    app.get("/ping", (req, res) => {
      res.send("pong");
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
export default app;
