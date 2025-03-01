const express = require("express");
const Vehicle = require("../models/Vehicle");
const { authenticate, isAdmin } = require("../middleware/authenticate");

const router = express.Router();

if (!authenticate || !isAdmin) {
  console.error("Error: authenticate or isAdmin is undefined");
}

// Create a vehicle (Admin Only)
router.post("/", authenticate, isAdmin, async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: "Error adding vehicle" });
  }
});

// Get all vehicles with filters
router.get("/", async (req, res) => {
  try {
    const { type, location, minPrice, maxPrice } = req.query;
    let filters = {};

    if (type) filters.type = type;
    if (location) filters.location = location;
    if (minPrice || maxPrice) {
      filters.pricePerDay = {};
      if (minPrice) filters.pricePerDay.$gte = minPrice;
      if (maxPrice) filters.pricePerDay.$lte = maxPrice;
    }

    const vehicles = await Vehicle.find(filters);
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: "Error fetching vehicles" });
  }
});

// Get a single vehicle by ID
router.get("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: "Error fetching vehicle details" });
  }
});

// Update a vehicle (Admin Only)
router.put("/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: "Error updating vehicle" });
  }
});

// Delete a vehicle (Admin Only)
router.delete("/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting vehicle" });
  }
});

module.exports = router;
