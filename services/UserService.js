import Promise from "bluebird";
import adminClient from 'keycloak-admin-client';
import axios from 'axios';
import Sequelize from "sequelize";
import mysql from 'mysql';

// Constants
import constants from "../constants";

const connectKeycloakDB = () => {
  const sequelize = new Sequelize("keycloak", constants.mysqlUser, constants.mysqlPassword, {
    dialect: "mysql",
    dialectOptions: {
      multipleStatements: true
    },
    logging: false,
    define: {
      timestamps: false
    }
  });
  return sequelize;
}

const keycloakClient = () => {
  const keyCloakSettings = {
    baseUrl: `${constants.keycloakHost}`,
    username: `${constants.keycloakSystemUser}`,
    password: `${constants.keycloakSystemtPassword}`,
    grant_type: 'password',
    client_id: 'admin-cli'
  };
  return adminClient(keyCloakSettings);
}

const getUserByUserID = (realm, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      client.users.find(realm, { userId })
        .then(user => {
          resolve(user);
          return;
        })
        .catch(error => {
          reject(error);
          return;
        })
    } catch (error) {
      reject(error);
      return;
    }
  })
}

const getUserRolesByUserID = (realm, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      client.users.roleMappings.find(realm, userId)
        .then(userRoles => {
          resolve(userRoles);
          return;
        })
        .catch(error => {
          reject(error);
          return;
        })
    } catch (error) {
      reject(error);
      return;
    }
  })
}

const createUser = (realm, newUser, password) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      client.users.create(realm, newUser)
        .then((createdUser) => {

          const updateUser = {
            type: 'password',
            value: password
          };
          client.users.resetPassword(realm, createdUser.id, updateUser)
            .then(() => {
              resolve(createdUser);
              return;
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
    } catch (error) {
      reject(error);
      return;
    }
  })
}

const updateUser = (realm, updateUser) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      const updateRes = await client.users.update(realm, updateUser);
      resolve(updateRes);
      return;
    } catch (error) {
      reject(error);
      return;
    }
  })
}

const updateUserPassword = (realm, userId, password) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      const updateRes = await client.users.resetPassword(realm, userId, { value: password });
      resolve(updateRes);
      return;
    } catch (error) {
      reject(error);
      return;
    }
  })
}

const deleteUser = (realm, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      const deleteRes = await client.users.remove(realm, userId);
      resolve(deleteRes);
      return;
    } catch (error) {
      reject(error);
      return;
    }
  })
}

const addRealmRolesToUser = (realm, userId, roles) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      client.realms.maps.map(realm, userId, roles)
        .then((response) => {
          resolve(response);
          return;
        })
        .catch(error => {
          reject(error);
          return;
        })
    } catch (error) {
      reject(error);
      return;
    }
  })
}

const addRealmManagementToUser = (token, realm, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      client.clients.find(realm, { clientId: 'realm-management' })
        .then(realmManagementClient => {

          if (!realmManagementClient.length) {
            reject();
            return;
          }
          const realmManagementClientId = realmManagementClient[0].id;
          client.clients.roles.find(realm, realmManagementClientId)
            .then((clientRoles) => {

              const url = `${constants.keycloakHost}/admin/realms/${realm}/users/${userId}/role-mappings/clients/${realmManagementClientId}`;
              axios.post(url, clientRoles, {
                headers: {
                  'Authorization': "Bearer " + token
                }
              })
                .then(() => {
                  resolve();
                  return;
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
    } catch (error) {
      reject(error);
      return;
    }
  })
}

const updateRealmRolesToUser = (realm, userId, newRoles, oldRoles) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      const unmapRes = await client.realms.maps.unmap(realm, userId, oldRoles);
      const mapRes = await client.realms.maps.map(realm, userId, newRoles);
      resolve(mapRes);
      return;
    } catch (error) {
      reject(error);
      return;
    }
  })
}

const assignRealmRolesToUser = (realm, userId, roles) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      const mapRes = await client.realms.maps.map(realm, userId, roles);
      resolve(mapRes);
      return;
    } catch (error) {
      reject(error);
      return;
    }
  })
}

const removeRealmRolesToUser = (realm, userId, roles) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      const unmapRes = await client.realms.maps.unmap(realm, userId, roles);
      resolve(unmapRes);
      return;
    } catch (error) {
      reject(error);
      return;
    }
  })
}

const userList = (realm, params) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      client.users.find(realm, params)
        .then(users => {
          resolve(users);
          return;
        })
        .catch(error => {
          reject(error);
          return;
        })
    } catch (error) {
      reject(error);
      return;
    }
  })
}

const userListByEmail = (realm, email) => {
  return new Promise(async (resolve, reject) => {
    const sequelize = connectKeycloakDB();
    try {
      let sql = "SELECT UE.ID";
      sql += " FROM USER_ENTITY AS UE";
      sql += ` LEFT JOIN keycloak.REALM AS R ON R.ID = UE.REALM_ID`;
      sql += ` WHERE R.NAME = "${realm}" AND UE.EMAIL = "${email}" AND UE.SERVICE_ACCOUNT_CLIENT_LINK is null`;

      const users = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT })
      sequelize.close();
      resolve(users);
      return;
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
}

const userListByParams = (realm, isTeamMember, onlyRow, limit, offset, extra) => {
  return new Promise(async (resolve, reject) => {

    var con = mysql.createConnection({
      host: constants.mysqlHost,
      user: constants.mysqlUser,
      password: constants.mysqlPassword,
    });

    try {

      con.connect((err) => {
        if (err) {
          con.end();
          reject(error);
          return;
        }

        let sql;
        let {
          FilterType,
          FilterField,
          SearchType,
          SearchField,
        } = extra;

        let isChannelFilter = false;
        let isRoleFilter = false;
        if (FilterType && FilterField) {
          if (['CHANNEL_FILTER'].indexOf(FilterType) != -1) {
            if (Array.isArray(FilterField) && FilterField.length) {
              isChannelFilter = true;
            }
          } else if (['ROLE_FILTER'].indexOf(FilterType) != -1) {
            if (Array.isArray(FilterField) && FilterField.length) {
              isRoleFilter = true;
            }
          }
        }

        if (onlyRow) {
          sql = "SELECT UE.ID AS UserGUID";
        } else {
          sql = "SELECT UE.ID AS UserGUID, UE.EMAIL AS Email, UE.FIRST_NAME AS FirstName, UE.LAST_NAME AS LastName, UE.ENABLED AS Enabled, UE.CREATED_TIMESTAMP AS CreatedTimestamp,";
          sql += " GROUP_CONCAT(KR.NAME separator ',') AS Roles";
        }

        sql += " FROM keycloak.USER_ENTITY AS UE";
        sql += ` LEFT JOIN keycloak.REALM AS R ON R.ID = UE.REALM_ID`;
        sql += ` LEFT JOIN keycloak.USER_ROLE_MAPPING AS URM ON URM.USER_ID = UE.ID`;
        sql += ` LEFT JOIN keycloak.KEYCLOAK_ROLE AS KR ON KR.ID = URM.ROLE_ID`;

        if (isChannelFilter) {
          sql += ` LEFT JOIN ${realm}.ChannelSubscribes AS CS ON CS.UserGUID = UE.ID`;
          sql += ` LEFT JOIN ${realm}.ExperienceChannels AS EC ON EC.ExperienceChannelID = CS.ExperienceChannelID`;
        }

        sql += ` WHERE R.NAME = "${realm}" AND UE.SERVICE_ACCOUNT_CLIENT_LINK is null`;

        if (isRoleFilter) {
          if (isTeamMember == '1') {

            const formattedFilterFiled = [];
            FilterField.forEach(item1 => {
              constants.keycloakRealmRoles.forEach(item2 => {
                if (item1 == item2.type) {
                  formattedFilterFiled.push(item2.value);
                }
              })
            })

            sql += ' AND (';
            formattedFilterFiled.forEach(role => {
              sql += ` KR.NAME = "${role}" OR`;
            })
            sql = sql.replace(/OR$/, ")");
          } else {
            sql += ` AND (KR.NAME = "user")`;
          }
        } else {
          if (isTeamMember == '1') {
            sql += ` AND (KR.NAME = "org-admin" 
            OR KR.NAME = "content-admin"
            OR KR.NAME = "publish-admin"
            OR KR.NAME = "channel-admin"
            OR KR.NAME = "user-manage-admin"
            OR KR.NAME = "analytics-admin"
            OR KR.NAME = "language-admin")`;
          } else {
            sql += ` AND (KR.NAME = "user")`;
          }
        }

        if (SearchType && SearchField) {
          if (['FIRST_LAST_NAME_EMAIL'].indexOf(SearchType) != -1) {
            sql += ` AND (UE.FIRST_NAME LIKE "%${SearchField}%" OR UE.LAST_NAME LIKE "%${SearchField}%" OR UE.EMAIL LIKE "%${SearchField}%")`;
          }
        }

        if (isChannelFilter) {
          sql += ' AND (';
          FilterField.forEach(channel => {
            sql += ` EC.ExperienceChannelGUID = "${channel}" OR`;
          })
          sql = sql.replace(/OR$/, ")");
        }

        sql += ' GROUP BY UE.ID'
        sql += " ORDER BY UE.CREATED_TIMESTAMP DESC";

        if (onlyRow) {
          con.query(sql, (error, users) => {
            con.end();
            if (error) {
              reject(error);
              return;
            }
            resolve(users.length);
            return;
          })
        } else {
          if (limit !== "-1") {
            sql += ` LIMIT ${limit}`;
            sql += ` OFFSET ${offset}`;
          }
          con.query(sql, (error, users) => {
            con.end();
            if (error) {
              reject(error);
              return;
            }

            let tasks = [];
            users.forEach((user) => {
              let task = new Promise((resolve, reject) => {
                getUserAttrsByUserID(user.UserGUID)
                  .then((activeUserAttrs) => {
                    user.Attributes = activeUserAttrs;
                    resolve(user);
                    return;
                  })
                  .catch(error => {
                    reject(error);
                    return;
                  })
              })
              tasks.push(task);
            })
            Promise.all(tasks)
              .then((formattedUsers) => {
                resolve(formattedUsers);
                return;
              })
              .catch(error => {
                reject(error);
                return;
              })
          })
        }
      })
    } catch (error) {
      reject(error);
      return;
    }
  })
}

const getUserAttrsByUserID = (userId) => {
  return new Promise(async (resolve, reject) => {
    const sequelize = connectKeycloakDB();
    try {

      let sql = "SELECT UA.NAME, UA.VALUE";
      sql += " FROM USER_ATTRIBUTE AS UA";
      sql += ` LEFT JOIN USER_ENTITY AS UE ON UE.ID = UA.USER_ID`;
      sql += ` WHERE UA.USER_ID = "${userId}"`;

      const userAttrs = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT })
      sequelize.close();
      resolve(userAttrs);
      return;
    } catch (error) {
      sequelize.close();
      reject(error);
      return;
    }
  })
}

const userLogout = (token, realm, userId) => {
  return new Promise((resolve, reject) => {
    const url = `${constants.keycloakHost}/admin/realms/${realm}/users/${userId}/logout`;
    const params = {
      realm,
      user: userId
    };
    axios.post(url, params, {
      headers: { 'Authorization': "Bearer " + token }
    })
      .then((response) => (response.data))
      .then(() => {
        resolve();
        return;
      })
      .catch(error => {
        reject(error);
        return;
      })
  })
}

export default {

  getUserByUserID,
  getUserRolesByUserID,
  getUserAttrsByUserID,

  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,

  addRealmRolesToUser,
  addRealmManagementToUser,

  updateRealmRolesToUser,
  assignRealmRolesToUser,
  removeRealmRolesToUser,

  userList,
  userListByEmail,
  userListByParams,
  userLogout,
};
