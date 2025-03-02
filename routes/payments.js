const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Razorpay = require("razorpay");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const { authenticate } = require("../middleware/authenticate");

const router = express.Router();

// Create Stripe Payment Intent
router.post("/stripe", authenticate, async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Validate bookingId
    const booking = await Booking.findById(bookingId);
    if (!bookingId)
      return res.status(400).json({ message: "Booking ID is required" });

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.totalPrice * 100, // Convert to cents
      currency: "usd",
      metadata: { bookingId: booking._id.toString() },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ message: "Payment error", error: error.message });
  }
});

// Create Razorpay Order
router.post("/razorpay", authenticate, async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Fetch booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: booking.totalPrice * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${booking._id}`,
      payment_capture: 1,
    });

    res.json({ orderId: order.id, amount: booking.totalPrice });
  } catch (error) {
    res.status(500).json({ message: "Payment error", error: error.message });
  }
});

// Save Payment Record (After Successful Payment)
router.post("/confirm", authenticate, async (req, res) => {
  try {
    const { bookingId, transactionId, method } = req.body;

    // Update payment record
    const payment = await Payment.create({
      user: req.user.id,
      booking: bookingId,
      amount: req.body.amount,
      transactionId,
      status: "completed",
    });

    // Mark booking as confirmed
    await Booking.findByIdAndUpdate(bookingId, { status: "confirmed" });

    res.json({ message: "Payment successful", payment });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error confirming payment", error: error.message });
  }
});

module.exports = router;
