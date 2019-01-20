import fs from 'fs';
import path from "path";

// Default
import middlewares from "../../middlewares";

// Services
import OrgService from "../../services/OrgService";
import ImageService from "../../services/ImageService";
import GoogleService from "../../services/GoogleService";

// Utilities
import * as upload from "../../utilities/upload";
import * as helpers from "../../utilities/helpers";

// Libraries
import sizeOf from 'image-size';

const Controller = {

  "/upload/file": {
    path: "/upload/file",
    method: "post",
    middleware: [middlewares.keycloakContentCreateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
      } = req.body;

      const mediaArr = ["application/pdf", "text/html"];
      if (!req.files) {
        return res
          .status(400)
          .json({ Confirmation: "FAIL", Message: "No files were uploaded" });
      }

      let file = req.files.File;
      if (!file) {
        return res
          .status(400)
          .json({ Confirmation: "FAIL", Message: "No files were uploaded" });
      }

      let { mimetype } = file;
      if (mediaArr.indexOf(mimetype) == -1) {
        return res
          .status(403)
          .json({ Confirmation: "FAIL", Message: "File type is invalid" });
      }

      try {
        const response = await upload.uploadFile(file, realm);
        return res.json({
          Confirmation: "SUCCESS",
          Response: {
            File: {
              FileGUID: response.fileGUID,
              FileType: response.fileType
            }
          }
        })
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: error });
      }
    }
  },


  "/upload/update_file": {
    path: "/upload/update_file",
    method: "post",
    middleware: [middlewares.keycloakContentCreateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
      } = req.body;

      const mediaArr = ["text/html"];
      if (!req.files) {
        return res
          .status(400)
          .json({ Confirmation: "FAIL", Message: "No files were uploaded" });
      }

      let file = req.files.File;
      let fileGUID = req.body.FileGUID;
      if (!file) {
        return res
          .status(400)
          .json({ Confirmation: "FAIL", Message: "No files were uploaded" });
      }
      if (!fileGUID) {
        return res
          .status(403)
          .json({ Confirmation: "FAIL", Message: "File guid is requried" });
      }
      let { mimetype } = file;
      if (mediaArr.indexOf(mimetype) == -1) {
        return res
          .status(403)
          .json({ Confirmation: "FAIL", Message: "File type is invalid" });
      }

      try {
        // 1. check file exists
        await helpers.isFileExist(realm, fileGUID, "html");
        // 2. delete old file
        await helpers.deleteFile(realm, fileGUID, "html");
        // 3. upload new file
        const response = await upload.uploadFile(file, realm, fileGUID);

        return res.json({
          Confirmation: "SUCCESS",
          Response: {
            File: {
              FileGUID: response.fileGUID,
              FileType: response.fileType
            }
          }
        })
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: error });
      }
    }
  },


  "/upload/image": {
    path: "/upload/image",
    method: "post",
    middleware: [middlewares.keycloakContentCreateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
      } = req.body;

      const mediaArr = ["image/png", "image/jpeg", "image/jpg", "image/gif"];
      if (!req.files) {
        return res
          .status(400)
          .json({ Confirmation: "FAIL", Message: "No files were uploaded" });
      }

      let file = req.files.File;
      if (!file) {
        return res
          .status(400)
          .json({ Confirmation: "FAIL", Message: "No files were uploaded" });
      }

      let { mimetype, data } = file;
      if (mediaArr.indexOf(mimetype) == -1) {
        return res
          .status(403)
          .json({ Confirmation: "FAIL", Message: "Image type is invalid" });
      }

      try {

        const org = await OrgService.getOrgByRealm(realm);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: 'DB error' });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;

          // 1. createDirIfNotExisted
          const realmDir = `../uploads/${realm}`;
          const realmTempDir = `../uploads/${realm}/temp`;
          await upload.createDirIfNotExisted(realmDir);
          await upload.createDirIfNotExisted(realmTempDir);

          // 2. move image
          const imageGUID = helpers.guid();
          const imageType = mimetype.replace("image/", "");
          const filePath = path.join(__dirname, `../../uploads/${realm}/temp/${imageGUID}.${imageType}`)
          file.mv(filePath, error => {  // move file to temp
            if (error) {
              return res.json({ Confirmation: "FAIL", Message: "Image get size error" });
            }

            // 3. get image dimension
            sizeOf(filePath, function (error, dimensions) {
              if (error) {
                return res.json({ Confirmation: "FAIL", Message: "Image resize error" });
              }

              // 4. remove temp image
              fs.unlink(filePath, error => {
                if (error) {
                  return res.json({ Confirmation: "FAIL", Message: "Image resize error" });
                }

                // 5. resize image
                const {
                  height,
                  width,
                } = dimensions;
                upload.formatImage(imageType, data, async (error, response) => {
                  if (error) {
                    return res.json({ Confirmation: "FAIL", Message: "Image resize error" });
                  }

                  // 6. insert image
                  let image = {
                    ImageGUID: imageGUID,
                    ImageType: mimetype,
                    Height: height,
                    Width: width,
                    ImageData: data,
                    ImageData72X72: response["72X72"],
                    ImageData90X90: response["90X90"],
                    ImageData200X200: response["200X200"],
                    ImageData250X250: response["250X250"],
                    ImageData525X295: response["525X295"],
                    ImageData726X420: response["726X420"]
                  };
                  const imageRes = await ImageService.createImage(OrgDbName, OrgDbPassword, image);
                  return res.json({
                    Confirmation: "SUCCESS",
                    Response: {
                      Image: {
                        ImageGUID: imageRes.ImageGUID,
                        Height: height,
                        Width: width,
                      }
                    }
                  })
                })
              })
            })
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: error });
      }
    }
  },


  "/upload/doc_file": {
    path: "/upload/doc_file",
    method: "post",
    middleware: [middlewares.keycloakContentCreateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {
      if (!req.files) {
        return res
          .status(400)
          .json({ Confirmation: "FAIL", Message: "No files were uploaded" });
      }
      let file = req.files.File;
      if (!file) {
        return res
          .status(400)
          .json({ Confirmation: "FAIL", Message: "No files were uploaded" });
      }

      const officeRegex = /application\/.*?(?:msword|x-ms|vnd\.ms-|officedocument)/;
      let { mimetype } = file;
      if (!officeRegex.test(mimetype)) {
        return res
          .status(403)
          .json({ Confirmation: "FAIL", Message: "Image type is invalid" });
      }
      try {

        const document = await GoogleService.uploadGoogleDoc(file);
        return res.json({
          Confirmation: "SUCCESS",
          Response: {
            GoogleFileGUID: document
          }
        })
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: error });
      }
    }
  },


  "/upload/h5p": {
    path: "/upload/h5p",
    method: "post",
    middleware: [middlewares.keycloakContentCreateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
      } = req.body;

      if (!req.files) {
        return res
          .status(400)
          .json({ Confirmation: "FAIL", Message: "No files were uploaded" });
      }

      let file = req.files.File;
      if (!file) {
        return res
          .status(400)
          .json({ Confirmation: "FAIL", Message: "No files were uploaded" });
      }

      const filename = file.name;
      const regex = /\.[0-9a-z]+$/i;
      const matches = filename.match(regex);
      if (!matches.length) {
        return res
          .status(403)
          .json({ Confirmation: "FAIL", Message: "File type is invalid" });
      }
      const suffix = matches[0];
      if (suffix != '.h5p') {
        return res
          .status(403)
          .json({ Confirmation: "FAIL", Message: "File type is invalid" });
      }

      try {

        const response = await upload.uploadH5pFile(file, realm);
        return res.json({
          Confirmation: "SUCCESS",
          Response: {
            File: {
              FileGUID: response,
              FileType: 'h5p',
            }
          }
        })
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: error });
      }
    }
  },
  

};

export default Controller;
