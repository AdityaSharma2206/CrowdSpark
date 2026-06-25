import express from "express";
import UserModel from "../models/user-model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticationMiddleware, requireAdmin, requireSelfOrAdmin } from "../middleware/index.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    // Whitelist the fields a client is allowed to set. Saving req.body wholesale
    // would let a caller send `isAdmin: true` (a writable schema field) and
    // self-promote to admin — mass-assignment privilege escalation.
    const name = req.body.name;
    // Normalize email so "Demo@x.com" and "demo@x.com" can't become two
    // accounts and so login lookups always match.
    const email = req.body.email?.toLowerCase().trim();
    const password = req.body.password;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    const user = await UserModel.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.create({ name, email, password: hashedPassword });
    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }
    const passwordsMatched = await bcrypt.compare(req.body.password, user.password);
    if (!passwordsMatched) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Deactivated accounts cannot log in.
    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated" });
    }

    // "Remember me" controls how long the session lasts; the JWT expiry and
    // the cookie max-age are kept in sync.
    const maxAgeDays = req.body.remember ? 30 : 1;
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: `${maxAgeDays}d` }
    );

    // The token is set as an HttpOnly cookie by the server so it is never
    // readable by client-side JavaScript (defends against XSS token theft).
    // It is no longer returned in the response body.
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ message: "User logged in successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/logout", (req, res) => {
  // Clear the HttpOnly cookie; attributes must match those used when setting it.
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res.status(200).json({ message: "Logged out successfully" });
});

router.get("/current-user", authenticationMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId).select("-password");
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Self-service profile edit. The user is derived from the verified token, and
// only name/email are accepted from the body — isAdmin/isActive can never be
// set here (that would be mass-assignment privilege escalation).
router.put("/update-profile", authenticationMiddleware, async (req, res) => {
  try {
    const updateData = {};
    if (req.body.name !== undefined) {
      if (!req.body.name) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      updateData.name = req.body.name;
    }
    if (req.body.email !== undefined) {
      const email = req.body.email?.toLowerCase().trim();
      if (!email) {
        return res.status(400).json({ message: "Email cannot be empty" });
      }
      // The email must not already belong to a different account.
      const existing = await UserModel.findOne({ email });
      if (existing && existing._id.toString() !== req.user.userId) {
        return res.status(400).json({ message: "Email is already in use" });
      }
      updateData.email = email;
    }
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Self-service password change. Requires the current password to be re-verified
// before setting a new one, so a stolen session alone can't change the password.
router.put("/change-password", authenticationMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    const user = await UserModel.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const matched = await bcrypt.compare(oldPassword, user.password);
    if (!matched) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/all-users", authenticationMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await UserModel.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/update/:id", authenticationMiddleware, requireSelfOrAdmin("id"), async (req, res) => {
  try {
    // Whitelist fields by privilege. requireSelfOrAdmin lets the resource owner
    // OR an admin through, so without this a normal user updating their own
    // record could send `isAdmin: true` and self-promote (mass assignment).
    // Re-load the requester to know whether the privilege fields are allowed.
    const requester = await UserModel.findById(req.user.userId);
    const isAdmin = Boolean(requester && requester.isAdmin);

    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.email !== undefined) updateData.email = req.body.email?.toLowerCase().trim();
    if (req.body.password) {
      updateData.password = await bcrypt.hash(req.body.password, 10);
    }
    // Privilege/status flags are admin-only.
    if (isAdmin) {
      if (req.body.isAdmin !== undefined) updateData.isAdmin = req.body.isAdmin;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
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

router.delete("/delete/:id", authenticationMiddleware, requireAdmin, async (req, res) => {
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
