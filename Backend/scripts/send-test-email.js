import envFile from "../config/env.js";
import { sendOtpEmail } from "../utils/email.js";

async function main() {
  const to = process.env.CONTACT_TO_EMAIL || "heyanubhab@gmail.com";
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  try {
    const res = await sendOtpEmail({ to, otp, shopName: "Dev Test" });
    console.log("Email test result:", res);
  } catch (err) {
    console.error("Email test failed:", err.message || err);
    process.exitCode = 1;
  }
}

main();
