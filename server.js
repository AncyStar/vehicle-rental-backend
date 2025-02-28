require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

const authenRoutes = require("./routes/authentication");
const vehicleRoutes = require("./routes/vehicles");
const bookingRoutes = require("./routes/bookings");
const paymentRoutes = require("./routes/payments");

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Routes
app.use("/api/authentication", authenRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_DB);

const db = mongoose.connection;
db.once("open", () => console.log("Connected to MongoDB"));

// Routes (Will add routes later)
app.get("/", (req, res) => {
  res.send("Vehicle Rental API is running...");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
