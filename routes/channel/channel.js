// Default
import middlewares from "../../middlewares";

// services
import OrgService from "../../services/OrgService";
import ExperienceChannelService from "../../services/ExperienceChannelService";
import ExperienceStreamService from "../../services/ExperienceStreamService";

// controller
import controllers from "../../controllers";

// Libraries
import validator from "validator";

const Controller = {

  "/channel/list": {
    path: "/channel/list",
    method: "post",
    middleware: [middlewares.keycloakChannelViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
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

      try {

        const org = await OrgService.getOrgByRealm(realm);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;

          const experienceChannels = await ExperienceChannelService.experienceChannelListByParams(OrgDbName, OrgDbPassword, false, Limit, Offset, Extra);
          const totalRecord = await ExperienceChannelService.experienceChannelListByParams(OrgDbName, OrgDbPassword, true, Limit, Offset, Extra);
          return res.json({
            Confirmation: "SUCCESS",
            Response: {
              TotalRecord: totalRecord,
              ExperienceChannels: experienceChannels
            }
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/channel/create": {
    path: "/channel/create",
    method: "post",
    middleware: [middlewares.keycloakChannelCreateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub,
        },
        ChannelName,
        ChannelDescription,
        ChannelColor,
        ChannelType,
        ChannelCode,
        ChannelLanguageGUID,
      } = req.body;

      if (!ChannelName) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Channel name is required" });
      }
      if (ChannelName.length > 255) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Channel name must be less than or equal 255 characters" });
      }
      if (!ChannelColor) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Channel color is required" });
      }
      if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(ChannelColor)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Channel color is invalid" });
      }
      if (["0", "1", "2"].indexOf(ChannelType) == -1) {
        return res.status(401).json({ Confirmation: "FAIL", Message: "ChannelType is invalid, must be one of [0, 1, 2]" });
      }
      if (ChannelCode) {
        ChannelCode = ChannelCode.trim();
      }
      if (ChannelType == '2' && !ChannelCode) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Channel code is required" });
      }
      if (ChannelType == '2' && ChannelCode) {
        if (ChannelCode.length > 255)
          return res.status(403).json({ Confirmation: "FAIL", Message: "Channel code must be less than or equal 255 characters" });
      }
      if (!ChannelLanguageGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Channel language guid is required" });
      }

      let experienceChannel = {
        ChannelName: ChannelName.trim(),
        ChannelColor: ChannelColor.trim(),
        ChannelType,
        ChannelLanguageGUID,
        CreatedBy: sub,
      };
      if (ChannelDescription) {
        experienceChannel.ChannelDescription = ChannelDescription.trim();
      }
      if (ChannelType == '2') {
        experienceChannel.ChannelCode = ChannelCode;
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

          if (ChannelType == '2') {
            let searchParams = {
              ChannelCode,
              IsDeleted: 0
            };
            const searchExperienceChannel = await ExperienceChannelService.experienceChannelList(OrgDbName, OrgDbPassword, searchParams);
            if (searchExperienceChannel.length) {
              return res.json({ Confirmation: "FAIL", Message: "Experience channel code already existed" });
            }
          }
          const experienceChannelRes = await ExperienceChannelService.createExperienceChannel(OrgDbName, OrgDbPassword, experienceChannel);
          return res.json({
            Confirmation: "SUCCESS",
            Response: {
              ExperienceChannel: {
                ExperienceChannelGUID: experienceChannelRes.ExperienceChannelGUID
              }
            }
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/channel/view": {
    path: "/channel/view",
    method: "post",
    middleware: [middlewares.keycloakChannelViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
        ExperienceChannelGUID
      } = req.body;

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

          const experienceChannel = await ExperienceChannelService.getExperienceChannelByGUID(OrgDbName, OrgDbPassword, ExperienceChannelGUID);

          if (!experienceChannel) {
            return res.json({ Confirmation: "FAIL", Message: "Channel not found" });
          } else {
            const {
              ExperienceChannelGUID,
              ChannelName,
              ChannelDescription,
              ChannelColor,
              ChannelStatus,
              ChannelType,
              ChannelCode,
              ChannelLanguageGUID,
              CreatedAt,
              UpdatedAt
            } = experienceChannel;

            return res.json({
              Confirmation: "SUCCESS",
              Response: {
                ExperienceChannelGUID,
                ChannelName,
                ChannelDescription: ChannelDescription ? ChannelDescription : '',
                ChannelColor,
                ChannelStatus,
                ChannelType,
                ChannelCode: ChannelCode ? ChannelCode : '',
                ChannelLanguageGUID: ChannelLanguageGUID ? ChannelLanguageGUID : '',
                CreatedAt,
                UpdatedAt: UpdatedAt ? UpdatedAt : ''
              }
            })
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/channel/update": {
    path: "/channel/update",
    method: "post",
    middleware: [middlewares.keycloakChannelUpdateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub,
        },
        ExperienceChannelGUID,
        ChannelName,
        ChannelDescription,
        ChannelColor,
        ChannelStatus,
        ChannelType,
        ChannelCode,
        ChannelLanguageGUID,
      } = req.body;

      if (!ExperienceChannelGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience channel guid is required" });
      }
      if (ChannelName && ChannelName.length > 255) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Channel name must be less than or equal 255 characters" });
      }
      if (ChannelColor && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(ChannelColor)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Channel color is invalid" });
      }
      if (ChannelStatus && ["DRAFT", "LIVE"].indexOf(ChannelStatus) == -1) {
        return res.status(401).json({ Confirmation: "FAIL", Message: "Channel status is invalid, must be one of [DRAFT, LIVE]" });
      }
      if (ChannelType && ['0', '1', '2'].indexOf(ChannelType) == -1) {
        return res.status(401).json({ Confirmation: "FAIL", Message: "ChannelType is invalid, must be one of [0, 1, 2]" });
      }
      if (ChannelCode) {
        ChannelCode = ChannelCode.trim();
      }
      if (ChannelType == '2' && !ChannelCode) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Channel code is required" });
      }
      if (ChannelType == '2' && ChannelCode) {
        if (ChannelCode.length > 255)
          return res.status(403).json({ Confirmation: "FAIL", Message: "Channel code must be less than or equal 255 characters" });
      }

      if (!ChannelName &&
        !ChannelDescription &&
        !ChannelColor &&
        !ChannelStatus &&
        !ChannelType &&
        !ChannelLanguageGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Update field(s) is required" });
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

          const experienceChannel = await ExperienceChannelService.getExperienceChannelByGUID(OrgDbName, OrgDbPassword, ExperienceChannelGUID);

          if (!experienceChannel) {
            return res.json({ Confirmation: "FAIL", Message: "Channel not found" });
          } else {
            const { ExperienceChannelID } = experienceChannel;
            const tmpChannelType = experienceChannel.ChannelType;

            if (tmpChannelType == '3' && (ChannelLanguageGUID)) {
              return res.json({ Confirmation: "FAIL", Message: "General channel language cannot be changed" });
            }
            let updateExperienceChannel = {
              UpdatedBy: sub,
            };
            if (ChannelName) {
              updateExperienceChannel.ChannelName = ChannelName.trim();
            }
            if (ChannelDescription) {
              updateExperienceChannel.ChannelDescription = ChannelDescription.trim();
            }
            if (ChannelColor) {
              updateExperienceChannel.ChannelColor = ChannelColor.trim();
            }
            if (ChannelStatus) {
              updateExperienceChannel.ChannelStatus = ChannelStatus;
            }
            if (ChannelType) {
              updateExperienceChannel.ChannelType = ChannelType;
              if (ChannelType == '2') {
                if (ChannelCode) {
                  updateExperienceChannel.ChannelCode = ChannelCode;
                }
              } else {
                updateExperienceChannel.ChannelCode = '';
              }
            }
            if (ChannelLanguageGUID) {
              updateExperienceChannel.ChannelLanguageGUID = ChannelLanguageGUID;
            }

            if (ChannelType == '2') {
              if (ChannelCode) {
                const searchExperienceChannel = await ExperienceChannelService.experienceChannelListV2(OrgDbName, OrgDbPassword, ExperienceChannelID, ChannelCode);
                if (searchExperienceChannel.length) {
                  return res.json({ Confirmation: "FAIL", Message: "Experience channel code already existed" });
                }
              }
            }

            await ExperienceChannelService.updateExperienceChannel(OrgDbName, OrgDbPassword, ExperienceChannelID, updateExperienceChannel);

            const experienceChannelRes = await ExperienceChannelService.getExperienceChannelByID(OrgDbName, OrgDbPassword, ExperienceChannelID);
            if (!experienceChannelRes) {
              return res.json({ Confirmation: "FAIL", Message: "Channel not found" });
            } else {

              const {
                ExperienceChannelGUID,
                ChannelName,
                ChannelDescription,
                ChannelColor,
                ChannelStatus,
                ChannelType,
                ChannelCode,
                ChannelLanguageGUID,
                CreatedAt,
                UpdatedAt
              } = experienceChannelRes;

              const experienceStreams = await ExperienceStreamService.experienceStreamList(OrgDbName, OrgDbPassword, { ExperienceChannelID });
              let tmpExperienceStreams = [];
              experienceStreams.forEach((experienceStream, index) => {
                const {
                  ExperienceStreamGUID,
                  ExperienceGUID,
                  ExperienceTitle,
                  CreatedAt,
                  UpdatedAt
                } = experienceStream;
                const item = {
                  ExperienceStreamGUID,
                  ExperienceGUID,
                  ExperienceTitle,
                  CreatedAt,
                  UpdatedAt: UpdatedAt ? UpdatedAt : ""
                };
                tmpExperienceStreams.push(item);
              });
              return res.json({
                Confirmation: "SUCCESS",
                Response: {
                  ExperienceChannel: {
                    ExperienceChannelGUID,
                    ChannelName,
                    ChannelDescription,
                    ChannelColor,
                    ChannelStatus,
                    ChannelType,
                    ChannelCode,
                    ChannelLanguageGUID,
                    CreatedAt,
                    UpdatedAt,
                    ExperienceStreams: tmpExperienceStreams
                  }
                }
              })
            }
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/channel/delete": {
    path: "/channel/delete",
    method: "post",
    middleware: [middlewares.keycloakChannelDeleteEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub,
        },
        ExperienceChannelGUID,
      } = req.body;

      if (!ExperienceChannelGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "ExperienceChannelGUID is required" });
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

          const experienceChannel = await ExperienceChannelService.getExperienceChannelByGUID(OrgDbName, OrgDbPassword, ExperienceChannelGUID);

          if (!experienceChannel) {
            return res.json({ Confirmation: "FAIL", Message: "Channel not found" });
          } else {
            const { ExperienceChannelID, ChannelType } = experienceChannel;

            if (ChannelType == '3') {
              return res.json({ Confirmation: "FAIL", Message: "Channel is invalid to delete" });
            }

            await ExperienceChannelService.deleteExperienceChannel(OrgDbName, OrgDbPassword, ExperienceChannelID, sub);
            const experienceStreams = await ExperienceStreamService.getExperienceStreamByChannelID(OrgDbName, OrgDbPassword, ExperienceChannelID);

            let tasks = [];
            experienceStreams.forEach(stream => {
              let task = new Promise(async (resolve, reject) => {
                const experience = await controllers.experience.findById(OrgDbName, OrgDbPassword, stream.ExperienceGUID);
                const { ExperienceStreams } = experience;
                await ExperienceStreamService.deleteExperienceStream(OrgDbName, OrgDbPassword, stream.ExperienceStreamID);

                let StreamIndex = ExperienceStreams.indexOf(stream.ExperienceStreamID);
                if (StreamIndex != -1)
                  ExperienceStreams.splice(StreamIndex);
                controllers.experience.update(OrgDbName, OrgDbPassword, stream.ExperienceGUID, { ExperienceStreams })
                  .then(() => {
                    resolve();
                    return;
                  })
                  .catch(error => {
                    reject(error);
                    return;
                  })
              })
              tasks.push(task);
            })
            await Promise.all(tasks);

            return res.json({
              Confirmation: "SUCCESS",
              Message: 'Channel has been deleted'
            })
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/channel/sync_channel_code": {
    path: "/channel/sync_channel_code",
    method: "post",
    middleware: [middlewares.keycloakChannelViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
        ChannelCode,
        ExperienceChannelGUID,
      } = req.body;

      if (!ChannelCode) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Channel code is required" });
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

          let searchParams = {
            ChannelType: '2',
            ChannelCode: ChannelCode.trim(),
            IsDeleted: 0
          };

          if (ExperienceChannelGUID) {

            const experienceChannel = await ExperienceChannelService.getExperienceChannelByGUID(OrgDbName, OrgDbPassword, ExperienceChannelGUID);
            if (!experienceChannel) {
              return res.json({ Confirmation: "FAIL", Message: "Channel not found" });
            } else {

              const { ExperienceChannelID } = experienceChannel;
              const searchExperienceChannel = await ExperienceChannelService.experienceChannelListV2(OrgDbName, OrgDbPassword, ExperienceChannelID, ChannelCode.trim());
              if (searchExperienceChannel.length) {
                return res.json({ Confirmation: "FAIL", Message: "Experience channel code already existed" });
              }

              return res.json({
                Confirmation: "SUCCESS",
                Message: 'Channel code is available'
              })
            }
          } else {

            const searchExperienceChannel = await ExperienceChannelService.experienceChannelList(OrgDbName, OrgDbPassword, searchParams);
            if (searchExperienceChannel.length) {
              return res.json({ Confirmation: "FAIL", Message: "Experience channel code already existed" });
            }
            return res.json({
              Confirmation: "SUCCESS",
              Message: 'Channel code is available'
            })
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/channel/language_list": {
    path: "/channel/language_list",
    method: "post",
    middleware: [middlewares.keycloakChannelViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
      } = req.body;

      try {

        const org = await OrgService.getOrgByRealm(realm);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;

          const languagesResponse = await controllers.language.list(OrgDbName, OrgDbPassword, -1, 0, {});
          return res.json({
            Confirmation: "SUCCESS",
            Response: {
              TotalRecord: languagesResponse.length,
              Languages: languagesResponse
            }
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },



};

export default Controller;
