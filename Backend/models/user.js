import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true, trim: true },
    email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:            { type: String, trim: true },
    passwordHash:     { type: String, select: false },
    isActive:         { type: Boolean, default: true },
    refreshTokenHash: { type: String, select: false },
    lastLogin:        { type: Date },
  },
  { timestamps: true }
);

// Require a password for local accounts (single-admin, local auth only)
userSchema.pre("validate", function (next) {
  // Skip on partial updates (e.g. refresh token rotation) where passwordHash is not loaded
  if (!this.isNew && !this.isModified("passwordHash")) {
    return next();
  }
  if (!this.passwordHash) {
    this.invalidate("passwordHash", "Password is required");
  }
  next();
});

userSchema.methods.comparePassword = function (password) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password) {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
  return bcrypt.hash(password, rounds);
};

export default mongoose.model("User", userSchema);
