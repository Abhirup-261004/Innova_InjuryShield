const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const checkinRoutes = require("./routes/checkinRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const planRoutes = require("./routes/planRoutes");
const injuryradarRoutes = require("./routes/injuryRadarRoutes");


dotenv.config();

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(express.json());

const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173","https://your-frontend.vercel.app"];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server / Postman / curl (no origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error("CORS blocked for origin: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// ✅ Preflight handler (Express v5 safe)
app.options(/.*/, cors());

// Health Route
app.get("/", (req, res) => {
  res.status(200).type("html").send(`
    <html>
      <head>
        <title>InjuryShield API</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            background: #0f172a;
            color: white;
          }
          .box {
            background: #111827;
            padding: 20px;
            border-radius: 12px;
            width: fit-content;
            box-shadow: 0 0 20px rgba(0,0,0,0.4);
          }
          .ok {
            color: #22c55e;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="box">
          <h2 class="ok">✅ InjuryShield API is running</h2>
          <p>Status: OK</p>
        </div>
      </body>
    </html>
  `);
});

app.use((req,res,next) =>{
    console.log("->", req.method, req.url);
    next();
});

app.use("/api/auth", authRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/checkins", checkinRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/injury-radar", injuryradarRoutes)

// Start Server
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

