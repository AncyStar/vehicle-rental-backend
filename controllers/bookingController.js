const Booking = require("../models/Booking");
const getUserBookings = async (req, res) => {
  try {
    // Assuming req.user.id contains the authenticated user's ID
    const bookings = await Booking.find({ user: req.user.id }).populate(
      "vehicle"
    );
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error });
  }
};

module.exports = { getUserBookings };
