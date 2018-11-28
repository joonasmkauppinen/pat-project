const express = require('express');
const router = express.Router();
const db = require('../../db');

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

/**
 * @api {get} /users/username-available/:id Check is Username free
 * @apiName username-available
 * @apiGroup Users
 *
 * @apiParam {String} userName Username for checking availability.
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded.
 * @apiSuccess {Boolean} available Is username available
 */
router.get('/username-available/:userName', (req,res,next) => {
  const userName = req.params.userName;
  if ( typeof userName == 'undefined' || userName == '') {
    res.status(200).json({ success: false, error: ':userName is not specified!'});
  }else{
    db.query("SELECT count(userID) AS `userCount` FROM users WHERE LOWER(userName)=?", userName.toLowerCase(), (e,r,f) => {
      if ( e != null ) {
        console.log(e);
        res.status(200).json({ success: false, error : 'Database query failed.'});
      }else{
        const regex = /^[a-zA-Z0-9-_]+$/;
        if(regex.test(userName)) {
          if ( r[0].userCount == 1 ) {
              res.status(200).json({ success: true, available: false});
            }else{
              res.status(200).json({ success: true, available: true});
            }
        }else{
          res.status(200).json({ success: false, error: 'Username contains illegal characters. Only a-z, A-Z, 0-9 and characters - and _ allowed!'});
        }
      }
    });
  }
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