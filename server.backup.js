'use strict';

const express = require('express');
const mysql = require('mysql');
const mongoose = require('mongoose');

// Constants
const PORT = 3000;

// keycloak
// user: keycloak
// pwd: AcLIg5nD3P

// mysql
// host: mysql-bitnami-mysql.default.svc.cluster.local
// user: keycloak
// pwd: keycloak

// mongodb
// host: mongodb-bitnami.default.svc.cluster.local
// user: root
// pwd: password

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

  const adminPath = 'mongodb://root:password@mongodb-bitnami.default.svc.cluster.local:27017/';
  const mongoCon = mongoose.createConnection(adminPath);
  const Admin = mongoose.mongo.Admin;

  mongoCon.on('error', (err) => {

    if(err){
      return res.json({
        confirmation: 'fail',
        message: err
      })
    }
  })

  mongoCon.on('open', () => {
    new Admin(mongoCon.db).listDatabases((err, mongoDbList) => {

      mongoCon.close();

      if (err) {
        return res.json({
          confirmation: 'fail',
          message: err
        })
      }

      return res.json({
        confirmation: 'success',
        mongoDbList
      })

    })
  })

});

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);