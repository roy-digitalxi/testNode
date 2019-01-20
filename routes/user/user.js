// Default
import middlewares from "../../middlewares";

// services
import OrgService from '../../services/OrgService';
import ApiKeyService from '../../services/ApiKeyService';
import UserService from '../../services/UserService';
import KeycloakService from '../../services/KeycloakService';
import ExperienceChannelService from "../../services/ExperienceChannelService";
import ChannelSubscribeService from "../../services/ChannelSubscribeService";
import ExperienceStreamService from "../../services/ExperienceStreamService";

// controller
import controllers from "../../controllers";

// helpers
import * as helpers from '../../utilities/helpers';

// Libraries
import validator from "validator";

// Constants
import constants from "../../constants";

const Controller = {

  "/user/heart_beat_v0": {
    path: "/user/heart_beat_v0",
    method: "post",
    middleware: [middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      const {
        OrgUrl,
        ApiKey,
      } = req.body;

      if (!OrgUrl) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "OrgUrl is required" });
      }

      try {

        const org = await OrgService.getOrgByOrgUrl(OrgUrl);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;

          const {
            CONFIG: {
              LINKS,
            }
          } = constants;

          // 1. info
          const apiKeyList = await ApiKeyService.apiKeyList({ KeyGUID: ApiKey });
          const languages = await controllers.language.availableList(OrgDbName, OrgDbPassword);
          const defaultLanguage = await controllers.language.defaultLanguage(OrgDbName, OrgDbPassword);
          const userApiKey = apiKeyList[0];
          if (userApiKey) {
            if (languages) {
              return res.json({
                Confirmation: "SUCCESS",
                Response: {
                  Version: userApiKey.Version,
                  Languages: languages,
                  DefaultLanguage: defaultLanguage,
                  Links: LINKS,
                  StoreConfig: {
                    appName: 'PublishXi',
                    appStoreId: 1434983463,
                    appStoreLocal: 'us',
                    playStoreId: 'com.orgmobilern'
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


  "/user/heart_beat": {
    path: "/user/heart_beat",
    method: "post",
    middleware: [middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      const {
        KeycloakUser: {
          realm,
          sub,
        },
        ApiKey,
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

          const {
            CONFIG: {
              LINKS,
            }
          } = constants;

          // 1. check user is settled
          let isSettled = false;
          const activeUser = await UserService.getUserByUserID(realm, sub);
          let activeUserAttrs = await UserService.getUserAttrsByUserID(sub);

          const assignedRoles = await UserService.getUserRolesByUserID(realm, sub);
          const assignedRealmRoles = assignedRoles.realmMappings;
          assignedRealmRoles.map(item1 => {
            let found = false;
            constants.keycloakRealmRoles.map(item2 => {
              if (item1.name == item2.value) {
                found = true;
              }
            })
            if (found) {
              isSettled = true;
            }
          })

          if (!isSettled) {
            // 1.1 realm roles
            const realmRoles = await KeycloakService.getKeycloakRealmRoles(realm);
            let updateRealmRoles = [];
            const assignRoles = [
              {
                type: 'keycloakUser',
                value: 'user'
              }
            ];
            assignRoles.map(item1 => {
              realmRoles.map(item2 => {
                if (item1.value == item2.name) {
                  updateRealmRoles.push(item2);
                }
              })
            })
            // 1.2 assign user role to self-register user
            await UserService.addRealmRolesToUser(realm, sub, updateRealmRoles);
            // 1.3 update user attributes
            const selfRegisterFilter = activeUserAttrs.filter(item => item.IsSelfRegistered);
            let selfRegister;
            if (selfRegisterFilter.length) {
              selfRegister = selfRegisterFilter[0];
            }
            if (!selfRegisterFilter.length || (selfRegister && selfRegister.VALUE == '0')) {
              if (!activeUser.attributes) {
                activeUser.attributes = {};
                activeUser.attributes.IsSelfRegistered = ['1'];
              } else {
                activeUser.attributes.IsSelfRegistered = ['1'];
              }
              await UserService.updateUser(realm, activeUser);

              activeUserAttrs = await UserService.getUserAttrsByUserID(sub);
            }
          }

          // 2. info
          const apiKeyList = await ApiKeyService.apiKeyList({ KeyGUID: ApiKey });
          const languages = await controllers.language.availableList(OrgDbName, OrgDbPassword);
          const defaultLanguage = await controllers.language.defaultLanguage(OrgDbName, OrgDbPassword);
          const userApiKey = apiKeyList[0];
          if (userApiKey) {
            if (languages) {

              const userObj = {
                UserGUID: sub,
                FirstName: activeUser.firstName,
                LastName: activeUser.lastName,
                Attributes: activeUserAttrs
              };
              return res.json({
                Confirmation: "SUCCESS",
                Response: {
                  User: userObj,
                  Version: userApiKey.Version,
                  Languages: languages,
                  DefaultLanguage: defaultLanguage,
                  Links: LINKS,
                  StoreConfig: {
                    appName: 'PublishXi',
                    appStoreId: 1434983463,
                    appStoreLocal: 'us',
                    playStoreId: 'com.orgmobilern'
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


  "/user/channel_list": {
    path: "/user/channel_list",
    method: "post",
    middleware: [middlewares.keycloakUserViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub,
        },
        ChannelLanguageGUID,
        Limit,
        Offset,
        Extra,
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

      Extra.UserGUID = sub;
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

          const experienceChannels = await ExperienceChannelService.userExperienceChannelListByParams(OrgDbName, OrgDbPassword, false, Limit, Offset, Extra);
          const totalRecord = await ExperienceChannelService.userExperienceChannelListByParams(OrgDbName, OrgDbPassword, true, Limit, Offset, Extra);

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


  "/user/subscribe_channel_list": {
    path: "/user/subscribe_channel_list",
    method: "post",
    middleware: [middlewares.keycloakUserViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub,
        },
        Limit,
        Offset,
        Extra,
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

      Extra.UserGUID = sub;

      try {

        const org = await OrgService.getOrgByRealm(realm);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;

          const channelSubscribes = await ChannelSubscribeService.channelSubscribeListByParams(OrgDbName, OrgDbPassword, false, Limit, Offset, Extra);
          const totalRecord = await ChannelSubscribeService.channelSubscribeListByParams(OrgDbName, OrgDbPassword, true, Limit, Offset, Extra);
          return res.json({
            Confirmation: "SUCCESS",
            Response: {
              TotalRecord: totalRecord,
              ChannelSubscribes: channelSubscribes
            }
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/user/subscribe_channel": {
    path: "/user/subscribe_channel",
    method: "post",
    middleware: [middlewares.keycloakUserCreateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub,
        },
        ExperienceChannelGUID,
        IsHardInterest,
      } = req.body;

      if (!ExperienceChannelGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience channel guid is required" });
      }
      if (IsHardInterest && ["1"].indexOf(IsHardInterest) == -1) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Is hard interest is invalid, must be one of [0, 1]" });
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
          const {
            ExperienceChannelID,
            ChannelType,
            ChannelStatus,
          } = experienceChannel;

          if (!ExperienceChannelID) {
            return res.json({ Confirmation: "FAIL", Message: "Experience channel not found" });
          }
          if (["0", "1", "2", "3"].indexOf(ChannelType) == -1) {
            return res.json({ Confirmation: "FAIL", Message: "ChannelType is invalid" });
          }
          if (ChannelStatus != 'LIVE') {
            return res.json({ Confirmation: "FAIL", Message: "Channel stateus is invalid" });
          }

          let channelSubscribe = {
            UserGUID: sub,
            ExperienceChannelID
          };

          const channelSubscribeList = await ChannelSubscribeService.channelSubscribeList(OrgDbName, OrgDbPassword, channelSubscribe);
          const experienceChannelRes = await ExperienceChannelService.getExperienceChannelByID(OrgDbName, OrgDbPassword, ExperienceChannelID);

          let formattedExperienceChannel = {
            ExperienceChannelGUID: experienceChannelRes.ExperienceChannelGUID,
            ChannelName: experienceChannelRes.ChannelName,
            ChannelDescription: experienceChannelRes.ChannelDescription ? experienceChannelRes.ChannelDescription : '',
            ChannelColor: experienceChannelRes.ChannelColor,
            ChannelStatus: experienceChannelRes.ChannelStatus,
            ChannelType: experienceChannelRes.ChannelType,
            CreatedAt: experienceChannelRes.CreatedAt,
            UpdatedAt: experienceChannelRes.UpdatedAt ? experienceChannelRes.UpdatedAt : '',
            IsSubscribed: 1
          };

          if (channelSubscribeList.length) {

            const channelSubscribe = channelSubscribeList[0];
            const {
              ChannelSubscribeID,
              IsDeleted,
            } = channelSubscribe;
            if (!IsDeleted) {

              if (IsHardInterest) {

                await ChannelSubscribeService.updateChannelSubscribe(OrgDbName, OrgDbPassword, ChannelSubscribeID, { IsHardInterest })

                return res.json({
                  Confirmation: "SUCCESS",
                  Response: {
                    ChannelSubscribe: {
                      ChannelSubscribeGUID: channelSubscribe.ChannelSubscribeGUID
                    },
                    ExperienceChannel: formattedExperienceChannel
                  }
                })
              } else {

                return res.json({
                  Confirmation: "SUCCESS",
                  Response: {
                    ChannelSubscribe: {
                      ChannelSubscribeGUID: channelSubscribe.ChannelSubscribeGUID
                    },
                    ExperienceChannel: formattedExperienceChannel
                  }
                })
              }
            } else {

              if (ChannelType == 2) {
                return res.json({ Confirmation: "FAIL", Message: "ChannelType is invalid" });
              }
              let updateChannelSubscribe = {
                IsDeleted: 0
              };
              if (IsHardInterest) {
                updateChannelSubscribe.IsHardInterest = IsHardInterest;
              }
              await ChannelSubscribeService.updateChannelSubscribe(OrgDbName, OrgDbPassword, ChannelSubscribeID, updateChannelSubscribe)

              const channelSubscribeRes = await ChannelSubscribeService.getChannelSubscribeByID(OrgDbName, OrgDbPassword, ChannelSubscribeID);

              return res.json({
                Confirmation: "SUCCESS",
                Response: {
                  ChannelSubscribe: {
                    ChannelSubscribeGUID: channelSubscribeRes.ChannelSubscribeGUID
                  },
                  ExperienceChannel: formattedExperienceChannel
                }
              })
            }
          } else {

            if (ChannelType == 2) {
              return res.json({ Confirmation: "FAIL", Message: "ChannelType is invalid" });
            }
            if (IsHardInterest) {
              channelSubscribe.IsHardInterest = IsHardInterest;
            }
            const channelSubscribeRes = await ChannelSubscribeService.createChannelSubscribe(OrgDbName, OrgDbPassword, channelSubscribe)
            return res.json({
              Confirmation: "SUCCESS",
              Response: {
                ChannelSubscribe: {
                  ChannelSubscribeGUID: channelSubscribeRes.ChannelSubscribeGUID
                },
                ExperienceChannel: formattedExperienceChannel
              }
            })
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/user/subscribe_invite_channel": {
    path: "/user/subscribe_invite_channel",
    method: "post",
    middleware: [middlewares.keycloakUserCreateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub,
        },
        ChannelCode,
      } = req.body;

      if (!ChannelCode) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Channel code is required" });
      }
      ChannelCode = ChannelCode.trim();

      try {

        const org = await OrgService.getOrgByRealm(realm);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;

          const experienceChannels = await ExperienceChannelService.experienceChannelList(OrgDbName, OrgDbPassword, { ChannelType: '2', ChannelCode, ChannelStatus: 'LIVE' });
          if (!experienceChannels.length) {
            return res.json({ Confirmation: "FAIL", Message: "Experience channel not found" });
          }

          const experienceChannel = experienceChannels[0];
          const {
            ExperienceChannelID,
          } = experienceChannel;
          if (!ExperienceChannelID) {
            return res.json({ Confirmation: "FAIL", Message: "Experience channel not found" });
          }

          let channelSubscribe = {
            UserGUID: sub,
            ExperienceChannelID
          };

          const channelSubscribeList = await ChannelSubscribeService.channelSubscribeList(OrgDbName, OrgDbPassword, channelSubscribe);
          const experienceChannelRes = await ExperienceChannelService.getExperienceChannelByID(OrgDbName, OrgDbPassword, ExperienceChannelID);

          let formattedExperienceChannel = {
            ExperienceChannelGUID: experienceChannelRes.ExperienceChannelGUID,
            ChannelName: experienceChannelRes.ChannelName,
            ChannelDescription: experienceChannelRes.ChannelDescription ? experienceChannelRes.ChannelDescription : '',
            ChannelColor: experienceChannelRes.ChannelColor,
            ChannelStatus: experienceChannelRes.ChannelStatus,
            ChannelType: experienceChannelRes.ChannelType,
            CreatedAt: experienceChannelRes.CreatedAt,
            UpdatedAt: experienceChannelRes.UpdatedAt ? experienceChannelRes.UpdatedAt : '',
            IsSubscribed: 1
          };

          if (channelSubscribeList.length) {

            const channelSubscribe = channelSubscribeList[0];
            const {
              ChannelSubscribeID,
              IsDeleted,
            } = channelSubscribe;
            if (!IsDeleted) {
              return res.json({ Confirmation: "FAIL", Message: "Invitation channel already subscribed" });
            }

            await ChannelSubscribeService.updateChannelSubscribe(OrgDbName, OrgDbPassword, ChannelSubscribeID, { IsDeleted: 0 })

            const channelSubscribeRes = await ChannelSubscribeService.getChannelSubscribeByID(OrgDbName, OrgDbPassword, ChannelSubscribeID)

            return res.json({
              Confirmation: "SUCCESS",
              Response: {
                ChannelSubscribe: {
                  ChannelSubscribeGUID: channelSubscribeRes.ChannelSubscribeGUID
                },
                ExperienceChannel: formattedExperienceChannel
              }
            })
          } else {

            const channelSubscribeRes = await ChannelSubscribeService.createChannelSubscribe(OrgDbName, OrgDbPassword, channelSubscribe)
            return res.json({
              Confirmation: "SUCCESS",
              Response: {
                ChannelSubscribe: {
                  ChannelSubscribeGUID: channelSubscribeRes.ChannelSubscribeGUID
                },
                ExperienceChannel: formattedExperienceChannel
              }
            })
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/user/unsubscribe_channel": {
    path: "/user/unsubscribe_channel",
    method: "post",
    middleware: [middlewares.keycloakUserDeleteEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub,
        },
        ChannelSubscribeGUID,
      } = req.body;

      if (!ChannelSubscribeGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Channel subscribe guid is required" });
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

          const channelSubscribe = await ChannelSubscribeService.getChannelSubscribeByGUID(OrgDbName, OrgDbPassword, ChannelSubscribeGUID);
          const {
            ChannelSubscribeID,
          } = channelSubscribe;

          if (sub != channelSubscribe.UserGUID) {
            return res.json({ Confirmation: "FAIL", Message: "Channel subscribe does not belong to user" });
          }

          await ChannelSubscribeService.updateChannelSubscribe(OrgDbName, OrgDbPassword, ChannelSubscribeID, { IsDeleted: 1 });

          return res.json({
            Confirmation: "SUCCESS",
            Message: "Channel subscribe has been deleted"
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/user/subscribe_multiple_channels": {
    path: "/user/subscribe_multiple_channels",
    method: "post",
    middleware: [middlewares.keycloakUserCreateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub,
        },
        ExperienceChannels,
      } = req.body;

      if (!ExperienceChannels) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience channels is required" });
      }
      if (!Array.isArray(ExperienceChannels)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience channels must be a array" });
      }
      if (!ExperienceChannels.length) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience channels cannot be empty" });
      }
      ExperienceChannels = _removeDuplicates(ExperienceChannels);

      try {

        const org = await OrgService.getOrgByRealm(realm);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;

          let tasks = [];
          for (let i = 0; i < ExperienceChannels.length; i++) {
            let task = new Promise((resolve, reject) => {

              const ExperienceChannelGUID = ExperienceChannels[i];
              ExperienceChannelService.getExperienceChannelByGUID(OrgDbName, OrgDbPassword, ExperienceChannelGUID)
                .then(experienceChannel => {
                  const {
                    ExperienceChannelID,
                    ChannelType,
                    ChannelStatus,
                  } = experienceChannel;

                  if (!ExperienceChannelID) {
                    resolve({ Message: 'Experience channel not found' });
                    return;
                  }
                  if (["0", "1", "2", "3"].indexOf(ChannelType) == -1) {
                    resolve({ Message: 'ChannelType is invalid' });
                    return;
                  }
                  if (ChannelStatus != 'LIVE') {
                    resolve({ Message: 'Channel status is invalid' });
                    return;
                  }

                  let channelSubscribe = {
                    UserGUID: sub,
                    ExperienceChannelID
                  };
                  ChannelSubscribeService.channelSubscribeList(OrgDbName, OrgDbPassword, channelSubscribe)
                    .then(channelSubscribeList => {

                      if (channelSubscribeList.length) {

                        const channelSubscribe = channelSubscribeList[0];
                        const {
                          ChannelSubscribeID,
                          IsDeleted,
                        } = channelSubscribe;
                        if (!IsDeleted) {
                          resolve({ Message: 'Channel subscribed' });
                          return;
                        } else {
                          if (ChannelType == 2) {
                            resolve({ Message: 'ChannelType is invalid' });
                            return;
                          }
                          let updateChannelSubscribe = {
                            IsDeleted: 0
                          };
                          ChannelSubscribeService.updateChannelSubscribe(OrgDbName, OrgDbPassword, ChannelSubscribeID, updateChannelSubscribe)
                            .then(() => {
                              resolve({ Message: 'Channel subscribed' });
                              return;
                            })
                            .catch(error => {
                              reject({ Message: 'DB error' });
                              return;
                            });
                        }
                      } else {

                        if (ChannelType == 2) {
                          resolve({ Message: 'ChannelType is invalid' });
                          return;
                        }
                        ChannelSubscribeService.createChannelSubscribe(OrgDbName, OrgDbPassword, channelSubscribe)
                          .then(channelSubscribe => {
                            resolve({ Message: 'Channel subscribed' });
                            return;
                          })
                          .catch(error => {
                            reject({ Message: 'DB error' });
                            return;
                          });
                      }
                    })
                    .catch((error) => {
                      reject({ Message: 'DB error' });
                      return;
                    })
                })
                .catch((error) => {
                  reject({ Message: 'DB error' });
                  return;
                })
            });
            tasks.push(task);
          }
          Promise.all(tasks)
            .then(async (response) => {

              // web app customize done
              let activeUser = await UserService.getUserByUserID(realm, sub);
              const activeUserAttrs = await UserService.getUserAttrsByUserID(sub);
              const customizeFilter = activeUserAttrs.filter(item => item.IsCustomizeDone);
              let isCustomizeDone;
              if (customizeFilter.length) {
                isCustomizeDone = customizeFilter[0];
              }
              if (!customizeFilter.length || (isCustomizeDone && isCustomizeDone.VALUE == '0')) {
                if (!activeUser.attributes) {
                  activeUser.attributes = {};
                  activeUser.attributes.IsCustomizeDone = ['1'];
                } else {
                  activeUser.attributes.IsCustomizeDone = ['1'];
                }
                await UserService.updateUser(realm, activeUser);
              }

              return res.json({
                Confirmation: "SUCCESS",
                Message: "Channels have been subscribed"
              });
            })
            .catch((error) => {
              return res.json({ Confirmation: "FAIL", Message: "DB error" });
            })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/user/stream_list": {
    path: "/user/stream_list",
    method: "post",
    middleware: [middlewares.keycloakUserViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
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


  "/user/stream_list_v2": {
    path: "/user/stream_list_v2",
    method: "post",
    middleware: [middlewares.keycloakUserViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub,
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
      Extra.UserGUID = sub;
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

          const experienceStreams = await ExperienceStreamService.subscribedExperienceStreamListByParams(OrgDbName, OrgDbPassword, false, Limit, Offset, Extra);
          const totalRecord = await ExperienceStreamService.subscribedExperienceStreamListByParams(OrgDbName, OrgDbPassword, true, Limit, Offset, Extra);

          return res.json({
            Confirmation: "SUCCESS",
            Response: {
              TotalRecord: totalRecord,
              ExperienceStreams: experienceStreams
            }
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/user/mobile_view": {
    path: "/user/mobile_view",
    method: "post",
    middleware: [middlewares.keycloakUserViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub,
        },
        ExperienceStreamGUID,
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
          let { ExperienceStreamID, ExperienceGUID, ExperienceClicks } = experienceStream;
          if (!ExperienceStreamID) {
            return res.json({ Confirmation: "FAIL", Message: "Experience stream not found" });
          }

          await ExperienceStreamService.updateExperienceStream(OrgDbName, OrgDbPassword, ExperienceStreamID, { ExperienceClicks: ExperienceClicks + 1 });

          const experience = await controllers.experience.viewExperienceDetail(OrgDbName, OrgDbPassword, ExperienceGUID);

          const { ExperienceType, ExperiencePages } = experience;

          if (ExperienceType == 0) {
            return res.json({
              Confirmation: "SUCCESS",
              Response: experience
            });
          }
          let tree = controllers.experiencePage.assembleTree(ExperiencePages);
          // 1. format mobile view
          if (tree[0]) {
            tree[0].IsContent = false;
          }
          experience.ExperiencePages = tree[0];
          return res.json({
            Confirmation: "SUCCESS",
            Response: experience
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/user/app_view": {
    path: "/user/app_view",
    method: "post",
    middleware: [middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        OrgUrl,
        ExperienceGUID,
      } = req.body;

      if (!OrgUrl) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "OrgUrl is required" });
      }
      if (!ExperienceGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Experience guid is required" });
      }

      try {

        const org = await OrgService.getOrgByOrgUrl(OrgUrl);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;

          const experience = await controllers.experience.viewExperienceDetail(OrgDbName, OrgDbPassword, ExperienceGUID);
          const { ExperienceType, ExperiencePages } = experience;

          if (ExperienceType == 0) {
            return res.json({
              Confirmation: "SUCCESS",
              Response: experience
            });
          }
          let tree = controllers.experiencePage.assembleTree(ExperiencePages);
          // 1. format mobile view
          if (tree[0]) {
            tree[0].IsContent = false;
          }
          experience.ExperiencePages = tree[0];
          return res.json({
            Confirmation: "SUCCESS",
            Response: experience
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/user/view_language_v0": {
    path: "/user/view_language_v0",
    method: "post",
    middleware: [middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        OrgUrl,
        LanguageGUID,
      } = req.body;

      if (!OrgUrl) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "OrgUrl is required" });
      }
      if (!LanguageGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Language guid is required" });
      }

      try {

        const org = await OrgService.getOrgByOrgUrl(OrgUrl);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          const {
            OrgDbName,
            OrgDbPassword,
          } = org;

          const languageResponse = await controllers.language.viewLanguageDetail(OrgDbName, OrgDbPassword, LanguageGUID);
          if (languageResponse) {
            return res.json({
              Confirmation: "SUCCESS",
              Response: {
                Language: languageResponse
              }
            })
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/user/view_language": {
    path: "/user/view_language",
    method: "post",
    middleware: [middlewares.keycloakUserViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
        LanguageGUID,
      } = req.body;
      if (!LanguageGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Language guid is required" });
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

          const languageResponse = await controllers.language.viewLanguageDetail(OrgDbName, OrgDbPassword, LanguageGUID);
          if (languageResponse) {
            return res.json({
              Confirmation: "SUCCESS",
              Response: {
                Language: languageResponse
              }
            })
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/user/logout": {
    path: "/user/logout",
    method: "post",
    middleware: [middlewares.keycloakUserDeleteEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub,
        },
      } = req.body;

      try {

        const token = await KeycloakService.keycloakAdminLogin();
        await UserService.userLogout(token, realm, sub);

        return res.json({
          Confirmation: "SUCCESS",
          Message: 'User has been logout'
        })
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


};

export default Controller;

const _removeDuplicates = (arr) => {
  let unique_array = []
  for (let i = 0; i < arr.length; i++) {
    if (unique_array.indexOf(arr[i]) == -1) {
      unique_array.push(arr[i])
    }
  }
  return unique_array
}