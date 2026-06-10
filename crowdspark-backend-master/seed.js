import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import UserModel from "./models/user-model.js";

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.DATABASE_URL);
  console.log("Connected to:", mongoose.connection.db.databaseName);

  const existing = await UserModel.findOne({ email: process.env.ADMIN_EMAIL });
  if (existing) {
    console.log("Admin already exists:", process.env.ADMIN_EMAIL);
    await mongoose.disconnect();
    return;
  }

  const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
  await UserModel.create({
    name: "Admin",
    email: process.env.ADMIN_EMAIL,
    password: hashed,
    isAdmin: true,
    isActive: true,
  });

  console.log("Admin created:", process.env.ADMIN_EMAIL);
  console.log("Password:", process.env.ADMIN_PASSWORD);
  await mongoose.disconnect();
};

seed().catch(console.error);
