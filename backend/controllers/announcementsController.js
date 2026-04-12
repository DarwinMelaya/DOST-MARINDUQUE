/**
 * Split: binary images → Supabase Storage only. All other fields + image URLs/alts → MongoDB.
 */
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Announcement = require("../models/Announcement");
const { getSupabaseAdmin, getAnnouncementsBucket } = require("../config/supabase");

function extFromMime(mime) {
  const m = String(mime || "").toLowerCase();
  if (m === "image/jpeg" || m === "image/jpg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  if (m === "image/gif") return "gif";
  return "bin";
}

function serialize(doc) {
  const o =
    doc && typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  return {
    id: String(o._id),
    highlightLabel: o.highlightLabel ?? "Today's highlight",
    title: o.title,
    subtitle: o.subtitle ?? "",
    displayDate: o.displayDate ?? "",
    badge: o.badge ?? "",
    carouselCaption: o.carouselCaption ?? "",
    bodyParagraphs: Array.isArray(o.bodyParagraphs) ? o.bodyParagraphs : [],
    hashtags: Array.isArray(o.hashtags) ? o.hashtags : [],
    ctaLabel: o.ctaLabel ?? "",
    ctaUrl: o.ctaUrl ?? "",
    images: Array.isArray(o.images) ? o.images : [],
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

async function uploadImagesToSupabase(files) {
  const supabase = getSupabaseAdmin();
  const bucket = getAnnouncementsBucket();
  const uploaded = [];

  for (const file of files) {
    const ext = extFromMime(file.mimetype);
    const path = `posts/${Date.now()}-${uuidv4()}.${ext}`;
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
  const paths = [...new Set(urls.map((u) => storagePathFromPublicUrl(u, bucket)).filter(Boolean))];
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) {
    console.warn("Supabase storage remove:", error.message || error);
  }
}

async function getFeaturedAnnouncement(req, res) {
  try {
    const doc = await Announcement.findOne().sort({ createdAt: -1 }).lean();
    if (!doc) {
      return res.json({ announcement: null });
    }
    res.json({ announcement: serialize({ ...doc, _id: doc._id }) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load announcement." });
  }
}

function parseBodyParagraphs(bodyText) {
  const raw = String(bodyText ?? "");
  return raw
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function parseHashtags(hashtagsRaw) {
  return String(hashtagsRaw ?? "")
    .split(/[\n,]+/)
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);
}

function parseImageAlts(imageAltsRaw) {
  if (imageAltsRaw == null || imageAltsRaw === "") return [];
  try {
    const parsed = JSON.parse(String(imageAltsRaw));
    return Array.isArray(parsed) ? parsed.map((s) => String(s ?? "").trim()) : [];
  } catch {
    return [];
  }
}

async function createAnnouncement(req, res) {
  try {
    const fileList = req.files?.images;
    const files = Array.isArray(fileList) ? fileList : [];
    if (files.length === 0) {
      return res.status(400).json({
        message: "At least one image is required for the announcement gallery.",
      });
    }

    let urls;
    try {
      urls = await uploadImagesToSupabase(files);
    } catch (e) {
      console.error(e);
      const msg =
        e.message?.includes("Missing SUPABASE") || e.message?.includes("Supabase")
          ? e.message
          : "Image upload failed. Check Supabase bucket and credentials.";
      return res.status(503).json({ message: msg });
    }

    const {
      highlightLabel,
      title,
      subtitle,
      displayDate,
      badge,
      carouselCaption,
      bodyText,
      hashtags: hashtagsRaw,
      ctaLabel,
      ctaUrl,
      imageAlts: imageAltsRaw,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required." });
    }

    const bodyParagraphs = parseBodyParagraphs(bodyText);
    if (bodyParagraphs.length === 0) {
      return res.status(400).json({
        message: "Add announcement text (body). Use a blank line between paragraphs.",
      });
    }

    const hashtags = parseHashtags(hashtagsRaw);
    const alts = parseImageAlts(imageAltsRaw);
    const images = urls.map((url, i) => ({
      url,
      alt: alts[i] ?? "",
    }));

    const doc = await Announcement.create({
      highlightLabel: String(highlightLabel ?? "").trim() || "Today's highlight",
      title: title.trim(),
      subtitle: String(subtitle ?? "").trim(),
      displayDate: String(displayDate ?? "").trim(),
      badge: String(badge ?? "").trim(),
      carouselCaption: String(carouselCaption ?? "").trim(),
      bodyParagraphs,
      hashtags,
      ctaLabel: String(ctaLabel ?? "").trim(),
      ctaUrl: String(ctaUrl ?? "").trim(),
      images,
    });

    res.status(201).json(serialize(doc));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save announcement." });
  }
}

async function listAnnouncements(req, res) {
  try {
    const docs = await Announcement.find().sort({ createdAt: -1 }).lean();
    res.json(docs.map((d) => serialize({ ...d, _id: d._id })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load announcements." });
  }
}

async function deleteAnnouncement(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid announcement id." });
    }
    const doc = await Announcement.findById(id).lean();
    if (!doc) {
      return res.status(404).json({ message: "Announcement not found." });
    }
    const urls = (doc.images || []).map((i) => i.url).filter(Boolean);
    await removeSupabaseObjectsByUrls(urls);
    await Announcement.deleteOne({ _id: id });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not delete announcement." });
  }
}

async function updateAnnouncement(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid announcement id." });
    }

    const doc = await Announcement.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    let kept = [];
    try {
      kept = JSON.parse(String(req.body.keptImagesJson ?? "[]"));
    } catch {
      return res.status(400).json({ message: "Invalid keptImagesJson." });
    }
    if (!Array.isArray(kept)) {
      return res.status(400).json({ message: "keptImagesJson must be an array." });
    }

    const allowedUrls = new Set((doc.images || []).map((i) => i.url));
    for (const item of kept) {
      if (!item || typeof item.url !== "string" || !allowedUrls.has(item.url)) {
        return res.status(400).json({
          message: "Kept images must match existing announcement URLs.",
        });
      }
    }

    const fileList = req.files?.images;
    const newFiles = Array.isArray(fileList) ? fileList : [];

    let newUrls = [];
    if (newFiles.length > 0) {
      try {
        newUrls = await uploadImagesToSupabase(newFiles);
      } catch (e) {
        console.error(e);
        const msg =
          e.message?.includes("Missing SUPABASE") || e.message?.includes("Supabase")
            ? e.message
            : "Image upload failed. Check Supabase bucket and credentials.";
        return res.status(503).json({ message: msg });
      }
    }

    const newAlts = parseImageAlts(req.body.imageAlts);
    const newImages = newUrls.map((url, i) => ({
      url,
      alt: newAlts[i] ?? "",
    }));

    const keptNormalized = kept.map((k) => ({
      url: k.url,
      alt: String(k.alt ?? "").trim(),
    }));

    const finalImages = [...keptNormalized, ...newImages];
    if (finalImages.length === 0) {
      return res.status(400).json({
        message: "Keep at least one image or upload new images.",
      });
    }

    const {
      highlightLabel,
      title,
      subtitle,
      displayDate,
      badge,
      carouselCaption,
      bodyText,
      hashtags: hashtagsRaw,
      ctaLabel,
      ctaUrl,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required." });
    }

    const bodyParagraphs = parseBodyParagraphs(bodyText);
    if (bodyParagraphs.length === 0) {
      return res.status(400).json({
        message: "Add announcement text (body). Use a blank line between paragraphs.",
      });
    }

    const oldUrls = (doc.images || []).map((i) => i.url).filter(Boolean);
    const finalUrlSet = new Set(finalImages.map((i) => i.url));
    const urlsToRemove = oldUrls.filter((u) => !finalUrlSet.has(u));
    await removeSupabaseObjectsByUrls(urlsToRemove);

    doc.highlightLabel =
      String(highlightLabel ?? "").trim() || "Today's highlight";
    doc.title = title.trim();
    doc.subtitle = String(subtitle ?? "").trim();
    doc.displayDate = String(displayDate ?? "").trim();
    doc.badge = String(badge ?? "").trim();
    doc.carouselCaption = String(carouselCaption ?? "").trim();
    doc.bodyParagraphs = bodyParagraphs;
    doc.hashtags = parseHashtags(hashtagsRaw);
    doc.ctaLabel = String(ctaLabel ?? "").trim();
    doc.ctaUrl = String(ctaUrl ?? "").trim();
    doc.images = finalImages;

    await doc.save();
    res.json(serialize(doc));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update announcement." });
  }
}

module.exports = {
  getFeaturedAnnouncement,
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  serialize,
};
