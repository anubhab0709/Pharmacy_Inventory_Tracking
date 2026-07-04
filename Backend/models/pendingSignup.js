import mongoose from "mongoose";

const pendingSignupSchema = new mongoose.Schema(
  {
    email:        { type: String, required: true, lowercase: true, trim: true, unique: true },
    phone:        { type: String, required: true, trim: true },
    shopName:     { type: String, required: true, trim: true },
    ownerName:    { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    otpHash:      { type: String, required: true },
    expiresAt:    { type: Date, required: true },
    attempts:     { type: Number, default: 0 },
  },
  { timestamps: true }
);

// TTL index — MongoDB auto-deletes expired docs
pendingSignupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PendingSignup", pendingSignupSchema);
