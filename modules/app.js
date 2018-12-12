'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

/* Route files in API folder */
const routeUsers         = require('../api/users');
const routePosts         = require('../api/posts');
const routeSession       = require('../api/session');
const routeTags          = require('../api/tags');
const routeComments      = require('../api/comments');
const routeReportContent = require('../api/reportcontent');
const routeRatings       = require('../api/ratings');
const routeFollow        = require('../api/follow');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }))

/* Display request in Console */
app.use((req,res,next) => {
  console.log(`--- REQUEST --- [${req.method}] ${req.connection.remoteAddress} ${req.path}`);
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
app.use('/users',         routeUsers);
app.use('/posts',         routePosts);
app.use('/session',       routeSession);
app.use('/tags',          routeTags);
app.use('/comments',      routeComments);
app.use('/reportcontent', routeReportContent);
app.use('/ratings',       routeRatings);
app.use('/follow',        routeFollow);

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

const db = require('./db');

module.exports = app;