// Libraries
import Promise from "bluebird";
import mongoose from 'mongoose';

// helpers
import * as helpers from "../utilities/helpers";

// service
import ExperienceStreamService from "../services/ExperienceStreamService";

// Model
import Experience from "../models/mongodb/Experience";
import ExperienceCard from "../models/mongodb/ExperienceCard";
import ExperiencePage from "../models/mongodb/ExperiencePage";

// constants
import constants from '../constants';

const connectDB = (dbName, dbPassword) => {
  const dbUserName = dbName;
  return mongoose.createConnection(`mongodb://${dbUserName}:${dbPassword}@localhost/${dbName}`);
}

export default {
  
  create: (dbName, dbPassword, experience) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const experienceSchema = connection.model('ExperienceSchema', Experience.ExperienceSchema);

      experienceSchema.create(experience, (error, experience) => {

        connection.close();

        if (error) {
          reject(error);
          return;
        }
        resolve(experience.summary());
        return;
      });
    });
  },

  update: (dbName, dbPassword, experienceGUID, experience) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const experienceSchema = connection.model('ExperienceSchema', Experience.ExperienceSchema);

      experience.UpdatedAt = helpers.currentDatetime();
      experienceSchema.findByIdAndUpdate(experienceGUID, experience, (error, experience) => {

        connection.close();

        if (error) {
          reject(error);
          return;
        }
        if (!experience) {
          reject("Experience not found");
          return;
        }
        resolve(experience.summary());
        return;
      }
      );
    });
  },

  find: (dbName, dbPassword, params, isRaw) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const experienceSchema = connection.model('ExperienceSchema', Experience.ExperienceSchema);

      experienceSchema.find(params, (error, experiences) => {

        connection.close();

        if (error) {
          reject(error);
          return;
        }
        if (isRaw) {
          resolve(experiences);
          return;
        }
        let summaries = [];
        experiences.forEach(experience => {
          summaries.push(experience.summary());
        });
        resolve(summaries);
        return;
      });
    });
  },

  findById: (dbName, dbPassword, experienceGUID, isRaw) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const experienceSchema = connection.model('ExperienceSchema', Experience.ExperienceSchema);

      experienceSchema.findById(experienceGUID, (error, experience) => {

        connection.close();

        if (error) {
          reject(error);
          return;
        }
        if (!experience) {
          reject("Experience not found");
          return;
        }
        if (isRaw) {
          resolve(experience);
          return;
        }
        resolve(experience.summary());
        return;
      });
    });
  },

  list: (dbName, dbPassword, limit, offset, extra, callback) => {

    const connection = connectDB(dbName, dbPassword);
    const experienceSchema = connection.model('ExperienceSchema', Experience.ExperienceSchema);
    connection.model('ExperienceCardSchema', ExperienceCard.ExperienceCardSchema);

    let { ExperienceType, FilterType, SearchType, SearchField } = extra;
    let experience;
    let searchParams = {};
    if (SearchType && SearchField) {
      if (["EXPERIENCE_TITLE"].indexOf(SearchType) != -1) {
        searchParams = { ExperienceTitle: new RegExp(SearchField, 'i') }
      }
    }
    if (["CARD_ONLY", "CARD_AND_PAGES"].indexOf(ExperienceType) != -1) {
      searchParams.ExperienceType = ExperienceType == 'CARD_ONLY' ? '0' : '1';
    }
    if (["ALL", "LIVE", "DRAFT"].indexOf(FilterType) != -1) {
      if (FilterType == 'LIVE') {
        searchParams.ExperienceStreams = { $exists: true, $ne: [] };
      } else if (FilterType == 'DRAFT') {
        searchParams.ExperienceStreams = { $exists: true, $eq: [] };
      } else { }
    }
    if (limit == "-1" && offset) {
      experience = experienceSchema
        .find(searchParams)
        .sort([["CreatedAt", -1]])
        .populate({ path: "ExperienceCard" })
    } else {
      experience = experienceSchema
        .find(searchParams)
        .sort([["CreatedAt", -1]])
        .skip(Number(offset))
        .limit(Number(limit))
        .populate({ path: "ExperienceCard" })
    }
    experience.exec((error, experiences) => {
      if (error) {
        callback(error, null);
        return;
      }
      experienceSchema.count(searchParams, (error, totalRecord) => {
        if (error) {
          callback(error, null);
          return;
        }
        let tasks = [];
        experiences.forEach(experience => {
          let tmpExperience = experience.summary();
          const tmpExperienceGUID = tmpExperience.ExperienceGUID;
          let task = new Promise((resolve, reject) => {
            ExperienceStreamService.experienceStreamList(dbName, dbPassword, { ExperienceGUID: tmpExperienceGUID })
              .then(experienceStreamList => {
                tmpExperience.ExperienceStreamList = experienceStreamList;
                tmpExperience.ExperienceCard = tmpExperience.ExperienceCard.summary();
                resolve(tmpExperience);
                return;
              })
              .catch(error => {
                reject(error);
                return;
              });
          });
          tasks.push(task);
        });

        Promise.all(tasks)
          .then(summaries => {
            connection.close();
            callback(null, {
              experiences: summaries,
              totalRecord
            });
            return;
          })
          .catch(error => {
            connection.close();
            callback(error, null);
            return;
          });
      });
    });
  },

  viewExperienceBriefDetail: (dbName, dbPassword, experienceGUID) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const experienceSchema = connection.model('ExperienceSchema', Experience.ExperienceSchema);
      connection.model('ExperienceCardSchema', ExperienceCard.ExperienceCardSchema);

      experienceSchema
        .findById({ _id: experienceGUID })
        .populate({ path: "ExperienceCard" })
        .exec((error, experience) => {

          connection.close();

          if (error) {
            reject(error);
            return;
          }
          if (!experience) {
            reject("Experience not found");
            return;
          }
          // experience
          let output = experience.briefSummary();
          // experience card
          output.ExperienceCard = output.ExperienceCard.summary();

          resolve(output);
          return;
        });
    });
  },

  viewExperienceDetail: (dbName, dbPassword, experienceGUID) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const experienceSchema = connection.model('ExperienceSchema', Experience.ExperienceSchema);
      connection.model('ExperienceCardSchema', ExperienceCard.ExperienceCardSchema);
      connection.model('ExperiencePageSchema', ExperiencePage.ExperiencePageSchema);

      experienceSchema
        .findById({ _id: experienceGUID })
        .populate({ path: "ExperienceCard" })
        .populate({ path: "ExperiencePages" })
        .exec((error, experience) => {

          connection.close();

          if (error) {
            reject(error);
            return;
          }
          if (!experience) {
            reject("Experience not found");
            return;
          }
          // experience
          let output = experience.summary();
          // experience card
          output.ExperienceCard = output.ExperienceCard.summary();
          // experience pages
          let experiencePages = [];
          output.ExperiencePages.forEach(experiencePage => {
            experiencePages.push(experiencePage.summary());
          });
          output.ExperiencePages = experiencePages;

          resolve(output);
          return;
        });
    });
  },

  delete: (dbName, dbPassword, experienceGUID, callback) => {

    const connection = connectDB(dbName, dbPassword);
    const experienceSchema = connection.model('ExperienceSchema', Experience.ExperienceSchema);
    const experienceCardSchema = connection.model('ExperienceCardSchema', ExperienceCard.ExperienceCardSchema);
    const experiencePageSchema = connection.model('ExperiencePageSchema', ExperiencePage.ExperiencePageSchema);

    experienceSchema
      .findById({ _id: experienceGUID })
      .exec((error, experience) => {
        if (error) {
          connection.close();
          callback(error, null);
          return;
        }
        if (!experience) {
          connection.close();
          callback("Experience not found", null);
          return;
        }
        experienceCardSchema
          .findByIdAndRemove(experience.ExperienceCard)
          .then(() => {
            let tasks = [];
            for (let i = 0; i < experience.ExperiencePages.length; i++) {
              let task = new Promise((resolve, reject) => {
                experiencePageSchema
                  .findByIdAndRemove(experience.ExperiencePages[i])
                  .then(() => {
                    resolve();
                    return;
                  })
                  .catch(error => {
                    reject(error);
                    return;
                  });
              });
              tasks.push(task);
            }
            Promise.all(tasks)
              .then(response => {
                experienceSchema
                  .findByIdAndRemove(experienceGUID)
                  .then(() => {
                    connection.close();
                    callback(null);
                    return;
                  })
                  .catch(error => {
                    connection.close();
                    callback(error, null);
                    return;
                  });
              })
              .catch(error => {
                connection.close();
                callback(error, null);
                return;
              });
          })
          .catch(error => {
            connection.close();
            callback(error, null);
            return;
          });
      });
  },

  pendingExperiencesByChannel: (dbName, dbPassword, limit, offset, extra, experiences) => {
    
    return new Promise((resolve, reject) => {

      const connection = connectDB(dbName, dbPassword);
      const experienceSchema = connection.model('ExperienceSchema', Experience.ExperienceSchema);

      let { SearchType, SearchField } = extra;
      let params = {
        _id: { $nin: experiences }
      };
      if (SearchType && SearchField) {
        if (SearchType == 'EXPERIENCE_NAME') {
          params.ExperienceTitle = { $regex: SearchField, $options: 'i' };
        }
      }

      let experience;
      if (limit == "-1") {
        experience = experienceSchema.find(params);
      } else {
        experience = experienceSchema
          .find(params)
          .skip(Number(offset))
          .limit(Number(limit));
      }

      experience
        .then(experiences => {
          experienceSchema
            .count(params, (error, totalRecord) => {
              if (error) {
                reject(error);
                return;
              }

              let tasks = [];
              experiences.forEach(experience => {
                let item = experience.summary();
                let task = new Promise((resolve, reject) => {
                  let tmpExperienceGUID = item.ExperienceGUID;
                  ExperienceStreamService.experienceStreamListByParams(dbName, dbPassword, false, '-1', '0', { ExperienceGUID: tmpExperienceGUID })
                    .then(experienceStreamList => {
                      item.ExperienceStreams = experienceStreamList;
                      resolve(item);
                      return;
                    })
                    .catch(error => {
                      reject(error);
                      return;
                    });
                });
                tasks.push(task);
              });
              Promise.all(tasks)
                .then(experiences => {
                  connection.close();
                  resolve({
                    experiences: experiences,
                    totalRecord
                  });
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
            });
        })
        .catch(error => {
          connection.close();
          reject(error);
          return;
        });
    });
  },

  getExperienceDownloadProperties: (experience) => {
    let {
      ExperienceType,
      ExperienceCard,
      ExperiencePages,
    } = experience;

    let ExperienceDownloadProperties = [];

    if (constants.EXPERIENCE_CARD[ExperienceCard.Type].indexOf('IMAGE') != -1) {
      let image = helpers.searchArrOfObjByValue('Type', 'IMAGE', ExperienceCard.Settings);
      image.Value = image.Default;
      delete image["Default"];
      ExperienceDownloadProperties.push(image);
    }

    if (ExperienceType == 1) {
      for (let i = 0; i < ExperiencePages.length; i++) {
        let experiencePage = ExperiencePages[i];
        for (let j = 0; j < experiencePage.Sections.length; j++) {
          let section = experiencePage.Sections[j];
          let item = {
            Type: '',
            Value: '',
            Suffix: '',
          };
          if (constants.EXPERIENCE_PAGE[section.Type].indexOf('Html') != -1) {
            item.Type = 'FILE';
            item.Value = section.Html;
            item.Suffix = 'html';
            ExperienceDownloadProperties.push(item);
          }
          else if (constants.EXPERIENCE_PAGE[section.Type].indexOf('Pdf') != -1) {
            item.Type = 'FILE';
            item.Value = section.Pdf;
            item.Suffix = 'pdf';
            ExperienceDownloadProperties.push(item);
          }
          else if (constants.EXPERIENCE_PAGE[section.Type].indexOf('SplashImg') != -1) {
            item.Type = 'IMAGE';
            item.Value = section.SplashImg;
            ExperienceDownloadProperties.push(item);
          }
          else if (constants.EXPERIENCE_PAGE[section.Type].indexOf('Img') != -1) {
            item.Type = 'IMAGE';
            item.Value = section.Img;
            ExperienceDownloadProperties.push(item);
          }
          else if (constants.EXPERIENCE_PAGE[section.Type].indexOf('AdBtnImg') != -1) {
            item.Type = 'IMAGE';
            item.Value = section.AdBtnImg;
            ExperienceDownloadProperties.push(item);
          }
        }
      }
    }
    experience.ExperienceDownloadProperties = ExperienceDownloadProperties;
    delete experience["ExperiencePages"];
    delete experience["ExperiencePageNumber"];
    return experience;
  }
  
};
