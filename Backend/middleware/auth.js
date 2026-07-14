import jwt from "jsonwebtoken";
import User from "../models/user.js";

/**
 * Verifies the Bearer access token and attaches req.user.
 * Every protected route uses this — no role checks needed (single admin).
 */
export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type === "refresh") {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
    const user = await User.findById(payload.sub).select("name email phone isActive");
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Account inactive or not found" });
    }
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
    };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}
