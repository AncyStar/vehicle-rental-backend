require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import routes
const authRoutes = require("./routes/authentication");
const vehicleRoutes = require("./routes/vehicles");
const bookingRoutes = require("./routes/bookings");
const paymentRoutes = require("./routes/payments");

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["https://vehicle-rentel-frontend.netlify.app/"], //frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGO_DB)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

app.get("/", (req, res) => {
  res.send("Vehicle Rental API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
