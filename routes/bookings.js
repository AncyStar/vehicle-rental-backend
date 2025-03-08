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
// Create a new booking
router.post("/", authenticate, async (req, res) => {
  try {
    console.log("Received Booking Request Body:", req.body); // ✅ Debugging log

    const { vehicleId, startDate, endDate, totalPrice } = req.body;
    if (!vehicleId || !startDate || !endDate || !totalPrice) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Convert to Date objects
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    // Check for existing bookings with overlapping dates
    const existingBooking = await Booking.findOne({
      vehicle: vehicleId,
      status: { $in: ["pending", "confirmed"] },
      $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
    });

    if (existingBooking) {
      return res
        .status(400)
        .json({ message: "Selected dates are unavailable." });
    }

    // Validate totalPrice
    if (typeof totalPrice !== "number" || totalPrice <= 0) {
      return res.status(400).json({ message: "Invalid total price." });
    }

    // Create booking
    const booking = await Booking.create({
      vehicle: vehicleId,
      user: req.user.id,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      totalPrice,
      status: "confirmed",
    });

    console.log("Booking Created Successfully:", booking);
    res.status(201).json({ message: "Booking created successfully", booking });
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
