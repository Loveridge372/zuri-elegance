import API_BASE from "../../services/api";
export function getToken() {
  return localStorage.getItem("token");
}

export async function adminFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error || data.message || "Admin request failed");
  }

  return data;
}

export const money = (value) => `R ${Number(value || 0).toFixed(2)}`;
