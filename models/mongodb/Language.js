import mongoose from "mongoose";

let LanguageSchema = new mongoose.Schema({
  Language: { type: String, trim: true, default: "" },
  LanguageCode: { type: String, trim: true, default: "" },
  LoginScreen: [
    { type: mongoose.Schema.Types.ObjectId, ref: "LanguageLabelSchema" }
  ],
  HomeScreen: [
    { type: mongoose.Schema.Types.ObjectId, ref: "LanguageLabelSchema" }
  ],
  ExploreScreen: [
    { type: mongoose.Schema.Types.ObjectId, ref: "LanguageLabelSchema" }
  ],
  FeedScreen: [
    { type: mongoose.Schema.Types.ObjectId, ref: "LanguageLabelSchema" }
  ],
  BookmarkScreen: [
    { type: mongoose.Schema.Types.ObjectId, ref: "LanguageLabelSchema" }
  ],
  DownloadScreen: [
    { type: mongoose.Schema.Types.ObjectId, ref: "LanguageLabelSchema" }
  ],
  SectionScreen: [
    { type: mongoose.Schema.Types.ObjectId, ref: "LanguageLabelSchema" }
  ],
  FeedbackScreen: [
    { type: mongoose.Schema.Types.ObjectId, ref: "LanguageLabelSchema" }
  ],
  LanguageScreen: [
    { type: mongoose.Schema.Types.ObjectId, ref: "LanguageLabelSchema" }
  ],
  Loader: [
    { type: mongoose.Schema.Types.ObjectId, ref: "LanguageLabelSchema" }
  ],
  DxCard: [
    { type: mongoose.Schema.Types.ObjectId, ref: "LanguageLabelSchema" }
  ],
  DxModal: [
    { type: mongoose.Schema.Types.ObjectId, ref: "LanguageLabelSchema" }
  ],
  SideBar: [
    { type: mongoose.Schema.Types.ObjectId, ref: "LanguageLabelSchema" }
  ],
  Message: [
    { type: mongoose.Schema.Types.ObjectId, ref: "LanguageLabelSchema" }
  ],
  FirstInstall: [
    { type: mongoose.Schema.Types.ObjectId, ref: "LanguageLabelSchema" }
  ],
  IsActive: { type: Boolean, default: true },
  IsDefault: { type: Boolean, default: false },
  CreatedBy: { type: String, trim: true, default: "" },
  UpdatedBy: { type: String, trim: true, default: "" },
  CreatedAt: { type: Date, required: true, default: Date.now },
  UpdatedAt: { type: Date, default: Date.now }
});

LanguageSchema.methods.summary = function () {
  let summary = {
    LanguageGUID: this._id.toString(),
    Language: this.Language,
    LanguageCode: this.LanguageCode,
    LoginScreen: this.LoginScreen,
    HomeScreen: this.HomeScreen,
    ExploreScreen: this.ExploreScreen,
    FeedScreen: this.FeedScreen,
    BookmarkScreen: this.BookmarkScreen,
    DownloadScreen: this.DownloadScreen,
    SectionScreen: this.SectionScreen,
    FeedbackScreen: this.FeedbackScreen,
    LanguageScreen: this.LanguageScreen,
    Loader: this.Loader,
    DxCard: this.DxCard,
    DxModal: this.DxModal,
    SideBar: this.SideBar,
    Message: this.Message,
    FirstInstall: this.FirstInstall,
    IsActive: this.IsActive,
    IsDefault: this.IsDefault,
    CreatedBy: this.CreatedBy,
    UpdatedBy: this.UpdatedBy,
    CreatedAt: this.CreatedAt,
    UpdatedAt: this.UpdatedAt
  };
  return summary;
};

LanguageSchema.methods.briefSummary = function () {
  let summary = {
    LanguageGUID: this._id.toString(),
    Language: this.Language,
    LanguageCode: this.LanguageCode,
    IsActive: this.IsActive,
    IsDefault: this.IsDefault,
    CreatedBy: this.CreatedBy,
    UpdatedBy: this.UpdatedBy,
    CreatedAt: this.CreatedAt,
    UpdatedAt: this.UpdatedAt
  };
  return summary;
};

LanguageSchema.methods.shortSummary = function () {
  let summary = {
    LanguageGUID: this._id.toString(),
    Language: this.Language,
    LanguageCode: this.LanguageCode,
    IsDefault: this.IsDefault,
    FirstInstall: this.FirstInstall,
  };
  return summary;
};

export default {
  LanguageSchema
};
