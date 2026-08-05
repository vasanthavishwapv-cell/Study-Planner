require("dotenv").config();
const dns = require("dns");
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch (e) {}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const subjectsRouter = require("../server/routes/subjects");
const tasksRouter = require("../server/routes/tasks");
const pomodoroRouter = require("../server/routes/pomodoro");

const app = express();

app.use(cors());
app.use(express.json());

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://vasanthavishwapv_db_user:Vichu*1234@cluster0.nsqdrj7.mongodb.net/study-planner?retryWrites=true&w=majority";
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log("Connected to MongoDB Atlas (Serverless)");
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