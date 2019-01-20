import fs from "fs";
import path from "path";
import Promise from "bluebird";
import md5 from "md5";
import uuid from "uuid-v4";
import moment from "moment-timezone";
import rimraf from 'rimraf';
import zipFolder from 'zip-folder';

// Services
import ImageService from "../services/ImageService";

export const guid = () => {
  return uuid();
};

export const currentDatetime = () => {
  return moment();
};

export const formattedCurrentDatetime = () => {
  return moment().format('YYYY-MM-DD');
};

export const formattedOldDatetimeByDays = (n) => {
  let date = moment().subtract(n, 'd').format('YYYY-MM-DD');
  return date;
};

export const hash = str => {
  return md5(str);
};

export const isNumeric = num => {
  return !isNaN(parseFloat(num)) && isFinite(num);
};

export const isFolderExist = (folderPath, callback) => {
  fs.stat(folderPath, function (err, stats) {
    if (err) {
      fs.mkdir(folderPath, callback);
    } else {

      fs.readdir(folderPath, (err, files) => {
        if (err) {
          callback(err);
          return;
        }

        let tasks = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          let task = new Promise((resolve, reject) => {
            fs.unlink(path.join(folderPath, file), err => {
              if (err) {
                reject(err);
                return;
              }
              resolve();
              return;
            });
          });
          tasks.push(task);
        }

        Promise.all(tasks)
          .then(() => {
            callback(null, { Confirmation: 'Success' });
          })
          .catch((error) => {
            callback(error);
          })
      });
    }
  });
};

export const isFileExist = (realm, fileName, type) => {
  const filePath = path.join(__dirname, `../uploads/${realm}/temp/${fileName}.${type}`);
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) {
      resolve();
      return;
    } else {
      reject("File not found");
      return;
    }
  });
};

export const deleteFile = (realm, fileName, type) => {
  const filePath = path.join(__dirname, `../uploads/${realm}/temp/${fileName}.${type}`);
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, error => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
      return;
    });
  });
};

export const searchArrOfObjByValue = (valueKey, value, myArray) => {
  for (let i = 0; i < myArray.length; i++) {
    if (myArray[i][valueKey] === value) {
      return myArray[i];
    }
  }
}

export const formatXiFolder = (realm, dbName, dbPassword, experienceGUID, fileArr, experience) => {

  return new Promise(async (resolve, reject) => {
    try {

      // 1. check folder exist
      const realmDir = `../uploads/${realm}`;
      const realmTempDir = `../uploads/${realm}/temp`;
      const realmZipDir = `../uploads/${realm}/zip`;
      await createDirIfNotExisted(realmDir);
      await createDirIfNotExisted(realmTempDir);
      await createDirIfNotExisted(realmZipDir);

      // 2. create XiFolder
      const tempPath = path.join(__dirname, `../uploads/${realm}/temp`);
      const zipPath = path.join(__dirname, `../uploads/${realm}/zip`);
      const folerPath = path.join(__dirname, `../uploads/${realm}/`, experienceGUID);

      isFolderExist(folerPath, (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        let tasks = [];
        for (let i = 0; i < fileArr.length; i++) {
          let file = fileArr[i];
          const {
            Type,
            Value,
            Suffix,
          } = file;
          let task = new Promise((resolve, reject) => {
            if (Type == 'IMAGE') {
              ImageService.getImageByGUID(dbName, dbPassword, Value)
                .then((image) => {
                  const {
                    ImageType,
                    ImageData,
                  } = image
                  const imgBuffer = new Buffer(ImageData, "base64");
                  const stream = fs.createWriteStream(`${folerPath}/${Value}.jpg`);
                  stream.write(imgBuffer);
                  stream.end(() => {
                    resolve();
                    return;
                  })
                })
                .catch((error) => {
                  reject(error);
                  return;
                })
            } else if (Type == 'FILE') {
              const fileName = Value + '.' + Suffix;
              const readStream = fs.createReadStream(`${tempPath}/${fileName}`);
              readStream.once('error', (error) => {
                reject(error);
                return;
              });
              readStream.once('end', () => {
                resolve();
                return;
              });
              readStream.pipe(fs.createWriteStream(`${folerPath}/${fileName}`));
            } else {
              resolve();
              return;
            }
          });
          tasks.push(task);
        }
        Promise.all(tasks)
          .then((response) => {
            fs.writeFile(`${folerPath}/data.json`, JSON.stringify(experience), (err) => {
              if (err) {
                reject(err);
                return;
              }
              zipFolder(folerPath, `${zipPath}/${experienceGUID}.zip`, (err) => {
                if (err) {
                  reject(err);
                  return;
                }
                resolve(response);
                return;
              });
            });
          })
          .catch((error) => {
            reject(error);
            return;
          })
      })

    } catch (error) {
      reject(error);
      return;
    }
  })
};

export const removeXiFolder = (realm, experienceGUID, fileArr) => {
  const tempPath = path.join(__dirname, `../uploads/${realm}/temp`);
  const zipPath = path.join(__dirname, `../uploads/${realm}/zip`);
  const folerPath = path.join(__dirname, `../uploads/${realm}/`, experienceGUID);

  return new Promise((resolve, reject) => {
    let tasks = [];
    for (let i = 0; i < fileArr.length; i++) {
      let file = fileArr[i];
      const {
        Type,
        Value,
        Suffix,
      } = file;
      let task = new Promise((resolve, reject) => {
        if (Type == 'FILE') {
          const fileName = Value + '.' + Suffix;
          fs.unlink(`${tempPath}/${fileName}`, err => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
            return;
          });
        } else {
          resolve();
          return;
        }
      });
      tasks.push(task);
    }
    Promise.all(tasks)
      .then((response) => {
        rimraf(folerPath, () => {
          fs.unlink(`${zipPath}/${experienceGUID}.zip`, err => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
            return;
          });
        });
      })
      .catch((error) => {
        reject(error);
        return;
      })
  })
}

export const createDirIfNotExisted = (folderPath) => {
  return new Promise((resolve, reject) => {
    folderPath = path.join(__dirname, folderPath);
    if (!fs.existsSync(folderPath)) {
      fs.mkdir(folderPath, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
        return;
      });
    } else {
      resolve();
      return;
    }
  })
}