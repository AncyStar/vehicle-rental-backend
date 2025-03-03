const express = require("express");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const { authenticate } = require("../middleware/authenticate");

const router = express.Router();

// Create a Booking
router.post("/", authenticate, async (req, res) => {
  try {
    const { vehicleId, startDate, endDate } = req.body;

    // Validate dates
    const today = new Date().toISOString().split("T")[0];
    if (startDate < today || endDate < today) {
      return res
        .status(400)
        .json({ message: "Booking dates cannot be in the past." });
    }
    if (new Date(startDate) >= new Date(endDate)) {
      return res
        .status(400)
        .json({ message: "End date must be after start date." });
    }

    // Check if the vehicle is already booked for these dates
    const existingBooking = await Booking.findOne({
      vehicle: vehicleId,
      $and: [{ startDate: { $lt: endDate } }, { endDate: { $gt: startDate } }],
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "This vehicle is already booked for the selected dates.",
      });
    }

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    // Calculate total price
    const rentalDays = Math.ceil(
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
    );
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
    res
      .status(500)
      .json({ message: "Error creating booking", error: error.message });
  }
});

// Get a Booking by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "vehicle user"
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Error fetching booking details" });
  }
});

// Get All Bookings (Admin Only)
router.get("/", authenticate, async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { user: req.user.id };
    const bookings = await Booking.find(filter).populate(
      "vehicle user",
      "make model name email"
    );
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

// Cancel a Booking (User Only)
router.put("/:id/cancel", authenticate, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "canceled";
    await booking.save();

    res.json({ message: "Booking canceled", booking });
  } catch (error) {
    res.status(500).json({ message: "Error canceling booking" });
  }
});

module.exports = router;
