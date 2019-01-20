// Default
import middlewares from "../../middlewares";

// services
import OrgService from '../../services/OrgService';
import ExperienceStreamService from "../../services/ExperienceStreamService";
import ExperienceChannelService from "../../services/ExperienceChannelService";

// controller
import controllers from "../../controllers";

// Libraries
import validator from "validator";

const Controller = {

  "/stream/list": {
    path: "/stream/list",
    method: "post",
    middleware: [middlewares.keycloakPublishViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
        ChannelLanguageGUID,
        Limit,
        Offset,
        Extra
      } = req.body;

      if (!Limit) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Limit is required" });
      }
      if (!validator.isNumeric(Limit)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Limit must be numeric" });
      }
      if (!Offset) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Offset is required" });
      }
      if (!validator.isNumeric(Offset)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Offset must be numeric" });
      }
      if (!Extra) {
        Extra = {};
      }
      Extra.ChannelLanguageGUID = ChannelLanguageGUID;

      try {

        const org = await OrgService.getOrgByRealm(realm);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;

          const totalRecord = await ExperienceStreamService.experienceStreamListByParams(OrgDbName, OrgDbPassword, true, Limit, Offset, Extra);
          const experienceStreams = await ExperienceStreamService.experienceStreamListByParams(OrgDbName, OrgDbPassword, false, Limit, Offset, Extra);
          if (!experienceStreams.length) {
            return res.json({
              Confirmation: "SUCCESS",
              Response: {
                TotalRecord: totalRecord,
                ExperienceStreams: experienceStreams
              }
            })
          }

          const formattedExperienceStreams = await ExperienceStreamService.formatExperienceStreamList(OrgDbName, OrgDbPassword, experienceStreams);
          return res.json({
            Confirmation: "SUCCESS",
            Response: {
              TotalRecord: totalRecord,
              ExperienceStreams: formattedExperienceStreams
            }
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/stream/create": {
    path: "/stream/create",
    method: "post",
    middleware: [middlewares.keycloakPublishCreateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub,
        },
        ExperienceGUID,
        ExperienceChannelGUID
      } = req.body;

      if (!ExperienceGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience guid is required" });
      }
      if (!ExperienceChannelGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience channel guid is required" });
      }

      try {

        const org = await OrgService.getOrgByRealm(realm);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;

          const experience = await controllers.experience.findById(OrgDbName, OrgDbPassword, ExperienceGUID, false);
          const { ExperienceTitle, ExperienceStreams } = experience;

          const experienceChannel = await ExperienceChannelService.getExperienceChannelByGUID(OrgDbName, OrgDbPassword, ExperienceChannelGUID);
          const { ExperienceChannelID } = experienceChannel;

          let experienceStream = {
            ExperienceGUID,
            ExperienceChannelID
          };

          const experienceStreamList = await ExperienceStreamService.experienceStreamList(OrgDbName, OrgDbPassword, experienceStream);

          if (experienceStreamList.length) {
            return res.json({ Confirmation: "FAIL", Message: "Experience stream already existed" });
          }

          experienceStream.ExperienceTitle = ExperienceTitle;
          experienceStream.ExperienceClicks = 0;
          experienceStream.CreatedBy = sub;

          const experienceStreamRes = await ExperienceStreamService.createExperienceStream(OrgDbName, OrgDbPassword, experienceStream);

          const {
            ExperienceStreamID,
            ExperienceStreamGUID,
            ExperienceClicks,
            CreatedAt,
          } = experienceStreamRes;

          ExperienceStreams.push(ExperienceStreamID);
          let updateExperience = { ExperienceStreams };

          const experienceRes = await controllers.experience.update(OrgDbName, OrgDbPassword, ExperienceGUID, updateExperience);

          const experienceChannelRes = await ExperienceChannelService.getExperienceChannelByID(OrgDbName, OrgDbPassword, ExperienceChannelID);

          return res.json({
            Confirmation: "SUCCESS",
            Response: {
              ExperienceStream: {
                ExperienceStreamGUID,
                ExperienceGUID,
                ExperienceTitle,
                ExperienceClicks,
                CreatedAt,
                UpdatedAt: "",
                ExperienceChannelGUID: experienceChannelRes.ExperienceChannelGUID,
                ChannelName: experienceChannelRes.ChannelName,
                ChannelColor: experienceChannelRes.ChannelColor
              }
            }
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/stream/delete": {
    path: "/stream/delete",
    method: "post",
    middleware: [middlewares.keycloakPublishDeleteEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
        ExperienceStreamGUID
      } = req.body;

      if (!ExperienceStreamGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience stream guid is required" });
      }

      try {

        const org = await OrgService.getOrgByRealm(realm);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;

          const experienceStream = await ExperienceStreamService.getExperienceStreamByGUID(OrgDbName, OrgDbPassword, ExperienceStreamGUID);
          const { ExperienceStreamID, ExperienceGUID, ExperienceChannelID } = experienceStream;

          const experience = await controllers.experience.findById(OrgDbName, OrgDbPassword, ExperienceGUID);
          const { ExperienceStreams } = experience;

          const pendingExperienceStreams = await ExperienceStreamService.pendingExperienceStreamListByExperienceGUID(OrgDbName, OrgDbPassword, ExperienceGUID, ExperienceChannelID);
          experience.ExperienceStreams = pendingExperienceStreams;

          await ExperienceStreamService.deleteExperienceStream(OrgDbName, OrgDbPassword, ExperienceStreamID);

          let StreamIndex = ExperienceStreams.indexOf(ExperienceStreamID);
          ExperienceStreams.splice(StreamIndex);

          await controllers.experience.update(OrgDbName, OrgDbPassword, ExperienceGUID, { ExperienceStreams });

          return res.json({
            Confirmation: "SUCCESS",
            Response: {
              Experience: experience
            }
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/stream/pending_stream_list_by_channel_guid": {
    path: "/stream/pending_stream_list_by_channel_guid",
    method: "post",
    middleware: [middlewares.keycloakPublishViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
        ExperienceChannelGUID,
        Limit,
        Offset,
        Extra
      } = req.body;

      if (!ExperienceChannelGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience channel guid is required" });
      }
      if (!Limit) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Limit is required" });
      }
      if (!validator.isNumeric(Limit)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Limit must be numeric" });
      }
      if (!Offset) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Offset is required" });
      }
      if (!validator.isNumeric(Offset)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Offset must be numeric" });
      }
      if (!Extra) {
        Extra = {};
      }

      try {

        const org = await OrgService.getOrgByRealm(realm);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;

          const experienceStreamList = await ExperienceStreamService.experienceStreamListByParams(OrgDbName, OrgDbPassword, false, "-1", "0", { ExperienceChannelGUID });

          let params = [];
          experienceStreamList.forEach(experienceStream => {
            params.push(experienceStream.ExperienceGUID);
          });

          const pendingExperience = await controllers.experience.pendingExperiencesByChannel(OrgDbName, OrgDbPassword, Limit, Offset, Extra, params);
          const { experiences, totalRecord } = pendingExperience;

          return res.json({
            Confirmation: "SUCCESS",
            Response: {
              TotalRecord: totalRecord,
              Experiences: experiences
            }
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/stream/live_stream_list_by_channel_guid": {
    path: "/stream/live_stream_list_by_channel_guid",
    method: "post",
    middleware: [middlewares.keycloakPublishViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
        ExperienceChannelGUID,
        Limit,
        Offset,
        Extra
      } = req.body;

      if (!ExperienceChannelGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience channel guid is required" });
      }
      if (!Limit) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Limit is required" });
      }
      if (!validator.isNumeric(Limit)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Limit must be numeric" });
      }
      if (!Offset) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Offset is required" });
      }
      if (!validator.isNumeric(Offset)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Offset must be numeric" });
      }
      if (!Extra) {
        Extra = {};
      }
      Extra.ExperienceChannelGUID = ExperienceChannelGUID;

      try {

        const org = await OrgService.getOrgByRealm(realm);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;

          const experienceStreamList = await ExperienceStreamService.experienceStreamListByParams(OrgDbName, OrgDbPassword, false, Limit, Offset, Extra);
          const totalRecord = await ExperienceStreamService.experienceStreamListByParams(OrgDbName, OrgDbPassword, true, Limit, Offset, Extra);

          return res.json({
            Confirmation: "SUCCESS",
            Response: {
              TotalRecord: totalRecord,
              ExperienceStreams: experienceStreamList
            }
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  }


};

export default Controller;
