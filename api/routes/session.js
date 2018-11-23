const express = require('express');
const router = express.Router();
const db = require('../../db');
const md5 = require('md5');

const md7 = (i) => {
  return md5(i + process.env.SALT_1) + md5(process.env.SALT_2 + i + process.env.SALT_3 + i);
}
  
const isSession = ( sessionID, sessionToken ) => {
  // return true / false
  db.query("SELECT userID FROM sessions WHERE `sessionID`=? AND `sessionToken`=? LIMIT 1", [session_id, token], (e,r,f) => {
    if ( typeof r == 'undefined' || r.length != 1 ) {
      return false;
    }else{
      return true;
    }
  });
}

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

router.post('/logout', (req,res,next) => {
  if ( typeof req.body.session_id == 'undefined' || typeof req.body.session_token == 'undefined' 
  || req.body.session_id == '' || req.body.session_token == ''
  || isNaN(parseFloat(req.body.session_id)) && isFinite(req.body.session_id) ) {
    res.status(200).json({ success: 0 });
  }else{
    db.query("SELECT sessionID FROM `sessions` WHERE `sessionID`=? AND `sessionToken`=? LIMIT 1", [req.body.session_id,req.body.session_token], (e,r,f) => {
      if ( typeof r != 'undefined' && r.length == 1 ) {
        
        db.query("DELETE FROM `sessions` WHERE `sessionID`=? LIMIT 1", [req.body.session_id], (e,r,f) => {
          res.status(200).json({ success: 1 });
        });
        
      }else{
        res.status(200).json({ success: 0 });
      }
    });
  }
});

router.post('/login', (req,res,next) => {

  let response = { success : 0 }

  if ( typeof req.body.username == 'undefined' || typeof req.body.password == 'undefined' 
      || req.body.username == '' || req.body.password == '' ) {
    res.status(200).json({ success: 0, error: 'username and password are required'});
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
              response.success = 1;
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



router.get('/logout', (req,res,next) => {
  
    let response = { success : 0 }
  
    if ( typeof req.query.session_id == 'undefined' || typeof req.query.token == 'undefined' ) {

      res.status(200).json({ success: 0, error: '`session_id` and `token` are required'});

    }else{

      const session_id = req.query.session_id;
      const token = req.query.token;

      if ( isSession ( session_id, token ) ) {

          db.query("DELETE FROM `sessions` WHERE `sessionID`=? AND sessionToken=? LIMIT 1", [session_id, token], (e,r,f) => {
              if ( e == null ) {
                response.success = 1;
                res.status(200).json((response));
              }
          });

      }else{

          res.status(200).json((response));

        }
    }

});


module.exports = router;