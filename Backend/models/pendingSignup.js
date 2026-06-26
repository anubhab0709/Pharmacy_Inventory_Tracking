import mongoose from "mongoose";

const pendingSignupSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    phone: { type: String, required: true, trim: true },
    shopName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "pharmacist"], default: "pharmacist" },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

pendingSignupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PendingSignup", pendingSignupSchema);
