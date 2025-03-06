const express = require("express");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const { authenticate } = require("../middleware/authenticate");

const router = express.Router();

// ✅ Fetch unavailable dates for a vehicle
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

// ✅ Create a Booking
router.post("/", authenticate, async (req, res) => {
  try {
    console.log("Creating Booking for Vehicle ID:", req.body.vehicleId);
    console.log("User Making Booking:", req.user.id);

    const { vehicleId, startDate, endDate } = req.body;

    // ✅ Validate booking dates properly
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to prevent timezone issues
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

    // ✅ Check if the vehicle is already booked for these dates
    const isBooked = await Booking.exists({
      vehicle: vehicleId,
      $and: [{ startDate: { $lt: end } }, { endDate: { $gt: start } }],
    });

    if (isBooked) {
      console.log("Booking Conflict: This vehicle is already booked");
      return res.status(400).json({
        message: "This vehicle is already booked for the selected dates.",
      });
    }

    // ✅ Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    // ✅ Calculate total price
    const rentalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = rentalDays * vehicle.pricePerDay;

    // ✅ Create the booking
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

// ✅ Get a Booking by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    console.log("Fetching Booking for ID:", req.params.id);

    const booking = await Booking.findById(req.params.id).populate(
      "vehicle user",
      "make model name email"
    );

    if (!booking) {
      console.log("Booking Not Found in Database");
      return res.status(404).json({ message: "Booking not found." });
    }

    // ✅ Only the booking owner or an admin can fetch the booking
    if (req.user.role !== "admin" && booking.user.toString() !== req.user.id) {
      console.log("Unauthorized Access Attempt - User ID:", req.user.id);
      return res
        .status(403)
        .json({
          message: "Forbidden: You do not have access to this booking.",
        });
    }

    res.json(booking);
  } catch (error) {
    console.error("Error fetching booking details:", error.message);
    res.status(500).json({ message: "Error fetching booking details." });
  }
});

// ✅ Get All Bookings (Admin Only)
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

// ✅ Cancel a Booking (User Only)
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
