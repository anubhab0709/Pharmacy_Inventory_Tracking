import jwt from "jsonwebtoken";
import User from "../models/user.js";

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("name email role isActive phone");
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Account inactive or not found" });
    }
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }
    next();
  };
}

/** @deprecated use authenticate — kept for /me route alias */
export async function loadUser(req, res, next) {
  return next();
}
