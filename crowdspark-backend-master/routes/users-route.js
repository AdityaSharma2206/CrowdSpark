import express from "express";
import UserModel from "../models/user-model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticationMiddleware } from "../middleware/index.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    req.body.password = hashedPassword;
    await UserModel.create(req.body);
    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }
    const passwordsMatched = await bcrypt.compare(req.body.password, user.password);
    if (!passwordsMatched) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    return res.status(200).json({ token, message: "User logged in successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/current-user", authenticationMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId).select("-password");
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/all-users", authenticationMiddleware, async (req, res) => {
  try {
    const users = await UserModel.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", authenticationMiddleware, async (req, res) => {
  try {
    const updateData = req.body;
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/delete/:id", authenticationMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.isAdmin) {
      return res.status(403).json({ message: "Cannot delete admin user" });
    }
    await UserModel.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/make-admin", async (req, res) => {
  try {
    const { email, adminSecret } = req.body;
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ message: "Invalid admin secret" });
    }
    const updatedUser = await UserModel.findOneAndUpdate(
      { email },
      { isAdmin: true },
      { new: true }
    ).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "User is now admin", user: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
