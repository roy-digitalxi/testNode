import mongoose from "mongoose";

// constants
import constants from '../../constants'

let ExperienceCardSchema = new mongoose.Schema({
  Type: {
    type: String,
    required: true,
    enum: constants.EXPERIENCE_CARDS,
    required: true
  },
  Title: { type: String, trim: true, default: "" },
  Content: { type: String, trim: true, default: "" },
  Settings: { type: Array, default: [] },
  CreatedAt: { type: Date, required: true, default: Date.now },
  UpdatedAt: { type: Date, default: Date.now }
});

ExperienceCardSchema.methods.summary = function() {
  let summary = {
    ExperienceCardGUID: this._id.toString(),
    Type: this.Type,
    Title: this.Title,
    Content: this.Content,
    Settings: this.Settings,
    CreatedAt: this.CreatedAt,
    UpdatedAt: this.UpdatedAt
  };
  return summary;
};

export default {
  ExperienceCardSchema
};
