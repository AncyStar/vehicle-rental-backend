const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const { authenticate } = require("../middleware/authenticate"); // Correct import

// Create a new booking
router.post("/", authenticate, async (req, res) => {
  // 🔹 Fixed Middleware Name
  try {
    const { vehicleId, startDate, endDate, totalPrice } = req.body;

    if (!vehicleId || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing booking details" });
    }

    if (isNaN(totalPrice) || totalPrice <= 0) {
      return res.status(400).json({ message: "Invalid total price" });
    }

    const newBooking = new Booking({
      vehicle: vehicleId,
      user: req.user.id,
      startDate,
      endDate,
      totalPrice,
      status: "pending",
    });

    await newBooking.save();
    res
      .status(201)
      .json({ message: "Booking successful!", booking: newBooking });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Get booking details by ID
router.get("/:id", authenticate, async (req, res) => {
  // 🔹 Fixed Middleware Name
  try {
    const booking = await Booking.findById(req.params.id).populate("vehicle"); // Populate vehicle details
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get all bookings for the logged-in user
router.get("/my-bookings", authenticate, async (req, res) => {
  try {
    const userId = req.user.id; // Ensure req.user is set correctly
    console.log("🔹 Fetching bookings for user:", userId);

    const bookings = await Booking.find({ user: userId }).populate("vehicle");

    if (!bookings.length) {
      console.log("No bookings found for this user.");
      return res.status(404).json({ message: "No bookings found." });
    }

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
