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
  totalPrice: { type: Number, required: true, min: 1 }, // Ensure valid price
  status: { type: String, default: "pending" },
});

// Prevent double bookings
bookingSchema.pre("save", async function (next) {
  try {
    const overlappingBookings = await mongoose.model("Booking").find({
      vehicle: this.vehicle,
      $or: [
        {
          startDate: { $lte: this.endDate },
          endDate: { $gte: this.startDate },
        },
      ],
      status: "confirmed",
    });

    if (overlappingBookings.length > 0) {
      return next(new Error("Vehicle is already booked for these dates."));
    }

    next();
  } catch (error) {
    next(error); // Pass error to the next middleware
  }
});

// Validate that endDate is after startDate
bookingSchema.pre("validate", function (next) {
  if (this.startDate >= this.endDate) {
    return next(new Error("End date must be after start date."));
  }
  next();
});

//Ensure totalPrice is a valid number
bookingSchema.pre("save", function (next) {
  if (isNaN(this.totalPrice) || this.totalPrice <= 0) {
    return next(new Error("Total price must be a valid number."));
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
