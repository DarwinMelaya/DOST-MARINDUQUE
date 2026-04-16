const mongoose = require("mongoose");

const coralReefSchema = new mongoose.Schema(
  {
    coralName: { type: String, required: true, trim: true },
    coralType: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    coralStatus: {
      type: String,
      required: true,
      enum: ["Healthy", "Bleached Damaged", "Recovering", "Dead"],
    },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    photo: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CoralReef", coralReefSchema);
