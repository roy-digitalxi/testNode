import Promise from "bluebird";
import twilio from "twilio";
import constants from "../constants";

export const sendSms = (phoneNumber, content) => {
  let { TWILIO_SID, TWILIO_TOKEN, TWILIO_NUMBER } = constants;
  const client = new twilio(TWILIO_SID, TWILIO_TOKEN);

  return new Promise((resolve, reject) => {
    client.messages
      .create({
        body: content,
        to: phoneNumber,
        from: TWILIO_NUMBER
      })
      .then(response => {
        resolve(response);
        return;
      })
      .catch(error => {
        reject(error);
        return;
      });
  });
};
