import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import UserModel from "./models/user-model.js";
import CampaignModel from "./models/campaign-model.js";
import DonationModel from "./models/donation-model.js";

dotenv.config();

const campaigns = [
  {
    name: "CodeBridge Academy",
    description:
      "Providing free coding bootcamps to underprivileged youth in rural areas. Our 12-week program covers web development fundamentals, giving students the skills to enter the tech workforce and break the cycle of poverty.",
    organizer: "Tech for Good Foundation",
    category: "technology",
    targetAmount: 5000,
    collectedAmount: 3200,
    startDate: "2026-04-01",
    endDate: "2026-07-31",
    isActive: true,
    showDonarsInCampaignPage: true,
    images: [],
  },
  {
    name: "Green Campus Initiative",
    description:
      "Transforming our university campus into a zero-waste, solar-powered environment. Funds will install solar panels on 3 buildings, set up composting stations, and plant 200 native trees across the grounds.",
    organizer: "EcoStudents Union",
    category: "environment",
    targetAmount: 8000,
    collectedAmount: 7400,
    startDate: "2026-03-15",
    endDate: "2026-06-30",
    isActive: true,
    showDonarsInCampaignPage: true,
    images: [],
  },
  {
    name: "Paws & Care Rescue Shelter",
    description:
      "Building a new wing for our animal rescue shelter to house 50 more dogs and cats. The expansion includes medical treatment rooms, play areas, and staff quarters for overnight care volunteers.",
    organizer: "Happy Tails Rescue",
    category: "animals",
    targetAmount: 3000,
    collectedAmount: 450,
    startDate: "2026-06-01",
    endDate: "2026-09-01",
    isActive: true,
    showDonarsInCampaignPage: true,
    images: [],
  },
  {
    name: "Riverside Community Sports Ground",
    description:
      "Renovating the Riverside neighbourhood sports ground that has been closed for 3 years. The project covers new turf, floodlights, changing rooms, and accessible pathways so everyone in the community can play.",
    organizer: "Riverside Neighbourhood Council",
    category: "sports",
    targetAmount: 12000,
    collectedAmount: 6800,
    startDate: "2026-02-01",
    endDate: "2026-08-31",
    isActive: true,
    showDonarsInCampaignPage: false,
  },
  {
    name: "Art for All — Free Studio Access",
    description:
      "Opening a free community art studio where anyone can walk in, pick up a brush, and create. Funds cover rent for 6 months, art supplies, and weekly workshops run by local artists for children and adults alike.",
    organizer: "The Open Canvas Collective",
    category: "arts",
    targetAmount: 2500,
    collectedAmount: 1100,
    startDate: "2026-05-01",
    endDate: "2026-10-01",
    isActive: true,
    showDonarsInCampaignPage: true,
    images: [],
  },
];

const seed = async () => {
  await mongoose.connect(process.env.DATABASE_URL);
  console.log("Connected to:", mongoose.connection.db.databaseName);

  // --- Users (always wipe and recreate) ---
  await UserModel.deleteMany({});
  console.log("Cleared existing users");

  const adminHashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
  await UserModel.create({
    name: "Admin",
    email: process.env.ADMIN_EMAIL,
    password: adminHashed,
    isAdmin: true,
    isActive: true,
  });
  console.log("Admin created:", process.env.ADMIN_EMAIL);

  const demoHashed = await bcrypt.hash("Demo@123", 10);
  const demoUser = await UserModel.create({
    name: "Demo User",
    email: "demo@crowdspark.com",
    password: demoHashed,
    isAdmin: false,
    isActive: true,
  });
  console.log("Demo user created: demo@crowdspark.com / Demo@123");

  // --- Campaigns (always wipe and re-seed) ---
  await DonationModel.deleteMany({});
  await CampaignModel.deleteMany({});
  console.log("Cleared existing campaigns and donations");

  // Assign all seeded campaigns to the demo user so the "My Campaigns"
  // (owner-scoped) view has data to show on the demo login.
  const createdCampaigns = await CampaignModel.insertMany(
    campaigns.map((c) => ({ ...c, owner: demoUser._id }))
  );
  console.log(`Created ${createdCampaigns.length} campaigns`);

  // --- Donations (tied to demo user) ---
  const donations = [
    { amount: 500,  message: "Great initiative, keep it up!",  campaign: createdCampaigns[0]._id, user: demoUser._id, paymentId: "test_pi_001" },
    { amount: 200,  message: "Happy to support this.",         campaign: createdCampaigns[0]._id, user: demoUser._id, paymentId: "test_pi_002" },
    { amount: 1000, message: "Love what you're doing!",        campaign: createdCampaigns[1]._id, user: demoUser._id, paymentId: "test_pi_003" },
    { amount: 300,  message: "",                               campaign: createdCampaigns[1]._id, user: demoUser._id, paymentId: "test_pi_004" },
    { amount: 150,  message: "For the animals!",               campaign: createdCampaigns[2]._id, user: demoUser._id, paymentId: "test_pi_005" },
    { amount: 750,  message: "The community needs this.",      campaign: createdCampaigns[3]._id, user: demoUser._id, paymentId: "test_pi_006" },
    { amount: 250,  message: "Art matters.",                   campaign: createdCampaigns[4]._id, user: demoUser._id, paymentId: "test_pi_007" },
  ];

  await DonationModel.insertMany(donations);
  console.log(`Created ${donations.length} donations`);
  console.log("\nSeed complete. Login credentials:");
  console.log(`  Admin : ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`);
  console.log(`  Demo  : demo@crowdspark.com / Demo@123`);

  await mongoose.disconnect();
};

seed().catch(console.error);
