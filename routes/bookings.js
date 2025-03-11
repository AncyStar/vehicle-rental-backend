const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const { authenticate } = require("../middleware/authenticate");

// Get all bookings
router.get("/", authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("vehicle", "make model year pricePerDay");
    res.json(bookings);
  } catch (error) {
    console.error("❌ Error fetching bookings:", error);
    res.status(500).json({ message: "Error fetching bookings." });
  }
});

// Get user's bookings
router.get("/me", authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate(
      "vehicle",
      "make model year pricePerDay images"
    );
    res.json(bookings);
  } catch (error) {
    console.error("❌ Error fetching user bookings:", error);
    res.status(500).json({ message: "Error fetching user bookings." });
  }
});

// Create a new booking
router.post("/", authenticate, async (req, res) => {
  try {
    console.log("🔹 Booking Request Body:", req.body);

    const { vehicleId, startDate, endDate } = req.body;

    if (!vehicleId || !startDate || !endDate) {
      console.error("❌ Missing required fields.");
      return res
        .status(400)
        .json({ message: "Vehicle ID, startDate, and endDate are required" });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      console.error("❌ Vehicle not found:", vehicleId);
      return res.status(404).json({ message: "Vehicle not found" });
    }

    console.log("🔹 Vehicle Found:", vehicle);

    // Convert dates to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      console.error("❌ Invalid date range.");
      return res
        .status(400)
        .json({ message: "End date must be after start date" });
    }

    // Calculate number of days
    const timeDiff = end - start;
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert ms to days
    if (days <= 0) {
      return res.status(400).json({ message: "Invalid booking duration." });
    }

    // Ensure vehicle has a pricePerDay field
    if (!vehicle.pricePerDay) {
      console.error(
        "❌ Vehicle pricePerDay is missing or invalid:",
        vehicle.pricePerDay
      );
      return res
        .status(500)
        .json({ message: "Vehicle price information is missing" });
    }

    // Calculate total price
    const totalPrice = days * vehicle.pricePerDay;
    console.log("✅ Total Price Calculated:", totalPrice);

    if (isNaN(totalPrice) || totalPrice <= 0) {
      console.error("❌ Total Price Calculation Failed:", totalPrice);
      return res
        .status(500)
        .json({ message: "Failed to calculate total price" });
    }

    // Create new booking
    const booking = new Booking({
      user: req.user.id,
      vehicle: vehicleId,
      startDate: start,
      endDate: end,
      totalPrice, // Now we ensure totalPrice is correctly calculated
      status: "pending",
    });

    console.log("🔹 Saving Booking:", booking);

    const savedBooking = await booking.save();
    console.log("✅ Booking Successfully Created:", savedBooking);

    res
      .status(201)
      .json({ message: "Booking created successfully", booking: savedBooking });
  } catch (error) {
    console.error("❌ Error in Booking Route:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

// Update booking status
router.patch("/:id/status", authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (req.user.role !== "admin" && booking.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this booking." });
    }

    booking.status = status;
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    console.error("❌ Error updating booking status:", error);
    res.status(500).json({ message: "Error updating booking status." });
  }
});

// Delete a booking
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (req.user.role !== "admin" && booking.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this booking." });
    }

    await booking.remove();
    res.json({ message: "Booking deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting booking:", error);
    res.status(500).json({ message: "Error deleting booking." });
  }
});

module.exports = router;
