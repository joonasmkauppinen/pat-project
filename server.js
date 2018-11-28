'use strict';

require('dotenv').config();

const http = require ('http');
const app = require('./modules/app');
const port = process.env.PORT || 3000
const server = http.createServer(app);

console.log ( `PAT. Server Starting ...` );
console.log ( `Listening to port ${port} ...` );

server.listen(port);