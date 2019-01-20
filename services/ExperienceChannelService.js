// Libraries
import Promise from "bluebird";
import Sequelize from "sequelize";
import path from "path";

// helpers
import * as helpers from "../utilities/helpers";

// services
import ExperienceStreamService from "./ExperienceStreamService";

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

const getExperienceChannelByID = (dbName, dbPassword, id) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ExperienceChannel = sequelize.import(path.join(__dirname, "../models/mysql/ExperienceChannel.js"));

  return new Promise(async (resolve, reject) => {
    try {
      const channel = await ExperienceChannel.findById(id);
      sequelize.close();
      resolve(channel);
      return;
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
};

const getExperienceChannelByGUID = (dbName, dbPassword, guid) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ExperienceChannel = sequelize.import(path.join(__dirname, "../models/mysql/ExperienceChannel.js"));

  return new Promise(async (resolve, reject) => {
    try {
      const channel = await ExperienceChannel.findOne({ where: { ExperienceChannelGUID: guid } });
      sequelize.close();
      resolve(channel);
      return;
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
};

const createExperienceChannel = (dbName, dbPassword, params) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ExperienceChannel = sequelize.import(path.join(__dirname, "../models/mysql/ExperienceChannel.js"));

  params.ExperienceChannelGUID = helpers.guid();
  params.CreatedAt = helpers.currentDatetime();

  return new Promise(async (resolve, reject) => {
    try {
      const channel = await ExperienceChannel.create(params);
      sequelize.close();
      resolve(channel);
      return;
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
};

const updateExperienceChannel = (dbName, dbPassword, id, params) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ExperienceChannel = sequelize.import(path.join(__dirname, "../models/mysql/ExperienceChannel.js"));

  params.UpdatedAt = helpers.currentDatetime();

  return new Promise(async (resolve, reject) => {
    try {
      const channel = await ExperienceChannel.update(params, { where: { ExperienceChannelID: id } });
      sequelize.close();
      resolve(channel);
      return;
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
};

const deleteExperienceChannel = (dbName, dbPassword, id, userID) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ExperienceChannel = sequelize.import(path.join(__dirname, "../models/mysql/ExperienceChannel.js"));

  const params = {
    IsDeleted: 1,
    UpdatedBy: userID,
    UpdatedAt: helpers.currentDatetime()
  };
  return new Promise(async (resolve, reject) => {
    try {
      const channel = await ExperienceChannel.update(params, { where: { ExperienceChannelID: id } });
      sequelize.close();
      resolve(channel);
      return;
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
}

const experienceChannelList = (dbName, dbPassword, params) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ExperienceChannel = sequelize.import(path.join(__dirname, "../models/mysql/ExperienceChannel.js"));

  return new Promise(async (resolve, reject) => {
    try {
      const channels = await ExperienceChannel.findAll({ where: params });
      sequelize.close();
      resolve(channels);
      return;
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
};

const experienceChannelListV2 = (dbName, dbPassword, experienceChannelID, channelCode) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ExperienceChannel = sequelize.import(path.join(__dirname, "../models/mysql/ExperienceChannel.js"));
  const op = sequelize.Op;

  let searchParams = {
    ExperienceChannelID: {
      [op.ne]: experienceChannelID,
    },
    ChannelType: '2',
    ChannelCode: channelCode,
    IsDeleted: 0
  };

  return new Promise(async (resolve, reject) => {
    try {
      const channels = await ExperienceChannel.findAll({ where: searchParams });
      sequelize.close();
      resolve(channels);
      return;
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
};

const experienceChannelListByParams = (dbName, dbPassword, onlyRow, limit, offset, extra) => {

  const sequelize = connectDB(dbName, dbPassword);
  let sql;
  let { SearchType, SearchField, ChannelType, ChannelStatus, ChannelLanguageGUID } = extra;

  if (onlyRow) {
    sql = "SELECT ExperienceChannelGUID";
  } else {
    sql = "SELECT ExperienceChannelID, ExperienceChannelGUID, ChannelName, IFNULL(ChannelDescription, '') AS ChannelDescription, ChannelColor, ChannelStatus, ChannelType, IFNULL(ChannelCode, '') AS ChannelCode, IFNULL(ChannelLanguageGUID, '') AS ChannelLanguageGUID," +
      " CreatedAt, IFNULL(UpdatedAt, '') AS UpdatedAt";
  }
  sql += " FROM ExperienceChannels";
  sql += " WHERE IsDeleted = 0"
  if (SearchType && SearchField) {
    if (["CHANNEL_NAME"].indexOf(SearchType) != -1) {
      sql += ` AND ChannelName LIKE "%${SearchField}%" `;
    }
  }
  if (ChannelStatus && ["DRAFT", "LIVE", "ALL"].indexOf(ChannelStatus) != -1) {
    if (ChannelStatus == 'DRAFT' || ChannelStatus == 'LIVE') {
      sql += ` AND ChannelStatus = "${ChannelStatus}"`;
    }
  }
  if (ChannelType && ["PUBLIC", "PRIVATE", "INVITATION", "ALL"].indexOf(ChannelType) != -1) {
    if (ChannelType == 'PUBLIC') {
      sql += ` AND (ChannelType = "0" OR ChannelType = "3")`;
    } else if (ChannelType == 'PRIVATE') {
      sql += ` AND ChannelType = "1"`;
    } else if (ChannelType == 'INVITATION') {
      sql += ` AND ChannelType = "2"`;
    }
  }
  if (ChannelLanguageGUID) {
    sql += ` AND ChannelLanguageGUID = "${ChannelLanguageGUID}"`;
  }
  sql += " ORDER BY ChannelType DESC, CreatedAt DESC";

  return new Promise(async (resolve, reject) => {
    try {
      if (onlyRow) {

        const channels = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
        sequelize.close();
        resolve(channels.length);
        return;
      } else {

        if (limit !== "-1") {
          sql += ` LIMIT ${limit}`;
          sql += ` OFFSET ${offset}`;
        }

        const channels = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
        let tasks = [];
        for (let i = 0; i < channels.length; i++) {
          let channel = channels[i];
          let task = new Promise((resolve, reject) => {
            ExperienceStreamService.experienceStreamList(dbName, dbPassword, {
              ExperienceChannelID: channel.ExperienceChannelID
            })
              .then(experienceStreams => {
                let tmpExperienceStreams = [];
                experienceStreams.forEach((experienceStream, index) => {
                  const {
                    ExperienceStreamGUID,
                    ExperienceGUID,
                    ExperienceTitle,
                    CreatedAt,
                    UpdatedAt
                  } = experienceStream;
                  const item = {
                    ExperienceStreamGUID,
                    ExperienceGUID,
                    ExperienceTitle,
                    CreatedAt,
                    UpdatedAt: UpdatedAt ? UpdatedAt : ""
                  };
                  tmpExperienceStreams.push(item);
                });
                channels[i].ExperienceStreams = tmpExperienceStreams;
                delete channels[i]["ExperienceChannelID"];
                resolve(channels[i]);
                return;
              })
              .catch(err => {
                reject(err);
                return;
              });
          });
          tasks.push(task);
        }
        Promise.all(tasks)
          .then(channels => {
            sequelize.close();
            resolve(channels);
            return;
          })
          .catch(err => {
            sequelize.close();
            reject(err);
            return;
          })
      }
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
};

const userExperienceChannelListByParams = (dbName, dbPassword, onlyRow, limit, offset, extra) => {

  const sequelize = connectDB(dbName, dbPassword);
  let sql;
  let { SearchType, SearchField, UserGUID, ChannelLanguageGUID } = extra;

  if (onlyRow) {
    sql = "SELECT EC.ExperienceChannelGUID";
  } else {
    sql = "SELECT EC.ExperienceChannelGUID, EC.ChannelName, IFNULL(EC.ChannelDescription, '') AS ChannelDescription, EC.ChannelColor, EC.ChannelStatus, EC.ChannelType," +
      " EC.CreatedAt, IFNULL(EC.UpdatedAt, '') AS UpdatedAt,";
    sql += " CASE WHEN CS.ChannelSubscribeID IS NOT NULL THEN '1' ELSE '0' END AS IsSubscribed,";
    sql += " IFNULL(CS.IsHardInterest, 0) AS IsHardInterest";
  }
  sql += " FROM ExperienceChannels AS EC";
  sql += ` LEFT JOIN ChannelSubscribes AS CS ON CS.ExperienceChannelID = EC.ExperienceChannelID AND CS.UserGUID = "${UserGUID}" AND CS.IsDeleted = "0"`;
  sql += ` WHERE EC.ChannelStatus = "LIVE" AND (EC.ChannelType = '0' OR EC.ChannelType = '3' OR ((EC.ChannelType = '1' OR EC.ChannelType = '2') AND CS.ChannelSubscribeID IS NOT NULL))`;
  if (ChannelLanguageGUID) {
    sql += ` AND EC.ChannelLanguageGUID = "${ChannelLanguageGUID}"`;
  }
  if (SearchType && SearchField) {
    if (SearchType == 'CHANNEL_NAME') {
      sql += ` AND EC.ChannelName LIKE "%${SearchField}%"`;
    }
  }
  sql += " ORDER BY EC.ChannelType DESC, EC.CreatedAt DESC";

  return new Promise(async (resolve, reject) => {
    try {

      if (onlyRow) {
        const channels = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT })
        sequelize.close();
        resolve(channels.length);
        return;
      } else {
        if (limit !== "-1") {
          sql += ` LIMIT ${limit}`;
          sql += ` OFFSET ${offset}`;
        }
        const channels = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT })
        sequelize.close();
        resolve(channels);
        return;
      }
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
};

const formatExperienceChannelLanguage = (dbName, dbPassword, channelLanguageGUID, userID) => {

  return new Promise(async (resolve, reject) => {
    try {

      const sequelize = connectDB(dbName, dbPassword);
      const ExperienceChannel = sequelize.import(path.join(__dirname, "../models/mysql/ExperienceChannel.js"));

      const searchParams = {
        ChannelLanguageGUID: null
      };
      const experienceChannels = await ExperienceChannel.findAll({ where: searchParams });

      let tasks = [];
      for (let i = 0; i < experienceChannels.length; i++) {
        let experienceChannel = experienceChannels[i];
        let task = new Promise((resolve, reject) => {
          let updateChannel = {
            ChannelLanguageGUID: channelLanguageGUID,
            UpdatedBy: userID,
            UpdatedAt: helpers.currentDatetime()
          };
          ExperienceChannel.update(updateChannel, { where: { ExperienceChannelID: experienceChannel.ExperienceChannelID } })
            .then(() => {
              resolve({});
              return;
            })
            .catch((error) => {
              reject(error);
              return;
            })
        });
        tasks.push(task);
      }
      Promise.all(tasks)
        .then(() => {
          sequelize.close();
          resolve({});
          return;
        })
        .catch((error) => {
          sequelize.close();
          reject(error);
          return;
        })
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
};

export default {
  getExperienceChannelByID,
  getExperienceChannelByGUID,
  createExperienceChannel,
  updateExperienceChannel,
  deleteExperienceChannel,
  experienceChannelList,
  experienceChannelListV2,
  experienceChannelListByParams,
  userExperienceChannelListByParams,
  formatExperienceChannelLanguage,
};
