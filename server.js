require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ✅ Fix CORS: Ensure proper frontend origin handling
const allowedOrigins = [
  process.env.FRONTEND_URL?.replace(/\/$/, "") || "http://localhost:5173", // Remove trailing slash
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Added OPTIONS
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Handle Preflight Requests
app.options("*", cors());

// Middleware
app.use(express.json());

// Import Routes
const authRoutes = require("./routes/authRoute");
const vehicleRoutes = require("./routes/vehicles");
const bookingRoutes = require("./routes/bookings");
const paymentRoutes = require("./routes/payments");

// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGO_DB)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error(" MongoDB Connection Error:", err));

app.get("/", (req, res) => {
  res.send("🚀 Vehicle Rental API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
