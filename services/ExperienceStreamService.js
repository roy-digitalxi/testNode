// Libraries
import Promise from "bluebird";
import Sequelize from "sequelize";
import path from "path";

// helpers
import * as helpers from "../utilities/helpers";

// constants
import constants from '../constants';

// controller
import controllers from "../controllers";

const connectDB = (dbName, dbPassword) => {
  const sequelize = new Sequelize(dbName, dbName, dbPassword, {
    dialect: "mysql",
    dialectOptions: {
      multipleStatements: true
    },
    logging: false,
    define: {
      timestamps: false
    }
  });
  return sequelize;
}

const getExperienceStreamByID = (dbName, dbPassword, id) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ExperienceStream = sequelize.import(path.join(__dirname, "../models/mysql/ExperienceStream.js"));

  return new Promise((resolve, reject) => {
    ExperienceStream.findById(id)
      .then((experienceStream) => {
        sequelize.close();
        resolve(experienceStream);
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  })
};

const getExperienceStreamByGUID = (dbName, dbPassword, guid) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ExperienceStream = sequelize.import(path.join(__dirname, "../models/mysql/ExperienceStream.js"));

  return new Promise((resolve, reject) => {
    ExperienceStream.findOne({ where: { ExperienceStreamGUID: guid } })
      .then((experienceStream) => {
        sequelize.close();
        resolve(experienceStream);
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  })
};

const createExperienceStream = (dbName, dbPassword, params) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ExperienceStream = sequelize.import(path.join(__dirname, "../models/mysql/ExperienceStream.js"));

  params.ExperienceStreamGUID = helpers.guid();
  params.CreatedAt = helpers.currentDatetime();

  return new Promise((resolve, reject) => {
    ExperienceStream.create(params)
      .then((experienceStream) => {
        sequelize.close();
        resolve(experienceStream);
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  })
};

const updateExperienceStream = (dbName, dbPassword, id, params) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ExperienceStream = sequelize.import(path.join(__dirname, "../models/mysql/ExperienceStream.js"));

  params.UpdatedAt = helpers.currentDatetime();

  return new Promise((resolve, reject) => {
    ExperienceStream.update(params, { where: { ExperienceStreamID: id } })
      .then((experienceStream) => {
        sequelize.close();
        resolve(experienceStream);
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  })
};

const updateExperienceStreamsByExperienceGUID = (dbName, dbPassword, experienceGUID, params) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ExperienceStream = sequelize.import(path.join(__dirname, "../models/mysql/ExperienceStream.js"));

  params.UpdatedAt = helpers.currentDatetime();

  return new Promise((resolve, reject) => {
    ExperienceStream.update(params, { where: { ExperienceGUID: experienceGUID } })
      .then((experienceStream) => {
        sequelize.close();
        resolve(experienceStream);
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  })
};

const experienceStreamList = (dbName, dbPassword, params) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ExperienceStream = sequelize.import(path.join(__dirname, "../models/mysql/ExperienceStream.js"));

  return new Promise((resolve, reject) => {
    ExperienceStream.findAll({ where: params })
      .then((experienceStreams) => {
        sequelize.close();
        resolve(experienceStreams);
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  })
};

const experienceStreamListByParams = (dbName, dbPassword, onlyRow, limit, offset, extra) => {
  
  const sequelize = connectDB(dbName, dbPassword);
  let sql;
  let {
    FilterType,
    FilterField,
    SearchType,
    SearchField,
    ExperienceGUID,
    ExperienceChannelGUID,
    ChannelLanguageGUID,
  } = extra;

  if (onlyRow) {
    sql = "SELECT ES.ExperienceStreamGUID";
  } else {
    sql = "SELECT ES.ExperienceStreamGUID, ES.ExperienceGUID, IFNULL(ES.ExperienceTitle, '') AS ExperienceTitle, ES.ExperienceClicks,"
      + " ES.CreatedAt, IFNULL(ES.UpdatedAt, '') AS UpdatedAt,";
    sql += " EC.ExperienceChannelGUID, EC.ChannelName, EC.ChannelColor";
  }
  sql += " FROM ExperienceStreams AS ES";
  sql += " LEFT JOIN ExperienceChannels AS EC ON EC.ExperienceChannelID = ES.ExperienceChannelID";
  sql += " WHERE 1 = 1";
  if (ExperienceGUID && ExperienceChannelGUID) {
    sql += ` AND ES.ExperienceGUID = "${ExperienceGUID}" AND EC.ExperienceChannelGUID = "${ExperienceChannelGUID}"`;
  } else if (ExperienceGUID) {
    sql += ` AND ES.ExperienceGUID = "${ExperienceGUID}"`;
  } else if (ExperienceChannelGUID) {
    sql += ` AND EC.ExperienceChannelGUID = "${ExperienceChannelGUID}"`;
  }
  if (FilterType && FilterField) {
    if (FilterType == 'CHANNEL_TYPE') {
      if (FilterField == 'GENERAL') {
        sql += ` AND EC.ChannelType = "3"`;
        if (ChannelLanguageGUID) {
          sql += ` AND EC.ChannelLanguageGUID = "${ChannelLanguageGUID}"`;
        }
      }
    }
  }
  if (SearchType && SearchField) {
    if (SearchType == 'EXPERIENCE_NAME') {
      sql += ` AND ES.ExperienceTitle LIKE "%${SearchField}%"`;
    }
  }
  sql += " ORDER BY ES.CreatedAt DESC";

  if (onlyRow) {
    return new Promise((resolve, reject) => {
      sequelize.query(sql, { type: sequelize.QueryTypes.SELECT })
        .then(streams => {
          sequelize.close();
          resolve(streams.length);
          return;
        })
        .catch(err => {
          sequelize.close();
          reject(err);
          return;
        })
    });
  } else {
    if (limit !== "-1") {
      sql += ` LIMIT ${limit}`;
      sql += ` OFFSET ${offset}`;
    }
    return new Promise((resolve, reject) => {
      sequelize.query(sql, { type: sequelize.QueryTypes.SELECT })
        .then(streams => {
          sequelize.close();
          resolve(streams);
          return;
        })
        .catch(err => {
          sequelize.close();
          reject(err);
          return;
        })
    })
  }
};

const subscribedExperienceStreamListByParams = (dbName, dbPassword, onlyRow, limit, offset, extra) => {
  
  const sequelize = connectDB(dbName, dbPassword);
  let sql;
  let { SearchType, SearchField, FilterType, FilterField, SortType, UserGUID, ChannelLanguageGUID } = extra;

  if (onlyRow) {
    sql = "SELECT ES.ExperienceStreamGUID";
  } else {
    sql = "SELECT ES.ExperienceStreamGUID, ES.ExperienceGUID, IFNULL(ES.ExperienceTitle, '') AS ExperienceTitle, ES.ExperienceClicks,"
      + " ES.CreatedAt, IFNULL(ES.UpdatedAt, '') AS UpdatedAt,";
    sql += " EC.ChannelName, EC.ChannelColor, EC.ExperienceChannelGUID,";
    sql += " CS.IsHardInterest";
  }
  sql += " FROM ExperienceStreams AS ES";
  sql += " LEFT JOIN ChannelSubscribes AS CS ON CS.ExperienceChannelID = ES.ExperienceChannelID";
  sql += " LEFT JOIN ExperienceChannels AS EC ON EC.ExperienceChannelID = ES.ExperienceChannelID";
  sql += ` WHERE CS.UserGUID = "${UserGUID}"`;
  if (ChannelLanguageGUID) {
    sql += ` AND EC.ChannelLanguageGUID = "${ChannelLanguageGUID}"`;
  }

  if (FilterType && FilterField) {
    if (["TIME_RANGE"].indexOf(FilterType) != -1
      && ["LAST_10_DAYS"].indexOf(FilterField) != -1) {
      let from = helpers.formattedOldDatetimeByDays(10);
      let to = helpers.formattedCurrentDatetime();
      sql += ` AND ES.CreatedAt BETWEEN "${from} 00:00:00" AND "${to} 23:59:59"`;
    }
  }
  if (SearchType && SearchField) {
    if (SearchType == 'CHANNEL_NAME') {
      sql += ` AND EC.ChannelName LIKE "%${SearchField}%"`;
    }
  }
  if (SortType == 'NEW_RELEASE') {
    sql += " ORDER BY ES.CreatedAt DESC";
  } else if (SortType == 'POPULAR') {
    sql += " ORDER BY ES.ExperienceClicks DESC, ES.CreatedAt DESC";
  }

  if (onlyRow) {
    return new Promise((resolve, reject) => {
      sequelize
        .query(sql, {
          type: sequelize.QueryTypes.SELECT
        })
        .then(streams => {
          sequelize.close();
          resolve(streams.length);
          return;
        })
        .catch(err => {
          sequelize.close();
          reject(err);
          return;
        })
    });
  } else {
    if (limit !== "-1") {
      sql += ` LIMIT ${limit}`;
      sql += ` OFFSET ${offset}`;
    }
    return new Promise((resolve, reject) => {
      sequelize
        .query(sql, { type: sequelize.QueryTypes.SELECT })
        .then(streams => {
          let tasks = [];
          for (let i = 0; i < streams.length; i++) {
            let stream = streams[i];
            let task = new Promise((resolve, reject) => {
              let tmpExperienceGUID = stream.ExperienceGUID;
              controllers.experience
                .viewExperienceDetail(dbName, dbPassword, tmpExperienceGUID)
                .then(experience => {
                  // format download properties
                  // experience = __format_experience_download_properties(experience);
                  stream.Experience = experience;
                  delete stream["ExperienceGUID"];
                  delete stream["ExperienceTitle"];
                  resolve(stream);
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
            .then(streams => {
              sequelize.close();
              resolve(streams);
              return;
            })
            .catch(error => {
              sequelize.close();
              reject(error);
              return;
            });
        })
        .catch(error => {
          sequelize.close();
          reject(error);
          return;
        });
    });
  }
};

const formatExperienceStreamList = (dbName, dbPassword, experienceStreams) => {

  return new Promise((resolve, reject) => {
    let tasks = [];
    for (let i = 0; i < experienceStreams.length; i++) {
      let stream = experienceStreams[i];
      let task = new Promise((resolve, reject) => {

        let tmpExperienceGUID = stream.ExperienceGUID;
        controllers.experience
          .viewExperienceDetail(dbName, dbPassword, tmpExperienceGUID)
          .then(experience => {
            // format download properties
            // experience = __format_experience_download_properties(experience);
            stream.Experience = experience;
            delete stream["ExperienceGUID"];
            delete stream["ExperienceTitle"];
            resolve(stream);
            return;
          })
          .catch(error => {
            reject(error);
            return;
          });
      })
      tasks.push(task);
    }
    Promise.all(tasks)
      .then((formattedExperienceStreams) => {
        resolve(formattedExperienceStreams);
        return;
      })
      .catch(error => {
        reject(error);
        return;
      })
  })
}

const deleteExperienceStream = (dbName, dbPassword, id) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ExperienceStream = sequelize.import(path.join(__dirname, "../models/mysql/ExperienceStream.js"));

  return new Promise((resolve, reject) => {
    ExperienceStream.destroy({ where: { ExperienceStreamID: id } })
      .then(() => {
        sequelize.close();
        resolve();
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  });
};

const deleteExperienceStreamByParams = (dbName, dbPassword, params) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ExperienceStream = sequelize.import(path.join(__dirname, "../models/mysql/ExperienceStream.js"));

  return new Promise((resolve, reject) => {
    ExperienceStream.destroy({ where: params })
      .then(() => {
        sequelize.close();
        resolve();
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  });
};

const pendingExperienceStreamListByExperienceGUID = (dbName, dbPassword, experienceGUID, experienceChannelID) => {
  
  const sequelize = connectDB(dbName, dbPassword);
  
  let sql = "SELECT ES.ExperienceStreamGUID, ES.ExperienceGUID, IFNULL(ES.ExperienceTitle, '') AS ExperienceTitle, ES.ExperienceClicks,"
    + " ES.CreatedAt, IFNULL(ES.UpdatedAt, '') AS UpdatedAt,";
  sql += " EC.ExperienceChannelGUID, EC.ChannelName, EC.ChannelColor"
  sql += " FROM ExperienceStreams AS ES";
  sql += " LEFT JOIN ExperienceChannels AS EC ON EC.ExperienceChannelID = ES.ExperienceChannelID";
  sql += ` WHERE ES.ExperienceGUID = "${experienceGUID}" AND ES.ExperienceChannelID != "${experienceChannelID}"`;

  return new Promise((resolve, reject) => {
    sequelize.query(sql, { type: sequelize.QueryTypes.SELECT })
      .then((streams) => {
        sequelize.close();
        resolve(streams);
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  });
}

const __format_experience_download_properties = (experience) => {
  let {
    ExperienceType,
    ExperienceCard,
    ExperiencePages,
  } = experience;

  let ExperienceCardProperties = [];
  let ExperiencePageProperties = [];

  if (constants.EXPERIENCE_CARD[ExperienceCard.Type].indexOf('IMAGE') != -1) {
    let image = helpers.searchArrOfObjByValue('Type', 'IMAGE', ExperienceCard.Settings);
    image.Value = image.Default;
    delete image["Default"];
    ExperienceCardProperties.push(image);
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
          ExperiencePageProperties.push(item);
        }
        else if (constants.EXPERIENCE_PAGE[section.Type].indexOf('Pdf') != -1) {
          item.Type = 'FILE';
          item.Value = section.Pdf;
          item.Suffix = 'pdf';
          ExperiencePageProperties.push(item);
        }
        else if (constants.EXPERIENCE_PAGE[section.Type].indexOf('SplashImg') != -1) {
          item.Type = 'IMAGE';
          item.Value = section.SplashImg;
          ExperiencePageProperties.push(item);
        }
        else if (constants.EXPERIENCE_PAGE[section.Type].indexOf('Img') != -1) {
          item.Type = 'IMAGE';
          item.Value = section.Img;
          ExperiencePageProperties.push(item);
        }
        else if (constants.EXPERIENCE_PAGE[section.Type].indexOf('AdBtnImg') != -1) {
          item.Type = 'IMAGE';
          item.Value = section.AdBtnImg;
          ExperiencePageProperties.push(item);
        }
      }
    }
  }
  experience.ExperienceCardProperties = ExperienceCardProperties;
  experience.ExperiencePageProperties = ExperiencePageProperties;
  delete experience["ExperiencePages"];
  delete experience["ExperiencePageNumber"];
  return experience;
}

const getExperienceStreamByChannelID = (dbName, dbPassword, experienceChannelID) => {

  const sequelize = connectDB(dbName, dbPassword);

  let sql = "SELECT ES.ExperienceStreamID, ES.ExperienceGUID";
  sql += " FROM ExperienceStreams AS ES";
  sql += ` WHERE ES.ExperienceChannelID = "${experienceChannelID}"`;

  return new Promise((resolve, reject) => {
    sequelize.query(sql, { type: sequelize.QueryTypes.SELECT })
      .then((streams) => {
        sequelize.close();
        resolve(streams);
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  });
}

export default {
  getExperienceStreamByID,
  getExperienceStreamByGUID,
  createExperienceStream,
  updateExperienceStream,
  updateExperienceStreamsByExperienceGUID,
  experienceStreamList,
  experienceStreamListByParams,
  subscribedExperienceStreamListByParams,
  formatExperienceStreamList,
  deleteExperienceStream,
  deleteExperienceStreamByParams,
  pendingExperienceStreamListByExperienceGUID,

  getExperienceStreamByChannelID,
};
