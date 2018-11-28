const express = require('express');
const router = express.Router();
const db = require('../../modules/db');
const md7 = require('../../modules/md7');
  
const isSession = ( sessionID, sessionToken ) => {
  // return true / false
  db.query("SELECT userID FROM sessions WHERE `sessionID`=? AND `sessionToken`=? LIMIT 1", [session_id, token], (e,r,f) => {
    if ( typeof r == 'undefined' || r.length != 1 ) {
      return false;
    }else{
      return true;
    }
  });
};

const getSession = async ( id, token ) => {
  // return true / false
  return new Promise((resolve, reject) => {
  db.query(`SELECT sessionUserLID, userGroupLID, upName FROM sessions, users 
  LEFT JOIN linkingsPermissionToGroup ON linkingsPermissionToGroup.lptgGroupLID=users.userGroupLID
  LEFT JOIN userPermissions ON userPermissions.upID=linkingsPermissionToGroup.lptgPermissionLID
  WHERE sessions.sessionUserLID=users.userID AND sessionID=? AND sessionToken=?`, [id, token], (e,r,f) => {    
    if ( typeof r == 'undefined' || r.length < 1 ) {
      //return false;
      resolve(false);
    }else{
        const permissionsArray = []
        r.forEach( (i) => {
          permissionsArray.push(i.upName);
        });
        console.log('NOW IM PASSING THE VALUE');
        resolve({permissions: permissionsArray});
    }
  });
});
}

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
  let response = { success: 1, session_exists : 0, permissions : {} }
  if ( typeof req.body.session_id == 'undefined' || typeof req.body.session_token == 'undefined' 
  || req.body.session_id == '' || req.body.session_token == ''
  || isNaN(parseFloat(req.body.session_id)) && isFinite(req.body.session_id) ) {
    res.status(200).json(response);
  }else{
    getSession ( req.body.session_id, req.body.session_token ) .then( (sess) => {
      console.log('GOT FEEDBACK, this:');
      console.log(sess);
      if ( sess ) {
        response.session_exists=1;
        response.permissions = sess.permissions;
        res.status(200).json(response);
      }else{
        res.status(200).json(response);
      }
    });
  }
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
  if ( typeof req.body.session_id == 'undefined' || typeof req.body.session_token == 'undefined' 
  || req.body.session_id == '' || req.body.session_token == ''
  || isNaN(parseFloat(req.body.session_id)) && isFinite(req.body.session_id) ) {
    res.status(200).json({ success: false, error: 'Session ID is illegal.' });
  }else{
    db.query("SELECT sessionID FROM `sessions` WHERE `sessionID`=? AND `sessionToken`=? LIMIT 1", [req.body.session_id,req.body.session_token], (e,r,f) => {
      if ( typeof r != 'undefined' && r.length == 1 ) {
        db.query("DELETE FROM `sessions` WHERE `sessionID`=? LIMIT 1", [req.body.session_id], (e,r,f) => {
          res.status(200).json({ success: true });
        });
      }else{
        res.status(200).json({ success: false, error: 'Session does not exists.' });
      }
    });
  }
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
        db.query("INSERT INTO `sessions` SET sessionUserLID=" + userID + ", sessionStartTime="+timestampNow+", sessionLastActive="+timestampNow+", sessionToken='"+token+"', sessionIP='"+req.connection.remoteAddress+"'", (e,r,f) => {
            if ( e == null ) {
              response.success = true;
              response.session_id = r.insertId;
              response.token = token;
              res.status(200).json((response));
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