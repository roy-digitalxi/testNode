const express = require('express');
const bodyParser = require("body-parser");
const axios = require("axios");
const qs = require('qs');

// keycloak
// user: keycloak
// pwd: 8iz3iZpGW7

// mysql
// host: mysql-bitnami-mysql.default.svc.cluster.local
// user: root
// pwd: root

// mongodb
// host: mongodb-bitnami.default.svc.cluster.local
// user: root
// pwd: password


// keycloak
const adminClient = require('keycloak-admin-client');
const KeycloakMultirealm = require('./keycloak-connect-multirealm');
const session = require('express-session');


// DB
const mysql = require('mysql');
const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');


const mysqlHost = 'mysql-bitnami-mysql.default.svc.cluster.local';
const mysqlUser = 'root';
const mysqlPassword = 'root';

const mongoDbHost = 'mongodb-bitnami.default.svc.cluster.local';
const mongoDbUser = 'root';
const mongoDbPassword = 'password';

// const keycloakHost = 'http://35.203.22.133/auth';
const keycloakHost = 'http://localhost:8080/auth';
const keycloakUser = 'keycloak';
const keycloakPassword = '8iz3iZpGW7';

// express
const app = express();
const port = (process.env.PORT || 3000);
app.use(bodyParser.json());


// keycloak session
const memoryStore = new session.MemoryStore();
const config = { store: memoryStore };
const keycloakConfig = {
  "auth-server-url": `${keycloakHost}`,
  'bearer-only': false,
  "ssl-required": "external",
  "resource": "nodejs-connect",
  "policy-enforcer": {},
  "confidential-port": 0,
  "public-client": true,
};
const keycloak = new KeycloakMultirealm(config, keycloakConfig);

app.use(session({
  secret: 'mySecret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));
app.use(keycloak.middleware({
  logout: '/logout',
  admin: '/',
}));


app.get('/', function (req, res) {
  return res.json({
    message: 'server is running'
  })
})

app.get('/login', keycloak.protect(), (req, res) => {
  return res.json({
    result: JSON.stringify(JSON.parse(req.session['keycloak-token']), null, 4),
  })
})

app.post('/mongodb_create', keycloak.enforcer(['res1:create'],
  {
    resource_server_id: 'nodejs-apiserver',
    response_mode: 'permissions'
  }
), (req, res) => {

  const token = req.kauth.grant.access_token.token;
  keycloak.getAccount(req.query.realm, token)
    .then((user) => {

      const {
        dbUserName,
        dbPassword,
      } = user;

      if (!dbUserName) {
        return res.json({
          confirmation: 'fail',
          message: 'dbUserName is required'
        })
      }

      if (!dbPassword) {
        return res.json({
          confirmation: 'fail',
          message: 'dbPassword is required'
        })
      }

      const dbName = dbUserName;

      MongoClient.connect(`mongodb://${dbUserName}:${dbPassword}@${mongoDbHost}:27017/${dbName}`, { useNewUrlParser: true }, (err, db) => {
        if (err) {
          return res.json({
            confirmation: 'fail',
            message: 'fail to connect db'
          })
        }

        const dbo = db.db(dbName);
        const myobj = { name: "Company Inc", address: "Highway 37" };
        dbo.collection("test").insertOne(myobj, (err, result) => {
          db.close();
          if (err) {
            return res.json({
              confirmation: 'fail',
              message: 'fail to insert data to collection'
            })
          }

          return res.json({
            confirmation: 'success',
            message: 'inserted to the corresponding db',
          })
        })
      })

    })
    .catch((error) => {
      return res.json({
        confirmation: 'fail',
        message: 'fail to get keycloak account'
      })
    })
})


app.post('/mongodb_view', keycloak.enforcer(['res1:create'],
  {
    resource_server_id: 'nodejs-apiserver',
    response_mode: 'permissions'
  }
), (req, res) => {
  
  const token = req.kauth.grant.access_token.token;

  keycloak.getAccount(req.query.realm, token)
    .then((user) => {

      const {
        dbUserName,
        dbPassword,
      } = user;

      if (!dbUserName) {
        return res.json({
          confirmation: 'fail',
          message: 'dbUserName is required'
        })
      }

      if (!dbPassword) {
        return res.json({
          confirmation: 'fail',
          message: 'dbPassword is required'
        })
      }

      const dbName = dbUserName;

      MongoClient.connect(`mongodb://${dbUserName}:${dbPassword}@${mongoDbHost}:27017/${dbName}`, { useNewUrlParser: true }, (err, db) => {
        if (err) {
          return res.json({
            confirmation: 'fail',
            message: 'fail to connect db'
          })
        }

        const dbo = db.db(dbName);
        dbo.collection("test").find().toArray((err, result) => {
          db.close();
          if (err) {
            return res.json({
              confirmation: 'fail',
              message: 'fail to fetch'
            })
          }

          return res.json({
            confirmation: 'success',
            totalRecords: result.length,
            response: result
          })
        })
      })
    })
    .catch((error) => {
      return res.json({
        confirmation: 'fail',
        message: 'fail to get keycloak account'
      })
    })
})


app.post('/mysql_create', keycloak.enforcer(['res1:create'],
  {
    resource_server_id: 'nodejs-apiserver',
    response_mode: 'permissions'
  }
), (req, res) => {

  const token = req.kauth.grant.access_token.token;
  keycloak.getAccount(req.query.realm, token)
    .then((user) => {

      const {
        dbUserName,
        dbPassword,
      } = user;

      if (!dbUserName) {
        return res.json({
          confirmation: 'fail',
          message: 'dbUserName is required'
        })
      }

      if (!dbPassword) {
        return res.json({
          confirmation: 'fail',
          message: 'dbPassword is required'
        })
      }

      const dbName = dbUserName;

      var con = mysql.createConnection({
        host: `${mysqlHost}`,
        user: dbName,
        password: dbPassword,
        database: dbName
      });

      con.connect((err) => {
        if (err) {

          con.end();

          return res.json({
            confirmation: 'fail to connect db',
            err,
          })
        }

        var sql = `INSERT INTO customers (name, address) VALUES ('test', '199 street')`;
        con.query(sql, (err, result) => {

          con.end();

          if (err) {
            return res.json({
              confirmation: 'fail',
              err,
            })
          }
          return res.json({
            confirmation: 'success',
            message: 'insert it to db'
          })
        })

      })
    })
    .catch((error) => {
      return res.json({
        confirmation: 'fail',
        message: 'fail to get keycloak account'
      })
    })
})


app.post('/mysql_view', keycloak.enforcer(['res1:create'],
  {
    resource_server_id: 'nodejs-apiserver',
    response_mode: 'permissions'
  }
), (req, res) => {

  const token = req.kauth.grant.access_token.token;
  keycloak.getAccount(req.query.realm, token)
    .then((user) => {

      const {
        dbUserName,
        dbPassword,
      } = user;

      if (!dbUserName) {
        return res.json({
          confirmation: 'fail',
          message: 'dbUserName is required'
        })
      }

      if (!dbPassword) {
        return res.json({
          confirmation: 'fail',
          message: 'dbPassword is required'
        })
      }

      const dbName = dbUserName;

      var con = mysql.createConnection({
        host: `${mysqlHost}`,
        user: dbName,
        password: dbPassword,
        database: dbName
      });

      con.connect((err) => {
        if (err) {

          con.end();

          return res.json({
            confirmation: 'fail to connect db',
            err,
          })
        }

        con.query("SELECT * FROM customers", function (err, result) {

          con.end();

          if (err) {
            return res.json({
              confirmation: 'fail',
              err,
            })
          };
          return res.json({
            confirmation: 'success',
            totalRecords: result.length,
            result
          })
        })
      })
    })
    .catch((error) => {
      return res.json({
        confirmation: 'fail',
        message: 'fail to get keycloak account'
      })
    })
})


app.post('/admin/create_org', (req, res) => {

  const {
    orgName,
    email,
    firstName,
    lastName,
    password,
  } = req.body;

  if (!orgName) {
    return res.json({
      confirmation: 'fail',
      message: 'orgName is required'
    })
  }
  if (!email) {
    return res.json({
      confirmation: 'fail',
      message: 'email is required'
    })
  }
  if (!firstName) {
    return res.json({
      confirmation: 'fail',
      message: 'firstName is required'
    })
  }
  if (!lastName) {
    return res.json({
      confirmation: 'fail',
      message: 'lastName is required'
    })
  }
  if (!password) {
    return res.json({
      confirmation: 'fail',
      message: 'password is required'
    })
  }

  // 1. mysql check
  const mysqlCon = mysql.createConnection({
    host: mysqlHost,
    user: mysqlUser,
    password: mysqlPassword,
  });
  mysqlCon.connect((err) => {
    if (err) {
      return res.json({
        confirmation: 'fail',
        message: 'fail to connect db'
      })
    }

    const showAllDbSql = 'SHOW DATABASES;';
    mysqlCon.query(showAllDbSql, (err, mysqlDbList) => {
      if (err) {
        mysqlCon.end();
        return res.json({
          confirmation: 'fail',
          message: 'fail to connect db'
        })
      }

      // 2. mongodb check
      const adminPath = `mongodb://${mongoDbUser}:${mongoDbPassword}@${mongoDbHost}:27017/`;
      const mongoCon = mongoose.createConnection(adminPath);
      const Admin = mongoose.mongo.Admin;
      mongoCon.on('open', () => {
        new Admin(mongoCon.db).listDatabases((err, mongoDbList) => {

          if (err) {
            mysqlCon.end();
            mongoCon.close();

            return res.json({
              confirmation: 'fail',
              message: 'fail to connect db'
            })
          }

          // 3. keycloak check
          const keyCloakSettings = {
            baseUrl: `${keycloakHost}`,
            username: `${keycloakUser}`,
            password: `${keycloakPassword}`,
            grant_type: 'password',
            client_id: 'admin-cli'
          };
          adminClient(keyCloakSettings)
            .then((client) => {

              client.realms.find()
                .then((keycloakRealms) => {

                  // 4. get unique db name
                  mysqlDbList = mysqlDbList.map(item => item = ({ ...item }));
                  mongoDbList = mongoDbList.databases;
                  generateUniqueDbName(keycloakRealms, mysqlDbList, mongoDbList, (err, dbName) => {
                    if (err) {
                      mysqlCon.end();
                      return res.json({
                        confirmation: 'fail',
                        message: 'fail to generate unique db name'
                      })
                    }

                    mongoCon.close();
                    const dbUserName = dbName;
                    const dbPassword = '123456';

                    const createDbQuery = `CREATE DATABASE ${dbName}`;
                    const createTableQuery = `CREATE TABLE ${dbName}.customers (name VARCHAR(255), address VARCHAR(255))`;
                    const createDbUserQuery = `CREATE USER '${dbUserName}'@'${mysqlHost}' IDENTIFIED BY '${dbPassword}';`;
                    const addPermissionQuery = `GRANT ALL PRIVILEGES ON ${dbName}.* TO '${dbUserName}'@'${mysqlHost}';`;

                    // 5. mysql setup
                    mysqlCon.query(createDbQuery, (err, result) => {
                      if (err) {

                        mysqlCon.end();
                        mongoCon.close();

                        return res.json({
                          confirmation: 'fail',
                          message: 'fail to create db',
                          err,
                          mysqlDbList
                        })
                      }

                      mysqlCon.query(createTableQuery, (err, result) => {
                        if (err) {

                          mysqlCon.end();
                          mongoCon.close();

                          return res.json({
                            confirmation: 'fail',
                            message: 'fail to create table'
                          })
                        }

                        mysqlCon.query(createDbUserQuery, (err, result) => {
                          if (err) {

                            mysqlCon.end();
                            mongoCon.close();

                            return res.json({
                              confirmation: 'fail',
                              message: 'fail to create db user'
                            })
                          }

                          mysqlCon.query(addPermissionQuery, (err, result) => {

                            mysqlCon.end();

                            if (err) {
                              return res.json({
                                confirmation: 'fail',
                                message: 'fail to add permission to db user'
                              })
                            }

                            // 6. mongoDB setup
                            MongoClient.connect(adminPath, { useNewUrlParser: true }, (err, db) => {
                              if (err) {
                                return res.json({
                                  confirmation: 'fail',
                                  message: 'fail to connect db'
                                })
                              }

                              const dbo = db.db(dbName);
                              dbo.addUser(dbUserName, dbPassword, {
                                roles: [
                                  { role: "readWrite", db: dbUserName },
                                  { role: "read", db: dbUserName },
                                  { role: "userAdmin", db: dbUserName },
                                  { role: "dbAdmin", db: dbUserName },
                                  { role: "dbOwner", db: dbUserName },
                                  { role: "enableSharding", db: dbUserName }
                                ],
                              }, (err, result) => {
                                db.close();
                                if (err) {
                                  return res.json({
                                    confirmation: 'fail',
                                    message: 'fail to create db user'
                                  })
                                }

                                // 1. create realm
                                const realmName = dbName;
                                const newRealm = {
                                  realm: realmName,
                                  enabled: true,
                                  registrationAllowed: true,
                                  registrationEmailAsUsername: true,
                                  loginWithEmailAllowed: true,
                                };
                                client.realms.create(newRealm)
                                  .then((createdRealm) => {

                                    // 2. create client
                                    const serverClientName = 'nodejs-apiserver';
                                    const newServerClient = {
                                      clientId: serverClientName,
                                      redirectUris: [
                                        'http://35.203.79.83/*'
                                      ],
                                      webOrigins: [
                                        'http://35.203.79.83/*'
                                      ],
                                      directAccessGrantsEnabled: true,
                                      serviceAccountsEnabled: true,
                                      authorizationServicesEnabled: true,
                                      fullScopeAllowed: false,
                                      defaultClientScopes: []
                                    };

                                    const connectClientName = 'nodejs-connect';
                                    const newConnectClient = {
                                      clientId: connectClientName,
                                      baseUrl: 'http://35.203.79.83/',
                                      redirectUris: [
                                        'http://35.203.79.83/*'
                                      ],
                                      webOrigins: [
                                        'http://35.203.79.83/*'
                                      ],
                                      publicClient: true,
                                      fullScopeAllowed: false,
                                      defaultClientScopes: []
                                    };

                                    client.clients.create(createdRealm.realm, newServerClient)
                                      .then((createdServerClient) => {

                                        client.clients.create(createdRealm.realm, newConnectClient)
                                          .then((createdConnectClient) => {

                                            // 3. create realm role
                                            const roleName = 'org-admin';
                                            const newRole = {
                                              name: roleName
                                            };
                                            client.realms.roles.create(createdRealm.realm, newRole)
                                              .then((createdRole) => {

                                                // 4. admin login
                                                let url = `${keycloakHost}/realms/master/protocol/openid-connect/token`;
                                                let params = qs.stringify({
                                                  username: `${keycloakUser}`,
                                                  password: `${keycloakPassword}`,
                                                  client_id: 'admin-cli',
                                                  grant_type: 'password'
                                                });
                                                axios.post(url, params, {
                                                  'Content-Type': 'application/x-www-form-urlencoded;'
                                                })
                                                  .then((response) => (response.data))
                                                  .then(adminLogin => {

                                                    // 5. create client scope
                                                    const { access_token } = adminLogin;
                                                    url = `${keycloakHost}/admin/realms/${createdRealm.realm}/client-scopes`;
                                                    const newClientScopeName = 'client-attribute-scope';
                                                    const newClientScope = {
                                                      attributes: {
                                                        "display.on.consent.screen": true
                                                      },
                                                      name: newClientScopeName,
                                                      protocol: "openid-connect"
                                                    };

                                                    axios.post(url, newClientScope, {
                                                      headers: { 'Authorization': "Bearer " + access_token }
                                                    })
                                                      .then((response) => (response.headers.location))
                                                      .then((location) => {

                                                        // 6. create mapper to add attribute in client scope
                                                        const createdClientScope = location.split("/");
                                                        const createdClientScopeId = createdClientScope[createdClientScope.length - 1];
                                                        url = `${location}/protocol-mappers/models`;
                                                        const newClientScopeMapper1 = {
                                                          config: {
                                                            "access.token.claim": "true",
                                                            "claim.name": "dbUserName",
                                                            "id.token.claim": "true",
                                                            "jsonType.label": "String",
                                                            "multivalued": "",
                                                            "user.attribute": "dbUserName",
                                                            "userinfo.token.claim": "true"
                                                          },
                                                          name: "dbUserName",
                                                          protocol: "openid-connect",
                                                          protocolMapper: "oidc-usermodel-attribute-mapper"
                                                        };
                                                        const newClientScopeMapper2 = {
                                                          config: {
                                                            "access.token.claim": "true",
                                                            "claim.name": "dbPassword",
                                                            "id.token.claim": "true",
                                                            "jsonType.label": "String",
                                                            "multivalued": "",
                                                            "user.attribute": "dbPassword",
                                                            "userinfo.token.claim": "true"
                                                          },
                                                          name: "dbPassword",
                                                          protocol: "openid-connect",
                                                          protocolMapper: "oidc-usermodel-attribute-mapper"
                                                        };
                                                        const newClientScopeMapper3 = {
                                                          config: {
                                                            "access.token.claim": "true",
                                                            "claim.name": "orgName",
                                                            "id.token.claim": "true",
                                                            "jsonType.label": "String",
                                                            "multivalued": "",
                                                            "user.attribute": "orgName",
                                                            "userinfo.token.claim": "true"
                                                          },
                                                          name: "orgName",
                                                          protocol: "openid-connect",
                                                          protocolMapper: "oidc-usermodel-attribute-mapper"
                                                        };
                                                        // 6.1
                                                        axios.post(url, newClientScopeMapper1, {
                                                          headers: { 'Authorization': "Bearer " + access_token }
                                                        })
                                                          .then((response) => (response.data))
                                                          .then(() => {
                                                            // 6.2
                                                            axios.post(url, newClientScopeMapper2, {
                                                              headers: { 'Authorization': "Bearer " + access_token }
                                                            })
                                                              .then((response) => (response.data))
                                                              .then(() => {
                                                                // 6.3
                                                                axios.post(url, newClientScopeMapper3, {
                                                                  headers: { 'Authorization': "Bearer " + access_token }
                                                                })
                                                                  .then((response) => (response.data))
                                                                  .then(() => {

                                                                    // 7. add scope to connect client
                                                                    // 7.1 client scope
                                                                    url = `${keycloakHost}/admin/realms/${createdRealm.realm}/clients/${createdConnectClient.id}/default-client-scopes/${createdClientScopeId}`;
                                                                    const updateClient = {
                                                                      client: createdConnectClient.id,
                                                                      clientScopeId: createdClientScopeId,
                                                                      realm: createdRealm.realm
                                                                    };
                                                                    axios.put(url, updateClient, {
                                                                      headers: { 'Authorization': "Bearer " + access_token }
                                                                    })
                                                                      .then((response) => (response.data))
                                                                      .then(() => {
                                                                        // 7.2 scope
                                                                        url = `${keycloakHost}/admin/realms/${createdRealm.realm}/clients/${createdConnectClient.id}/scope-mappings/realm`;
                                                                        axios.post(url, [createdRole], {
                                                                          headers: { 'Authorization': "Bearer " + access_token }
                                                                        })
                                                                          .then(() => {

                                                                            // 8. authorization
                                                                            // 8.1 scope
                                                                            // 8.2 resource
                                                                            // 8.3 policy
                                                                            // 8.4 permission
                                                                            url = `${keycloakHost}/admin/realms/${createdRealm.realm}/clients/${createdServerClient.id}/authz/resource-server/scope`;
                                                                            const newAuthScope = {
                                                                              name: "create"
                                                                            };
                                                                            axios.post(url, newAuthScope, {
                                                                              headers: { 'Authorization': "Bearer " + access_token }
                                                                            })
                                                                              .then((response) => (response.data))
                                                                              .then((createdAuthScope) => {

                                                                                url = `${keycloakHost}/admin/realms/${createdRealm.realm}/clients/${createdServerClient.id}/authz/resource-server/resource`;
                                                                                const authResourceName = 'res1'
                                                                                const newAuthResource = {
                                                                                  attributes: {},
                                                                                  displayName: authResourceName,
                                                                                  name: authResourceName,
                                                                                  ownerManagedAccess: "",
                                                                                  scopes: [
                                                                                    createdAuthScope
                                                                                  ],
                                                                                  uris: []
                                                                                };
                                                                                axios.post(url, newAuthResource, {
                                                                                  headers: { 'Authorization': "Bearer " + access_token }
                                                                                })
                                                                                  .then((response) => (response.data))
                                                                                  .then((createdAuthResource) => {

                                                                                    url = `${keycloakHost}/admin/realms/${createdRealm.realm}/clients/${createdServerClient.id}/authz/resource-server/policy/role`;
                                                                                    const authPolicyName = 'policy1'
                                                                                    const newAuthPolicy = {
                                                                                      decisionStrategy: "UNANIMOUS",
                                                                                      logic: "POSITIVE",
                                                                                      name: authPolicyName,
                                                                                      roles: [
                                                                                        {
                                                                                          "id": createdRole.id,
                                                                                          "required": true
                                                                                        }
                                                                                      ],
                                                                                      type: "role"
                                                                                    };
                                                                                    axios.post(url, newAuthPolicy, {
                                                                                      headers: { 'Authorization': "Bearer " + access_token }
                                                                                    })
                                                                                      .then((response) => (response.data))
                                                                                      .then((createdAuthPolicy) => {

                                                                                        url = `${keycloakHost}/admin/realms/${createdRealm.realm}/clients/${createdServerClient.id}/authz/resource-server/permission/resource`;
                                                                                        const authPermissionName = 'permission1'
                                                                                        const newAuthPermission = {
                                                                                          decisionStrategy: "UNANIMOUS",
                                                                                          logic: "POSITIVE",
                                                                                          name: authPermissionName,
                                                                                          policies: [createdAuthPolicy.id],
                                                                                          resources: [createdAuthResource._id],
                                                                                          type: "resource"
                                                                                        };
                                                                                        axios.post(url, newAuthPermission, {
                                                                                          headers: { 'Authorization': "Bearer " + access_token }
                                                                                        })
                                                                                          .then((response) => (response.data))
                                                                                          .then((createdAuthPermission) => {

                                                                                            // 9. create org admin user
                                                                                            let user = {
                                                                                              username: email,
                                                                                              email,
                                                                                              firstName,
                                                                                              lastName,
                                                                                              emailVerified: false,
                                                                                              enabled: true,
                                                                                              attributes: {
                                                                                                orgName,
                                                                                                dbUserName,
                                                                                                dbPassword: '123456'
                                                                                              }
                                                                                            };
                                                                                            client.users.create(createdRealm.realm, user)
                                                                                              .then((newUser) => {
                                                                                                const updateUser = {
                                                                                                  type: 'password',
                                                                                                  value: password
                                                                                                };
                                                                                                client.users.resetPassword(createdRealm.realm, newUser.id, updateUser)
                                                                                                  .then(() => {

                                                                                                    // 10. add realm role to keycloak user
                                                                                                    client.realms.maps.map(createdRealm.realm, newUser.id,
                                                                                                      [
                                                                                                        {
                                                                                                          id: createdRole.id,
                                                                                                          name: newRole.name
                                                                                                        },
                                                                                                      ])
                                                                                                      .then(() => {

                                                                                                        // 11. add realm management to keycloak user
                                                                                                        client.clients.find(createdRealm.realm, { clientId: 'realm-management' })
                                                                                                          .then(realmManagementClient => {

                                                                                                            if (!realmManagementClient.length) {
                                                                                                              return res.json({
                                                                                                                confirmation: 'fail',
                                                                                                                message: 'fail to find the realm management client'
                                                                                                              })
                                                                                                            }
                                                                                                            const realmManagementClientId = realmManagementClient[0].id;
                                                                                                            client.clients.roles.find(createdRealm.realm, realmManagementClientId)
                                                                                                              .then((clientRoles) => {

                                                                                                                url = `${keycloakHost}/admin/realms/${createdRealm.realm}/users/${newUser.id}/role-mappings/clients/${realmManagementClientId}`;
                                                                                                                axios.post(url, clientRoles, {
                                                                                                                  headers: {
                                                                                                                    'Authorization': "Bearer " + access_token
                                                                                                                  }
                                                                                                                })
                                                                                                                  .then(() => {
                                                                                                                    return res.json({
                                                                                                                      newUser
                                                                                                                    })
                                                                                                                  })
                                                                                                                  .catch(err => {
                                                                                                                    return res.json({
                                                                                                                      confirmation: 'fail',
                                                                                                                      message: 'fail to add realm client role to user'
                                                                                                                    })
                                                                                                                  })
                                                                                                              })
                                                                                                              .catch(err => {
                                                                                                                return res.json({
                                                                                                                  confirmation: 'fail',
                                                                                                                  message: 'fail to get realm client roles'
                                                                                                                })
                                                                                                              })
                                                                                                          })
                                                                                                          .catch(err => {
                                                                                                            return res.json({
                                                                                                              confirmation: 'fail',
                                                                                                              message: 'fail to get realm client'
                                                                                                            })
                                                                                                          })
                                                                                                      })
                                                                                                      .catch((err) => {
                                                                                                        return res.json({
                                                                                                          confirmation: 'fail',
                                                                                                          message: 'fail to add role to user'
                                                                                                        })
                                                                                                      })
                                                                                                  })
                                                                                                  .catch((err) => {
                                                                                                    return res.json({
                                                                                                      confirmation: 'fail',
                                                                                                      message: 'fail to update keycloak user'
                                                                                                    })
                                                                                                  })
                                                                                              })
                                                                                              .catch((err) => {
                                                                                                return res.json({
                                                                                                  confirmation: 'fail',
                                                                                                  message: 'fail to create keycloak user'
                                                                                                })
                                                                                              })
                                                                                          })
                                                                                          .catch((err) => {
                                                                                            return res.json({
                                                                                              confirmation: 'fail',
                                                                                              message: 'fail to create auth permission'
                                                                                            })
                                                                                          })
                                                                                      })
                                                                                      .catch((err) => {
                                                                                        return res.json({
                                                                                          confirmation: 'fail',
                                                                                          message: 'fail to create auth policy'
                                                                                        })
                                                                                      })
                                                                                  })
                                                                                  .catch((err) => {
                                                                                    return res.json({
                                                                                      confirmation: 'fail',
                                                                                      message: 'fail to create auth resource'
                                                                                    })
                                                                                  })
                                                                              })
                                                                              .catch((err) => {
                                                                                return res.json({
                                                                                  confirmation: 'fail',
                                                                                  message: 'fail to create auth scope'
                                                                                })
                                                                              })
                                                                          })
                                                                          .catch(err => {
                                                                            return res.json({
                                                                              confirmation: 'fail',
                                                                              message: 'fail to add scope to connect client'
                                                                            })
                                                                          })
                                                                      })
                                                                      .catch((err) => {
                                                                        return res.json({
                                                                          confirmation: 'fail',
                                                                          message: 'fail to add client scope to connect client'
                                                                        })
                                                                      })
                                                                  })
                                                                  .catch((err) => {
                                                                    return res.json({
                                                                      confirmation: 'fail',
                                                                      message: 'fail to create client scope mapper'
                                                                    })
                                                                  })
                                                              })
                                                              .catch((err) => {
                                                                return res.json({
                                                                  confirmation: 'fail',
                                                                  message: 'fail to create client scope mapper'
                                                                })
                                                              })
                                                          })
                                                          .catch((err) => {
                                                            return res.json({
                                                              confirmation: 'fail',
                                                              message: 'fail to create client scope mapper'
                                                            })
                                                          })
                                                      })
                                                      .catch((err) => {
                                                        return res.json({
                                                          confirmation: 'fail',
                                                          message: 'fail to create client scope'
                                                        })
                                                      })
                                                  })
                                                  .catch((err) => {
                                                    return res.json({
                                                      confirmation: 'fail',
                                                      message: 'fail to admin login'
                                                    })
                                                  })
                                              })
                                              .catch((err) => {
                                                return res.json({
                                                  confirmation: 'fail',
                                                  message: 'fail to create realm role'
                                                })
                                              })

                                          })
                                          .catch((err) => {
                                            return res.json({
                                              confirmation: 'fail',
                                              message: 'fail to create connect client'
                                            })
                                          })
                                      })
                                      .catch((err) => {
                                        return res.json({
                                          confirmation: 'fail',
                                          message: 'fail to create server client'
                                        })
                                      })
                                  })
                                  .catch((err) => {
                                    return res.json({
                                      confirmation: 'fail',
                                      message: 'fail to create realm'
                                    })
                                  })
                              })
                            })
                          })
                        })
                      })
                    })
                  })
                })
                .catch((err) => {
                  return res.json({
                    confirmation: 'fail',
                    message: 'fail to get keycloak realms'
                  })
                })
            })
            .catch((err) => {
              return res.json({
                confirmation: 'fail',
                message: 'fail to admin login'
              })
            })
        })
      })
    })
  })
})


app.listen(port, () => console.log(`Studio Back End listening on port ${port}!`));


// Helpers:

const generateUniqueDbName = (arr1, arr2, arr3, callback) => {
  let dbNumber = randomDbNumber();
  let dbName = `org${dbNumber}`;

  const filterArr1 = arr1.filter(db => db.realm == dbName);
  const filterArr2 = arr2.filter(db => db.Database == dbName);
  const filterArr3 = arr3.filter(db => db.name == dbName);
  if (filterArr1.length || filterArr2.length || filterArr3.length) {
    generateUniqueDbName(arr1, arr2, arr3, callback);
    return;
  }
  callback(null, dbName);
  return;
}

const randomDbNumber = () => {
  var text = "";
  var possible = "0123456789";
  for (var i = 0; i < 5; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}