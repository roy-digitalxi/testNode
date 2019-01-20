import nodemailer from "nodemailer";
import Promise from "bluebird";
import constants from "../constants";

export const sendEmail = emailOptions => {
  return new Promise(function(resolve, reject) {
    let transporter = nodemailer.createTransport({
      service: constants.NODE_EMAIL_SERVICE,
      auth: {
        type: constants.NODE_EMAIL_TYPE,
        user: constants.NODE_EMAIL_USER,
        clientId: constants.NODE_EMAIL_CLIENT_ID,
        clientSecret: constants.NODE_EMAIL_CLIENT_SECRET,
        refreshToken: constants.NODE_EMAIL_REFRESH_TOKEN,
        accessToken: constants.NODE_EMAIL_ACCESS_TOKEN
      }
    });
    transporter.sendMail(emailOptions, function(err, response) {
      if (err) {
        reject(err);
        return;
      }
      resolve(response);
      return;
    });
  });
};
