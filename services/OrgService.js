import Promise from 'bluebird';
import Sequelize from "sequelize";
import path from "path";
import constants from '../constants';

// helpers
import * as helpers from "../utilities/helpers";

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

const getOrgByID = id => {
  
  const sequelize = connectDB();
  const Org = sequelize.import(path.join(__dirname, "../models/mysql/Org.js"));

  return new Promise(async (resolve, reject) => {
    try {
      const org = await Org.findById(id);
      sequelize.close();
      resolve(org);
      return;
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
};

const getOrgByGUID = guid => {

  const sequelize = connectDB();
  const Org = sequelize.import(path.join(__dirname, "../models/mysql/Org.js"));

  return new Promise(async (resolve, reject) => {
    try {
      const org = await Org.findOne({ where: { OrgGUID: guid } });
      sequelize.close();
      resolve(org);
      return;
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
};

const getOrgByRealm = realm => {

  const sequelize = connectDB();
  const Org = sequelize.import(path.join(__dirname, "../models/mysql/Org.js"));

  return new Promise(async (resolve, reject) => {
    try {
      const org = await Org.findOne({ where: { Realm: realm } });
      sequelize.close();
      resolve(org);
      return;
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
}

const getOrgByOrgUrl = orgUrl => {

  const sequelize = connectDB();
  const Org = sequelize.import(path.join(__dirname, "../models/mysql/Org.js"));

  return new Promise(async (resolve, reject) => {
    try {
      const org = await Org.findOne({ where: { OrgUrl: orgUrl } });
      sequelize.close();
      resolve(org);
      return;
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
}

const createOrg = params => {

  const sequelize = connectDB();
  const Org = sequelize.import(path.join(__dirname, "../models/mysql/Org.js"));

  params.OrgGUID = helpers.guid();
  params.CreatedAt = helpers.currentDatetime();

  return new Promise(async (resolve, reject) => {
    try {
      const org = await Org.create(params);
      sequelize.close();
      resolve(org);
      return;
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
};

const updateOrg = (id, params) => {

  const sequelize = connectDB();
  const Org = sequelize.import(path.join(__dirname, "../models/mysql/Org.js"));

  params.UpdatedAt = helpers.currentDatetime();

  return new Promise(async (resolve, reject) => {
    try {
      const org = await Org.update(params, { where: { OrgID: id } });
      sequelize.close();
      resolve(org);
      return;
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
};

const orgList = params => {

  const sequelize = connectDB();
  const Org = sequelize.import(path.join(__dirname, "../models/mysql/Org.js"));

  return new Promise(async (resolve, reject) => {
    try {
      const orgs = await Org.findAll({ where: params });
      sequelize.close();
      resolve(orgs);
      return;
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
};

const orgListByParams = (onlyRow, limit, offset, extra) => {

  const sequelize = connectDB();
  return new Promise(async (resolve, reject) => {
    try {
      
      let sql;
      let {
        FilterType,
        FilterField,
        SearchType,
        SearchField,
      } = extra;

      if (onlyRow) {
        sql = "SELECT O.OrgID";
      } else {
        sql = "SELECT O.OrgGUID, O.Realm, O.OrgName, O.OrgUrl, O.IsActive, O.CreatedAt, O.UpdatedAt";
      }
      sql += " FROM Orgs AS O";
      sql += " ORDER BY O.CreatedAt DESC";

      if (onlyRow) {
        const orgs = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT })
        sequelize.close();
        resolve(orgs.length);
        return;
      } else {
        if (limit !== "-1") {
          sql += ` LIMIT ${limit}`;
          sql += ` OFFSET ${offset}`;
        }
        const orgs = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT })
        sequelize.close();
        resolve(orgs);
        return;
      }
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
}

export default {
  getOrgByID,
  getOrgByGUID,
  getOrgByRealm,
  getOrgByOrgUrl,
  createOrg,
  updateOrg,
  orgList,
  orgListByParams
};
