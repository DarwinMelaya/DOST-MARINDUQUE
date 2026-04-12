import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export const ADMIN_TOKEN_KEY = "dost_admin_token";
