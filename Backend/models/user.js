import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "pharmacist", "viewer"], default: "pharmacist" },
    isActive: { type: Boolean, default: true },
    refreshTokenHash: { type: String, select: false },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password) {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
  return bcrypt.hash(password, rounds);
};

export default mongoose.model("User", userSchema);
