const express = require('express');
const bodyParser = require("body-parser");
const axios = require("axios");
const qs = require('qs');

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
