import fs from "fs";
import path from "path";
import Promise from "bluebird";

export const listFiles = folderName => {
  const uploadFolder = "../uploads/temp/";
  return new Promise((resolve, reject) => {
    fs.readdir(
      path.join(__dirname, uploadFolder + folderName),
      (err, files) => {
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
