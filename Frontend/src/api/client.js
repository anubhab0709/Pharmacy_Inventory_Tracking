export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

let accessToken = null;
let onUnauthorized = null;
let refreshPromise = null;

const PUBLIC_AUTH_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/send-otp",
  "/api/auth/verify-otp",
  "/api/auth/setup-status",
]);

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/** Single shared refresh — used by apiFetch and AuthContext boot */
export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const json = await res.json().catch(() => ({}));
        const data = json.data;
        if (data?.accessToken) accessToken = data.accessToken;
        return data || null;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  const headers = { ...options.headers };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const shouldTryRefresh =
    res.status === 401 &&
    !options._retry &&
    !PUBLIC_AUTH_PATHS.has(path) &&
    path !== "/api/auth/refresh";

  if (shouldTryRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed?.accessToken) {
      return apiFetch(path, { ...options, _retry: true });
    }
    accessToken = null;
    if (path !== "/api/auth/logout") onUnauthorized?.();
    throw new ApiError("Session expired", 401);
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(json.message || "Request failed", res.status);
  }

  return json;
}
