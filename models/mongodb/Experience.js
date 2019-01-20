import mongoose from "mongoose";

let ExperienceSchema = new mongoose.Schema({
  ExperienceType: {
    type: String,
    required: true,
    enum: ["0", "1"],
    required: true
  },
  ExperienceTitle: { type: String, trim: true, default: "" },
  ExperienceCard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ExperienceCardSchema"
  },
  ExperiencePages: [
    { type: mongoose.Schema.Types.ObjectId, ref: "ExperiencePageSchema" }
  ],
  ExperienceStreams: [
    { type: String, trim: true }
  ],
  CreatedBy: { type: String, trim: true, default: "" },
  UpdatedBy: { type: String, trim: true, default: "" },
  CreatedAt: { type: Date, required: true, default: Date.now },
  UpdatedAt: { type: Date, default: Date.now }
});

ExperienceSchema.methods.summary = function () {
  let summary = {
    ExperienceGUID: this._id.toString(),
    ExperienceType: this.ExperienceType,
    ExperienceTitle: this.ExperienceTitle,
    ExperienceCard: this.ExperienceCard,
    ExperiencePages: this.ExperiencePages,
    ExperiencePageNumber: this.ExperiencePages.length,
    ExperienceStreams: this.ExperienceStreams,
    CreatedBy: this.CreatedBy,
    UpdatedBy: this.UpdatedBy,
    CreatedAt: this.CreatedAt,
    UpdatedAt: this.UpdatedAt
  };
  return summary;
};

ExperienceSchema.methods.briefSummary = function () {
  let summary = {
    ExperienceGUID: this._id.toString(),
    ExperienceType: this.ExperienceType,
    ExperienceTitle: this.ExperienceTitle,
    ExperienceCard: this.ExperienceCard,
    CreatedBy: this.CreatedBy,
    UpdatedBy: this.UpdatedBy,
    CreatedAt: this.CreatedAt,
    UpdatedAt: this.UpdatedAt
  };
  return summary;
};

export default {
  ExperienceSchema
};
