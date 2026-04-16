const { v4: uuidv4 } = require("uuid");
const { getSupabaseAdmin, getAnnouncementsBucket } = require("../config/supabase");

function extFromMime(mime) {
  const m = String(mime || "").toLowerCase();
  if (m === "image/jpeg" || m === "image/jpg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  if (m === "image/gif") return "gif";
  return "bin";
}

/**
 * Upload multer image buffers to the public announcements bucket (shared storage).
 * @param {import("multer").File[]} files
 * @param {string} subfolder - e.g. "posts", "projects"
 */
async function uploadImageFilesToSupabase(files, subfolder) {
  const list = Array.isArray(files) ? files : [];
  if (list.length === 0) return [];

  const supabase = getSupabaseAdmin();
  const bucket = getAnnouncementsBucket();
  const uploaded = [];

  for (const file of list) {
    const ext = extFromMime(file.mimetype);
    const path = `${subfolder}/${Date.now()}-${uuidv4()}.${ext}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      const msg = error.message || String(error);
      throw new Error(`Supabase upload failed: ${msg}`);
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path);
    uploaded.push(pub.publicUrl);
  }

  return uploaded;
}

function storagePathFromPublicUrl(publicUrl, bucket) {
  const u = String(publicUrl || "");
  const needle = `/object/public/${bucket}/`;
  const i = u.indexOf(needle);
  if (i === -1) return null;
  try {
    return decodeURIComponent(u.slice(i + needle.length).split("?")[0]);
  } catch {
    return null;
  }
}

async function removeSupabaseObjectsByUrls(urls) {
  if (!urls?.length) return;
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    return;
  }
  const bucket = getAnnouncementsBucket();
  const paths = [
    ...new Set(urls.map((u) => storagePathFromPublicUrl(u, bucket)).filter(Boolean)),
  ];
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) {
    console.warn("Supabase storage remove:", error.message || error);
  }
}

module.exports = {
  uploadImageFilesToSupabase,
  extFromMime,
  storagePathFromPublicUrl,
  removeSupabaseObjectsByUrls,
};
