const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./config/db");
const initializeDatabase = require("./config/initDb");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.status(200).json({ message: "API and DB are healthy" });
  } catch (error) {
    return res.status(500).json({ message: "DB connection failed", error: error.message });
  }
});

app.use("/api", authRoutes);
app.use("/api", taskRoutes);

async function startServer() {
  try {
    await initializeDatabase();
    await pool.query("SELECT 1");
    app.listen(PORT, () => {
      console.log(`StudyHub backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
}

startServer();
