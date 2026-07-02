import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { body, validationResult } from "express-validator";
import User from "../models/user.js";
import PendingSignup from "../models/pendingSignup.js";
import PendingPasswordReset from "../models/pendingPasswordReset.js";
import { sendPasswordResetEmail } from "../utils/email.js";
import { syncPharmacyProfile } from "../utils/pharmacyProfile.js";
import { sendOtpEmail } from "../utils/email.js";
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE } from "../utils/authCookies.js";

const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), type: "refresh" },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  );
}

function userResponse(user) {
  return { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role };
}

export const loginValidators = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password required"),
];

export const pharmacySignupValidators = [
  body("shopName").trim().isLength({ min: 2 }).withMessage("Shop name must be at least 2 characters"),
  body("ownerName").trim().isLength({ min: 2 }).withMessage("Owner name must be at least 2 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("phone").trim().matches(/^[+]?[\d\s-]{10,15}$/).withMessage("Valid phone number required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
];

export const verifyOtpValidators = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("otp").trim().matches(/^\d{6}$/).withMessage("Enter the 6-digit OTP"),
];

export const requestPasswordResetValidators = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
];

export const resetPasswordValidators = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("otp").trim().matches(/^\d{6}$/).withMessage("Enter the 6-digit OTP"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("confirmPassword").custom((v, { req }) => v === req.body.password).withMessage("Passwords do not match"),
];

export const googleAuthValidators = [
  body("credential").notEmpty().withMessage("Google credential required"),
];

export const registerValidators = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("role").optional().isIn(["admin", "pharmacist", "viewer"]).withMessage("Invalid role"),
];

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg });
    return false;
  }
  return true;
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

async function issueAuthTokens(user, res) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  user.lastLogin = new Date();
  await user.save();
  setRefreshCookie(res, refreshToken);
  return accessToken;
}

export async function sendOtp(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { shopName, ownerName, email, phone, password } = req.body;
    const userCount = await User.countDocuments();
    const isFirstSetup = userCount === 0;

    if (!isFirstSetup && process.env.ALLOW_PUBLIC_SIGNUP === "false") {
      return res.status(403).json({ success: false, message: "Public registration is disabled" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const passwordHash = await User.hashPassword(password);
    const role = isFirstSetup ? "admin" : "pharmacist";

    await PendingSignup.findOneAndUpdate(
      { email },
      {
        email,
        phone: phone.trim(),
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        passwordHash,
        role,
        otpHash,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
        attempts: 0,
      },
      { upsert: true, new: true }
    );

    const emailResult = await sendOtpEmail({ to: email, otp, shopName: shopName.trim() });

    res.json({
      success: true,
      message: emailResult.sent ? "OTP sent to your email" : "OTP generated (check server console in dev mode)",
      data: { email, expiresIn: OTP_EXPIRY_MS / 1000, isFirstSetup, emailSent: emailResult.sent },
    });
  } catch (err) {
    next(err);
  }
}

export async function requestPasswordReset(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // don't reveal whether email exists
      return res.json({ success: true, message: "If this email exists, a reset code has been sent" });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const OTP_EXPIRY_MS = 10 * 60 * 1000;

    await PendingPasswordReset.findOneAndUpdate(
      { email },
      { email, otpHash, expiresAt: new Date(Date.now() + OTP_EXPIRY_MS), attempts: 0 },
      { upsert: true, new: true }
    );

    await sendPasswordResetEmail({ to: email, otp });

    res.json({ success: true, message: "If this email exists, a reset code has been sent" });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;
    const { email, otp, password } = req.body;
    const pending = await PendingPasswordReset.findOne({ email });
    if (!pending) return res.status(400).json({ success: false, message: "Invalid or expired reset code" });
    if (pending.expiresAt < new Date()) {
      await PendingPasswordReset.deleteOne({ _id: pending._id });
      return res.status(400).json({ success: false, message: "Reset code expired" });
    }
    if (pending.attempts >= 5) {
      await PendingPasswordReset.deleteOne({ _id: pending._id });
      return res.status(429).json({ success: false, message: "Too many failed attempts. Request a new code." });
    }

    const valid = await bcrypt.compare(otp, pending.otpHash);
    if (!valid) {
      pending.attempts += 1;
      await pending.save();
      return res.status(400).json({ success: false, message: "Invalid reset code" });
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      await PendingPasswordReset.deleteOne({ _id: pending._id });
      return res.status(400).json({ success: false, message: "No account found for this email" });
    }

    user.passwordHash = await User.hashPassword(password);
    await user.save();
    await PendingPasswordReset.deleteOne({ _id: pending._id });

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { email, otp } = req.body;
    const pending = await PendingSignup.findOne({ email });

    if (!pending) {
      return res.status(400).json({ success: false, message: "No pending signup found. Request a new OTP." });
    }

    if (pending.expiresAt < new Date()) {
      await PendingSignup.deleteOne({ _id: pending._id });
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }

    if (pending.attempts >= MAX_OTP_ATTEMPTS) {
      await PendingSignup.deleteOne({ _id: pending._id });
      return res.status(429).json({ success: false, message: "Too many failed attempts. Request a new OTP." });
    }

    const valid = await bcrypt.compare(otp, pending.otpHash);
    if (!valid) {
      pending.attempts += 1;
      await pending.save();
      return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
    }

    let user;
    try {
      user = await User.create({
        name: pending.ownerName,
        email: pending.email,
        phone: pending.phone,
        passwordHash: pending.passwordHash,
        role: pending.role,
      });

      await syncPharmacyProfile({
        shopName: pending.shopName,
        ownerName: pending.ownerName,
        email: pending.email,
        phone: pending.phone,
      });
    } catch (createErr) {
      if (user?._id) await User.deleteOne({ _id: user._id }).catch(() => {});
      throw createErr;
    }

    await PendingSignup.deleteOne({ _id: pending._id });

    const accessToken = await issueAuthTokens(user, res);
    res.status(201).json({ success: true, data: { user: userResponse(user), accessToken } });
  } catch (err) {
    if (err.code === 11000) {
      const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : "email";
      const msg = field === "email"
        ? "Email already registered"
        : `Registration failed due to duplicate ${field}. Contact support.`;
      return res.status(409).json({ success: false, message: msg });
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+passwordHash +refreshTokenHash");

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ success: false, message: "This account uses Google sign-in. Use Continue with Google." });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.lastLogin = new Date();
    await user.save();

    setRefreshCookie(res, refreshToken);
    res.json({ success: true, data: { user: userResponse(user), accessToken } });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    if (!token) {
      return res.status(401).json({ success: false, message: "Refresh token missing" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    const user = await User.findById(payload.sub).select("+refreshTokenHash");
    if (!user || !user.isActive || !user.refreshTokenHash) {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: "Session expired" });
    }

    const valid = await bcrypt.compare(token, user.refreshTokenHash);
    if (!valid) {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: "Session expired" });
    }

    const accessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);
    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await user.save();

    setRefreshCookie(res, newRefreshToken);
    res.json({ success: true, data: { accessToken, user: userResponse(user) } });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        await User.findByIdAndUpdate(payload.sub, { $unset: { refreshTokenHash: 1 } });
      } catch {
        // ignore invalid token on logout
      }
    }
    clearRefreshCookie(res);
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({ success: true, data: req.user });
}

export async function register(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const { name, email, password, role = "pharmacist" } = req.body;
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash, role });

    res.status(201).json({ success: true, data: userResponse(user) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }
    next(err);
  }
}

export async function setupStatus(req, res) {
  const count = await User.countDocuments();
  res.json({
    success: true,
    data: {
      needsSetup: count === 0,
      googleAuthEnabled: Boolean(process.env.GOOGLE_CLIENT_ID),
      allowPublicSignup: process.env.ALLOW_PUBLIC_SIGNUP !== "false",
    },
  });
}

export async function googleAuth(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(503).json({ success: false, message: "Google sign-in is not configured" });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: req.body.credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email?.toLowerCase();
    const name = payload.name || payload.given_name || "Google User";

    if (!email) {
      return res.status(400).json({ success: false, message: "Google account has no email" });
    }

    if (payload.email_verified === false) {
      return res.status(401).json({ success: false, message: "Google email is not verified" });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] }).select("+passwordHash +refreshTokenHash");

    if (user) {
      if (!user.isActive) {
        return res.status(401).json({ success: false, message: "Account is disabled" });
      }
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = user.passwordHash ? "local" : "google";
        await user.save();
      }
    } else {
      const userCount = await User.countDocuments();
      const isFirstSetup = userCount === 0;

      if (!isFirstSetup && process.env.ALLOW_PUBLIC_SIGNUP === "false") {
        return res.status(403).json({ success: false, message: "Public registration is disabled" });
      }

      user = await User.create({
        name,
        email,
        googleId,
        authProvider: "google",
        role: isFirstSetup ? "admin" : "pharmacist",
      });

      if (isFirstSetup) {
        await syncPharmacyProfile({
          shopName: `${name}'s Pharmacy`,
          ownerName: name,
          email,
          phone: "",
        });
      }
    }

    const accessToken = await issueAuthTokens(user, res);
    res.json({ success: true, data: { user: userResponse(user), accessToken } });
  } catch (err) {
    if (err.message?.includes("Token used too late") || err.message?.includes("Invalid token")) {
      return res.status(401).json({ success: false, message: "Google sign-in expired. Try again." });
    }
    next(err);
  }
}
