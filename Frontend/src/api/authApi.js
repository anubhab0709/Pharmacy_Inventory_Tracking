import { apiFetch, setAccessToken, refreshAccessToken } from "./client.js";

export async function getSetupStatus() {
  const json = await apiFetch("/api/auth/setup-status");
  return json.data;
}

export async function sendOtp(payload) {
  const json = await apiFetch("/api/auth/send-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return json.data;
}

export async function verifyOtp({ email, otp }) {
  const json = await apiFetch("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
  setAccessToken(json.data.accessToken);
  return json.data;
}

export async function requestPasswordReset({ email }) {
  const json = await apiFetch("/api/auth/request-password-reset", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return json.data;
}

export async function resetPassword({ email, otp, password, confirmPassword }) {
  const json = await apiFetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, otp, password, confirmPassword }),
  });
  return json.data;
}

export async function login({ email, password }) {
  const json = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(json.data.accessToken);
  return json.data;
}

export async function logout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    setAccessToken(null);
  }
}

export async function refreshSession() {
  const data = await refreshAccessToken();
  if (!data) throw new Error("No session");
  return data;
}

export async function getMe() {
  const json = await apiFetch("/api/auth/me");
  return json.data;
}
