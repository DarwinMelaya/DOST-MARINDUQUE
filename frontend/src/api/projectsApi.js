import { api } from "./client";

function multipartConfig() {
  return {
    transformRequest: (body, headers) => {
      if (body instanceof FormData) {
        delete headers["Content-Type"];
      }
      return body;
    },
  };
}

/**
 * Pull / list projects (GET) — axios only, hindi `fetch()`.
 */
export async function fetchProjects() {
  const { data } = await api.get("/projects");
  return Array.isArray(data) ? data : [];
}

/**
 * Save bagong project (POST) — nangangailangan ng admin JWT.
 * Sends multipart/form-data when `imageFiles` is present; otherwise JSON (backward compatible).
 *
 * @param {object} payload - project fields; optional `imageFiles`: File[]
 */
export async function createProject(payload) {
  const { imageFiles = [], ...rest } = payload;
  const files = Array.isArray(imageFiles) ? imageFiles : [];

  if (files.length === 0) {
    const { data } = await api.post("/projects", rest);
    return data;
  }

  const fd = new FormData();
  fd.append("programType", rest.programType ?? "");
  fd.append("title", rest.title ?? "");
  fd.append("amountOfAssistance", rest.amountOfAssistance ?? "");
  fd.append("beneficiary", rest.beneficiary ?? "");
  fd.append("contactPerson", rest.contactPerson ?? "");
  fd.append("briefDescription", rest.briefDescription ?? "");
  fd.append("projectStatus", rest.projectStatus ?? "");
  fd.append("location", JSON.stringify(rest.location ?? {}));
  for (const f of files) {
    fd.append("images", f);
  }
  const { data } = await api.post("/projects", fd, multipartConfig());
  return data;
}

/**
 * Update project (PATCH). Always multipart: `keptImageUrls` controls existing photos; `imageFiles` are new uploads.
 */
export async function updateProject(id, payload) {
  const { imageFiles = [], keptImageUrls = [], ...rest } = payload;
  const fd = new FormData();
  fd.append("programType", rest.programType ?? "");
  fd.append("title", rest.title ?? "");
  fd.append("amountOfAssistance", rest.amountOfAssistance ?? "");
  fd.append("beneficiary", rest.beneficiary ?? "");
  fd.append("contactPerson", rest.contactPerson ?? "");
  fd.append("briefDescription", rest.briefDescription ?? "");
  fd.append("projectStatus", rest.projectStatus ?? "");
  fd.append("location", JSON.stringify(rest.location ?? {}));
  fd.append("keptImagesJson", JSON.stringify(keptImageUrls));
  for (const f of imageFiles) {
    fd.append("images", f);
  }
  const { data } = await api.patch(`/projects/${id}`, fd, multipartConfig());
  return data;
}

export async function deleteProject(id) {
  await api.delete(`/projects/${id}`);
}
