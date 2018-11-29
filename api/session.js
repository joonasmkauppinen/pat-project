const express = require('express');
const router = express.Router();
const db = require('../modules/db');
const md7 = require('../modules/md7');
const auth = require('../modules/auth');

/**
 * @api {post} /session/check Check is session valid and get permissions.
 * @apiName check
 * @apiGroup Session
 *
 * @apiParam {Integer} session_id Session ID.
 * @apiParam {String} session_token Session Token.
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded.
 * @apiSuccess {Array} permissions List of user's permissions as an array.
 * 
 * @apiPermission LOGGED_IN
 */
router.post('/check', (req,res,next) => {
  auth(req).then( (r) => {
    if ( r.session ) {
      res.status(200).json( {success: 1, session_exists: 1, permissions : r.permissions } )
    }else{
      res.status(400).json( {success: 0, session_exists: 0, permissions: [] } );
    }
  });
});

/**
 * @api {post} /session/logout Log out
 * @apiName logout
 * @apiGroup Session
 *
 * @apiParam {Integer} session_id Session ID.
 * @apiParam {String} session_token Session Token.
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded.
 * 
 * @apiPermission LOGGED_IN
 */
router.post('/logout', (req,res,next) => {
  auth(req).then( (r) => {
    if ( r.session ) {
      db.query("DELETE FROM `sessions` WHERE `sessionID`=? LIMIT 1", [req.body.session_id], (e,r,f) => {
        if ( e == null ) {
          res.status(200).json({ success: true });
        }else{
          res.status(200).json({ success: false, error: 'Database query failed.' });
        }
      });
    }else{
      res.status(400).json( { success: false, error: 'Session does not exists.'} );
    }
  });
});

/**
 * @api {post} /session/login Log in to the system
 * @apiName login
 * @apiGroup Session
 *
 * @apiParam {String} username Username.
 * @apiParam {String} password Password.
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded.
 * @apiSuccess {Integer} session_id Session ID.
 * @apiSuccess {String} token Session token.
 * 
 * @apiPermission HAS_ACCOUNT
 */
router.post('/login', (req,res,next) => {
  let response = { success : false }
  if ( typeof req.body.username == 'undefined' || typeof req.body.password == 'undefined' 
      || req.body.username == '' || req.body.password == '' ) {
    res.status(200).json({ success: 0, error: 'Both Username and Password are required.'});
  }else{
    const username = req.body.username;
    const password = req.body.password;
    db.query("SELECT userID FROM users WHERE `userName`=? AND `userPassword`='" + md7(password) + "' LIMIT 1", [username], (e,r,f) => {
      if (r.length == 1 ) {
        const token = md7( Math.floor((Math.random() * 10000) + 1) + username + Math.floor((Math.random() * 10000) + 1) + username );
        const userID = r[0].userID;
        const timestampNow = Math.floor(Date.now() / 1000);
        db.query("INSERT INTO `sessions` SET sessionUserLID=?, sessionStartTime=?, sessionLastActive=?, sessionToken=?, sessionIP=?"
        , [userID, timestampNow, timestampNow, token, req.connection.remoteAddress]
        , (e,r,f) => {
            if ( e == null ) {
              response.success = true;
              response.session_id = r.insertId;
              response.token = token;
              res.status(200).json( response );
            }else{
              res.status(200).json( {success:0, error : 'Database query error.'} );
            }
        });
      }else{
        response.error = 'Wrong username or password!';                      
        res.status(200).json((response));
      }
    });  
  }
});

module.exports = router;