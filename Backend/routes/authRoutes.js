import express from "express";
import rateLimit from "express-rate-limit";
import {
  login,
  refresh,
  logout,
  me,
  setupStatus,
  sendOtp,
  verifyOtp,
  requestPasswordReset,
  resetPassword,
  loginValidators,
  pharmacySignupValidators,
  verifyOtpValidators,
  requestPasswordResetValidators,
  resetPasswordValidators,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 10 : 30,
  message: { success: false, message: "Too many attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/setup-status", setupStatus);
router.post("/send-otp", authLimiter, pharmacySignupValidators, sendOtp);
router.post("/request-password-reset", authLimiter, requestPasswordResetValidators, requestPasswordReset);
router.post("/reset-password", authLimiter, resetPasswordValidators, resetPassword);
router.post("/verify-otp", authLimiter, verifyOtpValidators, verifyOtp);
router.post("/login", authLimiter, loginValidators, login);
router.post("/refresh", authLimiter, refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);

export default router;
