// Libraries
import Promise from "bluebird";
import Sequelize from "sequelize";
import path from "path";

// helpers
import * as helpers from "../utilities/helpers";

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

const getChannelSubscribeByID = (dbName, dbPassword, id) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ChannelSubscribe = sequelize.import(path.join(__dirname, "../models/mysql/ChannelSubscribe.js"));

  return new Promise((resolve, reject) => {
    ChannelSubscribe.findById(id)
      .then((channelSubscribe) => {
        sequelize.close();
        resolve(channelSubscribe);
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  })
};

const getChannelSubscribeByGUID = (dbName, dbPassword, guid) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ChannelSubscribe = sequelize.import(path.join(__dirname, "../models/mysql/ChannelSubscribe.js"));

  return new Promise((resolve, reject) => {
    ChannelSubscribe.findOne({ where: { ChannelSubscribeGUID: guid } })
      .then((channelSubscribe) => {
        sequelize.close();
        resolve(channelSubscribe);
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  })
};

const createChannelSubscribe = (dbName, dbPassword, params) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ChannelSubscribe = sequelize.import(path.join(__dirname, "../models/mysql/ChannelSubscribe.js"));

  params.ChannelSubscribeGUID = helpers.guid();
  params.CreatedAt = helpers.currentDatetime();

  return new Promise((resolve, reject) => {
    ChannelSubscribe.create(params)
      .then((channelSubscribe) => {
        sequelize.close();
        resolve(channelSubscribe);
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  })
};

const updateChannelSubscribe = (dbName, dbPassword, id, params) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ChannelSubscribe = sequelize.import(path.join(__dirname, "../models/mysql/ChannelSubscribe.js"));

  params.UpdatedAt = helpers.currentDatetime();

  return new Promise((resolve, reject) => {
    ChannelSubscribe.update(params, { where: { ChannelSubscribeID: id } })
      .then((channelSubscribe) => {
        sequelize.close();
        resolve(channelSubscribe);
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  })
};

const channelSubscribeList = (dbName, dbPassword, params) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ChannelSubscribe = sequelize.import(path.join(__dirname, "../models/mysql/ChannelSubscribe.js"));

  return new Promise((resolve, reject) => {
    ChannelSubscribe.findAll({ where: params })
      .then((channelSubscribes) => {
        sequelize.close();
        resolve(channelSubscribes);
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  })
};

const channelSubscribeListByParams = (dbName, dbPassword, onlyRow, limit, offset, extra) => {

  const sequelize = connectDB(dbName, dbPassword);
  let sql;
  let { SearchType, SearchField, UserGUID } = extra;

  if (onlyRow) {
    sql = "SELECT CS.ChannelSubscribeGUID";
  } else {
    sql = "SELECT CS.ChannelSubscribeGUID, CS.IsHardInterest,"
      + " CS.CreatedAt, IFNULL(CS.UpdatedAt, '') AS UpdatedAt,";
    sql += " EC.ExperienceChannelGUID, EC.ChannelName, IFNULL(EC.ChannelDescription, '') AS ChannelDescription, EC.ChannelColor, EC.ChannelStatus, EC.ChannelType";
  }
  sql += " FROM ChannelSubscribes AS CS";
  sql += " LEFT JOIN ExperienceChannels AS EC ON EC.ExperienceChannelID = CS.ExperienceChannelID";
  if (SearchType && SearchField) {

  }
  sql += ` WHERE CS.UserGUID = "${UserGUID}" AND CS.IsDeleted = "0" AND EC.ChannelStatus= "LIVE"`;
  sql += " ORDER BY CS.CreatedAt DESC";

  if (onlyRow) {
    return new Promise((resolve, reject) => {
      sequelize.query(sql, { type: sequelize.QueryTypes.SELECT })
        .then(channelSubscribes => {
          sequelize.close();
          resolve(channelSubscribes.length);
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
        .then(channelSubscribes => {
          sequelize.close();
          resolve(channelSubscribes);
          return;
        })
        .catch(err => {
          sequelize.close();
          reject(err);
          return;
        })
    });
  }
};

const disableUserChannelSubscribeList = (dbName, dbPassword, userGUID) => {

  const sequelize = connectDB(dbName, dbPassword);
  const ChannelSubscribe = sequelize.import(path.join(__dirname, "../models/mysql/ChannelSubscribe.js"));

  return new Promise((resolve, reject) => {
    ChannelSubscribe.findAll({ where: { UserGUID: userGUID } })
      .then(async (channelSubscribes) => {

        let tasks = [];
        channelSubscribes.forEach(channelSubscribe => {
          let task = new Promise((resolve, reject) => {
            let updateChannelSubscribe = {
              UpdatedAt: helpers.currentDatetime(),
              IsDeleted: 1
            }
            ChannelSubscribe.update(updateChannelSubscribe, { where: { ChannelSubscribeID: channelSubscribe.ChannelSubscribeID } })
              .then(() => {
                resolve();
                return;
              })
              .catch(error => {
                sequelize.close();
                reject(error);
                return;
              })
          })
          tasks.push(task);
        })

        await Promise.all(tasks);

        sequelize.close();
        resolve();
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  })
};

export default {
  getChannelSubscribeByID,
  getChannelSubscribeByGUID,
  createChannelSubscribe,
  updateChannelSubscribe,
  channelSubscribeList,
  channelSubscribeListByParams,

  disableUserChannelSubscribeList,
};
