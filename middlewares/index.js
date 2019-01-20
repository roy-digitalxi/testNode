import moment from "moment";
import LogService from "../services/LogService";
import ApiKeyService from "../services/ApiKeyService";
import contants from "../constants";

// keycloak
import KeycloakMultirealm from '../keycloak//keycloak-connect-multirealm';
import session from 'express-session';

// keycloak session
const memoryStore = new session.MemoryStore();
const config = { store: memoryStore };
const keycloakConfig = {
  "auth-server-url": `${contants.keycloakHost}`,
  'bearer-only': false,
  "ssl-required": "external",
  "resource": `${contants.keycloakConnect}`,
  "policy-enforcer": {},
  "confidential-port": 0,
  "public-client": true,
};
const keycloak = new KeycloakMultirealm(config, keycloakConfig);

const keycloakSession = session({
  secret: 'mySecret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
});
const keycloakMiddleware = keycloak.middleware({
  logout: '/logout',
  admin: '/',
});
const permissionConfig = {
  resource_server_id: 'nodejs-apiserver',
  response_mode: 'permissions'
};

export default {

  keycloakSession,
  keycloakMiddleware,

  keycloakAdminProtect: keycloak.protect('realm:admin'),
  // resource-based access control
  // 1. SA API
  keycloakAdminCreateEnforcer: keycloak.enforcer(['admin-resource-create:create'], permissionConfig),
  keycloakAdminViewEnforcer: keycloak.enforcer(['admin-resource-view:view'], permissionConfig),
  keycloakAdminUpdateEnforcer: keycloak.enforcer(['admin-resource-update:update'], permissionConfig),
  keycloakAdminDeleteEnforcer: keycloak.enforcer(['admin-resource-delete:delete'], permissionConfig),

  // 2. API
  keycloakProtect: keycloak.protect(),
  // 2.1 org-resource
  keycloakOrgCreateEnforcer: keycloak.enforcer(['org-resource-create:create'], permissionConfig),
  keycloakOrgUpdateEnforcer: keycloak.enforcer(['org-resource-update:update'], permissionConfig),
  keycloakOrgViewEnforcer: keycloak.enforcer(['org-resource-view:view'], permissionConfig),
  keycloakOrgDeleteEnforcer: keycloak.enforcer(['org-resource-delete:delete'], permissionConfig),
  // 2.2 content-resource
  keycloakContentCreateEnforcer: keycloak.enforcer(['content-resource-create:create'], permissionConfig),
  keycloakContentUpdateEnforcer: keycloak.enforcer(['content-resource-update:update'], permissionConfig),
  keycloakContentViewEnforcer: keycloak.enforcer(['content-resource-view:view'], permissionConfig),
  keycloakContentDeleteEnforcer: keycloak.enforcer(['content-resource-delete:delete'], permissionConfig),
  // 2.3 publish-resource
  keycloakPublishCreateEnforcer: keycloak.enforcer(['publish-resource-create:create'], permissionConfig),
  keycloakPublishUpdateEnforcer: keycloak.enforcer(['publish-resource-update:update'], permissionConfig),
  keycloakPublishViewEnforcer: keycloak.enforcer(['publish-resource-view:view'], permissionConfig),
  keycloakPublishDeleteEnforcer: keycloak.enforcer(['publish-resource-delete:delete'], permissionConfig),
  // 2.4 channel-resource
  keycloakChannelCreateEnforcer: keycloak.enforcer(['channel-resource-create:create'], permissionConfig),
  keycloakChannelUpdateEnforcer: keycloak.enforcer(['channel-resource-update:update'], permissionConfig),
  keycloakChannelViewEnforcer: keycloak.enforcer(['channel-resource-view:view'], permissionConfig),
  keycloakChannelDeleteEnforcer: keycloak.enforcer(['channel-resource-delete:delete'], permissionConfig),
  // 2.5 user-manage-resource
  keycloakUserManageCreateEnforcer: keycloak.enforcer(['user-manage-resource-create:create'], permissionConfig),
  keycloakUserManageUpdateEnforcer: keycloak.enforcer(['user-manage-resource-update:update'], permissionConfig),
  keycloakUserManageViewEnforcer: keycloak.enforcer(['user-manage-resource-view:view'], permissionConfig),
  keycloakUserManageDeleteEnforcer: keycloak.enforcer(['user-manage-resource-delete:delete'], permissionConfig),
  // 2.6 analytics-resource
  keycloakAnalyticsCreateEnforcer: keycloak.enforcer(['analytics-resource-create:create'], permissionConfig),
  keycloakAnalyticsUpdateEnforcer: keycloak.enforcer(['analytics-resource-update:update'], permissionConfig),
  keycloakAnalyticsViewEnforcer: keycloak.enforcer(['analytics-resource-view:view'], permissionConfig),
  keycloakAnalyticsDeleteEnforcer: keycloak.enforcer(['analytics-resource-delete:delete'], permissionConfig),
  // 2.7 language-resource
  keycloakLanguageCreateEnforcer: keycloak.enforcer(['language-resource-create:create'], permissionConfig),
  keycloakLanguageUpdateEnforcer: keycloak.enforcer(['language-resource-update:update'], permissionConfig),
  keycloakLanguageViewEnforcer: keycloak.enforcer(['language-resource-view:view'], permissionConfig),
  keycloakLanguageDeleteEnforcer: keycloak.enforcer(['language-resource-delete:delete'], permissionConfig),
  // 2.8 user-resource
  keycloakUserCreateEnforcer: keycloak.enforcer(['user-resource-create:create'], permissionConfig),
  keycloakUserUpdateEnforcer: keycloak.enforcer(['user-resource-update:update'], permissionConfig),
  keycloakUserViewEnforcer: keycloak.enforcer(['user-resource-view:view'], permissionConfig),
  keycloakUserDeleteEnforcer: keycloak.enforcer(['user-resource-delete:delete'], permissionConfig),


  keycloakAccount: (req, res, next) => {
    if (!req.kauth
      || !req.kauth.grant
      || !req.kauth.grant.access_token
      || !req.kauth.grant.access_token.token) {
      return res.status(403).json({
        Confirmation: "Fail",
        Message: "Access denied"
      });
    }
    const token = req.kauth.grant.access_token.token;
    const realm = getRealmNameFromRequest(req);
    if (!realm) {
      return res.status(403).json({
        Confirmation: "Fail",
        Message: "Access denied"
      });
    }
    keycloak.getAccount(realm, token)
      .then((user) => {
        if (!user.sub) {
          return res.status(403).json({
            Confirmation: "Fail",
            Message: "Access denied"
          });
        }
        user.realm = realm;
        req.body.KeycloakUser = user;
        return next();
      })
      .catch(err => {
        return res.status(403).json({
          Confirmation: "Fail",
          Message: "Access denied"
        });
      })
  },

  apiKey: (req, res, next) => {
    let apiKey = req.get("api-key");
    if (!apiKey) {
      return res.status(401).json({
        Confirmation: "Fail",
        Message: "Api key is required"
      });
    }

    let params = {
      KeyGUID: apiKey,
      IsActive: 1
    };
    ApiKeyService.apiKeyList(params)
      .then(apiKeyArr => {
        if (apiKeyArr.length == 0) {
          return res.status(401).json({
            Confirmation: "Fail",
            Message: "Api key is invalid"
          });
        }

        let key = apiKeyArr[0];
        let { Level } = key;

        let url = req.originalUrl;
        let apiList = contants.API_LIST;
        if (!apiList[url]) {
          return res.status(401).json({
            Confirmation: "Fail",
            Message: "Api key is invalid"
          });
        }

        let apiLevel = apiList[url];
        if (Level < apiLevel) {
          return res.status(401).json({
            Confirmation: "Fail",
            Message: "Api key is invalid"
          });
        }

        req.body.ApiKey = apiKey;
        return next();
      })
      .catch(error => {
        return res.status(401).json({
          Confirmation: "Fail",
          Message: "Api key is invalid"
        });
      });
  },

  logResponseBody: (req, res, next) => {
    let oldWrite = res.write,
      oldEnd = res.end,
      startTime = moment();

    let chunks = [];
    res.write = function (chunk) {
      chunks.push(chunk);
      oldWrite.apply(res, arguments);
    };

    res.end = function (chunk) {
      if (chunk) chunks.push(chunk);

      let body = Array.isArray(chunks)
        ? Buffer.concat(chunks).toString("utf8")
        : "";
      let now = moment();
      let then = moment(startTime, "YYYY-MM-DD'T'HH:mm:ss:SSSZ");
      let diff = moment.duration(then.diff(now)).asMilliseconds();
      if (diff < 0) {
        diff = Math.abs(diff);
      }
      let rtime = moment.utc(diff).format("s.SSS");

      let params = {
        Header: JSON.stringify(req.headers),
        APIKey: req.get("api-key") ? req.get("api-key") : "",
        StatusCode: res.statusCode,
        ElapseTime: rtime,
        Method: req.method,
        URL: req.originalUrl,
        Params: JSON.stringify(req.body),
        Response: body,
        Timestamp: now
      };
      LogService.createLog(params)
        .then(response => {
          //console.log('SUCCESS: ',response);
        })
        .catch(error => {
          //console.log('err: ',error);
        });
      oldEnd.apply(res, arguments);
    };

    next();
  }
};

const getRealmNameFromRequest = (req) => {
  // specific target realm
  if (req.url.includes('/admin/login')) {
    return 'digitalxi';
  }
  if (req.get('host').includes('localhost')) {
    return 'org5024663852';
  }
  return req.get('host').replace('-api.publishxi.com', '');
}