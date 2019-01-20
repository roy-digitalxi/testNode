import Promise from "bluebird";
import fs from "fs";
import path from "path";
import lwip from "pajk-lwip";
import unzip from 'unzip';
import * as helpers from "../utilities/helpers";

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

export const uploadFile = (file, realm, guid) => {
  return new Promise(async (resolve, reject) => {
    try {

      // 1. check folder exist
      const realmDir = `../uploads/${realm}`;
      const realmTempDir = `../uploads/${realm}/temp`;
      await createDirIfNotExisted(realmDir);
      await createDirIfNotExisted(realmTempDir);

      // 2. check temp file
      let fileGUID = helpers.guid();
      if (guid) {
        fileGUID = guid;
      }
      var fileType = file.name.substr(file.name.lastIndexOf(".") + 1);
      let filePath = `../uploads/${realm}/temp/${fileGUID}.${fileType}`;

      file.mv(path.join(__dirname, filePath), (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ fileGUID, fileType });
        return;
      });
    } catch (error) {
      reject(error);
      return;
    }
  })
}

export const uploadMultipleFiles = (filelist, docPath, callback) => {
  let tasks = [];
  for (let file of filelist) {
    let task = new Promise((resolve, reject) => {
      let fileName = file.FileName.trim();
      fileName = fileName.replace(/[\s]/g, "");
      let filePath = `/../${docPath}/${fileName}`;
      file.mv(path.join(__dirname, filePath), function (error) {
        if (error) {
          reject(error);
          return;
        }
        resolve(filePath);
        return;
      });
    });
    tasks.push(task);
  }
  Promise.all(tasks)
    .then(response => {
      callback(null, response);
    })
    .catch(error => {
      callback(error, null);
    });
};

export const formatImage = (type, buffer, callback) => {
  lwip.open(buffer, type, function (err, image) {
    if (err) {
      callback(err, null);
      return;
    }

    let bufferObj = {};
    resizeImage(image, type, 72, 72)
      .then(buffer => {
        bufferObj["72X72"] = buffer;

        resizeImage(image, type, 90, 90)
          .then(buffer => {
            bufferObj["90X90"] = buffer;

            resizeImage(image, type, 200, 200)
              .then(buffer => {
                bufferObj["200X200"] = buffer;

                resizeImage(image, type, 250, 250)
                  .then(buffer => {
                    bufferObj["250X250"] = buffer;

                    resizeImage(image, type, 525, 295)
                      .then(buffer => {
                        bufferObj["525X295"] = buffer;

                        resizeImage(image, type, 726, 420)
                          .then(buffer => {
                            bufferObj["726X420"] = buffer;
                            callback(null, bufferObj);
                          })
                          .catch(error => {
                            bufferObj["726X420"] = "";
                            callback(null, bufferObj);
                          });
                      })
                      .catch(error => {
                        bufferObj["525X295"] = "";
                      });
                  })
                  .catch(error => {
                    bufferObj["250X250"] = "";
                  });
              })
              .catch(error => {
                bufferObj["200X200"] = "";
              });
          })
          .catch(error => {
            bufferObj["90X90"] = "";
          });
      })
      .catch(error => {
        bufferObj["72X72"] = "";
      });
  });
};

const resizeImage = (image, type, width, height) => {
  return new Promise((resolve, reject) => {
    image.resize(width, height, function (err, formattedImage) {
      if (err) {
        reject(err);
        return;
      }
      formattedImage.toBuffer(type, function (err, buffer) {
        if (err) {
          reject(err);
          return;
        }
        resolve(buffer);
        return;
      });
    });
  });
};

export const uploadH5pFile = (file, realm) => {
  return new Promise(async (resolve, reject) => {
    let folderGUID = helpers.guid();
    let fileGUID = helpers.guid();

    // 1. check folder exist
    const realmDir = `../uploads/${realm}`;
    const realmH5pDir = `../uploads/${realm}/h5p`;
    const realmH5pFolderDir = `../uploads/${realm}/h5p/${folderGUID}`;

    await createDirIfNotExisted(realmDir);
    await createDirIfNotExisted(realmH5pDir);
    await createDirIfNotExisted(realmH5pFolderDir);

    // 2. move file
    const filePath = `${realmH5pFolderDir}/${fileGUID}.zip`;
    file.mv(path.join(__dirname, filePath), error => {

      if (error) {
        reject(error);
        return;
      }

      // 3. unzip file
      fs.createReadStream(path.join(__dirname, filePath))
        .pipe(unzip.Extract({ path: path.join(__dirname, realmH5pFolderDir) }))
        .on('close', error => {

          if (error) {
            reject(error);
            return;
          }

          // 4. delete zip file
          fs.unlink(path.join(__dirname, filePath), error => {
            if (error) {
              reject(error);
              return;
            }

            resolve(folderGUID);
            return;
          })
        })
    })
  })
}