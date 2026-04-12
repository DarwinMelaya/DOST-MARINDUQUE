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
 * Latest announcement for the public landing page (carousel + article).
 */
export async function fetchFeaturedAnnouncement() {
  const { data } = await api.get("/announcements/featured");
  return data?.announcement ?? null;
}

/**
 * All announcements (admin), newest first.
 */
export async function fetchAnnouncements() {
  const { data } = await api.get("/announcements");
  return Array.isArray(data) ? data : [];
}

/**
 * Create announcement (admin). Sends multipart/form-data with `images` files.
 */
export async function createAnnouncement(formData) {
  const { data } = await api.post("/announcements", formData, multipartConfig());
  return data;
}

/**
 * Update announcement (admin). Include `keptImagesJson` + optional new `images` files.
 */
export async function updateAnnouncement(id, formData) {
  const { data } = await api.patch(`/announcements/${id}`, formData, multipartConfig());
  return data;
}

export async function deleteAnnouncement(id) {
  await api.delete(`/announcements/${id}`);
}
