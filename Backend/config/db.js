import mongoose from "mongoose";

/** Legacy indexes from older schemas that break multi-user signup */
const STALE_INDEXES = ["phoneNumber_1"];

async function dropStaleIndexes() {
  const collection = mongoose.connection.collection("users");
  for (const name of STALE_INDEXES) {
    try {
      await collection.dropIndex(name);
      console.log(`Dropped stale index: users.${name}`);
    } catch (err) {
      if (err.codeName !== "IndexNotFound") {
        console.warn(`Could not drop users.${name}:`, err.message);
      }
    }
  }
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL || process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await dropStaleIndexes();
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;