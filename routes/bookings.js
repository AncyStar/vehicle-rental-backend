const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const { authenticate } = require("../middleware/authenticate"); // Correct import

// Create a new booking
router.post("/", authenticate, async (req, res) => {
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
// Get all bookings
router.get("/", authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find().populate("vehicle user");
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get booking details by ID (Fix: Use exact "/:id" to prevent conflicts)
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const booking = await Booking.findById(id).populate("vehicle");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
