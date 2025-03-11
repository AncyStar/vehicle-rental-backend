const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const authMiddleware = require("../middleware/auth"); // Ensure user is logged in

router.post("/", authMiddleware, async (req, res) => {
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

module.exports = router;
