import express from "express";
import UserModel from "../models/user-model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticationMiddleware } from "../middleware/index.js";
import mongoose from "mongoose";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    console.log('=== USER REGISTRATION DEBUG ===');
    console.log('Database name:', mongoose.connection.db.databaseName);
    console.log('Collection name:', UserModel.collection.name);
    console.log('Registering user with email:', req.body.email);
    
    // check if the user already exists
    const user = await UserModel.findOne({ email: req.body.email });
    if (user) {
      console.log('User already exists in database');
      return res.status(400).json({ message: "User already exists" });
    }
    
    // hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    req.body.password = hashedPassword;
    
    // create the user
    console.log('About to create user in database:', mongoose.connection.db.databaseName);
    const newUser = await UserModel.create(req.body);
    console.log('User created successfully with ID:', newUser._id);
    console.log('User saved to collection:', UserModel.collection.name);
    console.log('=== END REGISTRATION DEBUG ===');
    
    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.log('Registration error:', error.message);
    return res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    console.log('=== USER LOGIN DEBUG ===');
    console.log('Database name:', mongoose.connection.db.databaseName);
    console.log('Collection name:', UserModel.collection.name);
    console.log('Looking for user with email:', req.body.email);
    
    // check if the user exists
    const user = await UserModel.findOne({ email: req.body.email });
    if (!user) {
      console.log('User not found in database');
      return res.status(400).json({ message: "User does not exist" });
    }
    
    console.log('User found with ID:', user._id);
    console.log('=== END LOGIN DEBUG ===');
    
    // compare the password
    const passwordsMatched = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!passwordsMatched) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    // create a jwt token and return it
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    return res
      .status(200)
      .json({ token, message: "User logged in successfully" });
  } catch (error) {
    console.log('Login error:', error.message);
    return res.status(500).json({ message: error.message });
  }
});

router.get("/current-user", authenticationMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await UserModel.findById(userId).select("-password");
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/all-users", authenticationMiddleware, async (req, res) => {
  try {
    console.log('=== FETCHING ALL USERS DEBUG ===');
    console.log('Database name:', mongoose.connection.db.databaseName);
    console.log('Collection name:', UserModel.collection.name);
    
    const users = await UserModel.find()
      .select("-password")
      .sort({ createdAt: -1 });
      
    console.log('Found', users.length, 'users in database');
    console.log('User IDs:', users.map(u => u._id));
    console.log('=== END FETCH USERS DEBUG ===');
    
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// UPDATE USER ROUTE
router.put("/update/:id", authenticationMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    
    // If password is being updated, hash it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    // Find and update the user
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    return res.status(200).json({ 
      message: "User updated successfully",
      user: updatedUser 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// DELETE USER ROUTE
router.delete("/delete/:id", authenticationMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Prevent deletion of admin users (optional security measure)
    if (user.isAdmin) {
      return res.status(403).json({ message: "Cannot delete admin user" });
    }
    
    // Delete the user
    await UserModel.findByIdAndDelete(userId);
    
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// TEMPORARY ADMIN ROUTE - Make user admin by email
router.put("/make-admin", async (req, res) => {
  try {
    const { email, adminSecret } = req.body;
    
    // Simple secret check - you can change this
    if (adminSecret !== 'make-me-admin-please') {
      return res.status(401).json({ message: "Invalid admin secret" });
    }
    
    console.log('=== MAKING USER ADMIN ===');
    console.log('Email:', email);
    console.log('Database:', mongoose.connection.db.databaseName);
    
    const updatedUser = await UserModel.findOneAndUpdate(
      { email: email },
      { isAdmin: true },
      { new: true }
    ).select("-password");
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log('User is now admin:', updatedUser.email);
    console.log('=== ADMIN CREATED ===');
    
    return res.status(200).json({ 
      message: "User is now admin",
      user: updatedUser 
    });
  } catch (error) {
    console.log('Make admin error:', error);
    return res.status(500).json({ message: error.message });
  }
});

export default router;
