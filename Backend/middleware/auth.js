import jwt from "jsonwebtoken";
import User from "../models/user.js";

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, role: payload.role, name: payload.name };
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

export async function loadUser(req, res, next) {
  if (!req.user?.id) return next();
  try {
    const user = await User.findById(req.user.id).select("name email role isActive");
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Account inactive or not found" });
    }
    req.user = { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
    next();
  } catch {
    return res.status(500).json({ success: false, message: "Failed to load user" });
  }
}
