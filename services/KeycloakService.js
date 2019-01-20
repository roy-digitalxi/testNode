import Promise from "bluebird";
import adminClient from 'keycloak-admin-client';
import qs from 'qs';
import axios from 'axios';

// Constants
import constants from "../constants";

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

const keycloakAdminLogin = () => {
  return new Promise((resolve, reject) => {
    const url = `${constants.keycloakHost}/realms/master/protocol/openid-connect/token`;
    const params = qs.stringify({
      username: `${constants.keycloakSystemUser}`,
      password: `${constants.keycloakSystemtPassword}`,
      client_id: 'admin-cli',
      grant_type: 'password'
    });
    axios.post(url, params, {
      'Content-Type': 'application/x-www-form-urlencoded;'
    })
      .then((response) => (response.data))
      .then(adminLogin => {
        const { access_token } = adminLogin;
        resolve(access_token);
        return;
      })
      .catch(err => {
        reject(err);
        return;
      })
  })
}

const realmList = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      client.realms.find()
        .then((keycloakRealms) => {
          resolve(keycloakRealms);
          return;
        })
        .catch(err => {
          reject(err);
          return;
        })
    } catch (error) {
      reject(error);
      return;
    }
  })
};

const createRealm = (realmName, orgName) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      const newRealm = {
        realm: realmName,
        enabled: true,
        registrationAllowed: true,
        registrationEmailAsUsername: true,
        loginWithEmailAllowed: true,
        accessTokenLifespan: 86400,
        accessTokenLifespanForImplicitFlow: 86400,
        ssoSessionIdleTimeout: 86400,
        ssoSessionMaxLifespan: 86400,
        offlineSessionIdleTimeout: 86400,
        offlineSessionMaxLifespan: 5184000,
        accessCodeLifespan: 86400,
        accessCodeLifespanUserAction: 86400,
        accessCodeLifespanLogin: 86400,
        actionTokenGeneratedByAdminLifespan: 86400,
        actionTokenGeneratedByUserLifespan: 86400,
        editUsernameAllowed: true,
        smtpServer: {
          password: constants.keycloakEmailUserPassword,
          replyToDisplayName: '',
          starttls: 'true',
          auth: 'true',
          port: constants.keycloakEmailPort,
          host: constants.keycloakEmailHost,
          from: constants.keycloakEmailUser,
          fromDisplayName: orgName,
          ssl: 'false',
          user: constants.keycloakEmailUser
        },
      };
      client.realms.create(newRealm)
        .then((createdRealm) => {
          resolve(createdRealm);
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
};

const createServerClient = (realm, serverClient) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      const newServerClient = {
        clientId: serverClient,
        redirectUris: ['*'],
        webOrigins: ['*'],
        directAccessGrantsEnabled: true,
        serviceAccountsEnabled: true,
        authorizationServicesEnabled: true,
        fullScopeAllowed: false,
        defaultClientScopes: []
      };
      client.clients.create(realm, newServerClient)
        .then((createdClient) => {
          resolve(createdClient);
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
};

const createConnectClient = (realm, connectClient) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      const newConnectClient = {
        clientId: connectClient,
        redirectUris: ['*'],
        webOrigins: ['*'],
        publicClient: true,
        fullScopeAllowed: false,
        defaultClientScopes: []
      };
      client.clients.create(realm, newConnectClient)
        .then((createdClient) => {
          resolve(createdClient);
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
};

const createRealmRoles = (realm, realmRolesArr) => {
  return new Promise((resolve, reject) => {
    let tasks = [];
    for (let i = 0; i < realmRolesArr.length; i++) {
      const task = new Promise((resolve, reject) => {
        const item = {
          name: realmRolesArr[i].value
        };
        createRealmRole(realm, item)
          .then(response => {
            const output = {
              type: realmRolesArr[i].type,
              role: response
            };
            resolve(output);
            return;
          })
          .catch(err => {
            reject(err);
            return;
          })
      })
      tasks.push(task);
    }
    Promise.all(tasks)
      .then((response) => {
        resolve(response);
        return;
      })
      .catch(err => {
        reject(err);
        return;
      })
  })
}

const createRealmRole = (realm, newRealmRole) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      client.realms.roles.create(realm, newRealmRole)
        .then((createdRealmRole) => {
          resolve(createdRealmRole);
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

const createClientScope = (token, realm, keycloakClientScope) => {
  return new Promise((resolve, reject) => {
    const newClientScope = {
      attributes: {
        "display.on.consent.screen": true
      },
      name: keycloakClientScope,
      protocol: "openid-connect"
    };
    const url = `${constants.keycloakHost}/admin/realms/${realm}/client-scopes`;
    axios.post(url, newClientScope, {
      headers: { 'Authorization': "Bearer " + token }
    })
      .then((response) => (response.headers.location))
      .then((location) => {
        const createdClientScope = location.split("/");
        const createdClientScopeId = createdClientScope[createdClientScope.length - 1];
        resolve(createdClientScopeId);
        return;
      })
      .catch(error => {
        reject(error);
        return;
      })
  })
}

const createClientScopeMappers = (scopeArr, token, realm, clientScopeId) => {
  return new Promise((resolve, reject) => {
    let tasks = [];
    for (let i = 0; i < scopeArr.length; i++) {
      const task = new Promise((resolve, reject) => {
        const newClientScopeMapper = {
          config: {
            "access.token.claim": "true",
            "claim.name": scopeArr[i],
            "id.token.claim": "true",
            "jsonType.label": "String",
            "multivalued": "",
            "user.attribute": scopeArr[i],
            "userinfo.token.claim": "true"
          },
          name: scopeArr[i],
          protocol: "openid-connect",
          protocolMapper: "oidc-usermodel-attribute-mapper"
        };
        createClientScopeMapper(token, realm, clientScopeId, newClientScopeMapper)
          .then(response => {
            resolve(response);
            return;
          })
          .catch(err => {
            reject(err);
            return;
          })
      })
      tasks.push(task);
    }
    Promise.all(tasks)
      .then((response) => {
        resolve(response);
        return;
      })
      .catch(err => {
        reject(err);
        return;
      })
  })
}

const createClientScopeMapper = (token, realm, clientScopeId, newClientScopeMapper) => {
  return new Promise((resolve, reject) => {
    const url = `${constants.keycloakHost}/admin/realms/${realm}/client-scopes/${clientScopeId}/protocol-mappers/models`;
    axios.post(url, newClientScopeMapper, {
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

const addClientScopeToClient = (token, realm, clientId, clientScopeId) => {
  return new Promise((resolve, reject) => {
    const updateClient = {
      realm: realm,
      client: clientId,
      clientScopeId: clientScopeId,
    };
    const url = `${constants.keycloakHost}/admin/realms/${realm}/clients/${clientId}/default-client-scopes/${clientScopeId}`;
    axios.put(url, updateClient, {
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

const addRealmRoleToClient = (token, realm, clientId, roles) => {
  return new Promise((resolve, reject) => {
    const url = `${constants.keycloakHost}/admin/realms/${realm}/clients/${clientId}/scope-mappings/realm`;
    axios.post(url, roles, {
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

const createAuthorizationScopes = (authScopeArr, token, realm, clientId) => {
  return new Promise((resolve, reject) => {
    let tasks = [];
    for (let i = 0; i < authScopeArr.length; i++) {
      const task = new Promise((resolve, reject) => {
        const newAuthScope = {
          name: authScopeArr[i]
        };
        createAuthorizationScope(token, realm, clientId, newAuthScope)
          .then(response => {
            const item = {
              type: authScopeArr[i],
              scope: response
            }
            resolve(item);
            return;
          })
          .catch(err => {
            reject(err);
            return;
          })
      })
      tasks.push(task);
    }
    Promise.all(tasks)
      .then((response) => {
        resolve(response);
        return;
      })
      .catch(err => {
        reject(err);
        return;
      })
  })
}

const createAuthorizationScope = (token, realm, clientId, newAuthScope) => {
  return new Promise((resolve, reject) => {
    const url = `${constants.keycloakHost}/admin/realms/${realm}/clients/${clientId}/authz/resource-server/scope`;
    axios.post(url, newAuthScope, {
      headers: { 'Authorization': "Bearer " + token }
    })
      .then((response) => (response.data))
      .then((createdAuthScope) => {
        resolve(createdAuthScope);
        return;
      })
      .catch(error => {
        reject(error);
        return;
      })
  })
}

const createAuthorizationResources = (authResourceArr, token, realm, clientId, authScopeRes) => {
  return new Promise((resolve, reject) => {
    let tasks = [];
    for (let i = 0; i < authResourceArr.length; i++) {
      const task = new Promise((resolve, reject) => {
        const scope = authScopeRes.filter(item => item.type == authResourceArr[i].type)
        const formattedScope = scope.map(item => item.scope);
        const newAuthResource = {
          name: authResourceArr[i].value,
          displayName: authResourceArr[i].value,
          attributes: {},
          ownerManagedAccess: "",
          scopes: formattedScope,
          uris: []
        };
        createAuthorizationResource(token, realm, clientId, newAuthResource)
          .then(response => {
            const item = {
              type: authResourceArr[i].type,
              resource: response
            }
            resolve(item);
            return;
          })
          .catch(err => {
            reject(err);
            return;
          })
      })
      tasks.push(task);
    }
    Promise.all(tasks)
      .then((response) => {
        resolve(response);
        return;
      })
      .catch(err => {
        reject(err);
        return;
      })
  })
}

const createAuthorizationResource = (token, realm, clientId, newAuthResource) => {
  return new Promise((resolve, reject) => {
    const url = `${constants.keycloakHost}/admin/realms/${realm}/clients/${clientId}/authz/resource-server/resource`;
    axios.post(url, newAuthResource, {
      headers: { 'Authorization': "Bearer " + token }
    })
      .then((response) => (response.data))
      .then((createdAuthResource) => {
        resolve(createdAuthResource);
        return;
      })
      .catch(error => {
        reject(error);
        return;
      })
  })
}

const createAuthorizationPolicies = (authPolicyArr, token, realm, clientId, roles) => {
  return new Promise((resolve, reject) => {
    let tasks = [];
    for (let i = 0; i < authPolicyArr.length; i++) {
      const task = new Promise((resolve, reject) => {
        const assignRoles = roles.filter(item => {
          return authPolicyArr[i].roles.includes(item.type);
        });
        const formattedRoles = assignRoles.map(item => {
          return {
            "id": item.role.id,
            "required": false
          }
        });
        const newAuthPolicy = {
          name: authPolicyArr[i].type,
          decisionStrategy: "UNANIMOUS",
          logic: "POSITIVE",
          roles: formattedRoles,
          type: "role"
        };

        createAuthorizationPolicy(token, realm, clientId, newAuthPolicy)
          .then(response => {
            const item = {
              type: authPolicyArr[i].type,
              policy: response
            }
            resolve(item);
            return;
          })
          .catch(err => {
            reject(err);
            return;
          })
      })
      tasks.push(task);
    }
    Promise.all(tasks)
      .then((response) => {
        resolve(response);
        return;
      })
      .catch(err => {
        reject(err);
        return;
      })
  })
}

const createAuthorizationPolicy = (token, realm, clientId, newAuthPolicy) => {
  return new Promise((resolve, reject) => {
    const url = `${constants.keycloakHost}/admin/realms/${realm}/clients/${clientId}/authz/resource-server/policy/role`;
    axios.post(url, newAuthPolicy, {
      headers: { 'Authorization': "Bearer " + token }
    })
      .then((response) => (response.data))
      .then((createdAuthPolicy) => {
        resolve(createdAuthPolicy);
        return;
      })
      .catch(error => {
        reject(error);
        return;
      })
  })
}

const createAuthorizationPermissions = (authPermissionArr, token, realm, clientId, resources, policies) => {

  return new Promise((resolve, reject) => {
    let tasks = [];
    for (let i = 0; i < authPermissionArr.length; i++) {
      const task = new Promise((resolve, reject) => {
        const assignPolicies = policies.filter(item => {
          return authPermissionArr[i].policies.includes(item.policy.name);
        });
        const formattedPolicies = assignPolicies.map(item => {
          return item.policy.id;
        });
        const assignResources = resources.filter(item => {
          return authPermissionArr[i].resources.includes(item.resource.name);
        });
        const formattedResources = assignResources.map(item => {
          return item.resource._id;
        });
        const newAuthPermission = {
          name: authPermissionArr[i].type,
          decisionStrategy: "UNANIMOUS",
          logic: "POSITIVE",
          policies: formattedPolicies,
          resources: formattedResources,
          type: "resource"
        };

        createAuthorizationPermission(token, realm, clientId, newAuthPermission)
          .then(response => {
            const item = {
              type: authPermissionArr[i].type,
              policy: response
            }
            resolve(item);
            return;
          })
          .catch(err => {
            reject(err);
            return;
          })
      })
      tasks.push(task);
    }
    Promise.all(tasks)
      .then((response) => {
        resolve(response);
        return;
      })
      .catch(err => {
        reject(err);
        return;
      })
  })
}

const createAuthorizationPermission = (token, realm, clientId, newAuthPermission) => {
  return new Promise((resolve, reject) => {
    const url = `${constants.keycloakHost}/admin/realms/${realm}/clients/${clientId}/authz/resource-server/permission/resource`;
    axios.post(url, newAuthPermission, {
      headers: { 'Authorization': "Bearer " + token }
    })
      .then((response) => (response.data))
      .then((createdAuthPermission) => {
        resolve(createdAuthPermission);
        return;
      })
      .catch(error => {
        reject(error);
        return;
      })
  })
}

const getKeycloakRealmRoles = (realm) => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = await keycloakClient();
      const realmRoles = await client.realms.roles.find(realm);
      resolve(realmRoles);
      return;
    } catch (error) {
      reject(error);
      return;
    }
  })
}

export default {

  // keycloak setup
  realmList,
  createRealm,
  createServerClient,
  createConnectClient,
  createRealmRoles,

  keycloakAdminLogin,
  createClientScope,
  createClientScopeMappers,
  addClientScopeToClient,
  addRealmRoleToClient,

  createAuthorizationScopes,
  createAuthorizationResources,
  createAuthorizationPolicies,
  createAuthorizationPermissions,
  // keycloak setup

  getKeycloakRealmRoles,
};
