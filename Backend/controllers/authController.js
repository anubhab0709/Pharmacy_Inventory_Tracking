import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import User from "../models/user.js";
import PendingSignup from "../models/pendingSignup.js";
import { syncPharmacyProfile } from "../utils/pharmacyProfile.js";

const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const REFRESH_COOKIE = "pharmacy_refresh";
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

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
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
  return String(Math.floor(100000 + Math.random() * 900000));
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

    console.log(`[PharmaCare OTP] ${email} | ${phone} | Shop: ${shopName} → ${otp}`);

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

    res.json({
      success: true,
      message: "OTP sent successfully",
      data: { email, expiresIn: OTP_EXPIRY_MS / 1000, isFirstSetup },
    });
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

    const user = await User.create({
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

    await PendingSignup.deleteOne({ _id: pending._id });

    const accessToken = await issueAuthTokens(user, res);
    res.status(201).json({ success: true, data: { user: userResponse(user), accessToken } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }
    next(err);
  }
}

export async function setup(req, res, next) {
  try {
    if (!handleValidation(req, res)) return;

    const count = await User.countDocuments();
    if (count > 0) {
      return res.status(403).json({ success: false, message: "Setup already completed" });
    }

    const { name, email, password } = req.body;
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash, role: "admin" });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    setRefreshCookie(res, refreshToken);
    res.status(201).json({ success: true, data: { user: userResponse(user), accessToken } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Email already registered" });
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

export async function signup(req, res, next) {
  try {
    if (process.env.ALLOW_PUBLIC_SIGNUP === "false") {
      return res.status(403).json({ success: false, message: "Public registration is disabled" });
    }

    if (!handleValidation(req, res)) return;

    const count = await User.countDocuments();
    if (count === 0) {
      return res.status(400).json({ success: false, message: "Complete initial setup first" });
    }

    const { name, email, password } = req.body;
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash, role: "pharmacist" });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    setRefreshCookie(res, refreshToken);
    res.status(201).json({ success: true, data: { user: userResponse(user), accessToken } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }
    next(err);
  }
}

export async function setupStatus(req, res) {
  const count = await User.countDocuments();
  res.json({ success: true, data: { needsSetup: count === 0 } });
}
