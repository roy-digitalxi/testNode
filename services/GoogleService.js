import path from "path";
import Promise from "bluebird";
import google from "googleapis";
import async from "async";

// helpers
import * as helpers from "../utilities/helpers";

const uploadGoogleDoc = uploadFile => {
  let drive = google.drive("v3");
  let key = require(path.join(__dirname, "../cert/google_cert.json"));
  let jwtClient = new google.auth.JWT(
    key.client_email,
    null, // pem
    key.private_key,
    ["https://www.googleapis.com/auth/drive"], // an array of auth scopes
    null // User to impersonate (leave empty if no impersonation needed)
  );

  return new Promise((resolve, reject) => {
    jwtClient.authorize((error, tokens) => {
      if (error) {
        reject(error);
        return;
      }
      let fileMetadata = {
        name: helpers.guid(),
        mimeType: "application/vnd.google-apps.document"
      };
      let media = {
        mimeType: "application/msword",
        body: uploadFile.data,
        parents: ["1oc1NYKiVSVao9NTE0lHWRojLeYLB7iQD"]
      };

      // 1. insert file into source folder
      drive.files.create(
        {
          auth: jwtClient,
          resource: fileMetadata,
          media: media
        },
        (error, resp) => {
          if (error) {
            reject(error);
            return;
          }

          // 2. create permission for editor
          let uploaded = resp;
          let fileId = uploaded.id;
          let permissions = [
            {
              type: "anyone",
              role: "writer"
            }
          ];
          async.eachSeries(
            permissions,
            (permission, permissionCallback) => {
              drive.permissions.create(
                {
                  auth: jwtClient,
                  resource: permission,
                  fileId: fileId,
                  fields: "id"
                },
                (error, resp) => {
                  if (error) {
                    permissionCallback(error, null);
                  }
                  permissionCallback(null, resp);
                }
              );
            },
            (error, resp) => {
              if (error) {
                reject(error);
                return;
              }

              resolve(fileId);
              return;
            }
          );
        }
      );
    });
  });
};

export default {
  uploadGoogleDoc
};
