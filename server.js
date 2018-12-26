'use strict';

const express = require('express');
const mysql = require('mysql');
const mongoose = require('mongoose');

// Constants
const PORT = 3000;

// mysql
// host: mysql-bitnami-mysql.default.svc.cluster.local
// user: keycloak
// pwd: keycloak

// mongodb
// host: mongodb-bitnami.default.svc.cluster.local
// user: my-user
// pwd: my-password

// App
const app = express();

app.get('/', function (req, res) {

  return res.json({
    message: 'server is running'
  })
})

app.get('/test1', function (req, res) {

  //Connect to DB
  const mysqlCon = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
  });

  mysqlCon.connect((err) => {

    mysqlCon.end();

    if (err) {
      return res.json({
        confirmation: 'fail',
        message: err,
        env: process.env,
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
      })
    }
    return res.json({
      confirmation: 'success',
      env: process.env,
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
    })
  })

});


app.get('/test2', function (req, res) {

  const dbPath = 'mongodb://my-user:my-password@mongodb-bitnami.default.svc.cluster.local:27017/my-database';
  mongoose.connect(
    dbPath,
    (err, res) => {
      if (err) {
        return res.json({
          confirmation: 'fail',
          message: err,
          env: process.env,
          dbPath
        })
      }

      return res.json({
        confirmation: 'success',
        env: process.env,
        dbPath
      })
    }
  );

});

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);
