'use strict';

const express = require('express');
const mysql = require('mysql');
const mongoose = require('mongoose');

// Constants
const PORT = 3000;


// App
const app = express();
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
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
      })
    }
    return res.json({
      confirmation: 'success',
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
    })
  })

});


app.get('/test2', function (req, res) {

  const adminPath = 'mongodb://root:root@localhost:27017/';
  const mongoCon = mongoose.createConnection(adminPath);
  const Admin = mongoose.mongo.Admin;
  mongoCon.on('open', () => {
    new Admin(mongoCon.db).listDatabases((err, mongoDbList) => {

      mongoCon.close();

      if (err) {
        return res.json({
          confirmation: 'fail',
          message: err,
          adminPath
        })
      }

      return res.json({
        confirmation: 'success',
        mongoDbList,
        adminPath,
      })
    })
  })

});

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);
