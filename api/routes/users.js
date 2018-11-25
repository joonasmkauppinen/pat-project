const express = require('express');
const  router = express.Router();
const      db = require('../../db');

router.get('/', (req,res,next) => {
  let response = { success : 0 }
  db.query("SELECT * FROM users", (e,r,f) => {
    if ( typeof r != 'undefined' ) {
      response.users_count = r.length;
      response.users = [];
      r.forEach((i) => {
        const addThis = ({ 'id' : i.userID, 'name' : i.userName, 'time_join' : '999 days ago', 'last_seen' : '999 days ago' });
        response.users.push ( addThis );
      });
    }
    res.status(200).json((response));
  });
});

router.get('/:userID', (req,res,next) => {
  const id = req.params.userID;
  if ( id === '' ) {
    res.status(500).json({
      message: 'ID is not specified'
    });
  }else{
    res.status(200).json({
      message: 'User ID Data from user' + id
    });
  }
});

router.post('/', (req,res,next) => {
  res.status(200).json({
    message: 'Handling POST requests to /users'
  });
});

module.exports = router;