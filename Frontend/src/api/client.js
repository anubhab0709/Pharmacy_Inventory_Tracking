export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

let accessToken = null;
let onUnauthorized = null;
let refreshPromise = null;

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

async function tryRefresh() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const json = await res.json();
        accessToken = json.data?.accessToken || null;
        return json.data || null;
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

  if (res.status === 401 && !options._retry && !path.startsWith("/api/auth/")) {
    const refreshed = await tryRefresh();
    if (refreshed?.accessToken) {
      return apiFetch(path, { ...options, _retry: true });
    }
    accessToken = null;
    onUnauthorized?.();
    throw new ApiError("Session expired", 401);
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(json.message || "Request failed", res.status);
  }

  return json;
}
