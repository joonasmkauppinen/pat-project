'use strict';


console.log(`
  ┌──────────────────────────────────────────────────────────┐
  │                PAT.  Node.JS Server                      │
  ├──────────────────────────┬───────────────────────────────┤
  │   .----.  .--.  .---.    │  CREATED BY TEAM JJS          │
  │   | {}  }/ {} \\{_   _}   ├───────────────────────────────┤
  │   | .--'/  /\\  \\ | |     │  Samuli Virtanen              │
  │   \`-'   \`-'  \`-' \`-' .   │  Joonas Kauppinen             │
  │   - a place for pets -   │  "Jamie" GeonHui Yoon         │
  ├──────────────────────────┴───────────────────────────────┤
  │ https://github.com/joonasmkauppinen/pat-project-backend  │
  │ https://github.com/joonasmkauppinen/pat-project-frontend │
  └──────────────────────────────────────────────────────────┘
`);

require('dotenv').config();

const http = require ('http');
const app = require('./modules/app');
const port = process.env.PORT || 3000
const server = http.createServer(app);


console.log ( `WOOF! Listening to port ${port} ...` );

server.listen(port);