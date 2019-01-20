import Promise from "bluebird";
import Sequelize from "sequelize";
import path from "path";

const connectDB = (dbName, dbPassword) => {
  const sequelize = new Sequelize(`${dbName}_image`, dbName, dbPassword, {
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

const getImageByID = (dbName, dbPassword, id) => {

  const sequelize = connectDB(dbName, dbPassword);
  const Image = sequelize.import(path.join(__dirname, "../models/mysql/Image.js"));

  return new Promise((resolve, reject) => {
    Image.findById(id)
      .then((image) => {
        sequelize.close();
        resolve(image);
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  })
};

const getImageByGUID = (dbName, dbPassword, guid) => {

  const sequelize = connectDB(dbName, dbPassword);
  const Image = sequelize.import(path.join(__dirname, "../models/mysql/Image.js"));

  return new Promise((resolve, reject) => {
    Image.findOne({ where: { ImageGUID: guid } })
      .then((image) => {
        sequelize.close();
        resolve(image);
        return;
      })
      .catch(err => {
        sequelize.close();
        reject(err);
        return;
      })
  })
};

const createImage = (dbName, dbPassword, params) => {

  const sequelize = connectDB(dbName, dbPassword);
  const Image = sequelize.import(path.join(__dirname, "../models/mysql/Image.js"));

  return new Promise((resolve, reject) => {
    Image.create(params)
      .then((image) => {
        sequelize.close();
        resolve(image);
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
  getImageByID,
  getImageByGUID,
  createImage
};
