const express = require("express");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const { authenticate } = require("../middleware/authenticate");

const router = express.Router();

// Get available dates for a vehicle
router.get("/availability/:vehicleId", async (req, res) => {
  try {
    const { vehicleId } = req.params;

    if (!vehicleId) {
      return res.status(400).json({ message: "Vehicle ID is required." });
    }

    const bookings = await Booking.find({
      vehicle: vehicleId,
      status: { $in: ["pending", "confirmed"] }, // Fetch active bookings
    });

    if (!bookings || bookings.length === 0) {
      return res.json({ unavailableDates: [] }); // No bookings, all dates available
    }

    const unavailableDates = bookings.map((booking) => ({
      start: booking.startDate.toISOString(),
      end: booking.endDate.toISOString(),
    }));

    console.log("Unavailable Dates:", unavailableDates); // Debugging
    res.json({ unavailableDates });
  } catch (error) {
    console.error("Error fetching available dates:", error.message);
    res.status(500).json({ message: "Error fetching available dates." });
  }
});

// Book a Vehicle
router.post("/", authenticate, async (req, res) => {
  try {
    const { vehicleId, startDate, endDate } = req.body;
    const userId = req.user.id;

    const booking = await Booking.create({
      vehicle: vehicleId,
      user: userId,
      startDate,
      endDate,
      status: "confirmed",
    });

    res.status(201).json({ message: "Booking created", booking }); //Returns booking with ID
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Error creating booking." });
  }
});

//  Get booking by ID
router.get("/:bookingId", authenticate, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({ message: "Error fetching booking details." });
  }
});

module.exports = router;
