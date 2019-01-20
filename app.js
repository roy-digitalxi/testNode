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
