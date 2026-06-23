import { authenticationMiddleware } from "../middleware/index.js";
import CampaignModel from "../models/campaign-model.js";
import UserModel from "../models/user-model.js";
import express from "express";
const router = express.Router();

// Returns true if the requester owns the campaign or is an admin.
const canManageCampaign = async (campaign, userId) => {
  const isOwner = campaign.owner && campaign.owner.toString() === userId;
  if (isOwner) return true;
  const requester = await UserModel.findById(userId);
  return Boolean(requester && requester.isAdmin);
};

router.post("/create", authenticationMiddleware, async (req, res) => {
  try {
    req.body.collectedAmount = 0;
    // Owner is derived from the verified token, never trusted from the body.
    req.body.owner = req.user.userId;
    await CampaignModel.create(req.body);

    return res.status(201).json({ message: "Campaign created successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", authenticationMiddleware, async (req, res) => {
  try {
    const campaign = await CampaignModel.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (!(await canManageCampaign(campaign, req.user.userId))) {
      return res.status(403).json({ message: "Forbidden: you do not own this campaign" });
    }
    // Prevent ownership transfer via the request body.
    delete req.body.owner;
    await CampaignModel.findByIdAndUpdate(req.params.id, req.body);
    return res.status(200).json({ message: "Campaign updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", authenticationMiddleware, async (req, res) => {
  try {
    const campaign = await CampaignModel.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (!(await canManageCampaign(campaign, req.user.userId))) {
      return res.status(403).json({ message: "Forbidden: you do not own this campaign" });
    }
    await CampaignModel.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Campaign deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/get-all", authenticationMiddleware, async (req, res) => {
  try {
    const campaigns = await CampaignModel.find().sort({ createdAt: -1 });
    return res.status(200).json(campaigns);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/get/:id", authenticationMiddleware, async (req, res) => {
  try {
    const campaign = await CampaignModel.findById(req.params.id);
    return res.status(200).json(campaign);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get campaigns owned by the current authenticated user.
router.get("/get-by-user", authenticationMiddleware, async (req, res) => {
  try {
    const campaigns = await CampaignModel.find({
      owner: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json(campaigns);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
