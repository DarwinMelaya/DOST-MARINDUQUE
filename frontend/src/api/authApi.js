import { api } from "./client";

/**
 * Admin auth — lahat axios (`api`), walang native `fetch`.
 */
export async function loginAdmin(credentials) {
  const { data } = await api.post("/auth/admin/login", credentials);
  return data;
}

export async function signupAdmin(payload) {
  const { data } = await api.post("/auth/admin/signup", payload);
  return data;
}
