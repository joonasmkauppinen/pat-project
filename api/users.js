const express = require('express');
const router = express.Router();
const db = require('../modules/db');
const md7 = require('../modules/md7');

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

/* Check if the username meets the username criteria */
const isUsernameAcceptable = (userName) => {
  const regex = /^[a-zA-Z0-9-_]+$/;
  if(regex.test(userName)){
      if ( userName.length > 16) {
          return 'Username is too long. Max 16 characters!';
        }else if ( userName.length < 2 ) {
          return 'Username is too short. Min 2 characters!';
        }else if (userName == ''){
          return 'Username cannot be empty.';
        }else{
          return 'yes';
        }
    }else{
      return 'Username contains illegal characters. Only a-z, A-Z, 0-9 and marks - and _ allowed (no spaces)!';
    }
  }

/* Check if the email meets the email criteria */
const isEmailAcceptable = (email) => {
  const regex = /^(([^<>()[\]\\.,'";:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if(regex.test(email)){
      return 'yes';
    }else{
      return 'Email address is invalid.';
    }
  }

/* Check if the password meets the password criteria */
const isPasswordAcceptable = (password) => {
  if ( password.length < 6 ) {
      return 'Password is too short. Should be at least 6 characters.';
    }else{
      return 'yes';
    }
  }

/* Check if the username is available (not exists in Database) */
const isUsernameAvailable = async (userName) => {
  return new Promise((resolve,reject) => {
    db.query("SELECT count(userID) AS `userCount` FROM users WHERE LOWER(userName)=?", userName.toLowerCase(), (e,r,f) => {
      if ( e != null ) {
          resolve(false);
        }else{
          if ( r[0].userCount != '0' ) {          
            resolve(false);
          }else{
            resolve(true);
          }
        }
      });
  });
  }

/* Check if the email is available (not exists in Database) */
const isEmailAvailable = async (emailAddress) => {
  return new Promise((resolve,reject) => {
    db.query("SELECT count(userID) AS `userCount` FROM users WHERE LOWER(userEmail)=?", emailAddress.trim().toLowerCase(), (e,r,f) => {
      if ( e != null ) {
          resolve(false);
        }else{
          if ( r[0].userCount != '0' ) {        
            resolve(false);
          }else{
            resolve(true);
          }
        }
      });
  });
  }

/**
 * @api {get} /users/username-available/:id Check is Username available
 * @apiName username-available
 * @apiVersion 1.0.0
 * @apiGroup Users
 *
 * @apiParam {String} userName Username for checking availability.
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded.
 * @apiSuccess {Boolean} available Is username available.
 * 
 * @apiError {Boolean} success (false) API Call failed.
 * @apiError {String} error Error description.
 * 
 * @apiPermission everyone
 */
router.get('/username-available/:userName', (req,res,next) => {
  let userName = req.params.userName;
  if ( typeof userName == 'undefined' || userName == '') {
    res.status(200).json({ success: false, error: ':userName parameter is not specified!'});
  }else{
    userName = userName.trim();
    const isAcceptable = isUsernameAcceptable(userName);
    if ( isAcceptable == 'yes' ) {
        isUsernameAvailable(userName).then((r) => {
          console.log(r);
          if ( r == true ) {
              res.status(200).json({success: true, available: true});
            }else{
              res.status(200).json({success: true, available: false});
            }
          });
      }else{
        res.status(200).json({ success: false, error: isAcceptable });
      }
    }
});

/**
 * @api {post} /users/create-user-account Create new User Account
 * @apiName create-user-account
 * @apiVersion 1.0.0
 * @apiGroup Users
 *
 * @apiParam {String} username Username.
 * @apiParam {String} password Password for User. 
 * @apiParam {String} email User Email address.
 * 
 * @apiSuccess {Boolean} success (true) API Call succeeded.
 * @apiSuccess {Boolean} session TRUE if Automatic Session Creation is Enabled, otherwise FALSE
 * @apiSuccess {Integer} session_id Session ID  (this value returned only if Automatic Session Creation is Enabled)
 * @apiSuccess {String} token Session Token (this value returned only if Automatic Session Creation is Enabled)
 * 
 * @apiError {Boolean} success (false) API Call failed.
 * @apiError {String} error Error description.
 * 
 * @apiPermission everyone
 */
router.post('/create-user-account', (req,res,next) => {
  let response = { success: true };
  if ( typeof req.body.username == 'undefined' || typeof req.body.password == 'undefined' || req.body.email == 'undefined'
       || req.body.username == '' || typeof req.body.password == '' || req.body.email == '' ) {
    response.success = false;
    response.error = 'Params username, password and email are required.';
  }else{
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email.trim().toLowerCase();
    const usernameAcceptable = isUsernameAcceptable(username);
    if ( usernameAcceptable == 'yes' ) {
      const emailAcceptable = isEmailAcceptable(email);
      if ( emailAcceptable == 'yes' ) {
        const passwordAcceptable = isPasswordAcceptable(password);
        if ( passwordAcceptable == 'yes' ) {
          // Now we have pre-validated USERNAME, PASSWORD and EMAIL. Let's do the db queries.
          isUsernameAvailable(username).then((isAvailable)=>{
            if ( isAvailable ) {
              isEmailAvailable(email).then((isAvailable)=>{
                if ( isAvailable ) {
                    // Everything is ok, let's create user!
                    const userCreateTime = Math.floor(Date.now() / 1000);
                    db.query("INSERT INTO `users` (userName, userPassword, userEmail, userGroupLID, userCreateTime, userLastSeenTime) VALUES (?, ?, ?, ?, ?, ?)", 
                    [username, md7(password), email, process.env.DEFAULT_USER_GROUP, userCreateTime, 0] ,(e,r,f) => {
                      if ( e == null ) {
                        // User is added to the database -> r.insertId would be needed if we want to autoLogin
                        res.status(200).json((response));
                      }else{
                        res.status(200).json({success: false, error: 'Database query error.'});
                      }
                    });
                  }else{
                    res.status(200).json({success: false, error: 'Email address is already in use.'});
                  }
                });
            }else{
              res.status(200).json({success: false, error: 'Username is already in use.'});
            }
          });
        }else{
          response.success = false;
          response.error = passwordAcceptable;  
        }
      }else{
        response.success = false;
        response.error = emailAcceptable;
      }
    }else{
      response.success = false;
      response.error = usernameAcceptable;
    }
  }
  if ( response.success == false ) {
    res.status(400).json(response);
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