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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
