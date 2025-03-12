const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { authenticate } = require("../middleware/authenticate");
const Booking = require("../models/Booking");

router.post("/create-checkout-session", authenticate, async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Fetch booking details
    const booking = await Booking.findById(bookingId).populate("vehicle");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-failed`,
      customer_email: req.user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Rental: ${booking.vehicle.name}`,
              description: `From: ${booking.startDate} To: ${booking.endDate}`,
            },
            unit_amount: booking.totalPrice * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ message: "Server Error", error });
  }
});

// Webhook to handle Stripe events
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook Error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle checkout session completion
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const bookingId = session.metadata.bookingId;

      await Booking.findByIdAndUpdate(bookingId, { status: "confirmed" });

      console.log("✅ Payment Successful for Booking:", bookingId);
    }

    res.json({ received: true });
  }
);

module.exports = router;
