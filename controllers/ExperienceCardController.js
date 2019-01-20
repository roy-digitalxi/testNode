// Libraries
import Promise from "bluebird";
import mongoose from 'mongoose';

// helpers
import * as helpers from "../utilities/helpers";

// Model
import ExperienceCard from "../models/mongodb/ExperienceCard";

const connectDB = (dbName, dbPassword) => {
  const dbUserName = dbName;
  return mongoose.createConnection(`mongodb://${dbUserName}:${dbPassword}@localhost/${dbName}`);
}

export default {

  create: (dbName, dbPassword, experienceCard) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const experienceCardSchema = connection.model('ExperienceCardSchema', ExperienceCard.ExperienceCardSchema);

      experienceCardSchema.create(experienceCard, (error, experienceCard) => {

        connection.close();

        if (error) {
          reject(error);
          return;
        }
        resolve(experienceCard.summary());
        return;
      }
      );
    });
  },

  update: (dbName, dbPassword, experienceCardGUID, experienceCard) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const experienceCardSchema = connection.model('ExperienceCardSchema', ExperienceCard.ExperienceCardSchema);

      experienceCard.UpdatedAt = helpers.currentDatetime();
      experienceCardSchema.findByIdAndUpdate(experienceCardGUID, experienceCard, (error, experienceCard) => {

        connection.close();

        if (error) {
          reject(error);
          return;
        }
        if (!experienceCard) {
          reject("Experience card not found");
          return;
        }
        resolve(experienceCard.summary());
        return;
      });
    });
  },

  find: (dbName, dbPassword, params, isRaw) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const experienceCardSchema = connection.model('ExperienceCardSchema', ExperienceCard.ExperienceCardSchema);

      experienceCardSchema.find(params, (error, experienceCards) => {

        connection.close();

        if (error) {
          reject(error);
          return;
        }
        if (isRaw) {
          resolve(experienceCards);
          return;
        }
        let summaries = [];
        experienceCards.forEach(experienceCard => {
          summaries.push(experienceCard.summary());
        });
        resolve(summaries);
        return;
      });
    });
  },

  findById: (dbName, dbPassword, experienceCardGUID, isRaw) => {

    return new Promise((resolve, reject) => {
      const connection = connectDB(dbName, dbPassword);
      const experienceCardSchema = connection.model('ExperienceCardSchema', ExperienceCard.ExperienceCardSchema);

      experienceCardSchema.findById(experienceCardGUID, (error, experienceCard) => {

        connection.close();

        if (error) {
          reject(error);
          return;
        }
        if (!experienceCard) {
          reject("Experience card not found");
          return;
        }
        if (isRaw) {
          resolve(experienceCard);
          return;
        }
        resolve(experienceCard.summary());
        return;
      });
    });
  }
  
};
