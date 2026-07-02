import mongoose from "mongoose";

const pendingPasswordResetSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

pendingPasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PendingPasswordReset", pendingPasswordResetSchema);
