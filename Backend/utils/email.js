import { Resend } from "resend";

let resendClient = null;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

export async function sendOtpEmail({ to, otp, shopName }) {
  const from =
    process.env.RESEND_FROM_EMAIL || "PharmaCare <onboarding@mail.itsanubhab.com>";
  const client = getClient();

  if (!client) {
    console.log(
      `[PharmaCare OTP] ${to} | Shop: ${shopName} → ${otp} (no RESEND_API_KEY — dev fallback)`,
    );
    return { sent: false, devFallback: true };
  }

  const { error } = await client.emails.send({
    from,
    to,
    subject: `PharmaCare verification code`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#2563eb;margin:0 0 8px">PharmaCare</h2>
        <p style="color:#64748b;margin:0 0 24px">Use the verification code below to complete your registration. This code is valid for <strong>10 minutes</strong>.</p>
        <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center">
          <p style="color:#64748b;font-size:13px;margin:0 0 8px">Your verification code</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:0.3em;color:#0f172a;margin:0">${otp}</p>
        </div>
      <div style="margin-top:24px;padding:16px;background:#fff7ed;border-left:4px solid #f59e0b;border-radius:8px;">

      <p style="margin:0;color:#92400e;font-size:13px;line-height:20px;">

    <strong>Security Notice:</strong> Never share this verification code with anyone. PharmaCare will never ask for your OTP via phone, email, or text message. If you did not request this code, you can safely ignore this email.

  </p>
  <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e5e7eb;">

  <p style="margin:0;color:#64748b;font-size:13px;">

    <strong>Request Details</strong><br>

    Date: ${new Date().toLocaleDateString("en-IN", {

      day: "2-digit",

      month: "long",

      year: "numeric"

    })}<br>

    Time: ${new Date().toLocaleTimeString("en-IN", {

      hour: "2-digit",

      minute: "2-digit",

      second: "2-digit"

    })}

  </p>

</div>

</div>
      </div>
    `,
  });

  if (error) {
    console.error("[PharmaCare Email]", error.message);
    throw new Error("Failed to send verification email. Try again later.");
  }

  return { sent: true };
}

export async function sendPasswordResetEmail({ to, otp }) {
  const from =
    process.env.RESEND_FROM_EMAIL || "PharmaCare <onboarding@resend.dev>";
  const client = getClient();

  if (!client) {
    console.log(
      `[PharmaCare Password Reset] ${to} → ${otp} (no RESEND_API_KEY — dev fallback)`,
    );
    return { sent: false, devFallback: true };
  }

  const { error } = await client.emails.send({
    from,
    to,
    subject: `Reset your PharmaCare password`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#2563eb;margin:0 0 8px">PharmaCare — Password Reset</h2>
        <p style="color:#64748b;margin:0 0 24px">Use the code below to reset your password</p>
        <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center">
          <p style="color:#64748b;font-size:13px;margin:0 0 8px">Your password reset code</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:0.3em;color:#0f172a;margin:0">${otp}</p>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin:24px 0 0">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error("[PharmaCare Email]", error.message);
    throw new Error("Failed to send password reset email. Try again later.");
  }

  return { sent: true };
}

export async function sendContactEmail({ from, subject, message, userName }) {
  const to = process.env.CONTACT_TO_EMAIL || "heyanubhab@gmail.com";
  const fromAddress =
    process.env.RESEND_FROM_EMAIL || "PharmaCare <onboarding@resend.dev>";
  const client = getClient();
  const safeSubject = escapeHtml(
    subject?.trim() || "PharmaCare Contact Form Message",
  );
  const safeMessage = escapeHtml(message?.trim() || "");
  const safeFrom = escapeHtml(from?.trim() || "unknown@example.com");
  const safeName = escapeHtml(userName?.trim() || "PharmaCare User");

  if (!safeMessage) {
    throw new Error("Message is required");
  }

  if (!client) {
    console.log(
      `[PharmaCare Contact] From: ${safeFrom} (${safeName}) | Subject: ${safeSubject}`,
    );
    console.log(safeMessage);
    console.log(`(no RESEND_API_KEY — would send to ${to})`);
    return { sent: false, devFallback: true };
  }

  const { error } = await client.emails.send({
    from: fromAddress,
    to,
    replyTo: safeFrom,
    subject: `Message  from ${safeName} -- PharmaCare Contact Form  ${safeSubject}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px">
        <h2 style="color:#2563eb;margin:0 0 8px">New Contact Message</h2>
        <p style="color:#64748b;margin:0 0 20px">Sent via PharmaCare Contact Us form</p>
        <p style="margin:0 0 6px"><strong>From:</strong> ${safeName} &lt;${safeFrom}&gt;</p>
        <p style="margin:0 0 20px"><strong>Subject:</strong> ${safeSubject}</p>
        <div style="background:#f1f5f9;border-radius:12px;padding:20px;white-space:pre-wrap;color:#0f172a;line-height:1.6">${safeMessage}</div>
      </div>
    `,
  });

  if (error) {
    console.error("[PharmaCare Contact Email]", error.message);
    throw new Error("Failed to send message. Try again later.");
  }

  return { sent: true };
}
