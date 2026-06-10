import stripe from "stripe";
import { authenticationMiddleware } from "../middleware/index.js";

import express from "express";
const router = express.Router();

router.post(
  "/create-payment-intent",
  authenticationMiddleware,
  async (req, res) => {
    try {
      console.log(process.env.STRIPE_SECRET_KEY);
      const paymentIntent = await stripe(
        process.env.STRIPE_SECRET_KEY
      ).paymentIntents.create({
        amount: req.body.amount * 100,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        description: "CrowdSpark DONATION",
      });

      return res
        .status(201)
        .json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

export default router;
