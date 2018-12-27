const express = require('express');
const bodyParser = require("body-parser");
const axios = require("axios");
const qs = require('qs');


// Keycloak
const Keycloak = require('keycloak-connect');
const session = require('express-session');

// express
const app = express();
const port = (process.env.PORT || 3000);
app.use(bodyParser.json());


// keycloak session
const memoryStore = new session.MemoryStore();
app.use(session({
  secret: 'mySecret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));
const keycloak = new Keycloak({
  store: memoryStore
});
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

app.post('/test', keycloak.enforcer(['res1:create'],
  {
    resource_server_id: 'nodejs-apiserver',
    response_mode: 'permissions'
  }
), (req, res) => {

  return res.json({
    message: 'pass enforce'
  })
})


app.listen(port, () => console.log(`Studio Back End listening on port ${port}!`));
