import { apiFetch } from "./client.js";

export async function getMedicines() {
  const json = await apiFetch("/api/medicines");
  return json.data;
}

export async function addMedicine(data) {
  const json = await apiFetch("/api/medicines", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return json.data;
}

export async function updateMedicine(id, data) {
  if (!id) throw new Error("ID required");
  const json = await apiFetch(`/api/medicines/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return json.data;
}

export async function deleteMedicine(id) {
  const json = await apiFetch(`/api/medicines/${id}`, { method: "DELETE" });
  return json.data;
}

export async function getStockOuts() {
  const json = await apiFetch("/api/stock-out");
  return json.data;
}

export async function addStockOut(data) {
  const json = await apiFetch("/api/stock-out", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return json.data;
}

export async function deleteStockOut(id) {
  const json = await apiFetch(`/api/stock-out/${id}`, { method: "DELETE" });
  return json.data;
}

export async function getBills() {
  const json = await apiFetch("/api/bills");
  return json.data;
}

export async function createBill(data) {
  const json = await apiFetch("/api/bills", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return json.data;
}

export async function getProfile() {
  const json = await apiFetch("/api/profile");
  return json.data;
}

export async function updateProfile(data) {
  const json = await apiFetch("/api/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return json.data;
}
