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

const createLog = params => {
  const sequelize = connectDB();
  const Log = sequelize.import(path.join(__dirname, "../models/mysql/Log.js"));

  return new Promise((resolve, reject) => {
    Log.create(params)
      .then((response) => {
        sequelize.close();
        resolve(response);
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
  createLog
};
