import { api } from "./client";

/**
 * Pull / list projects (GET) — axios only, hindi `fetch()`.
 */
export async function fetchProjects() {
  const { data } = await api.get("/projects");
  return Array.isArray(data) ? data : [];
}

/**
 * Save bagong project (POST) — nangangailangan ng admin JWT (interceptor sa `client.js`).
 */
export async function createProject(payload) {
  const { data } = await api.post("/projects", payload);
  return data;
}
