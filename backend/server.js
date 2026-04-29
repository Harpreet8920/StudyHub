const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./config/db");
const { getDatabaseConfig } = require("./config/env");
const initializeDatabase = require("./config/initDb");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

dotenv.config();

const dbConfig = getDatabaseConfig();


// 1. Define the secrets your app needs (like JWT)
const requiredEnv = ["JWT_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

// 2. Check for Database connection info
const hasDbUrl = !!process.env.DATABASE_URL;
const missingDbComponents = ["host", "user", "password", "database"].filter((key) => !dbConfig[key]);

// 3. Only crash if BOTH the URL and individual variables are missing
if (missingEnv.length > 0 || (!hasDbUrl && missingDbComponents.length > 0)) {
  const missing = [
    ...missingEnv,
    ...(!hasDbUrl ? missingDbComponents.map((key) => `DB_${key.toUpperCase()}`) : [])
  ];
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}
const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS: Origin not allowed"));
    },
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
    console.error("Failed to start backend:", error);
    if (error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

startServer();
