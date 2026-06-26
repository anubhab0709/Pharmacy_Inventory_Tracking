import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/user.js";

dotenv.config();

async function run() {
  const MONGO_URL = process.env.MONGO_URL || process.env.MONGO_URI || "mongodb://localhost:27017/pharmacy_db";
  await mongoose.connect(MONGO_URL);

  const count = await User.countDocuments();
  if (count > 0) {
    console.log("ℹ️  Admin user already exists — skipping seed");
    await mongoose.disconnect();
    return;
  }

  const email = process.env.ADMIN_EMAIL || "admin@pharmacare.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@123456";
  const name = process.env.ADMIN_NAME || "Pharmacy Admin";

  const passwordHash = await User.hashPassword(password);
  await User.create({ name, email, passwordHash, role: "admin" });

  console.log(`✅ Admin user created: ${email}`);
  console.log("⚠️  Change the default password after first login");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Admin seed failed:", err);
  process.exit(1);
});
