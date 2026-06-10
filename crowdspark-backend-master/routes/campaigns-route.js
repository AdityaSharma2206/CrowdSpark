import { authenticationMiddleware } from "../middleware/index.js";
import CampaignModel from "../models/campaign-model.js";
import express from "express";
const router = express.Router();

router.post("/create", authenticationMiddleware, async (req, res) => {
  try {
    req.body.collectedAmount = 0;
    await CampaignModel.create(req.body);

    return res.status(201).json({ message: "Campaign created successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", authenticationMiddleware, async (req, res) => {
  try {
    await CampaignModel.findByIdAndUpdate(req.params.id, req.body);
    return res.status(200).json({ message: "Campaign updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", authenticationMiddleware, async (req, res) => {
  try {
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

// Add this route to get campaigns created by the current user
router.get("/get-by-user", authenticationMiddleware, async (req, res) => {
  try {
    // Get campaigns created by the current authenticated user
    const campaigns = await CampaignModel.find({
      createdBy: req.user.id
    }).sort({ createdAt: -1 });

    return res.status(200).json(campaigns);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
