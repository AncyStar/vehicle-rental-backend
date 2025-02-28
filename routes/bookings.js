const express = require("express");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const { authenticate } = require("../middleware/authenticate");

const router = express.Router();

// Create a Booking
router.post("/", authenticate, async (req, res) => {
  try {
    const { vehicleId, startDate, endDate } = req.body;

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
    res.status(500).json({ message: "Error creating booking" });
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
