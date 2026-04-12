import axios from "axios";

/**
 * Central axios instance para sa buong app.
 * Ang pag-fetch at pag-pull ng data sa server ay dito lang (`api.get` / `api.post`),
 * o sa `projectsApi.js` / `authApi.js` na gumagamit nito — huwag gumamit ng `fetch()`.
 */

/**
 * Resolves the API **origin** (scheme + host + port), without `/api`.
 * - Production: `VITE_API_URL` (e.g. `https://api.example.com`)
 * - Dev: not used when using the Vite proxy (see `baseURL` below)
 */
function normalizeApiOrigin(url) {
  const fallback = "http://localhost:5000";
  if (url == null || String(url).trim() === "") return fallback;
  let u = String(url).trim().replace(/\/+$/, "");
  if (u.endsWith("/api")) {
    u = u.slice(0, -4);
    u = u.replace(/\/+$/, "");
  }
  return u || fallback;
}

function resolveApiOrigin() {
  let u = normalizeApiOrigin(import.meta.env.VITE_API_URL);
  if (import.meta.env.DEV && /:5173\b/.test(u)) {
    console.warn(
      "[api] VITE_API_URL points to Vite (:5173); using http://localhost:5000 for production builds."
    );
    u = "http://localhost:5000";
  }
  return u;
}

/**
 * - **Development:** `baseURL` is `/api` so requests go to the Vite dev server and are
 *   proxied to `http://localhost:5000` (see `vite.config.js`). No CORS problems.
 * - **Production:** full URL to your API + `/api`.
 */
const baseURL = import.meta.env.DEV
  ? "/api"
  : `${resolveApiOrigin()}/api`;

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export const ADMIN_TOKEN_KEY = "dost_admin_token";

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Human-readable message for failed API calls (network, 404, 500, etc.).
 */
export function getApiErrorMessage(err, fallback = "Request failed.") {
  if (!err) return fallback;
  const data = err.response?.data;
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message.trim();
  }
  if (err.response?.status === 404) {
    return "API not found (404). Restart the backend or check the /api proxy.";
  }
  if (err.response?.status === 500) {
    return "Server error (500). Check backend logs and MongoDB.";
  }
  if (err.response?.status === 401 || err.response?.status === 403) {
    return data?.message ?? "Not authorized.";
  }
  if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
    return "Cannot reach the API. In dev, run the backend on port 5000 and keep Vite running.";
  }
  if (!err.response) {
    return "No response from server. Is the backend running (port 5000)?";
  }
  if (typeof err.message === "string" && err.message.trim()) {
    return err.message.trim();
  }
  return fallback;
}
