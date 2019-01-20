import mongoose from "mongoose";

let LanguageLabelSchema = new mongoose.Schema({
  Type: { type: String, trim: true, default: "" },
  Content: { type: String, trim: true, default: "" },
});

LanguageLabelSchema.methods.summary = function () {
  let summary = {
    LanguageLabelGUID: this._id.toString(),
    Type: this.Type,
    Content: this.Content,
  };
  return summary;
};

export default {
  LanguageLabelSchema
};
