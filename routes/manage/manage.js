// Default
import middlewares from "../../middlewares";

// services
import KeycloakService from "../../services/KeycloakService";
import UserService from '../../services/UserService';
import OrgService from '../../services/OrgService';
import ExperienceChannelService from '../../services/ExperienceChannelService';
import ChannelSubscribeService from '../../services/ChannelSubscribeService';

// helpers
import * as emailHelper from '../../utilities/emailHelper';
import * as passwordHelper from '../../utilities/passwordHelper';

// Libraries
import validator from "validator";

// Constants
import constants from "../../constants";

const Controller = {

  "/manage/user_list": {
    path: "/manage/user_list",
    method: "post",
    middleware: [middlewares.keycloakUserManageViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
        Limit,
        Offset,
        Extra,
        IsTeamMember,
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
      if (!IsTeamMember) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "IsTeamMember is required" });
      }
      if (['0', '1'].indexOf(IsTeamMember) == -1) {
        return res.status(401).json({ Confirmation: "FAIL", Message: "IsTeamMember is invalid, must be one of [0, 1]" });
      }

      try {

        const users = await UserService.userListByParams(realm, IsTeamMember, false, Limit, Offset, Extra);
        const totalRecord = await UserService.userListByParams(realm, IsTeamMember, true, Limit, Offset, Extra);
        return res.json({
          Confirmation: "SUCCESS",
          Response: {
            TotalRecord: totalRecord,
            Users: users,
          }
        })
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/manage/create_user": {
    path: "/manage/create_user",
    method: "post",
    middleware: [middlewares.keycloakUserManageCreateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub
        },
        Users,
        IsTeamMember,
        Roles,
        Channels,
      } = req.body;

      // #1
      if (!Users) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Users is required" });
      }
      if (!Array.isArray(Users)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Users must be a array" });
      }
      if (!Users.length) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "At least one user to be create" });
      }
      const validateUsersRes = _validateUsers(Users);
      if (!validateUsersRes.isValidated) {
        return res.status(403).json({ Confirmation: "FAIL", Message: validateUsersRes.message });
      }

      // #2
      if (!Roles) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Roles is required" });
      }
      if (!Array.isArray(Roles)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Roles must be a array" });
      }
      if (!Roles.length) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "At least one role must be selected" });
      }
      const formattedRoles = _removeDuplicates(Roles);
      const { isValidated, invalidRoles, assignRoles } = _validateRealmRoles(formattedRoles, IsTeamMember);
      if (!isValidated) {
        return res.status(403).json({ Confirmation: "FAIL", Message: `Role(s): ${invalidRoles.join(', ')} is invalid` });
      }

      // #3
      if (!IsTeamMember) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "IsTeamMember is required" });
      }
      if (['0', '1'].indexOf(IsTeamMember) == -1) {
        return res.status(401).json({ Confirmation: "FAIL", Message: "IsTeamMember is invalid, must be one of [0, 1]" });
      }
      if (IsTeamMember == '0') {
        if (!Channels) {
          return res.status(403).json({ Confirmation: "FAIL", Message: "Channels is required" });
        }
        if (!Array.isArray(Channels)) {
          return res.status(403).json({ Confirmation: "FAIL", Message: "Channels must be a array" });
        }
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

          // 0. check private channel available
          if (IsTeamMember == '0') {
            let checkChTasks = [];
            Channels.forEach(ch => {
              let task = new Promise((resolve, reject) => {
                ExperienceChannelService.getExperienceChannelByGUID(OrgDbName, OrgDbPassword, ch)
                  .then(channel => {
                    if (!channel) {
                      resolve('0');
                      return;
                    }
                    resolve('1');
                    return;
                  })
                  .catch(error => {
                    resolve('0');
                    return;
                  })
              })
              checkChTasks.push(task);
            })
            const existedChannels = await Promise.all(checkChTasks);

            if (existedChannels.indexOf('0') != -1) {
              return res.json({ Confirmation: "FAIL", Message: `${Channels[existedChannels.indexOf('0')]}: Channel not found` });
            }
          }

          // 1. check user realm role
          const assignedRoles = await UserService.getUserRolesByUserID(realm, sub);
          const assignedRealmRoles = assignedRoles.realmMappings;

          const assignedOrgAdminFilter = assignedRealmRoles.filter(item => item.name == 'org-admin');
          const assignOrgAdminFilter = assignRoles.filter(item => item.value == 'org-admin');

          if (!assignedOrgAdminFilter.length && assignOrgAdminFilter.length) {
            return res.json({ Confirmation: "FAIL", Message: "Does not have sufficient permission" });
          }

          // 2. check email is unique
          let checkTasks = [];
          Users.forEach(user => {
            let task = new Promise((resolve, reject) => {
              UserService.userListByEmail(realm, user.Email.trim())
                .then(users => {
                  if (users.length) {
                    resolve('1');
                    return;
                  }
                  resolve('0');
                  return;
                })
                .catch(error => {
                  resolve('1');
                  return;
                })
            })
            checkTasks.push(task);
          })
          const existedEmail = await Promise.all(checkTasks);
          if (existedEmail.indexOf('1') != -1) {
            return res.json({ Confirmation: "FAIL", Message: `${Users[existedEmail.indexOf('1')].Email}: Email already existed` });
          }

          // 3. active org info
          const activeOrg = await OrgService.getOrgByRealm(realm);

          // 4. realm roles
          const realmRoles = await KeycloakService.getKeycloakRealmRoles(realm);
          let updateRealmRoles = [];
          assignRoles.map(item1 => {
            realmRoles.map(item2 => {
              if (item1.value == item2.name) {
                updateRealmRoles.push(item2);
              }
            })
          })

          // 5. create new users - member & end user
          // 6. assign realm roles to created user - member & end user
          // 7. send email - member & end user
          // 8. create channel subscription - end user
          let createTasks = [];
          Users.forEach(user => {
            let task = new Promise((resolve, reject) => {
              const newUser = {
                username: user.Email.trim(),
                firstName: user.FirstName,
                lastName: user.LastName,
                email: user.Email.trim(),
                emailVerified: false,
                enabled: true,
                attributes: {
                  IsSelfRegistered: '0'
                }
              };
              const tempPassword = passwordHelper.randomPassword();
              UserService.createUser(realm, newUser, tempPassword)
                .then(createdUser => {

                  UserService.addRealmRolesToUser(realm, createdUser.id, updateRealmRoles)
                    .then(() => {

                      const emailContent = `email: ${user.Email}\npassword: ${tempPassword}\n`;
                      let emailOptions = {
                        from: activeOrg.OrgName,
                        to: user.Email.trim(),
                        subject: `${activeOrg.OrgName} - User invitation`,
                        text: emailContent
                      };
                      emailHelper.sendEmail(emailOptions)
                        .then(async () => {

                          // end user
                          if (IsTeamMember == '0' && Channels.length) {

                            let subscribeChannelTasks = [];
                            for (let i = 0; i < Channels.length; i++) {
                              let task = new Promise((resolve, reject) => {

                                const ExperienceChannelGUID = Channels[i];
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
                                      UserGUID: createdUser.id,
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
                              subscribeChannelTasks.push(task);
                            }
                            Promise.all(subscribeChannelTasks)
                              .then(async () => {

                                const assignedRoles = await UserService.getUserRolesByUserID(realm, createdUser.id);
                                let assignedRealmRoles = assignedRoles.realmMappings;
                                assignedRealmRoles = assignedRealmRoles.filter(role => role.name.includes('-admin'))
                                assignedRealmRoles = assignedRealmRoles.map(role => role.name);
                                createdUser.roles = assignedRealmRoles;
                                resolve(createdUser);
                                return;
                              })
                              .catch(error => {
                                reject(error);
                                return;
                              })
                          } else {

                            const assignedRoles = await UserService.getUserRolesByUserID(realm, createdUser.id);
                            let assignedRealmRoles = assignedRoles.realmMappings;
                            assignedRealmRoles = assignedRealmRoles.filter(role => role.name.includes('-admin'))
                            assignedRealmRoles = assignedRealmRoles.map(role => role.name);
                            createdUser.roles = assignedRealmRoles;
                            resolve(createdUser);
                            return;
                          }
                        })
                        .catch(error => {
                          reject(error);
                          return;
                        })
                    })
                    .catch(error => {
                      reject(error);
                      return;
                    })
                })
                .catch(error => {
                  reject(error);
                  return;
                })
            })
            createTasks.push(task);
          })
          const createdUsers = await Promise.all(createTasks);
          const formattedUsers = createdUsers.map(user => {
            return {
              UserGUID: user.id,
              Email: user.email,
              FirstName: user.firstName,
              LastName: user.lastName,
              Enabled: user.enabled,
              CreatedTimestamp: user.createdTimestamp,
              Attributes: user.attributes,
              Roles: user.roles.join(',')
            }
          })
          return res.json({
            Confirmation: "SUCCESS",
            Response: {
              Users: formattedUsers
            }
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/manage/view_user": {
    path: "/manage/view_user",
    method: "post",
    middleware: [middlewares.keycloakUserManageViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
        UserID,
        IsTeamMember,
      } = req.body;

      if (!UserID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "UserID is required" });
      }
      if (!IsTeamMember) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "IsTeamMember is required" });
      }
      if (['0', '1'].indexOf(IsTeamMember) == -1) {
        return res.status(401).json({ Confirmation: "FAIL", Message: "IsTeamMember is invalid, must be one of [0, 1]" });
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

          // 1. user info
          const user = await UserService.getUserByUserID(realm, UserID);

          // 2. user realm role
          const assignedRoles = await UserService.getUserRolesByUserID(realm, UserID);
          const assignedRealmRoles = assignedRoles.realmMappings;

          if (!user) {
            return res.json({ Confirmation: "FAIL", Message: "User not found" });
          } else {

            const output = [];
            assignedRealmRoles.forEach(item1 => {
              constants.keycloakRealmRoles.forEach(item2 => {
                if (item1.name == item2.value) {
                  item2 = item2.type;
                  output.push(item2);
                }
              })
            })

            let channelSubscribes;
            if (IsTeamMember == '0') {
              channelSubscribes = await ChannelSubscribeService.channelSubscribeListByParams(OrgDbName, OrgDbPassword, false, "-1", "0", { UserGUID: UserID });
            }

            const formattedUser = {
              UserGUID: user.id,
              Email: user.email,
              FirstName: user.firstName,
              LastName: user.lastName,
              Enabled: user.enabled,
              Roles: output,
              CreatedTimestamp: user.createdTimestamp,
              ChannelSubscribes: channelSubscribes
            };
            return res.json({
              Confirmation: "SUCCESS",
              Response: {
                User: formattedUser
              }
            })
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/manage/update_user": {
    path: "/manage/update_user",
    method: "post",
    middleware: [middlewares.keycloakUserManageUpdateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub
        },
        UserID,
        Email,
        FirstName,
        LastName,
        Enabled,
        IsTeamMember,
        Roles,
        Channels,
      } = req.body;

      if (!UserID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "UserID is required" });
      }
      if (!Email) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Email is required" });
      }
      if (!validator.isEmail(Email)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Email is invalid" });
      }
      if (!Enabled) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Enabled is required" });
      }
      if (['0', '1'].indexOf(Enabled) == -1) {
        return res.status(401).json({ Confirmation: "FAIL", Message: "Enabled is invalid, must be one of [0, 1]" });
      }
      if (!Roles) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Roles is required" });
      }
      if (!Array.isArray(Roles)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Roles must be a array" });
      }
      if (!Roles.length) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "At least one role must be selected" });
      }
      const formattedRoles = _removeDuplicates(Roles);
      const { isValidated, invalidRoles, assignRoles } = _validateRealmRoles(formattedRoles, IsTeamMember);
      if (!isValidated) {
        return res.status(403).json({ Confirmation: "FAIL", Message: `Role(s): ${invalidRoles.join(', ')} is invalid` });
      }
      if (!IsTeamMember) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "IsTeamMember is required" });
      }
      if (['0', '1'].indexOf(IsTeamMember) == -1) {
        return res.status(401).json({ Confirmation: "FAIL", Message: "IsTeamMember is invalid, must be one of [0, 1]" });
      }
      if (IsTeamMember == '0') {
        if (!Channels) {
          return res.status(403).json({ Confirmation: "FAIL", Message: "Channels is required" });
        }
        if (!Array.isArray(Channels)) {
          return res.status(403).json({ Confirmation: "FAIL", Message: "Channels must be a array" });
        }
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

          // 1. check user realm role
          const assignedRoles = await UserService.getUserRolesByUserID(realm, sub);
          const userAssignedRoles = await UserService.getUserRolesByUserID(realm, UserID);

          const assignedRealmRoles = assignedRoles.realmMappings;
          const userAssignedRealmRoles = userAssignedRoles.realmMappings;

          const assignedOrgAdminFilter = assignedRealmRoles.filter(item => item.name == 'org-admin');
          const userAssignedOrgAdminFilter = userAssignedRealmRoles.filter(item => item.value == 'org-admin');
          const assignOrgAdminFilter = assignRoles.filter(item => item.value == 'org-admin');

          if (!assignedOrgAdminFilter.length && userAssignedOrgAdminFilter.length) {
            return res.json({ Confirmation: "FAIL", Message: "Does not have sufficient permission" });
          }

          if (!assignedOrgAdminFilter.length && assignOrgAdminFilter.length) {
            return res.json({ Confirmation: "FAIL", Message: "Does not have sufficient permission" });
          }

          // 2. check email is unique
          Email = Email.trim();
          const users = await UserService.userListByEmail(realm, Email);
          if (users.length > 1 || (users.length && users[0].ID != UserID)) {
            return res.json({ Confirmation: "FAIL", Message: "Email already existed" });
          }

          // 3. realm roles
          const realmRoles = await KeycloakService.getKeycloakRealmRoles(realm);
          let updateRealmRoles = [];
          assignRoles.map(item1 => {
            realmRoles.map(item2 => {
              if (item1.value == item2.name) {
                updateRealmRoles.push(item2);
              }
            })
          })

          // 4. update user
          const updateUser = {
            id: UserID,
            username: Email,
            enabled: Enabled == '1',
            email: Email,
            firstName: FirstName ? FirstName : "",
            lastName: LastName ? LastName : "",
          };
          await UserService.updateUser(realm, updateUser);

          // 5. update user realm roles
          await UserService.updateRealmRolesToUser(realm, UserID, updateRealmRoles, userAssignedRealmRoles);

          // 6. update channel subscribes
          if (IsTeamMember == '0') {

            await ChannelSubscribeService.disableUserChannelSubscribeList(OrgDbName, OrgDbPassword, UserID);

            let subscribeChannelTasks = [];
            for (let i = 0; i < Channels.length; i++) {
              let task = new Promise((resolve, reject) => {

                const ExperienceChannelGUID = Channels[i];
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
                      UserGUID: UserID,
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
              subscribeChannelTasks.push(task);
            }
            await Promise.all(subscribeChannelTasks);
          }

          let tmpAssignedRoles = await UserService.getUserRolesByUserID(realm, UserID);
          let tmpAssignedRealmRoles = tmpAssignedRoles.realmMappings;
          tmpAssignedRealmRoles = tmpAssignedRealmRoles.filter(role => role.name.includes('-admin'))
          tmpAssignedRealmRoles = tmpAssignedRealmRoles.map(role => role.name);

          const updatedUser = await UserService.getUserByUserID(realm, UserID);
          const formattedUser = {
            UserGUID: updatedUser.id,
            Email: updatedUser.email,
            FirstName: updatedUser.firstName,
            LastName: updatedUser.lastName,
            Enabled: updatedUser.enabled,
            CreatedTimestamp: updatedUser.createdTimestamp,
            Attributes: updatedUser.attributes,
            Roles: tmpAssignedRealmRoles.join(',')
          };
          return res.json({
            Confirmation: "SUCCESS",
            Response: {
              User: formattedUser
            }
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/manage/reset_user_password": {
    path: "/manage/reset_user_password",
    method: "post",
    middleware: [middlewares.keycloakUserManageUpdateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub,
        },
        UserID,
        Password
      } = req.body;

      if (!UserID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "UserID is required" });
      }
      if (!Password) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Password is required" });
      }

      try {

        // 1. get active user info
        const activeUserRoles = await UserService.getUserRolesByUserID(realm, sub);
        const userRoles = await UserService.getUserRolesByUserID(realm, UserID);

        const activeUserAssignedRealmRoles = activeUserRoles.realmMappings;
        const userAssignedRealmRoles = userRoles.realmMappings;

        const activeUserOrgAdminFilter = activeUserAssignedRealmRoles.filter(item => item.name == 'org-admin');
        const userOrgAdminFilter = userAssignedRealmRoles.filter(item => item.name == 'org-admin');

        if (!activeUserOrgAdminFilter.length && userOrgAdminFilter.length) {
          return res.json({ Confirmation: "FAIL", Message: "Does not have sufficient permission" });
        }

        // 2. get user info
        const user = await UserService.getUserByUserID(realm, UserID);
        if (!user) {
          return res.json({ Confirmation: "FAIL", Message: "User not found" });
        } else {

          // 3. reset password
          await UserService.updateUserPassword(realm, UserID, Password);
          const {
            email
          } = user;

          // 4. active org info
          const activeOrg = await OrgService.getOrgByRealm(realm);

          // 5. send email
          const emailContent = `email: ${email}\npassword: ${Password}\n`;
          let emailOptions = {
            from: activeOrg.OrgName,
            to: email,
            subject: `${activeOrg.OrgName} - Password reset`,
            text: emailContent
          };
          await emailHelper.sendEmail(emailOptions);

          return res.json({
            Confirmation: "SUCCESS",
            Message: 'Password has been reset'
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/manage/update_user_roles": {
    path: "/manage/update_user_roles",
    method: "post",
    middleware: [middlewares.keycloakUserManageUpdateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub
        },
        Users,
        IsAdd,
        Roles,
      } = req.body;

      if (!Users) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Users is required" });
      }
      if (!Array.isArray(Users)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Users must be a array" });
      }
      if (!Users.length) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "At least one user to be update" });
      }
      if (Users.indexOf(sub) != -1) {
        return res.json({ Confirmation: "FAIL", Message: "Cannot update by self" });
      }
      if (!IsAdd) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "IsAdd is required" });
      }
      if (['0', '1'].indexOf(IsAdd) == -1) {
        return res.json({ Confirmation: "FAIL", Message: "IsAdd is invalid, must be one of [0, 1]" });
      }
      if (!Roles) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Roles is required" });
      }
      if (!Array.isArray(Roles)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Roles must be a array" });
      }
      if (!Roles.length) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "At least one role must be selected" });
      }
      const formattedRoles = _removeDuplicates(Roles);
      const IsTeamMember = '1';
      const { isValidated, invalidRoles, assignRoles } = _validateRealmRoles(formattedRoles, IsTeamMember);
      if (!isValidated) {
        return res.status(403).json({ Confirmation: "FAIL", Message: `Role(s): ${invalidRoles.join(', ')} is invalid` });
      }

      try {

        const realmRoles = await KeycloakService.getKeycloakRealmRoles(realm);
        let updateRealmRoles = [];
        assignRoles.map(item1 => {
          realmRoles.map(item2 => {
            if (item1.value == item2.name) {
              updateRealmRoles.push(item2);
            }
          })
        })

        let tasks = [];
        Users.forEach(userID => {
          let task = new Promise(async (resolve, reject) => {
            // 1. get active user info
            const activeUserRoles = await UserService.getUserRolesByUserID(realm, sub);
            const userRoles = await UserService.getUserRolesByUserID(realm, userID);

            const activeUserAssignedRealmRoles = activeUserRoles.realmMappings;
            const userAssignedRealmRoles = userRoles.realmMappings;

            const activeUserOrgAdminFilter = activeUserAssignedRealmRoles.filter(item => item.name == 'org-admin');
            const userOrgAdminFilter = userAssignedRealmRoles.filter(item => item.name == 'org-admin');

            if (!activeUserOrgAdminFilter.length && userOrgAdminFilter.length) {
              reject("Does not have sufficient permission");
              return;
            }

            if (IsAdd == '0') {
              let checkRealmRoles = userAssignedRealmRoles.filter(role => role.name.includes('-admin'));
              let check = [];
              for (let i = 0; i < checkRealmRoles.length; i++) {
                let existedRole = checkRealmRoles[i];
                for (let j = 0; j < updateRealmRoles.length; j++) {
                  let removeRole = updateRealmRoles[j];
                  if (existedRole.name == removeRole.name) {
                    check.push(i);
                  }
                }
              }
              if(check.length == checkRealmRoles.length){
                reject("User must has at least one role");
                return;
              }              
            }
            resolve();
            return;
          })
          tasks.push(task);
        })
        await Promise.all(tasks);

        tasks = [];
        Users.forEach(userID => {
          let task = new Promise(async (resolve, reject) => {
            let prom;
            if (IsAdd == '1') {
              prom = UserService.assignRealmRolesToUser(realm, userID, updateRealmRoles);
            } else {
              prom = UserService.removeRealmRolesToUser(realm, userID, updateRealmRoles);
            }
            prom
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
          Message: 'User roles has been updated'
        })
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/manage/update_user_channel_subscribes": {
    path: "/manage/update_user_channel_subscribes",
    method: "post",
    middleware: [middlewares.keycloakUserManageUpdateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub
        },
        Users,
        IsSubscribe,
        Channels,
      } = req.body;

      if (!Users) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Users is required" });
      }
      if (!Array.isArray(Users)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Users must be a array" });
      }
      if (!Users.length) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "At least one user to be update" });
      }
      if (Users.indexOf(sub) != -1) {
        return res.json({ Confirmation: "FAIL", Message: "Cannot update by self" });
      }
      if (!IsSubscribe) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "IsSubscribe is required" });
      }
      if (['0', '1'].indexOf(IsSubscribe) == -1) {
        return res.json({ Confirmation: "FAIL", Message: "IsSubscribe is invalid, must be one of [0, 1]" });
      }
      if (!Channels) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Channels is required" });
      }
      if (!Array.isArray(Channels)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Channels must be a array" });
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

          let tasks = [];
          Users.forEach(userID => {

            let task = new Promise(async (resolve, reject) => {
              // 1. get active user info
              const activeUserRoles = await UserService.getUserRolesByUserID(realm, sub);
              const userRoles = await UserService.getUserRolesByUserID(realm, userID);

              const activeUserAssignedRealmRoles = activeUserRoles.realmMappings;
              const userAssignedRealmRoles = userRoles.realmMappings;

              const activeUserOrgAdminFilter = activeUserAssignedRealmRoles.filter(item => item.name == 'org-admin');
              const userOrgAdminFilter = userAssignedRealmRoles.filter(item => item.name == 'org-admin');

              if (!activeUserOrgAdminFilter.length && userOrgAdminFilter.length) {
                reject("Does not have sufficient permission");
                return;
              }

              let subscribeChannelTasks = [];
              for (let i = 0; i < Channels.length; i++) {

                let task = new Promise((resolve, reject) => {

                  const ExperienceChannelGUID = Channels[i];
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

                      // # 1 subscribe
                      if (IsSubscribe == '1') {

                        let channelSubscribe = {
                          UserGUID: userID,
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

                      } else {

                        // # 2 unsubscribe
                        let channelSubscribe = {
                          UserGUID: userID,
                          ExperienceChannelID
                        };
                        ChannelSubscribeService.channelSubscribeList(OrgDbName, OrgDbPassword, channelSubscribe)
                          .then(channelSubscribeList => {

                            if (!channelSubscribeList.length) {
                              resolve({ Message: 'Channel un-subscribed' });
                              return;
                            } else {
                              ChannelSubscribeService.updateChannelSubscribe(OrgDbName, OrgDbPassword, channelSubscribeList[0].ChannelSubscribeID, { IsDeleted: 1 })
                                .then(() => {
                                  resolve({ Message: 'Channel un-subscribed' });
                                  return;
                                })
                                .catch((error) => {
                                  reject({ Message: 'DB error' });
                                  return;
                                })
                            }
                          })
                          .catch((error) => {
                            reject({ Message: 'DB error' });
                            return;
                          })
                      }

                    })
                    .catch((error) => {
                      reject({ Message: 'DB error' });
                      return;
                    })
                });
                subscribeChannelTasks.push(task);
              }
              Promise.all(subscribeChannelTasks)
                .then(() => {
                  resolve();
                  return;
                })
                .catch((error) => {
                  reject(error);
                  return;
                })
            })
            tasks.push(task);
          })
          await Promise.all(tasks);

          return res.json({
            Confirmation: "SUCCESS",
            Message: 'User channel subscribes has been updated'
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/manage/update_user_enabled": {
    path: "/manage/update_user_enabled",
    method: "post",
    middleware: [middlewares.keycloakUserManageUpdateEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub
        },
        Users,
        Enabled,
      } = req.body;

      if (!Users) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Users is required" });
      }
      if (!Array.isArray(Users)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Users must be a array" });
      }
      if (!Users.length) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "At least one user to be update" });
      }
      if (Users.indexOf(sub) != -1) {
        return res.json({ Confirmation: "FAIL", Message: "Cannot update by self" });
      }
      if (!Enabled) {
        return res.json({ Confirmation: "FAIL", Message: "Enabled is required" });
      }
      if (['0', '1'].indexOf(Enabled) == -1) {
        return res.json({ Confirmation: "FAIL", Message: "Enabled is invalid, must be one of [0, 1]" });
      }

      try {

        let tasks = [];
        Users.forEach(userID => {
          let task = new Promise(async (resolve, reject) => {
            // 1. get active user info
            const activeUserRoles = await UserService.getUserRolesByUserID(realm, sub);
            const userRoles = await UserService.getUserRolesByUserID(realm, userID);

            const activeUserAssignedRealmRoles = activeUserRoles.realmMappings;
            const userAssignedRealmRoles = userRoles.realmMappings;

            const activeUserOrgAdminFilter = activeUserAssignedRealmRoles.filter(item => item.name == 'org-admin');
            const userOrgAdminFilter = userAssignedRealmRoles.filter(item => item.name == 'org-admin');

            if (!activeUserOrgAdminFilter.length && userOrgAdminFilter.length) {
              reject("Does not have sufficient permission");
              return;
            }

            // 2. update enabled
            let user = await UserService.getUserByUserID(realm, userID);
            user.enabled = Enabled == '1';
            UserService.updateUser(realm, user)
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
          Message: 'User enabled has been updated'
        })
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/manage/delete_user": {
    path: "/manage/delete_user",
    method: "post",
    middleware: [middlewares.keycloakUserManageDeleteEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub
        },
        UserID,
      } = req.body;

      if (!UserID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "UserID is required" });
      }
      if (sub == UserID) {
        return res.json({ Confirmation: "FAIL", Message: "Cannot delete by self" });
      }

      try {

        // 1. get active user info
        const activeUserRoles = await UserService.getUserRolesByUserID(realm, sub);
        const userRoles = await UserService.getUserRolesByUserID(realm, UserID);

        const activeUserAssignedRealmRoles = activeUserRoles.realmMappings;
        const userAssignedRealmRoles = userRoles.realmMappings;

        const activeUserOrgAdminFilter = activeUserAssignedRealmRoles.filter(item => item.name == 'org-admin');
        const userOrgAdminFilter = userAssignedRealmRoles.filter(item => item.name == 'org-admin');

        if (!activeUserOrgAdminFilter.length && userOrgAdminFilter.length) {
          return res.json({ Confirmation: "FAIL", Message: "Does not have sufficient permission" });
        }

        // 2. delete user
        await UserService.deleteUser(realm, UserID);
        return res.json({
          Confirmation: "SUCCESS",
          Message: 'User has been deleted'
        })
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/manage/delete_users": {
    path: "/manage/delete_users",
    method: "post",
    middleware: [middlewares.keycloakUserManageDeleteEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
          sub
        },
        Users,
      } = req.body;

      if (!Users) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Users is required" });
      }
      if (!Array.isArray(Users)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Users must be a array" });
      }
      if (!Users.length) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "At least one user to be update" });
      }
      if (Users.indexOf(sub) != -1) {
        return res.json({ Confirmation: "FAIL", Message: "Cannot delete by self" });
      }

      try {

        let tasks = [];
        Users.forEach(userID => {
          let task = new Promise(async (resolve, reject) => {
            // 1. get active user info
            const activeUserRoles = await UserService.getUserRolesByUserID(realm, sub);
            const userRoles = await UserService.getUserRolesByUserID(realm, userID);

            const activeUserAssignedRealmRoles = activeUserRoles.realmMappings;
            const userAssignedRealmRoles = userRoles.realmMappings;

            const activeUserOrgAdminFilter = activeUserAssignedRealmRoles.filter(item => item.name == 'org-admin');
            const userOrgAdminFilter = userAssignedRealmRoles.filter(item => item.name == 'org-admin');

            if (!activeUserOrgAdminFilter.length && userOrgAdminFilter.length) {
              reject("Does not have sufficient permission");
              return;
            }

            // 2. delete user
            UserService.deleteUser(realm, userID)
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
          Message: 'Users have been deleted'
        })
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/manage/sync_email": {
    path: "/manage/sync_email",
    method: "post",
    middleware: [middlewares.keycloakUserManageViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        KeycloakUser: {
          realm,
        },
        Email,
        UserID,
      } = req.body;

      if (!Email) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Email is required" });
      }
      if (!validator.isEmail(Email)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Email is invalid" });
      }

      try {

        const org = await OrgService.getOrgByRealm(realm);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "DB error" });
        } else {

          Email = Email.trim();
          const users = await UserService.userListByEmail(realm, Email);

          if (UserID) {
            if (users.length > 1 || (users.length && users[0].ID != UserID)) {
              return res.json({ Confirmation: "FAIL", Message: "Email already existed" });
            }
            return res.json({
              Confirmation: "SUCCESS",
              Message: 'Email is available'
            })
          } else {

            if (users.length) {
              return res.json({ Confirmation: "FAIL", Message: "Email already existed" });
            }
            return res.json({
              Confirmation: "SUCCESS",
              Message: 'Email is available'
            })
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/manage/channel_list": {
    path: "/manage/channel_list",
    method: "post",
    middleware: [middlewares.keycloakUserManageViewEnforcer, middlewares.keycloakAccount, middlewares.apiKey, middlewares.logResponseBody],
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

};

export default Controller;

const _validateUsers = (users) => {
  let isValidated = true;
  let message = null;
  users.every(user => {
    if (!user.Email) {
      isValidated = false;
      message = `Email is required`;
      return false;
    }
    if (!validator.isEmail(user.Email)) {
      isValidated = false;
      message = `${user.Email}: Email is invalid`;
      return false;
    }
    return true;
  })
  const emailArr = users.map((item) => { return item.Email });
  const isDuplicateEmail = emailArr.some((item, idx) => {
    return emailArr.indexOf(item) != idx
  });
  if (isDuplicateEmail) {
    isValidated = false;
    message = `Email cannot be the same`;
  }
  return {
    isValidated,
    message,
  }
}

const _removeDuplicates = (arr) => {
  let unique_array = []
  for (let i = 0; i < arr.length; i++) {
    if (unique_array.indexOf(arr[i]) == -1) {
      unique_array.push(arr[i])
    }
  }
  return unique_array
}

const _validateRealmRoles = (roleArr, isTeamMember) => {
  let invalidRoles = [];
  let assignRoles = [];
  roleArr.map(item1 => {
    let found = false;
    constants.keycloakRealmRoles.map(item2 => {
      if (item1 == item2.type) {
        found = true;
        assignRoles.push(item2);
      }
    })
    if (!found) {
      invalidRoles.push(item1);
    }
  })
  if (invalidRoles.length) {
    return {
      isValidated: false,
      invalidRoles,
      assignRoles,
    }
  }

  if (isTeamMember == '1') {
    if (roleArr.indexOf('keycloakUser') != -1) {
      invalidRoles.push('keycloakUser');
      return {
        isValidated: false,
        invalidRoles,
        assignRoles,
      }
    }
  } else {
    if (roleArr.length != 1 || roleArr[0] != 'keycloakUser') {
      const index = roleArr.indexOf('keycloakUser');
      roleArr.splice(index, 1);
      return {
        isValidated: false,
        invalidRoles: roleArr,
        assignRoles,
      }
    }
  }

  return {
    isValidated: true,
    invalidRoles,
    assignRoles,
  }
}