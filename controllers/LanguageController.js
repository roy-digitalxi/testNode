// Libraries
import Promise from "bluebird";
import mongoose from 'mongoose';

// helpers
import * as helpers from "../utilities/helpers";

// Model
import Language from "../models/mongodb/Language";
import LanguageLabel from "../models/mongodb/LanguageLabel";

const connectDB = (dbName, dbPassword) => {
  const dbUserName = dbName;
  return mongoose.createConnection(`mongodb://${dbUserName}:${dbPassword}@localhost/${dbName}`);
}

export default {

  create: (dbName, dbPassword, language) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const languageSchema = connection.model('LanguageSchema', Language.LanguageSchema);

      languageSchema.create(language, (error, language) => {

        connection.close();

        if (error) {
          reject(error);
          return;
        }
        resolve(language.summary());
        return;
      })
    })
  },

  update: (dbName, dbPassword, languageGUID, language) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const languageSchema = connection.model('LanguageSchema', Language.LanguageSchema);

      language.UpdatedAt = helpers.currentDatetime();
      languageSchema.findByIdAndUpdate(
        languageGUID,
        language,
        (error, language) => {

          connection.close();

          if (error) {
            reject(error);
            return;
          }
          if (!language) {
            reject("Language not found");
            return;
          }
          resolve(language.summary());
          return;
        }
      )
    })
  },

  find: (dbName, dbPassword, params, isRaw) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const languageSchema = connection.model('LanguageSchema', Language.LanguageSchema);

      languageSchema.find(params, (error, languages) => {

        connection.close();

        if (error) {
          reject(error);
          return;
        }
        if (isRaw) {
          resolve(languages);
          return;
        }
        let summaries = [];
        languages.forEach(language => {
          summaries.push(language.summary());
        });
        resolve(summaries);
        return;
      });
    });
  },

  findById: (dbName, dbPassword, languageGUID, isRaw) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const languageSchema = connection.model('LanguageSchema', Language.LanguageSchema);

      languageSchema.findById(languageGUID, (error, language) => {

        connection.close();

        if (error) {
          reject(error);
          return;
        }
        if (!language) {
          reject("Language not found");
          return;
        }
        if (isRaw) {
          resolve(language);
          return;
        }
        resolve(language.summary());
        return;
      });
    });
  },

  viewLanguageDetail: (dbName, dbPassword, languageGUID) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const languageSchema = connection.model('LanguageSchema', Language.LanguageSchema);
      connection.model('LanguageLabelSchema', LanguageLabel.LanguageLabelSchema);

      languageSchema
        .findById({ _id: languageGUID })
        .populate({ path: "LoginScreen" })
        .populate({ path: "HomeScreen" })
        .populate({ path: "ExploreScreen" })
        .populate({ path: "FeedScreen" })
        .populate({ path: "BookmarkScreen" })
        .populate({ path: "DownloadScreen" })
        .populate({ path: "SectionScreen" })
        .populate({ path: "FeedbackScreen" })
        .populate({ path: "LanguageScreen" })
        .populate({ path: "Loader" })
        .populate({ path: "DxCard" })
        .populate({ path: "DxModal" })
        .populate({ path: "SideBar" })
        .populate({ path: "Message" })
        .populate({ path: "FirstInstall" })
        .exec((error, language) => {

          connection.close();

          if (error) {
            reject(error);
            return;
          }
          if (!language) {
            reject("Language not found");
            return;
          }
          // language
          let output = language.summary();
          let LoginScreen = [], HomeScreen = [], ExploreScreen = [], FeedScreen = [], BookmarkScreen = [], DownloadScreen = [], SectionScreen = [], FeedbackScreen = [], LanguageScreen = [], Loader = [], DxCard = [], DxModal = [], SideBar = [], Message = [], FirstInstall = [];
          output.LoginScreen.forEach(label => {
            LoginScreen.push(label.summary());
          });
          output.HomeScreen.forEach(label => {
            HomeScreen.push(label.summary());
          });
          output.ExploreScreen.forEach(label => {
            ExploreScreen.push(label.summary());
          });
          output.FeedScreen.forEach(label => {
            FeedScreen.push(label.summary());
          });
          output.BookmarkScreen.forEach(label => {
            BookmarkScreen.push(label.summary());
          });
          output.DownloadScreen.forEach(label => {
            DownloadScreen.push(label.summary());
          });
          output.SectionScreen.forEach(label => {
            SectionScreen.push(label.summary());
          });
          output.FeedbackScreen.forEach(label => {
            FeedbackScreen.push(label.summary());
          });
          output.LanguageScreen.forEach(label => {
            LanguageScreen.push(label.summary());
          });
          output.Loader.forEach(label => {
            Loader.push(label.summary());
          });
          output.DxCard.forEach(label => {
            DxCard.push(label.summary());
          });
          output.DxModal.forEach(label => {
            DxModal.push(label.summary());
          });
          output.SideBar.forEach(label => {
            SideBar.push(label.summary());
          });
          output.Message.forEach(label => {
            Message.push(label.summary());
          });
          output.FirstInstall.forEach(label => {
            FirstInstall.push(label.summary());
          });

          output.LoginScreen = LoginScreen;
          output.HomeScreen = HomeScreen;
          output.ExploreScreen = ExploreScreen;
          output.FeedScreen = FeedScreen;
          output.BookmarkScreen = BookmarkScreen;
          output.DownloadScreen = DownloadScreen;
          output.SectionScreen = SectionScreen;
          output.FeedbackScreen = FeedbackScreen;
          output.LanguageScreen = LanguageScreen;
          output.Loader = Loader;
          output.DxCard = DxCard;
          output.DxModal = DxModal;
          output.SideBar = SideBar;
          output.Message = Message;
          output.FirstInstall = FirstInstall;

          resolve(output);
          return;
        });
    });
  },

  list: (dbName, dbPassword, limit, offset, extra) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const languageSchema = connection.model('LanguageSchema', Language.LanguageSchema);

      languageSchema.find({})
        .then((languages) => {

          connection.close();

          let summaries = [];
          languages.forEach(language => {
            summaries.push(language.briefSummary());
          });
          resolve(summaries);
          return;
        })
        .catch((error) => {
          connection.close();
          reject(error);
          return;
        })
    });
  },

  availableList: (dbName, dbPassword) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const languageSchema = connection.model('LanguageSchema', Language.LanguageSchema);
      connection.model('LanguageLabelSchema', LanguageLabel.LanguageLabelSchema);

      languageSchema
        .find({ IsActive: true })
        .populate({ path: "FirstInstall" })
        .then((languages) => {

          connection.close();

          let summaries = [];
          languages.forEach(language => {

            let output = language.shortSummary();
            let FirstInstall = [];
            output.FirstInstall.forEach(label => {
              FirstInstall.push(label.summary());
            });

            output.FirstInstall = FirstInstall;

            summaries.push(output);
          });
          resolve(summaries);
          return;
        })
        .catch((error) => {
          connection.close();
          reject(error);
          return;
        })
    });
  },

  defaultLanguage: (dbName, dbPassword) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const languageSchema = connection.model('LanguageSchema', Language.LanguageSchema);
      connection.model('LanguageLabelSchema', LanguageLabel.LanguageLabelSchema);

      languageSchema.find({ IsDefault: true })
        .then((languages) => {

          if (!languages.length) {
            connection.close();
            resolve({});
            return;
          }

          const defaultLanguage = languages[0];
          languageSchema
            .findById({ _id: defaultLanguage._id })
            .populate({ path: "FirstInstall" })
            .exec((error, language) => {

              connection.close();

              if (error) {
                reject(error);
                return;
              }
              if (!language) {
                reject("Language not found");
                return;
              }
              // language
              let output = language.shortSummary();
              let FirstInstall = [];
              output.FirstInstall.forEach(label => {
                FirstInstall.push(label.summary());
              });

              output.FirstInstall = FirstInstall;
              resolve(output);
              return;
            })
        })
        .catch((error) => {
          connection.close();
          reject(error);
          return;
        })
    });
  },

  updateDefaultLanguage: (dbName, dbPassword, languageGUID, userID) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const languageSchema = connection.model('LanguageSchema', Language.LanguageSchema);

      languageSchema.find({})
        .then((languages) => {
          let tasks = [];
          for (let i = 0; i < languages.length; i++) {
            let language = languages[i];
            if (language._id == languageGUID) {
              language.IsDefault = true;
              language.IsActive = true;
            } else {
              language.IsDefault = false;
            }
            let task = new Promise((resolve, reject) => {

              language.UpdatedBy = userID;
              language.UpdatedAt = helpers.currentDatetime();
              languageSchema.findByIdAndUpdate(
                language._id,
                language,
                (error, language) => {
                  if (error) {
                    reject(error);
                    return;
                  }
                  if (!language) {
                    reject("Language not found");
                    return;
                  }
                  resolve(language);
                  return;
                }
              );
            });
            tasks.push(task);
          }
          Promise.all(tasks)
            .then(response => {
              connection.close();
              resolve(response);
              return;
            })
            .catch(error => {
              connection.close();
              reject(error);
              return;
            });
        })
        .catch(error => {
          connection.close();
          reject(error);
          return;
        })
    });
  },

};
