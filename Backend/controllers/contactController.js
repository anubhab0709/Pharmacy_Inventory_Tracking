import { sendContactEmail } from "../utils/email.js";

export async function submitContactMessage(req, res, next) {
  try {
    const { email, subject, message } = req.body || {};

    if (!email?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: "Email and message are required" });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }

    const result = await sendContactEmail({
      from: email.trim(),
      subject: subject?.trim() || "General inquiry",
      message: message.trim(),
      userName: req.user?.name,
    });

    res.json({
      success: true,
      message: result.devFallback
        ? "Message received (dev mode — check backend console)"
        : "Message sent successfully! Our team will contact you soon.",
      emailSent: result.sent,
    });
  } catch (err) {
    next(err);
  }
}
