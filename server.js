'use strict';

require('dotenv').config();

const fs = require("fs");
const options = {
    key: fs.readFileSync("keys/key.pem"),
    cert: fs.readFileSync("keys/cert.pem"),
    passphrase: 'kullipilluvittu'
  };


const http = require ('http');
const app = require('./app');
const port = process.env.PORT || 3000
const server = http.createServer(app);

console.log ( `Listening to port ${port} ...` );

//app.listen(8000);

server.listen(port);