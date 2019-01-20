import middlewares from "../../middlewares";
import * as helpers from "../../utilities/helpers";
import adminClient from 'keycloak-admin-client';

import constants from "../../constants";

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

const Controller = {

  "/test": {
    path: "/test",
    method: "post",
    middleware: [],
    controller: async (req, res, next) => {

      const client = await keycloakClient();
      console.log('client: ', client);

    }
  }

};

export default Controller;
