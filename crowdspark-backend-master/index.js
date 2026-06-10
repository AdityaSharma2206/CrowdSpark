import express from "express";
import cors from "cors";

const app = express();
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectMongoDB from "./config/db-config.js";

dotenv.config();

connectMongoDB();

app.use(cors({
  origin: 'http://localhost:5174', // Your frontend URL
  credentials: true, // This allows cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

app.use(express.json());
app.use(cookieParser());

import userRoutes from "./routes/users-route.js";
import campaignRoutes from "./routes/campaigns-route.js";
import paymentsRoutes from "./routes/payments-route.js";
import donationsRoutes from "./routes/donations-route.js";
import reportsRoutes from "./routes/reports-route.js";

const port = process.env.PORT || 5050;

app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/donations", donationsRoutes);
app.use("/api/reports", reportsRoutes);

app.listen(port, () => {
  console.log("Node+Express Server Is Successfull");
});
