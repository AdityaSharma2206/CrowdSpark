import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    message: {
      type: String,
      required: false,
      default: "",
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "campaigns",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    paymentId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const DonationModel = mongoose.model("donations", donationSchema);
export default DonationModel;