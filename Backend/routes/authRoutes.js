import express from "express";
import rateLimit from "express-rate-limit";
import {
  login,
  refresh,
  logout,
  me,
  register,
  setupStatus,
  sendOtp,
  verifyOtp,
  loginValidators,
  registerValidators,
  pharmacySignupValidators,
  verifyOtpValidators,
} from "../controllers/authController.js";
import { authenticate, authorize, loadUser } from "../middleware/auth.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/setup-status", setupStatus);
router.post("/send-otp", authLimiter, pharmacySignupValidators, sendOtp);
router.post("/verify-otp", authLimiter, verifyOtpValidators, verifyOtp);
router.post("/login", authLimiter, loginValidators, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, loadUser, me);
router.post("/register", authenticate, authorize("admin"), registerValidators, register);

export default router;
