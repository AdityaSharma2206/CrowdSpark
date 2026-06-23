import mongoose from "mongoose";

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected to MongoDB:", mongoose.connection.db.databaseName);
  } catch (error) {
    // Fail fast: a server with no database can't serve any request usefully,
    // so exit instead of booting into a broken state.
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectMongoDB;
