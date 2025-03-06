const express = require("express");
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const { authenticate } = require("../middleware/authenticate");

const router = express.Router();

// Fetch unavailable dates for a vehicle
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

// Create a Booking
router.post("/", authenticate, async (req, res) => {
  const rentalDays = Math.ceil(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
  );

  const totalPrice = rentalDays * vehicle.pricePerDay;
  console.log("Total Price for Booking:", totalPrice); // ✅ Debugging

  try {
    const { vehicleId, startDate, endDate } = req.body;

    const booking = await Booking.create({
      user: req.user.id,
      vehicle: vehicleId,
      startDate,
      endDate,
      totalPrice,
      status: "pending",
    });

    if (!booking || !booking._id) {
      return res.status(500).json({ message: "Booking creation failed." });
    }

    console.log(" Booking Created:", booking);

    res
      .status(201)
      .json({ message: "Booking created", bookingId: booking._id }); // ✅ Send only the ID
  } catch (error) {
    console.error("Error creating booking:", error.message);
    res.status(500).json({ message: "Error creating booking" });
  }
});

// Get a Booking by ID
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

    // Allow access only to the booking owner or an admin
    if (req.user.role !== "admin" && booking.user.toString() !== req.user.id) {
      console.log("Unauthorized Access Attempt - User ID:", req.user.id);
      return res.status(403).json({
        message: "Forbidden: You do not have access to this booking.",
      });
    }

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
