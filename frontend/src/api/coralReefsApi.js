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
  const { photoFile, ...rest } = payload;
  if (!(photoFile instanceof File)) {
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
  fd.append("photo", photoFile);

  const { data } = await api.post("/coral-reefs", fd, multipartConfig());
  return data;
}

export async function deleteCoralReef(id) {
  await api.delete(`/coral-reefs/${id}`);
}
