require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const subjectsRouter = require("../server/routes/subjects");
const tasksRouter = require("../server/routes/tasks");
const pomodoroRouter = require("../server/routes/pomodoro");

const app = express();

app.use(cors());
app.use(express.json());

// Serverless Mongoose connection caching
let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/study-planner";
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });
    isConnected = true;
    console.log("Connected to MongoDB (Serverless)");
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
  }
}

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.use("/api/subjects", subjectsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/pomodoro", pomodoroRouter);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

module.exports = app;