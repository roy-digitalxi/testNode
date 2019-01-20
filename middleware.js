const keycloak = require('./server');

const keycloakProtect = (req, res, next) => {
  console.log('hit here: ', keycloak);
}

module.exports = {
  keycloakProtect
};