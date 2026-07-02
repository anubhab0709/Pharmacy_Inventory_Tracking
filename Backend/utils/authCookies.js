export const REFRESH_COOKIE = "pharmacy_refresh";

function parseRefreshMaxAge() {
  const raw = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  const match = raw.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === "d") return n * 24 * 60 * 60 * 1000;
  if (unit === "h") return n * 60 * 60 * 1000;
  if (unit === "m") return n * 60 * 1000;
  return n * 1000;
}

export function refreshCookieOptions() {
  const secure = process.env.COOKIE_SECURE === "true";
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "strict" : "lax",
    maxAge: parseRefreshMaxAge(),
    path: "/api/auth",
  };
}

export function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions());
}

export function clearRefreshCookie(res) {
  const { maxAge, ...options } = refreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE, options);
}
