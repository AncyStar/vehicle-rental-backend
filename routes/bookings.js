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

// 🔹 Get all bookings for the logged-in user (Fix: Change route from "/my-bookings" to "/my")
router.get("/my", authenticate, async (req, res) => {
  try {
    console.log("🔹 Checking authenticated user:", req.user);

    if (!req.user || !req.user.id) {
      console.error("❌ Error: User ID is missing from req.user");
      return res.status(401).json({ message: "Unauthorized: User ID missing" });
    }

    const userId = req.user.id;
    console.log("🔹 Fetching bookings for user:", userId);

    const bookings = await Booking.find({ user: userId }).populate("vehicle");

    console.log("✅ Bookings Found:", bookings);

    if (!bookings.length) {
      console.log("ℹ️ No bookings found for this user.");
      return res.status(404).json({ message: "No bookings found." });
    }

    res.json(bookings);
  } catch (error) {
    console.error("❌ Error fetching bookings:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;
