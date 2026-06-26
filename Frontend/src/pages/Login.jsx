import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { C } from "../theme";
import { Btn, FInput } from "../components/SharedUI";
import { useAuth } from "../context/AuthContext";
import { getSetupStatus } from "../api/authApi";
import { ApiError } from "../api/client";

const pageStyle = {
  width: "100%",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--bg)",
  padding: 24,
  position: "relative",
  overflow: "hidden",
};

const glowStyle = (color, x, y) => ({
  position: "absolute",
  width: 480,
  height: 480,
  borderRadius: "50%",
  background: color,
  filter: "blur(80px)",
  opacity: 0.35,
  left: x,
  top: y,
  pointerEvents: "none",
});

const cardStyle = {
  width: "100%",
  maxWidth: 460,
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 20,
  padding: "40px 36px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
  position: "relative",
  zIndex: 1,
  maxHeight: "92vh",
  overflowY: "auto",
};

const toggleWrap = {
  display: "flex",
  background: C.surfaceHover,
  borderRadius: 10,
  padding: 4,
  marginBottom: 24,
  border: `1px solid ${C.border}`,
};

const toggleBtn = (active) => ({
  flex: 1,
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontFamily: "'Inter',sans-serif",
  fontSize: 13,
  fontWeight: 600,
  transition: "all 0.2s ease",
  background: active ? C.surface : "transparent",
  color: active ? C.teal : C.muted,
  boxShadow: active ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
});

const otpInputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 10,
  border: `1px solid ${C.border}`,
  background: C.surface,
  color: C.text,
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: "0.35em",
  textAlign: "center",
  fontFamily: "'Inter',sans-serif",
  outline: "none",
};

const emptySignupForm = {
  shopName: "",
  ownerName: "",
  email: "",
  phone: "",
  password: "",
};

export default function Login() {
  const { login, sendOtp, verifyOtp, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [needsSetup, setNeedsSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [mode, setMode] = useState("signin");
  const [signupStep, setSignupStep] = useState("details");
  const [form, setForm] = useState(emptySignupForm);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSignup = needsSetup || mode === "signup";

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, from]);

  useEffect(() => {
    getSetupStatus()
      .then((data) => {
        setNeedsSetup(data.needsSetup);
        if (data.needsSetup) setMode("signup");
      })
      .catch(() => setError("Cannot reach server. Is the backend running?"))
      .finally(() => setCheckingSetup(false));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const switchMode = (next) => {
    setMode(next);
    setSignupStep("details");
    setOtp("");
    setError("");
    setInfo("");
    if (next === "signin") setForm(emptySignupForm);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      const data = await sendOtp(form);
      setSignupStep("otp");
      setInfo(
        data.isFirstSetup
          ? "OTP sent! Check your backend console for the code (dev mode)."
          : "OTP sent to your registered phone. Check the backend console for the code (dev mode)."
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send OTP");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await verifyOtp({ email: form.email, otp });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email: form.email, password: form.password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || checkingSetup) {
    return (
      <div style={pageStyle}>
        <p style={{ color: C.teal, fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={glowStyle("rgba(37,99,235,0.15)", "-10%", "-20%")} />
      <div style={glowStyle("rgba(16,185,129,0.12)", "60%", "50%")} />

      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: "0 auto 14px",
            background: "linear-gradient(135deg,var(--primary),var(--slate))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 800, color: "#fff",
            boxShadow: "0 8px 24px rgba(37,99,235,0.25)",
          }}>
            Rx
          </div>
          <h1 style={{ fontFamily: "'Inter',sans-serif", fontSize: 26, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>
            PharmaCare
          </h1>
          <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>
            {needsSetup
              ? "Register your pharmacy"
              : isSignup
                ? signupStep === "otp" ? "Verify your phone number" : "Create your pharmacy account"
                : "Welcome back — sign in to your pharmacy"}
          </p>
        </div>

        {!needsSetup && (
          <div style={toggleWrap}>
            <button type="button" style={toggleBtn(mode === "signin")} onClick={() => switchMode("signin")}>
              Sign In
            </button>
            <button type="button" style={toggleBtn(mode === "signup")} onClick={() => switchMode("signup")}>
              Sign Up
            </button>
          </div>
        )}

        {needsSetup && (
          <div style={{
            background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)",
            borderRadius: 10, padding: "12px 16px", marginBottom: 20,
            fontSize: 13, color: C.muted, lineHeight: 1.5, textAlign: "center",
          }}>
            Register your pharmacy with shop details and verify via OTP.
          </div>
        )}

        {isSignup && signupStep === "details" && (
          <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FInput label="Shop / Pharmacy Name" required value={form.shopName} onChange={(e) => set("shopName", e.target.value)} placeholder="e.g. City Care Pharmacy" />
            <FInput label="Owner Name" required value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} placeholder="e.g. Dr. Rajesh Kumar" />
            <FInput label="Email" required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="pharmacy@email.com" autoComplete="email" />
            <FInput label="Phone Number" required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" />
            <FInput label="Password" required type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password" />

            {error && <ErrorBox message={error} />}
            <Btn variant="primary" type="submit" style={{ width: "100%", justifyContent: "center", padding: "12px 20px" }} disabled={submitting}>
              {submitting ? "Sending OTP..." : "Send OTP"}
            </Btn>
          </form>
        )}

        {isSignup && signupStep === "otp" && (
          <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 13, color: C.muted, margin: 0, textAlign: "center", lineHeight: 1.5 }}>
              Enter the 6-digit code sent to <strong style={{ color: C.text }}>{form.phone}</strong>
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              style={otpInputStyle}
              autoFocus
            />
            {info && <InfoBox message={info} />}
            {error && <ErrorBox message={error} />}
            <Btn variant="primary" type="submit" style={{ width: "100%", justifyContent: "center", padding: "12px 20px" }} disabled={submitting || otp.length !== 6}>
              {submitting ? "Verifying..." : needsSetup ? "Create Pharmacy Account" : "Verify & Sign Up"}
            </Btn>
            <button
              type="button"
              onClick={() => { setSignupStep("details"); setOtp(""); setError(""); setInfo(""); }}
              style={{ background: "none", border: "none", color: C.teal, fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "'Inter',sans-serif" }}
            >
              ← Edit details
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={submitting}
              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 12, fontFamily: "'Inter',sans-serif" }}
            >
              Resend OTP
            </button>
          </form>
        )}

        {!isSignup && (
          <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FInput label="Email" required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="pharmacy@email.com" autoComplete="email" />
            <FInput label="Password" required type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Your password" autoComplete="current-password" />
            {error && <ErrorBox message={error} />}
            <Btn variant="primary" type="submit" style={{ width: "100%", justifyContent: "center", padding: "12px 20px" }} disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </Btn>
          </form>
        )}

        {!needsSetup && signupStep === "details" && (
          <p style={{ textAlign: "center", marginTop: 22, fontSize: 13, color: C.muted }}>
            {isSignup ? "Already registered?" : "New pharmacy?"}{" "}
            <button type="button" onClick={() => switchMode(isSignup ? "signin" : "signup")} style={{ background: "none", border: "none", color: C.teal, fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "'Inter',sans-serif", padding: 0 }}>
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <p style={{ color: C.red, fontSize: 13, margin: 0, padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.15)" }}>
      {message}
    </p>
  );
}

function InfoBox({ message }) {
  return (
    <p style={{ color: C.teal, fontSize: 12, margin: 0, padding: "10px 14px", background: "rgba(37,99,235,0.06)", borderRadius: 8, border: "1px solid rgba(37,99,235,0.12)", lineHeight: 1.5 }}>
      {message}
    </p>
  );
}
