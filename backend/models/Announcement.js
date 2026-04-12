const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const announcementSchema = new mongoose.Schema(
  {
    highlightLabel: { type: String, default: "Today's highlight", trim: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "", trim: true },
    displayDate: { type: String, default: "", trim: true },
    badge: { type: String, default: "", trim: true },
    carouselCaption: { type: String, default: "", trim: true },
    bodyParagraphs: { type: [String], default: [] },
    hashtags: { type: [String], default: [] },
    ctaLabel: { type: String, default: "", trim: true },
    ctaUrl: { type: String, default: "", trim: true },
    images: { type: [imageSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
