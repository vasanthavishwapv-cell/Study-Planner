require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const subjectsRouter = require("./routes/subjects");
const tasksRouter = require("./routes/tasks");
const pomodoroRouter = require("./routes/pomodoro");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/study-planner";

app.use(cors());
app.use(express.json());

app.use("/api/subjects", subjectsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/pomodoro", pomodoroRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

async function connectWithRetry(retries = 5, delay = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      console.log("✅ Connected to MongoDB");
      app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
      return;
    } catch (err) {
      if (i === retries) {
        console.error(`\n❌ Could not connect to MongoDB after ${retries} attempts.`);
        console.error("   Please ensure MongoDB is installed and running.");
        console.error("   Download: https://www.mongodb.com/try/download/community");
        console.error("   Or use MongoDB Atlas: https://cloud.mongodb.com\n");
        // Start server anyway (API will fail gracefully)
        app.listen(PORT, () => {
          console.log(`⚠️  Server running at http://localhost:${PORT} (No DB - limited functionality)`);
        });
        return;
      }
      console.log(`⏳ MongoDB not ready (attempt ${i}/${retries}), retrying in ${delay/1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

connectWithRetry();