const express = require('express');
const router = express.Router();
const db = require('../modules/db');
const global = require('../modules/global');
const auth = require('../modules/auth');
const md7 = require('../modules/md7');
const user = require('../modules/user');
const post = require('../modules/post');
const timeFormatting = require('../modules/time-formatting');

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
 * @api {post} /users/profile User Profile Data
 * @apiName users-profile
 * @apiVersion 1.0.0
 * @apiGroup Users
 *
 * @apiParam {Integer} session_id Session ID
 * @apiParam {String} session_token Session Token
 * @apiParam {Integer} user_id User ID
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded.
 * 
 * @apiError {Boolean} success (false) API Call failed.
 * @apiError {String} error Error description.
 * 
 * @apiPermission Logged in
 */
router.post('/profile', (req,res,next) => {
  if ( global.issetIsNumeric ( req.body.user_id ) ) {
    next();
  }else{
    res.status(400).json( { success: false, error: 'Parameter user_id is required and it must be a number.' } );
  }
});
router.post('/profile', (req,res,next) => {
  auth(req).then( (r) => {
    if ( r.session ) {
      next();
    }else{
      res.status(400).json( { success: false, error: 'You are not logged in / no valid session.' } );
    }
  });
});
router.post('/profile', (req,res,next) => {
  user.userExists(parseInt(req.body.user_id)).then( (userExists) => {
    if ( userExists ) {
      next();
    }else{
      res.status(400).json( { success: false, error: 'User does not exists' } );
    }
  });
});
router.post('/profile', (req,res,next) => {
  user.userExists(parseInt(req.body.user_id)).then( (userExists) => {
    if ( userExists ) {
      next();
    }else{
      res.status(400).json( { success: false, error: 'User does not exists' } );
    }
  });
});
router.post('/profile', (req,res,next) => {
  db.query(`SELECT userID, userName, userDescription, userLastSeenTime, userCreateTime FROM users WHERE userID=? LIMIT 1`, 
  [parseInt(req.body.user_id)], (e,r,f) => {
    if ( !e ) {
      if ( r.length == 1 ) {
        req.userData = r[0];
        next();
      }else{
        res.status(400).json( { success: false, error: 'User data cannot be found in the database.' } );  
      }
    }else{
      res.status(400).json( { success: false, error: 'Database query failes' } );
    }
  });
});
router.post('/profile', (req,res,next) => {
  db.query(`SELECT COUNT(lfuID) AS followers FROM linkingsFollowingUser WHERE lfuFollowingUserLID=?`, [parseInt(req.body.user_id)], (e,r,f) => {
    if ( !e ) {
      if ( r.length == 1 ){
        req.followers = r[0].followers;
      }      
      next();
    }else{ res.status(400).json( { success: false, error: 'Failted to fetch followers' } ) }
  });
});  
router.post('/profile', (req,res,next) => {
  db.query(`SELECT COUNT(lfuID) AS following FROM linkingsFollowingUser WHERE lfuFollowerUserLID=?`, [parseInt(req.body.user_id)], (e,r,f) => {
    if ( !e ) {
      if ( r.length == 1 ){
        req.following = r[0].following;
      }
      next();
    }else{ res.status(400).json( { success: false, error: 'Failted to fetch following' } ) }
  });
});  
router.post('/profile', (req,res,next) => {
  db.query(`SELECT COUNT(postID) AS postCount FROM posts WHERE postAddedBy=?`, [parseInt(req.body.user_id)], (e,r,f) => {
    if ( !e ) {
      if ( r.length == 1 ){
        req.postCount = r[0].postCount;
      }
      next();
    }else{ res.status(400).json( { success: false, error: 'Failted to fetch post amount' } ) }
  });
});  
router.post('/profile', (req,res,next) => {
  res.status(200).json( { success: true,
                          user_name: req.userData.userName,
                          user_description : req.userData.userDescription,
                          following: req.following,
                          followers: req.followers,
                          posts: req.postCount,
                          profile_pic_uri: 'img/usr/' + req.userData.userID + '.png',
                          profile_create_time: timeFormatting.unixTimeAsDate(req.userData.userCreateTime),
                          profile_create_time_ago: timeFormatting.timeAgo(req.userData.userCreateTime),
                          last_seen_time :  timeFormatting.unixTimeAsDate(req.userData.userLastSeenTime),
                          last_seen_time_ago: timeFormatting.timeAgo(req.userData.userLastSeenTime) } );
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
                    db.query("INSERT INTO `users` (userName, userPassword, userEmail, userGroupLID, userCreateTime, userLastSeenTime, userVerified) VALUES (?, ?, ?, ?, ?, ?, 0)", 
                    [username, md7(password), email, process.env.DEFAULT_USER_GROUP, userCreateTime, 0, 0] ,(e,r,f) => {
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

/**
 * @api {delete} /users Delete User #_IN_PROGRESS_#
 * @apiName users/delete
 * @apiVersion 1.0.0
 * @apiGroup Users
 *
 * @apiParam {Integer} session_id Session ID
 * @apiParam {String} session_token Session Token
 * @apiParam {Integer} user_id Usr ID
 * 
 * @apiPermission USER_DELETE or logged in user can delete own account
 * 
 * @apiSuccess {Boolean} success (true) API Call succeeded
 * 
 * @apiError {Boolean} success (false) API Call failed
 * @apiError {String} error Error description
 */
router.delete('/', (req,res,next) => {
  if ( global.issetIsNumeric ( req.body.user_id ) ) {
    req.body.user_id = parseInt(req.body.user_id);
    next();
  }else{
    res.status(400).json( { success: false, error: 'Parameter user_id is required and it must be a number.' } );
  }
});
router.delete('/', (req,res,next) => {
  auth(req).then( (r) => {
    if ( r.session ) {
      req.user_id = r.user_id;
      if ( r.permissions.indexOf('USER_DELETE') ) {
        req.USER_DELETE = 1;
      }else{
        req.USER_DELETE = 0;
      }
      next();
    }else{
      res.status(400).json( { success: false, error: 'You are not logged in / no valid session.' } );
    }
  });
});
router.delete('/', (req,res,next) => {
  if ( req.body.user_id != req.user_id ) {
    user.getUser(req.body.user_id).then( (usr) => {
      if ( usr ) {
        next();
      }else{
        res.status(400).json( { success: false, error: 'User not found.' } );
      }
    });    
  }else{
    next();
  }
});
router.delete('/', (req,res,next) => {
  if ( req.body.user_id == req.user_id ) {
    // User is deleting its own account.
    next();
  }else{
    // User tries to delete other users account
    if ( req.USER_DELETE ) {
      next();
    }else{
      res.status(400).json( { success: false, error: 'Unauthorized! You do not have permission to delete other users!' } );
    }
  }
});
router.delete('/', (req,res,next) => {
  user.getAllPostIDsByUser(req.body.user_id).then( (delUserPosts) => {
    req.user_posts = delUserPosts;
    next();
  });  
});
router.delete('/', (req,res,next) => {
  user.getAllPetIDsByUser(req.body.user_id).then( (delUserPets) => {
    req.user_pets = delUserPets;
    next();
  });  
});
router.delete('/', (req,res,next) => {
  if ( req.user_posts ) {
    let queryWhereParams = '';
    for ( let i=0; i<req.user_posts.length; i++ ){
      queryWhereParams += (i==0?'':' OR ')+'p='+req.user_posts[i].id;
      post.deleteAllStoredPostFiles(req.user_posts[i].id);
    }
    req.queryWhereParamsForPost = queryWhereParams;
  }
  next();
});
router.delete('/', (req,res,next) => {
  if ( req.user_pets ) {
    let queryWhereParams = '';
    for ( let i=0; i<req.user_pets.length; i++ ){
      queryWhereParams += (i==0?'':' OR ')+'p='+req.user_pets[i];
    }
    req.queryWhereParamsForPet = queryWhereParams;
  }
  next();
});
router.delete('/', (req,res,next) => {
  console.log(`DELETE FROM comments WHERE commentUserLID=?`);
  next();
});
router.delete('/', (req,res,next) => {
  console.log(`DELETE FROM linkingsFollowingUser WHERE lfuFollowerUserLID=? OR lfuFollowingUserLID=?`);
  next();
});
router.delete('/', (req,res,next) => {
  console.log(`DELETE FROM contentReports WHERE crReportedBy=?`);
  next();
});
router.delete('/', (req,res,next) => {
  if ( req.user_pets ) {
    console.log(`DELETE FROM linkingsPetToPost WHERE ${(req.queryWhereParamsForPet).replace(/p/g,'lptpPetLID')}`);
  }
  next();
});
router.delete('/', (req,res,next) => {
  if ( req.user_posts ) {
    console.log(`DELETE FROM linkingsTagToPost WHERE ${(req.queryWhereParamsForPost).replace(/p/g,'lttpPostLID')}`);
    }
  next();
});
router.delete('/', (req,res,next) => {
  console.log(`DELETE FROM pets WHERE petOwnerLID=?`);
  next();
});
router.delete('/', (req,res,next) => {
  console.log(`DELETE FROM posts WHERE postAddedBy=?`);
  next();
});
router.delete('/', (req,res,next) => {
  console.log(`DELETE FROM sessions WHERE sessionUserLID=?`);
  next();
});
router.delete('/', (req,res,next) => {
  console.log(`DELETE FROM ratings WHERE ratingByUserLID=?`);
  next();
});
router.delete('/', (req,res,next) => {
  console.log(`DELETE FROM users WHERE userID=? LIMIT 1`);
  next();
});
router.delete('/', (req,res,next) => {
  res.status(400).json( { success: false, error: 'TODO' } );
});
module.exports = router;