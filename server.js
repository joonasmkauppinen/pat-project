'use strict';

require('dotenv').config();

const http = require ('http');
const app = require('./app');
const port = process.env.PORT || 3000
const server = http.createServer(app);

console.log ( `Listening to port ${port} ...` );

server.listen(port);