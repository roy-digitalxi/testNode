const express = require('express');
const bodyParser = require("body-parser");
const axios = require("axios");
const qs = require('qs');

// keycloak
// user: keycloak
// pwd: 3NkxhxutiN

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

const keycloakHost = 'http://35.203.121.29/auth';
const keycloakUser = 'keycloak';
const keycloakPassword = '3NkxhxutiN';

// express
const app = express();
const port = (process.env.PORT || 3000);
app.use(bodyParser.json());


app.get('/', function (req, res) {
  return res.json({
    message: 'server is running'
  })
})

app.listen(port, () => console.log(`Studio Back End listening on port ${port}!`));
