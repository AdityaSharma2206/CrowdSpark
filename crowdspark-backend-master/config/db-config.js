import mongoose from "mongoose";

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected to MongoDB:", mongoose.connection.db.databaseName);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
  }
};

export default connectMongoDB;
