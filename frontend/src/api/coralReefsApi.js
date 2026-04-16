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

export async function fetchCoralReefs() {
  const { data } = await api.get("/coral-reefs");
  return Array.isArray(data) ? data : [];
}

export async function createCoralReef(payload) {
  const { photoFiles, ...rest } = payload;
  if (!Array.isArray(photoFiles) || photoFiles.length === 0) {
    const { data } = await api.post("/coral-reefs", rest);
    return data;
  }

  const fd = new FormData();
  fd.append("coralName", rest.coralName ?? "");
  fd.append("coralType", rest.coralType ?? "");
  fd.append("description", rest.description ?? "");
  fd.append("coralStatus", rest.coralStatus ?? "");
  fd.append("location", JSON.stringify(rest.location ?? {}));
  fd.append("areaCoordinates", JSON.stringify(rest.areaCoordinates ?? []));
  for (const f of photoFiles.slice(0, 3)) {
    if (f instanceof File) fd.append("photos", f);
  }

  const { data } = await api.post("/coral-reefs", fd, multipartConfig());
  return data;
}

export async function updateCoralReef(id, payload) {
  const { photoFiles, keptPhotoUrls, ...rest } = payload;
  if (!Array.isArray(photoFiles) || photoFiles.length === 0) {
    const { data } = await api.patch(`/coral-reefs/${id}`, {
      ...rest,
      ...(keptPhotoUrls !== undefined ? { keptPhotoUrls } : {}),
    });
    return data;
  }

  const fd = new FormData();
  fd.append("coralName", rest.coralName ?? "");
  fd.append("coralType", rest.coralType ?? "");
  fd.append("description", rest.description ?? "");
  fd.append("coralStatus", rest.coralStatus ?? "");
  fd.append("location", JSON.stringify(rest.location ?? {}));
  fd.append("areaCoordinates", JSON.stringify(rest.areaCoordinates ?? []));
  if (keptPhotoUrls !== undefined) {
    fd.append("keptPhotoUrls", JSON.stringify(keptPhotoUrls ?? []));
  }
  for (const f of photoFiles.slice(0, 3)) {
    if (f instanceof File) fd.append("photos", f);
  }

  const { data } = await api.patch(`/coral-reefs/${id}`, fd, multipartConfig());
  return data;
}

export async function deleteCoralReef(id) {
  await api.delete(`/coral-reefs/${id}`);
}
