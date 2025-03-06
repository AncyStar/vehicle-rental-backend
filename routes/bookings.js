const express = require("express");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const { authenticate } = require("../middleware/authenticate");

const router = express.Router();

// Get available dates for a vehicle
router.get("/availability/:vehicleId", async (req, res) => {
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
});

// Book a Vehicle
router.post("/", authenticate, async (req, res) => {
  try {
    console.log("Creating Booking for Vehicle ID:", req.body.vehicleId);
    console.log("User Making Booking:", req.user.id);

    const { vehicleId, startDate, endDate } = req.body;

    // Validate booking dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start < today || end < today) {
      return res
        .status(400)
        .json({ message: "Booking dates cannot be in the past." });
    }
    if (start >= end) {
      return res
        .status(400)
        .json({ message: "End date must be after start date." });
    }

    // Check if the vehicle is already booked
    const isBooked = await Booking.exists({
      vehicle: vehicleId,
      $and: [{ startDate: { $lt: end } }, { endDate: { $gt: start } }],
    });

    if (isBooked) {
      return res
        .status(400)
        .json({ message: "This vehicle is already booked for these dates." });
    }

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    // Calculate total price
    const rentalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = rentalDays * vehicle.pricePerDay;

    // Create the booking
    const booking = await Booking.create({
      user: req.user.id,
      vehicle: vehicleId,
      startDate,
      endDate,
      totalPrice,
      status: "pending",
    });

    res.status(201).json({ message: "Booking created", booking });
  } catch (error) {
    console.error("Error creating booking:", error.message);
    res.status(500).json({ message: "Error creating booking" });
  }
});

module.exports = router;
