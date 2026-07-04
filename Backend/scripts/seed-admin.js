import "../config/env.js";
import mongoose from "mongoose";
import User from "../models/user.js";

async function run() {
  const MONGO_URL = process.env.MONGO_URL || process.env.MONGO_URI || "mongodb://localhost:27017/pharmacy_db";
  await mongoose.connect(MONGO_URL);

  const email    = process.env.ADMIN_EMAIL    || "admin@pharmacare.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@123456";
  const name     = process.env.ADMIN_NAME     || "Pharmacy Admin";
  const force    = process.argv.includes("--force");

  const existing = await User.findOne({ email }).select("+passwordHash");
  if (existing) {
    if (force) {
      existing.passwordHash = await User.hashPassword(password);
      existing.name         = name;
      existing.isActive     = true;
      await existing.save();
      console.log(`✅ Admin password reset: ${email}`);
    } else {
      console.log("ℹ️  Admin user already exists — skipping seed (use --force to reset password)");
    }
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await User.hashPassword(password);
  await User.create({ name, email, passwordHash });

  console.log(`✅ Admin user created: ${email}`);
  console.log("⚠️  Change the default password after first login");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Admin seed failed:", err);
  process.exit(1);
});
