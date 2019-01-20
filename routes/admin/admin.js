// Default
import middlewares from "../../middlewares";

// services
import KeycloakService from "../../services/KeycloakService";
import UserService from "../../services/UserService";
import OrgService from "../../services/OrgService";

// controller

// helpers
import * as dbHelper from '../../utilities/dbHelper';
import * as passwordHelper from '../../utilities/passwordHelper';

// Libraries
import validator from "validator";

// Constants
import constants from "../../constants";

const Controller = {

  "/admin/login": {
    path: "/admin/login",
    method: "get",
    middleware: [middlewares.keycloakAdminProtect, middlewares.logResponseBody],
    controller: (req, res, next) => {
      const keycloakToken = JSON.parse(req.session['keycloak-token']);
      const {
        access_token,
        refresh_token
      } = keycloakToken;
      return res.json({
        Confirmation: 'SUCCESS',
        Response: {
          AccessToken: access_token,
          RefreshToken: refresh_token,
        }
      })
    }
  },


  "/admin/org_list": {
    path: "/admin/org_list",
    method: "post",
    middleware: [middlewares.keycloakAdminViewEnforcer, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let { Limit, Offset, Extra } = req.body;

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

        const totalRecord = await OrgService.orgListByParams(true, Limit, Offset, Extra);
        const orgList = await OrgService.orgListByParams(false, Limit, Offset, Extra);

        return res.json({
          Confirmation: 'SUCCESS',
          Response: {
            TotalRecord: totalRecord,
            Orgs: orgList
          }
        })
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/admin/create_org": {
    path: "/admin/create_org",
    method: "post",
    middleware: [middlewares.keycloakAdminCreateEnforcer, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        OrgName,
        Email,
        FirstName,
        LastName,
        Password,
      } = req.body;

      if (!OrgName) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "OrgName is required" });
      }
      if (!Email) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Email is required" });
      }
      if (!validator.isEmail(Email)) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Email is invalid" });
      }
      if (!FirstName) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "FirstName is required" });
      }
      if (!LastName) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "LastName is required" });
      }
      if (!Password) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Password is required" });
      }

      try {

        // -1. check org name unique
        const orgList = await OrgService.orgList({ OrgName });
        if (orgList.length) {
          return res.json({ Confirmation: "FAIL", Message: "Org name already existed" });
        }
        const mysqlDbList = await dbHelper.mysqlDbList();
        const mongoDbList = await dbHelper.mongoDbList();
        const realmList = await KeycloakService.realmList();

        dbHelper.generateUniqueDbName(realmList, mysqlDbList, mongoDbList, async (err, dbName) => {
          if (err) {
            return res.json({ Confirmation: "FAIL", Message: "DB error" });
          }

          const dbUserName = dbName;
          const dbPassword = passwordHelper.randomPassword();
          const realmName = dbName;

          // 0. create org
          const org = {
            Realm: realmName,
            OrgName,
            OrgUrl: convertOrgNameToOrgUrl(OrgName),
            OrgDbName: dbName,
            OrgDbPassword: dbPassword,
            IsActive: 0
          };
          const createdOrg = await OrgService.createOrg(org);

          // 1. MySQL setup
          const mysqlSetupRes = await dbHelper.mysqlSetup(dbName, dbUserName, dbPassword);

          // 2. MongoDB setup
          const mongoSetupRes = await dbHelper.mongoSetup(dbName, dbUserName, dbPassword);

          // 3. Keycloak setup
          // 3.1 create realm
          const keycloakCreatedRealm = await KeycloakService.createRealm(realmName, OrgName);

          // 3.2 create clients
          const keycloakCreatedServerClient = await KeycloakService.createServerClient(keycloakCreatedRealm.realm, constants.keycloakServer);
          const keycloakCreatedConnectClient = await KeycloakService.createConnectClient(keycloakCreatedRealm.realm, constants.keycloakConnect);

          // 3.3 create realm role
          const keycloakCreatedRealmRoles = await KeycloakService.createRealmRoles(keycloakCreatedRealm.realm, constants.keycloakRealmRoles);
          const keycloakCreatedRealmRolesFilter = keycloakCreatedRealmRoles.map(item => { return item.role });
          const keycloakCreatedRealmOrgAdminRoleFilter = keycloakCreatedRealmRoles.filter(item => item.type == 'keycloakOrgAdmin');
          const keycloakCreatedRealmOrgAdminRole = keycloakCreatedRealmOrgAdminRoleFilter[0].role;

          const token = await KeycloakService.keycloakAdminLogin();
          // 3.4 create client scope
          // const keycloakCreatedClientScopeId = await KeycloakService.createClientScope(token, keycloakCreatedRealm.realm, constants.keycloakClientScope);

          // 3.5 add client scope mapper
          // await KeycloakService.createClientScopeMappers(constants.keycloakClientScopeMappers, token, keycloakCreatedRealm.realm, keycloakCreatedClientScopeId);

          // 3.6 add client scope to connect client
          // await KeycloakService.addClientScopeToClient(token, keycloakCreatedRealm.realm, keycloakCreatedConnectClient.id, keycloakCreatedClientScopeId);

          // 3.7 add realm scope to connect client
          await KeycloakService.addRealmRoleToClient(token, keycloakCreatedRealm.realm, keycloakCreatedConnectClient.id, keycloakCreatedRealmRolesFilter);

          // 3.8 setup server client authorization
          // 3.8.1 scope
          const authScopeRes = await KeycloakService.createAuthorizationScopes(constants.keycloakClientAuthScopes, token, keycloakCreatedRealm.realm, keycloakCreatedServerClient.id);

          // 3.8.2 resource
          const createdAuthResources = await KeycloakService.createAuthorizationResources(constants.keycloakClientAuthResources, token, keycloakCreatedRealm.realm, keycloakCreatedServerClient.id, authScopeRes);

          // 3.8.3 policy
          const createdAuthPolicies = await KeycloakService.createAuthorizationPolicies(constants.keycloakClientAuthPolicies, token, keycloakCreatedRealm.realm, keycloakCreatedServerClient.id, keycloakCreatedRealmRoles);

          // 3.8.4 permission
          const createdAuthPermissions = await KeycloakService.createAuthorizationPermissions(constants.keycloakClientAuthPermissions, token, keycloakCreatedRealm.realm, keycloakCreatedServerClient.id, createdAuthResources, createdAuthPolicies);

          // 3.9 create org admin user 
          let user = {
            username: Email,
            email: Email,
            firstName: FirstName,
            lastName: LastName,
            emailVerified: true,
            enabled: true,
            attributes: {}
          };
          const createdUser = await UserService.createUser(keycloakCreatedRealm.realm, user, Password);

          // 3.10 add realm role to keycloak user
          const updateRealmRoles = [
            {
              id: keycloakCreatedRealmOrgAdminRole.id,
              name: keycloakCreatedRealmOrgAdminRole.name
            }
          ];
          const addRealmRolesToUserRes = await UserService.addRealmRolesToUser(keycloakCreatedRealm.realm, createdUser.id, updateRealmRoles);

          // 3.11 add realm management to keycloak user
          const addRealmManagementToUserRes = await UserService.addRealmManagementToUser(token, keycloakCreatedRealm.realm, createdUser.id);

          const formattedOrg = {
            OrgGUID: createdOrg.OrgGUID,
            Realm: createdOrg.Realm,
            OrgName: createdOrg.OrgName,
            OrgUrl: createdOrg.OrgUrl,
            IsActive: createdOrg.IsActive,
            CreatedAt: createdOrg.CreatedAt
          }
          return res.json({
            Confirmation: "SUCCESS",
            Response: {
              Org: formattedOrg
            }
          })
        })
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/admin/view_org": {
    path: "/admin/view_org",
    method: "post",
    middleware: [middlewares.keycloakAdminViewEnforcer, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let { OrgGUID } = req.body;

      if (!OrgGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "OrgGUID is required" });
      }
      try {

        const org = await OrgService.getOrgByGUID(OrgGUID);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "Org not found" });
        } else {

          const {
            OrgGUID,
            OrgName,
            OrgUrl,
            IsActive,
            CreatedAt,
            UpdatedAt,
          } = org;
          return res.json({
            Confirmation: "SUCCESS",
            Response: {
              Org: {
                OrgGUID,
                OrgName,
                OrgUrl,
                IsActive,
                CreatedAt,
                UpdatedAt,
              }
            }
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/admin/update_org": {
    path: "/admin/update_org",
    method: "post",
    middleware: [middlewares.keycloakAdminUpdateEnforcer, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        OrgGUID,
        OrgName,
      } = req.body;

      if (!OrgGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "OrgGUID is required" });
      }
      if (!OrgName) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "OrgName is required" });
      }
      try {

        // 1. check org status
        const org = await OrgService.getOrgByGUID(OrgGUID);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "Org not found" });
        } else {

          if (org.IsActive) {
            return res.json({ Confirmation: "FAIL", Message: "Org status is invalid" });
          }

          // 2. check org name unique
          const orgList = await OrgService.orgList({ OrgName });
          if (orgList.length > 1
            || (orgList.length == 1 && orgList[0].OrgID != org.OrgID)) {
            return res.json({ Confirmation: "FAIL", Message: "Org name already existed" });
          }

          // 3. update org name and url
          const updateOrg = {
            OrgName: OrgName.trim(),
            OrgUrl: convertOrgNameToOrgUrl(OrgName),
          };
          const updateOrgRes = await OrgService.updateOrg(org.OrgID, updateOrg);

          if (updateOrgRes) {
            const tmpOrg = await OrgService.getOrgByID(org.OrgID);
            const {
              OrgGUID,
              Realm,
              OrgName,
              OrgUrl,
              IsActive,
              CreatedAt,
              UpdatedAt,
            } = tmpOrg;
            return res.json({
              Confirmation: "SUCCESS",
              Response: {
                Org: {
                  OrgGUID,
                  Realm,
                  OrgName,
                  OrgUrl,
                  IsActive,
                  CreatedAt,
                  UpdatedAt,
                }
              }
            })
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/admin/update_org_status": {
    path: "/admin/update_org_status",
    method: "post",
    middleware: [middlewares.keycloakAdminUpdateEnforcer, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        OrgGUID,
        IsActive,
      } = req.body;

      if (!OrgGUID) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "OrgGUID is required" });
      }
      if (!IsActive) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "IsActive is required" });
      }
      if (["0", "1"].indexOf(IsActive) == -1) {
        return res.status(401).json({ Confirmation: "FAIL", Message: "IsActive is invalid, must be one of [0, 1]" });
      }
      try {

        const org = await OrgService.getOrgByGUID(OrgGUID);
        if (!org) {
          return res.json({ Confirmation: "FAIL", Message: "Org not found" });
        } else {

          const updateOrg = {
            IsActive,
          };
          const updateOrgRes = await OrgService.updateOrg(org.OrgID, updateOrg);
          
          if(updateOrgRes){
            const tmpOrg = await OrgService.getOrgByID(org.OrgID);
            const {
              OrgGUID,
              Realm,
              OrgName,
              OrgUrl,
              IsActive,
              CreatedAt,
              UpdatedAt,
            } = tmpOrg;
            return res.json({
              Confirmation: "SUCCESS",
              Response: {
                Org: {
                  OrgGUID,
                  Realm,
                  OrgName,
                  OrgUrl,
                  IsActive,
                  CreatedAt,
                  UpdatedAt,
                }
              }
            })
          }
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


  "/admin/delete_org": {
    path: "/admin/delete_org",
    method: "post",
    middleware: [middlewares.keycloakAdminDeleteEnforcer, middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      console.log('hit delete');
    }
  },

};

export default Controller;

const convertOrgNameToOrgUrl = (orgName) => {
  return orgName.replace(/\s/g, '.').trim();
}