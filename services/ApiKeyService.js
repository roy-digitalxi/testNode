import Promise from 'bluebird';
import Sequelize from "sequelize";
import path from "path";
import constants from '../constants';

const connectDB = () => {
  const sequelize = new Sequelize("digitalxi", constants.mysqlUser, constants.mysqlPassword, {
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

const apiKeyList = params => {
  const sequelize = connectDB();
  const ApiKey = sequelize.import(path.join(__dirname, "../models/mysql/ApiKey.js"));

  return new Promise((resolve, reject) => {
    ApiKey.findAll({ where: params })
      .then((apiKeyList) => {
        sequelize.close();
        resolve(apiKeyList);
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
  apiKeyList
};
