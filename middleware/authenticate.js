const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Booking = require("../models/Booking");

const authenticate = async (req, res, next) => {
  try {
    console.log("Request Headers:", req.headers);

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token missing or invalid." });
    }

    const token = authHeader.split(" ")[1];
    console.log("Extracted Token:", token);

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in .env!");
      return res
        .status(500)
        .json({
          message: "Server error: JWT secret missing. Contact support.",
        });
    }

    // Verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", verified);

    // Find user in database
    const user = await User.findById(verified.id).select("-password");
    console.log("User Found:", user ? "Yes" : "No");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    return res.status(401).json({ message: "Unauthorized: Invalid token." });
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Please log in first." });
  }
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Forbidden: Only admins can perform this action." });
  }
  next();
};

const logout = (req, res) => {
  res.json({ message: "Logged out successfully." });
};

const getAvailableDates = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const bookings = await Booking.find({
      vehicle: vehicleId,
      status: "confirmed",
    });
    const unavailableDates = bookings.map((booking) => ({
      start: booking.startDate,
      end: booking.endDate,
    }));
    res.json({ unavailableDates });
  } catch (error) {
    console.error("Error fetching available dates:", error.message);
    res.status(500).json({ message: "Error fetching available dates." });
  }
};

module.exports = { authenticate, isAdmin, logout, getAvailableDates };
