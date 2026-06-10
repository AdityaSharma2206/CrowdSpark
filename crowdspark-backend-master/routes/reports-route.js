import { authenticationMiddleware } from "../middleware/index.js";
import CampaignModel from "../models/campaign-model.js";
import DonationModel from "../models/donation-model.js";
import UserModel from "../models/user-model.js";
import express from "express";
const router = express.Router();

router.get("/admin-reports", authenticationMiddleware, async (req, res) => {
  try {
    const [totalUsers, totalCampaigns, donations] = await Promise.all([
      UserModel.countDocuments({}),
      CampaignModel.countDocuments({}),
      DonationModel.find({})
        .populate("campaign")
        .populate("user")
        .sort({ createdAt: -1 }),
    ]);

    const response = {
      totalUsers,
      totalCampaigns,
      totalDonations: donations.length,
      totalAmount: donations.reduce(
        (acc, donation) => acc + donation.amount,
        0
      ),
      lastFiveDonations: donations.slice(-5),
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/user-reports/:id", authenticationMiddleware, async (req, res) => {
  try {
    const [donations] = await Promise.all([
      DonationModel.find({
        user: req.params.id,
      })
        .populate("campaign")
        .sort({ createdAt: -1 }),
    ]);

    const response = {
      totalDonations: donations.length,
      totalAmount: donations.reduce(
        (acc, donation) => acc + donation.amount,
        0
      ),
      lastFiveDonations: donations.slice(-5),
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
