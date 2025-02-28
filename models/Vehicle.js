const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  pricePerDay: { type: Number, required: true },
  availability: { type: Boolean, default: true },
  images: { type: [String], required: true },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Vehicle", VehicleSchema);
