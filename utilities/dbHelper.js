import Promise from 'bluebird';
import mysql from 'mysql';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { MongoClient } from 'mongodb';

// Constants
import constants from "../constants";

const listFiles = (folderPath) => {
  return new Promise((resolve, reject) => {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(files);
      return;
    }
    );
  });
};

const readFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
      return;
    });
  })
}

const mysqlConnect = () => {
  const mysqlCon = mysql.createConnection({
    host: constants.mysqlHost,
    user: constants.mysqlUser,
    password: constants.mysqlPassword,
  });
  return mysqlCon;
}

const mysqlQuery = (query) => {
  return new Promise(function (resolve, reject) {
    const mysqlCon = mysqlConnect();
    mysqlCon.connect((err) => {
      if (err) {
        reject(err);
        return;
      }
      mysqlCon.query(query, (err, response) => {
        mysqlCon.end();
        if (err) {
          reject(err);
          return;
        }
        resolve(response);
        return;
      })
    })
  })
};

export const mysqlDbList = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const showDbQueryPath = path.join(__dirname, '../sql/showDbQuery.txt');
      const showDbQuery = await readFile(showDbQueryPath);
      const response = await mysqlQuery(showDbQuery);

      const output = [];
      response.map(item => {
        let obj = {};
        obj.Database = item.Database;
        output.push(obj);
      })
      resolve(output);
      return;
    } catch (error) {
      reject(error);
      return;
    }
  })
};


export const mongoDbList = () => {
  return new Promise(function (resolve, reject) {
    const adminPath = `mongodb://${constants.mongoDbUser}:${constants.mongoDbPassword}@${constants.mongoDbHost}:27017/`;
    const mongoCon = mongoose.createConnection(adminPath);
    const Admin = mongoose.mongo.Admin;
    mongoCon.on('open', () => {
      new Admin(mongoCon.db).listDatabases((err, mongoDbList) => {
        mongoCon.close();
        if (err) {
          reject(err);
          return;
        }
        resolve(mongoDbList.databases);
        return;
      })
    })
  })
};


export const generateUniqueDbName = (keycloakRealms, mysqlDbList, mongoDbList, callback) => {
  let dbNumber = randomDbNumber();
  let dbName = `org${dbNumber}`;
  const filterArr1 = keycloakRealms.filter(db => db.realm == dbName);
  const filterArr2 = mysqlDbList.filter(db => db.Database == dbName);
  const filterArr3 = mongoDbList.filter(db => db.name == dbName);
  if (filterArr1.length || filterArr2.length || filterArr3.length) {
    generateUniqueDbName(keycloakRealms, mysqlDbList, mongoDbList, callback);
    return;
  }
  callback(null, dbName);
  return;
};

const randomDbNumber = () => {
  let text = "";
  let possible = "0123456789";
  for (let i = 0; i < 10; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export const mysqlSetup = (dbName, dbUserName, dbPassword) => {
  return new Promise(async (resolve, reject) => {
    try {

      const dbFolderPath = path.join(__dirname, '../sql/db');
      const tableFolderPath = path.join(__dirname, '../sql/table');
      const createDbUserQueryPath = path.join(__dirname, '../sql/createDbUserQuery.txt');
      const addPermissionQueryPath = path.join(__dirname, '../sql/addPermissionQuery.txt');
      let dbTasks = [];
      let tableTasks = [];

      const dbArr = await listFiles(dbFolderPath);
      const tableArr = await listFiles(tableFolderPath);
      let createDbUserQuery = await readFile(createDbUserQueryPath);
      let addPermissionQuery = await readFile(addPermissionQueryPath);
      createDbUserQuery = formatQuery(createDbUserQuery, dbName, dbUserName, dbPassword);
      addPermissionQuery = formatQuery(addPermissionQuery, dbName, dbUserName, dbPassword);

      // 1. create db
      for (let i = 0; i < dbArr.length; i++) {
        let task = new Promise(async (resolve, reject) => {
          try {
            let createDbQueryPath = path.join(__dirname, '../sql/db', dbArr[i]);
            let createDbQuery = await readFile(createDbQueryPath);
            createDbQuery = formatQuery(createDbQuery, dbName, dbUserName, dbPassword);
            const createDbRes = await mysqlQuery(createDbQuery);
            if (createDbRes) {
              resolve(createDbRes);
              return;
            }
          } catch (error) {
            reject(error);
            return;
          }
        })
        dbTasks.push(task);
      }
      const dbTasksRes = await Promise.all(dbTasks);

      // 2. create tables
      for (let i = 0; i < tableArr.length; i++) {
        let task = new Promise(async (resolve, reject) => {
          try {
            let createTableQueryPath = path.join(__dirname, '../sql/table', tableArr[i]);
            let createTableQuery = await readFile(createTableQueryPath);
            createTableQuery = formatQuery(createTableQuery, dbName, dbUserName, dbPassword);
            const createTableRes = await mysqlQuery(createTableQuery);
            if (createTableRes) {
              resolve(createTableRes);
              return;
            }
          } catch (error) {
            reject(error);
            return;
          }
        })
        tableTasks.push(task);
      }
      const tableTasksRes = await Promise.all(tableTasks);

      // 3. create db user
      const createDbUserRes = await mysqlQuery(createDbUserQuery);
      // 4. add permission to db user
      const addPermissionRes = await mysqlQuery(addPermissionQuery);

      resolve({ Confimation: 'Success' });
      return;
    } catch (error) {
      reject(error);
      return;
    }
  })
}

const formatQuery = (query, dbName, dbUserName, dbPassword) => {
  query = query.replace(/\${dbName}/g, dbName);
  query = query.replace(/\${dbUserName}/g, dbUserName);
  query = query.replace(/\${dbPassword}/g, dbPassword);
  return query;
}

export const mongoSetup = (dbName, dbUserName, dbPassword) => {
  return new Promise((resolve, reject) => {
    const config = `mongodb://${constants.mongoDbUser}:${constants.mongoDbPassword}@${constants.mongoDbHost}:27017/`;
    MongoClient.connect(config, { useNewUrlParser: true }, (err, db) => {
      if (err) {
        reject(err);
        return;
      }
      const dbo = db.db(dbName);
      dbo.addUser(dbUserName, dbPassword.toString(), {
        roles: [
          { role: "readWrite", db: dbUserName },
          { role: "read", db: dbUserName },
          { role: "userAdmin", db: dbUserName },
          { role: "dbAdmin", db: dbUserName },
          { role: "dbOwner", db: dbUserName },
          { role: "enableSharding", db: dbUserName }
        ],
      }, (err, result) => {
        db.close();
        if (err) {
          reject(err);
          return;
        }
        resolve({ Confimation: 'Success' });
        return;
      })
    })
  })
}