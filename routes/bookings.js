const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
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

// Get a specific booking
router.get("/:id", authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email")
      .populate("vehicle", "make model year pricePerDay images");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    console.error("❌ Error fetching booking:", error);
    res.status(500).json({ message: "Error fetching booking." });
  }
});

// Create a new booking with Corrected Total Price Calculation
router.post("/", authenticate, async (req, res) => {
  try {
    console.log("🔹 Received Booking Request:", req.body);

    const { vehicleId, startDate, endDate } = req.body;
    if (!vehicleId || !startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Vehicle ID, startDate, and endDate are required" });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      console.error(`❌ Vehicle not found: ${vehicleId}`);
      return res.status(404).json({ message: "Vehicle not found" });
    }

    console.log("🔹 Vehicle Found:", vehicle);
    console.log("🔹 pricePerDay from DB:", vehicle.pricePerDay);

    // Ensure pricePerDay is valid
    if (!vehicle.pricePerDay || isNaN(vehicle.pricePerDay)) {
      console.error("❌ Invalid pricePerDay:", vehicle.pricePerDay);
      return res
        .status(500)
        .json({ message: "Invalid vehicle pricing in database" });
    }

    // Convert pricePerDay to a number
    const pricePerDay = Number(vehicle.pricePerDay);
    console.log("✅ pricePerDay (Converted to Number):", pricePerDay);

    // Convert startDate and endDate to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    console.log("🔹 Start Date:", start, "🔹 End Date:", end);

    // Calculate number of days
    const timeDiff = end - start;
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    console.log("✅ Number of Days:", days);

    if (days <= 0) {
      return res
        .status(400)
        .json({ message: "End date must be after start date" });
    }

    // Calculate total price
    const totalPrice = days * pricePerDay;
    console.log(`✅ Calculated totalPrice: ${totalPrice}`);

    if (isNaN(totalPrice)) {
      console.error("❌ totalPrice calculation failed.");
      return res
        .status(500)
        .json({ message: "Booking price calculation error" });
    }

    // Create the booking
    const booking = new Booking({
      user: req.user.id,
      vehicle: vehicleId,
      startDate: start,
      endDate: end,
      totalPrice: totalPrice,
      status: "pending",
    });

    console.log("🔹 Booking Before Save:", booking);

    const savedBooking = await booking.save();
    console.log("✅ Booking Successfully Created:", savedBooking);

    res
      .status(201)
      .json({ message: "Booking created successfully", booking: savedBooking });
  } catch (error) {
    console.error("❌ Error creating booking:", error.message);
    res
      .status(500)
      .json({ message: "Error creating booking.", error: error.message });
  }
});

// ✅ Update booking status
router.patch("/:id/status", authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user is authorized (admin or the booking owner)
    if (req.user.role !== "admin" && booking.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this booking" });
    }

    booking.status = status;
    const updatedBooking = await booking.save();

    res.json(updatedBooking);
  } catch (error) {
    console.error("❌ Error updating booking status:", error);
    res.status(500).json({ message: "Error updating booking status." });
  }
});

// ✅ Delete a booking
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user is authorized (admin or the booking owner)
    if (req.user.role !== "admin" && booking.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this booking" });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting booking:", error);
    res.status(500).json({ message: "Error deleting booking." });
  }
});

module.exports = router;
