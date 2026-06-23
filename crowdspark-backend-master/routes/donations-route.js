import stripe from "stripe";
import { authenticationMiddleware } from "../middleware/index.js";
import CampaignModel from "../models/campaign-model.js";
import DonationModel from "../models/donation-model.js";
import express from "express";
const router = express.Router();

router.post("/create", authenticationMiddleware, async (req, res) => {
  try {
    const { amount, campaign, message, paymentId } = req.body;

    // Basic input guards (a full validation layer is tracked as IM-2).
    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "Invalid donation amount" });
    }
    if (!campaign || !paymentId) {
      return res.status(400).json({ message: "Missing campaign or paymentId" });
    }

    // The campaign must exist before we record money against it.
    const campaignDoc = await CampaignModel.findById(campaign);
    if (!campaignDoc) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Idempotency: a given PaymentIntent may only ever be recorded once, so a
    // successful payment cannot be replayed to inflate the campaign total.
    const alreadyRecorded = await DonationModel.findOne({ paymentId });
    if (alreadyRecorded) {
      return res
        .status(409)
        .json({ message: "This payment has already been recorded" });
    }

    // Never trust the client about money: verify the PaymentIntent with Stripe
    // before recording anything. Confirm it actually succeeded and that the
    // amount charged matches the donation amount the client is claiming.
    const paymentIntent = await stripe(
      process.env.STRIPE_SECRET_KEY
    ).paymentIntents.retrieve(paymentId);
    if (paymentIntent.status !== "succeeded") {
      return res.status(402).json({ message: "Payment has not been completed" });
    }
    if (paymentIntent.amount !== Math.round(amount * 100)) {
      return res
        .status(400)
        .json({ message: "Payment amount does not match donation amount" });
    }

    // Whitelist fields and derive the user from the verified token, not the
    // request body (which could otherwise attribute a donation to anyone).
    await DonationModel.create({
      amount,
      campaign,
      message: message || "",
      paymentId,
      user: req.user.userId,
    });
    await CampaignModel.findByIdAndUpdate(campaign, {
      $inc: { collectedAmount: amount },
    });

    return res.status(201).json({ message: "Donation created successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/get-all", authenticationMiddleware, async (req, res) => {
  try {
    const donations = await DonationModel.find().populate('campaign').populate('user', '-password').sort({ createdAt: -1 });
     
    return res.status(200).json(donations);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get(
  "/get-donations-by-campaign/:id",
  authenticationMiddleware,
  async (req, res) => {
    try {
      const donations = await DonationModel.find({ campaign: req.params.id })
        .populate("user", "-password")
        .sort({ createdAt: -1 });
      return res.status(200).json(donations);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

router.get(
  "/get-donations-by-user/:id",
  authenticationMiddleware,
  async (req, res) => {
    try {
      const donations = await DonationModel.find({ user: req.params.id })
        .populate("campaign")
        .sort({ createdAt: -1 });
      return res.status(200).json(donations);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

export default router;
