const express = require("express");
const Vehicle = require("../models/Vehicle");
const Booking = require("../models/Booking");
const { authenticate, isAdmin } = require("../middleware/authenticate");

const router = express.Router();

//Get unavailable dates for a vehicle
router.get("/availability/:vehicleId", async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const bookings = await Booking.find({
      vehicle: vehicleId,
      status: "confirmed",
    });

    if (!bookings.length) {
      return res.json({ unavailableDates: [] }); //No bookings = all dates available
    }

    const unavailableDates = bookings.map((booking) => ({
      start: booking.startDate,
      end: booking.endDate,
    }));

    res.json({ unavailableDates });
  } catch (error) {
    console.error("Error fetching available dates:", error);
    res.status(500).json({ message: "Error fetching available dates." });
  }
});

//  Create a new vehicle (Admin Only)
router.post("/", authenticate, isAdmin, async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    console.error("Error adding vehicle:", error);
    res.status(500).json({ message: "Error adding vehicle." });
  }
});

// Get all vehicles with optional filters
router.get("/", async (req, res) => {
  try {
    const { type, location, minPrice, maxPrice } = req.query;
    let filters = {};

    if (type) filters.type = type;
    if (location) filters.location = location;
    if (minPrice || maxPrice) {
      filters.pricePerDay = {};
      if (minPrice) filters.pricePerDay.$gte = parseFloat(minPrice);
      if (maxPrice) filters.pricePerDay.$lte = parseFloat(maxPrice);
    }

    const vehicles = await Vehicle.find(filters);
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Error fetching vehicles." });
  }
});

// Get a single vehicle by ID
router.get("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found." });

    res.json(vehicle);
  } catch (error) {
    console.error("Error fetching vehicle details:", error);
    res.status(500).json({ message: "Error fetching vehicle details." });
  }
});

// Update a vehicle (Admin Only)
router.put("/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found." });

    res.json(vehicle);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(500).json({ message: "Error updating vehicle." });
  }
});

// Delete a vehicle (Admin Only)
router.delete("/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found." });

    res.json({ message: "Vehicle deleted successfully." });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ message: "Error deleting vehicle." });
  }
});

module.exports = router;
