require("dotenv").config();
const dns = require("dns");
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch (e) {}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const subjectsRouter = require("./routes/subjects");
const tasksRouter = require("./routes/tasks");
const pomodoroRouter = require("./routes/pomodoro");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://vasanthavishwapv_db_user:Vichu*1234@cluster0.nsqdrj7.mongodb.net/study-planner?retryWrites=true&w=majority";

app.use(cors());
app.use(express.json());

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

async function connectWithRetry(retries = 5, delay = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      console.log("✅ Connected to MongoDB Atlas Cloud Database");
      app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
      return;
    } catch (err) {
      if (i === retries) {
        console.error(`\n❌ Could not connect to MongoDB after ${retries} attempts.`);
        console.error("   Error:", err.message);
        app.listen(PORT, () => {
          console.log(`⚠️ Server running at http://localhost:${PORT} (Offline mode)`);
        });
        return;
      }
      console.log(`⏳ MongoDB not ready (attempt ${i}/${retries}), retrying in ${delay / 1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

connectWithRetry();