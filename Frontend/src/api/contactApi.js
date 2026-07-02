import { apiFetch } from "./client";

export function sendContactMessage({ email, subject, message }) {
  return apiFetch("/api/contact", {
    method: "POST",
    body: JSON.stringify({ email, subject, message }),
  });
}
