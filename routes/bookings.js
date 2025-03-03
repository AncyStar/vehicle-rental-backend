const express = require("express");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const { authenticate } = require("../middleware/authenticate");

const router = express.Router();

// Create a Booking
router.post("/", authenticate, async (req, res) => {
  try {
    console.log("Creating Booking for Vehicle ID:", req.body.vehicleId);
    console.log("User Making Booking:", req.user.id);

    const { vehicleId, startDate, endDate } = req.body;

    // Validate booking dates
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
      console.log("Booking Conflict: This vehicle is already booked");
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

    // Verify booking is saved
    const bookingExists = await Booking.findById(booking._id);
    console.log("Booking Exists in DB:", bookingExists ? "Yes" : "No");

    res.status(201).json({ message: "Booking created", booking });
  } catch (error) {
    console.error("Error creating booking:", error.message);
    res.status(500).json({ message: "Error creating booking" });
  }
});

// Get a Booking by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    console.log("Fetching Booking for ID:", req.params.id); // Debugging

    const booking = await Booking.findById(req.params.id).populate(
      "vehicle user",
      "make model name email"
    );

    if (!booking) {
      console.log("Booking Not Found in Database");
      return res.status(404).json({ message: "Booking not found." });
    }

    // Only the booking owner or an admin can fetch the booking
    if (req.user.role !== "admin" && booking.user.toString() !== req.user.id) {
      console.log("Unauthorized Access Attempt - User ID:", req.user.id);
      return res.status(403).json({
        message: "Forbidden: You do not have access to this booking.",
      });
    }

    console.log("Booking Found:", booking);
    res.json(booking);
  } catch (error) {
    console.error("Error fetching booking details:", error.message);
    res.status(500).json({ message: "Error fetching booking details." });
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
    console.log("Canceling Booking ID:", req.params.id);
    console.log("User Requesting Cancellation:", req.user.id);

    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user.id, // Ensure user can only cancel their own booking
    });

    if (!booking) {
      console.log("Booking Not Found or Unauthorized");
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = "canceled";
    await booking.save();

    console.log("Booking Canceled Successfully");
    res.json({ message: "Booking canceled", booking });
  } catch (error) {
    console.error("Error canceling booking:", error.message);
    res.status(500).json({ message: "Error canceling booking" });
  }
});

module.exports = router;
