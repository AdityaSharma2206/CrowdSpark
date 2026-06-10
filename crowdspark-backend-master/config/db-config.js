import mongoose from "mongoose";
const connectMongoDB = async () => {
  try {
    console.log('Connecting to:', process.env.DATABASE_URL);
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected to MongoDB");
    console.log("Database name:", mongoose.connection.db.databaseName); // Add this line
  } catch (error) {
    console.log("Error connecting to MongoDB: ", error);
  }
};

export default connectMongoDB;
