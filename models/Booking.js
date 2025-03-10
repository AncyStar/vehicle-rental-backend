const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
    required: true,
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending",
  },
});

// Prevent double bookings
bookingSchema.pre("save", async function (next) {
  const overlappingBookings = await mongoose.model("Booking").find({
    vehicle: this.vehicle,
    $or: [
      { startDate: { $lte: this.endDate }, endDate: { $gte: this.startDate } },
    ],
    status: "confirmed",
  });

  if (overlappingBookings.length > 0) {
    throw new Error("Vehicle is already booked for these dates.");
  }

  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
