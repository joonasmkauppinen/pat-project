const express = require('express');
const app = express();

app.get('/', (req,res) => res.send('Hello World - THIS IS PAT FRONT END SERVER!'));

module.exports = app;