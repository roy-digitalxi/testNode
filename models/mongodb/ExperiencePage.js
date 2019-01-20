import mongoose from "mongoose";

let ExperiencePageSchema = new mongoose.Schema({
  PageGUID: { type: String, trim: true, default: null },
  ParentPageGUID: { type: String, trim: true, default: null },
  IsRoot: { type: Boolean, default: false },
  IsSplash: { type: Boolean, default: false },
  Title: { type: String, trim: true, default: "" },
  Sections: { type: Array, default: [] },
  IsCompleted: { type: Boolean, default: false },
  Completion: { type: Number, default: 0 },
  IsConnected: { type: Boolean, default: false },
  CreatedAt: { type: Date, required: true, default: Date.now },
  UpdatedAt: { type: Date, default: Date.now }
});

ExperiencePageSchema.methods.summary = function() {
  let summary = {
    ExperiencePageGUID: this._id.toString(),
    PageGUID: this.PageGUID,
    ParentPageGUID: this.ParentPageGUID,
    IsRoot: this.IsRoot,
    IsSplash: this.IsSplash,
    Title: this.Title,
    Sections: this.Sections,
    IsCompleted: this.IsCompleted,
    IsConnected: this.IsConnected,
    CreatedAt: this.CreatedAt,
    UpdatedAt: this.UpdatedAt
  };
  return summary;
};
ExperiencePageSchema.methods.treeSummary = function() {
  let summary = {
    ExperiencePageGUID: this._id.toString(),
    PageGUID: this.PageGUID,
    ParentPageGUID: this.ParentPageGUID,
    IsRoot: this.IsRoot,
    IsSplash: this.IsSplash,
    Title: this.Title,
    Sections: this.Sections,
    IsCompleted: this.IsCompleted,
    Completion: this.Completion,
    IsConnected: this.IsConnected
  };
  return summary;
};

export default {
  ExperiencePageSchema
};
