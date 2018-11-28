'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const routeUsers   = require('../api/routes/users');
const routePosts   = require('../api/routes/posts');
const routeSession = require('../api/routes/session');

app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }))

app.use((req,res,next) => {
  console.log('New server request: ');
  next();
  });

/* CORS Handling: allowing oring/headers (*), allowing several methods */
app.use((req,res,next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  if ( req.method === 'OPTIONS' ) {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
    }
    next();
});

/* Import routes */
app.use('/users',   routeUsers);
app.use('/posts',   routePosts);
app.use('/session', routeSession);


// If no route is found, throw `Not found` error:
app.use((req, res, next) => {
  const error = new Error('Requested path not found - please check your command');
  error.status = 404;
  next(error);
});

// Display error as JSON response
app.use((e, req, res, next) => {
  res.status(e.status || 500);
  res.json({ success : 0, error: e.message });
});

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// *** REMOVE THIS IN THE PRODUCTION VERSION AND WHEN DB CONNECTION ISSUE IS FIXED >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const db = require('./db');

setInterval(() => {
   console.log('[STAY-ALIVE] Script:');
   db.query("SELECT userID FROM users WHERE userID=1", '', (e,r,f) => {
     if ( e == null ) {
       if ( r.length == 1 ) {
         console.log('DB_connection_status = OK');
       }else{
        console.log('DB_connection_status = ERROR');
       }
     }else{ console.log('DB_connection_status = ERROR'); }
  });
  }, 60000);

  // *** <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< REMOVE THIS IN THE PRODUCTION VERSION AND WHEN DB CONNECTION ISSUE IS FIXED
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

module.exports = app;