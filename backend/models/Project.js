const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    programType: {
      type: String,
      required: true,
      enum: ["GIA", "CEST", "SSCP", "SETUP"],
    },
    title: { type: String, required: true, trim: true },
    amountOfAssistance: { type: String, default: "", trim: true },
    beneficiary: { type: String, required: true, trim: true },
    contactPerson: { type: String, default: "", trim: true },
    briefDescription: { type: String, default: "", trim: true },
    projectStatus: {
      type: String,
      required: true,
      enum: ["Ongoing", "Graduated", "Terminated"],
    },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    /** Public image URLs (Supabase), optional gallery for landing / admin. */
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Project", projectSchema);
