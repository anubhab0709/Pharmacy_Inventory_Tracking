import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { C } from "../theme";
import { Btn, FInput } from "../components/SharedUI";
import BrandLogo from "../components/BrandLogo";
import LoadingScreen from "../components/LoadingScreen";
import { useAuth } from "../context/AuthContext";
import {
  getSetupStatus,
  requestPasswordReset,
  resetPassword,
} from "../api/authApi";
import { ApiError } from "../api/client";

const pageStyle = {
  width: "100%",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "radial-gradient(circle at top left, rgba(37,99,235,0.08), transparent 32%), radial-gradient(circle at bottom right, rgba(16,185,129,0.08), transparent 28%), var(--bg)",
  padding: 28,
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
  maxWidth: 540,
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 24,
  padding: "44px 42px",
  boxShadow: "0 24px 70px rgba(0,0,0,0.10)",
  position: "relative",
  zIndex: 1,
  maxHeight: "92vh",
  overflowY: "auto",
};

const toggleWrap = {
  display: "flex",
  background: C.surfaceHover,
  borderRadius: 16,
  padding: 4,
  marginBottom: 24,
  border: `1px solid ${C.border}`,
  position: "relative",
  overflow: "hidden",
};

const toggleBtn = (active) => ({
  flex: 1,
  padding: "12px 16px",
  borderRadius: 12,
  border: "none",
  cursor: "pointer",
  fontFamily: "'Inter',sans-serif",
  fontSize: 14,
  fontWeight: 700,
  transition: "color 0.24s ease, transform 0.24s ease",
  background: "transparent",
  color: active ? C.teal : C.muted,
  position: "relative",
  zIndex: 1,
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
  const {
    login,
    sendOtp,
    verifyOtp,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from
    ? `${location.state.from.pathname}${location.state.from.search || ""}`
    : "/";

  const [needsSetup, setNeedsSetup] = useState(false);
  const [allowPublicSignup, setAllowPublicSignup] = useState(true);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [mode, setMode] = useState("signin");
  const [forgotStep, setForgotStep] = useState("request");
  const [signupStep, setSignupStep] = useState("details");
  const [form, setForm] = useState(emptySignupForm);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSignup = allowPublicSignup || needsSetup;

  const isSignup = mode === "signup" && canSignup;

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, from]);

  useEffect(() => {
    getSetupStatus()
      .then((data) => {
        setNeedsSetup(data.needsSetup);

        setAllowPublicSignup(data.allowPublicSignup !== false);

        if (data.needsSetup) {
          setMode("signup");
        } else {
          setMode("signin");
        }
      })

      .catch(() => setError("Cannot reach server. Is the backend running?"))

      .finally(() => setCheckingSetup(false));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const switchMode = (next) => {
    if (next === "signup" && !allowPublicSignup && !needsSetup) {
      return; // 🚫 block signup completely
    }

    setMode(next);

    setSignupStep("details");

    setOtp("");

    setError("");

    setInfo("");

    if (next === "signin") setForm(emptySignupForm);
  };

  useEffect(() => {
    if (!allowPublicSignup && !needsSetup && mode === "signup") {
      setMode("signin");
    }
  }, [allowPublicSignup, needsSetup, mode]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      const data = await sendOtp(form);
      setSignupStep("otp");
      setInfo(
        data.emailSent
          ? `OTP sent to ${form.email}. Check your inbox (expires in 10 minutes).`
          : "OTP generated. Check your backend console for the code (dev mode — add RESEND_API_KEY to send real emails).",
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

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await requestPasswordReset({ email: form.email });
      setForgotStep("verify");
      setInfo("If this email exists, a reset code was sent.");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to request reset",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await resetPassword({
        email: form.email,
        otp,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setInfo("Password reset. Please sign in with your new password.");
      setMode("signin");
      setForgotStep("request");
      setForm(emptySignupForm);
      setOtp("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || checkingSetup) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <div style={pageStyle}>
      <div style={glowStyle("rgba(37,99,235,0.15)", "-10%", "-20%")} />
      <div style={glowStyle("rgba(16,185,129,0.12)", "60%", "50%")} />

      <div style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <BrandLogo size={52} showText={false} />
          </div>
          <h1
            style={{
              fontFamily: "'Inter',sans-serif",
              fontSize: 30,
              fontWeight: 800,
              color: C.text,
              margin: "0 0 8px",
              letterSpacing: "-0.02em",
            }}
          >
            PharmaCare
          </h1>
          <p
            style={{ color: C.muted, fontSize: 15, margin: 0, lineHeight: 1.5 }}
          >
            {needsSetup
              ? "Register your pharmacy"
              : isSignup
                ? signupStep === "otp"
                  ? "Verify your email address"
                  : "Create your pharmacy account"
                : "Welcome back — sign in to your Inventory Management System"}
          </p>
        </div>

        {!needsSetup && allowPublicSignup && (
          <div style={toggleWrap}>
            <div
              style={{
                position: "absolute",
                inset: 4,
                width: "calc(50% - 4px)",
                borderRadius: 12,
                background: C.surface,
                boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
                transform:
                  mode === "signup"
                    ? "translateX(calc(100% + 4px))"
                    : "translateX(0)",
                transition: "transform 220ms ease",
              }}
            />
            <button
              type="button"
              style={toggleBtn(mode === "signin")}
              onClick={() => switchMode("signin")}
            >
              Sign In
            </button>
            <button
              type="button"
              style={toggleBtn(mode === "signup")}
              onClick={() => switchMode("signup")}
            >
              Sign Up
            </button>
          </div>
        )}

        {location.state?.sessionExpired && (
          <div
            style={{
              background: "rgba(245,130,32,0.08)",
              border: "1px solid rgba(245,130,32,0.2)",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 14,
              color: C.muted,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Your session expired. Please sign in again.
          </div>
        )}

        {needsSetup && (
          <div
            style={{
              background: "rgba(37,99,235,0.06)",
              border: "1px solid rgba(37,99,235,0.15)",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 14,
              color: C.muted,
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            Register your pharmacy with shop details and verify via email OTP.
          </div>
        )}

        {mode === "signup" && canSignup && signupStep === "details" && (
          <form
            onSubmit={handleSendOtp}
            style={{ display: "flex", flexDirection: "column", gap: 18 }}
          >
            <FInput
              label="Shop / Pharmacy Name"
              required
              value={form.shopName}
              onChange={(e) => set("shopName", e.target.value)}
              placeholder="e.g. City Care Pharmacy"
            />
            <FInput
              label="Owner Name"
              required
              value={form.ownerName}
              onChange={(e) => set("ownerName", e.target.value)}
              placeholder="e.g. Dr. Rajesh Kumar"
            />
            <FInput
              label="Email"
              required
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="pharmacy@email.com"
              autoComplete="email"
            />
            <FInput
              label="Phone Number"
              required
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 98765 43210"
              autoComplete="tel"
            />
            <FInput
              label="Password"
              required
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
            />

            {error && <ErrorBox message={error} />}
            <Btn
              variant="primary"
              type="submit"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "13px 20px",
              }}
              disabled={submitting}
            >
              {submitting ? "Sending OTP..." : "Send OTP"}
            </Btn>
          </form>
        )}

        {mode === "signup" && signupStep === "otp" && (
          <form
            onSubmit={handleVerifyOtp}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <p
              style={{
                fontSize: 14,
                color: C.muted,
                margin: 0,
                textAlign: "center",
                lineHeight: 1.6,
              }}
            >
              Enter the 6-digit code sent to{" "}
              <strong style={{ color: C.text }}>{form.email}</strong>
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              style={otpInputStyle}
              autoFocus
            />
            {info && <InfoBox message={info} />}
            {error && <ErrorBox message={error} />}
            <Btn
              variant="primary"
              type="submit"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "13px 20px",
              }}
              disabled={submitting || otp.length !== 6}
            >
              {submitting
                ? "Verifying..."
                : needsSetup
                  ? "Create Pharmacy Account"
                  : "Verify & Sign Up"}
            </Btn>
            <button
              type="button"
              onClick={() => {
                setSignupStep("details");
                setOtp("");
                setError("");
                setInfo("");
              }}
              style={{
                background: "none",
                border: "none",
                color: C.teal,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "'Inter',sans-serif",
              }}
            >
              ← Edit details
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={submitting}
              style={{
                background: "none",
                border: "none",
                color: C.muted,
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "'Inter',sans-serif",
              }}
            >
              Resend OTP
            </button>
          </form>
        )}

        {mode === "signin" && (
          <form
            onSubmit={handleSignIn}
            style={{ display: "flex", flexDirection: "column", gap: 18 }}
          >
            <FInput
              label="Email"
              required
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="pharmacy@email.com"
              autoComplete="email"
            />
            <FInput
              label="Password"
              required
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
            />
            {error && <ErrorBox message={error} />}
            <Btn
              variant="primary"
              type="submit"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "13px 20px",
              }}
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Sign In"}
            </Btn>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 8,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setForgotStep("request");
                  setError("");
                  setInfo("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: C.teal,
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "'Inter',sans-serif",
                  fontWeight: 600,
                }}
              >
                Forgot password?
              </button>
            </div>
          </form>
        )}

        {mode === "forgot" &&
          (forgotStep === "request" ? (
            <form
              onSubmit={handleRequestReset}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <FInput
                label="Email"
                required
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="Enter your account email"
              />
              {info && <InfoBox message={info} />}
              {error && <ErrorBox message={error} />}
              <Btn variant="primary" type="submit" disabled={submitting}>
                {submitting ? "Sending..." : "Send reset code"}
              </Btn>
              <button
                type="button"
                onClick={() => setMode("signin")}
                style={{
                  background: "none",
                  border: "none",
                  color: C.muted,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                ← Back to sign in
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleResetPassword}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <p style={{ fontSize: 13, color: C.muted }}>
                Enter the code sent to{" "}
                <strong style={{ color: C.text }}>{form.email}</strong> and
                choose a new password.
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                style={otpInputStyle}
              />
              <FInput
                label="New password"
                required
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="New password"
              />
              <FInput
                label="Confirm password"
                required
                type="password"
                value={form.confirmPassword || ""}
                onChange={(e) => set("confirmPassword", e.target.value)}
                placeholder="Confirm new password"
              />
              {info && <InfoBox message={info} />}
              {error && <ErrorBox message={error} />}
              <Btn
                variant="primary"
                type="submit"
                disabled={submitting || otp.length !== 6}
              >
                {submitting ? "Resetting..." : "Reset password"}
              </Btn>
            </form>
          ))}

        {!needsSetup && allowPublicSignup && signupStep === "details" && (
          <p
            style={{
              textAlign: "center",
              marginTop: 22,
              fontSize: 13,
              color: C.muted,
            }}
          >
            {isSignup ? "Already registered?" : "New pharmacy?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(isSignup ? "signin" : "signup")}
              style={{
                background: "none",
                border: "none",
                color: C.teal,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "'Inter',sans-serif",
                padding: 0,
              }}
            >
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
    <p
      style={{
        color: C.red,
        fontSize: 13,
        margin: 0,
        padding: "10px 14px",
        background: "rgba(239,68,68,0.08)",
        borderRadius: 8,
        border: "1px solid rgba(239,68,68,0.15)",
      }}
    >
      {message}
    </p>
  );
}

function InfoBox({ message }) {
  return (
    <p
      style={{
        color: C.teal,
        fontSize: 12,
        margin: 0,
        padding: "10px 14px",
        background: "rgba(37,99,235,0.06)",
        borderRadius: 8,
        border: "1px solid rgba(37,99,235,0.12)",
        lineHeight: 1.5,
      }}
    >
      {message}
    </p>
  );
}
