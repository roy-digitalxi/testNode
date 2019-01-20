// Libraries
import Promise from "bluebird";
import mongoose from 'mongoose';

// Model
import LanguageLabel from "../models/mongodb/LanguageLabel";

const connectDB = (dbName, dbPassword) => {
  const dbUserName = dbName;
  return mongoose.createConnection(`mongodb://${dbUserName}:${dbPassword}@localhost/${dbName}`);
}

export default {

  create: (dbName, dbPassword, languageLabels) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const languageLabelSchema = connection.model('LanguageLabelSchema', LanguageLabel.LanguageLabelSchema);

      let tasks = [];
      for (let i = 0; i < languageLabels.length; i++) {
        let task = new Promise((resolve, reject) => {
          let languageLabel = languageLabels[i];
          languageLabelSchema.create(
            languageLabel,
            (error, languageLabel) => {
              if (error) {
                reject(error);
                return;
              }
              resolve(languageLabel._id);
              return;
            }
          )
        })
        tasks.push(task);
      }
      Promise.all(tasks)
        .then((response) => {
          connection.close();
          resolve(response);
          return;
        })
        .catch((err) => {
          connection.close();
          reject(err);
          return;
        })
    })
  },

  update: (dbName, dbPassword, languageLabels) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const languageLabelSchema = connection.model('LanguageLabelSchema', LanguageLabel.LanguageLabelSchema);

      let tasks = [];
      for (let i = 0; i < languageLabels.length; i++) {
        let task = new Promise((resolve, reject) => {
          let languageLabel = languageLabels[i];
          const {
            LanguageLabelGUID
          } = languageLabel;
          if (!LanguageLabelGUID) {
            languageLabelSchema.create(
              languageLabel,
              (error, languageLabel) => {
                if (error) {
                  reject(error);
                  return;
                }
                resolve(languageLabel._id);
                return;
              }
            );
          } else {
            languageLabelSchema.findByIdAndUpdate(
              LanguageLabelGUID,
              languageLabel,
              (error, languageLabel) => {
                if (error) {
                  reject(error);
                  return;
                }
                if (!languageLabel) {
                  reject("Language label not found");
                  return;
                }
                resolve(languageLabel._id);
                return;
              }
            );
          }
        });
        tasks.push(task);
      }

      Promise.all(tasks)
        .then((response) => {
          connection.close();
          resolve(response);
          return;
        })
        .catch((err) => {
          connection.close();
          reject(err);
          return;
        })
    })
  },

  find: (dbName, dbPassword, params, isRaw) => {
  
    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const languageLabelSchema = connection.model('LanguageLabelSchema', LanguageLabel.LanguageLabelSchema);

      languageLabelSchema.find(params, (error, languageLabels) => {

        connection.close();

        if (error) {
          reject(error);
          return;
        }
        if (isRaw) {
          resolve(languageLabels);
          return;
        }
        let summaries = [];
        languageLabels.forEach(languageLabel => {
          summaries.push(languageLabel.summary());
        });
        resolve(summaries);
        return;
      })
    })
  },

  findById: (dbName, dbPassword, languageLabelGUID, isRaw) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const languageLabelSchema = connection.model('LanguageLabelSchema', LanguageLabel.LanguageLabelSchema);

      languageLabelSchema.findById(
        languageLabelGUID,
        (error, languageLabel) => {

          connection.close();

          if (error) {
            reject(error);
            return;
          }
          if (!languageLabel) {
            reject("Language label not found");
            return;
          }
          if (isRaw) {
            resolve(languageLabel);
            return;
          }
          resolve(languageLabel.summary());
          return;
        }
      )
    })
  }

};
