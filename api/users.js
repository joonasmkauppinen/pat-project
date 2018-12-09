const express = require('express');
const router = express.Router();
const db = require('../modules/db');
const global = require('../modules/global');
const auth = require('../modules/auth');
const md7 = require('../modules/md7');
const user = require('../modules/user');
const post = require('../modules/post');
const timeFormatting = require('../modules/time-formatting');
const session = require('../modules/session');

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
    const isAcceptable = user.isUsernameAcceptable(userName);
    if ( isAcceptable == 'yes' ) {
        user.isUsernameAvailable(userName).then((r) => {
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
  if ( global.issetVar(req.body.username) && global.issetVar(req.body.password) && global.issetVar(req.body.email) ) {
    next();
  }else{
    res.status(400).json({success: false, error: 'Params username, password and email are required!'});
  }
});
router.post('/create-user-account', (req,res,next) => {
  const isAcceptable = user.isUsernameAcceptable(req.body.username);
  if ( isAcceptable == 'yes' ) next(); else res.status(400).json({success: false, error: isAcceptable });
});
router.post('/create-user-account', (req,res,next) => {
  const isAcceptable = user.isEmailAcceptable(req.body.email);
  if ( isAcceptable == 'yes' ) next(); else res.status(400).json({success: false, error: isAcceptable });
});
router.post('/create-user-account', (req,res,next) => {
  const isAcceptable = user.isPasswordAcceptable(req.body.password);
  if ( isAcceptable == 'yes' ) next(); else res.status(400).json({success: false, error: isAcceptable});
});
router.post('/create-user-account', (req,res,next) => {
  user.isUsernameAvailable(req.body.username).then( (isAvailable) => {
    if ( isAvailable ) {
      next();
    }else{
      res.status(400).json({success: false, error: 'Username is already in use.'});
    }
  });
});
router.post('/create-user-account', (req,res,next) => {
  user.isEmailAvailable(req.body.email).then( (isAvailable) => {
    if ( isAvailable ) {
      next();
    }else{
      res.status(400).json({success: false, error: 'Email address is already in use.'});
    }
  });
});
router.post('/create-user-account', (req,res,next) => {
  // Everything is ok, let's create user!
  db.query("INSERT INTO `users` (userName, userPassword, userEmail, userGroupLID, userCreateTime, userLastSeenTime, userVerified) VALUES (?, ?, ?, ?, ?, 0, 0)", 
  [req.body.username, md7(req.body.password), req.body.email, process.env.DEFAULT_USER_GROUP, timeFormatting.systemTimestamp() ] ,(e,r,f) => {
    if ( e == null ) {
      // User is added to the database -> r.insertId would be needed if we want to autoLogin
      session.tryLogin(req.body.username, req.body.password).then( (session) => {
        if ( session ) {
          res.status(200).json( {success: true, session: true, session_id: session.session_id, token: session.token } );
        }else{
          res.status(200).json( {success: true, session: false, warning: 'Logging in failed.' } );
        }
      });
    }else{
      res.status(200).json( {success: false, error: 'Database query error.'} );
    }
  });
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
      if ( r.permissions.indexOf('USER_DELETE') != -1 ) {
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
  user.getAllPostIDsByUser(req.body.user_id).then( (userPostIDs) => {
    req.user_posts = userPostIDs;
    next();
  });  
});
router.delete('/', (req,res,next) => {
  // TODO: delete files
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

/**
 * @api {post} / List Users
 * @apiName users
 * @apiVersion 1.0.0
 * @apiGroup Users
 *
 * @apiParam {Number} session_id Session ID
 * @apiParam {String} session_token Session Token
 * @apiParam {String} [search_term] Search term
 * 
 * @apiPermission Logged in
 * 
 * @apiSuccess {Boolean} success (true) API Call succeeded
 * @apiSuccess {Number} user_count Count of users
 * @apiSuccess {String[]} users
 * 
 * @apiError {Boolean} success (false) API Call failed
 * @apiError {String} error Error description
 */
router.post('/', (req,res,next) => {
  auth(req).then( (r) => {
    if ( r.session ) {
      next();
    }else{
      res.status(400).json( { success: false, error: 'You are not logged in / no valid session.' } );
    }
  });
});
router.post('/', (req,res,next) => {
  console.log((req.body.search_term ? '%'+req.body.search_term+'%' : '' ));
  db.query(`SELECT userID, userName FROM users ${(req.body.search_term ? ' WHERE userName LIKE ?' : '')} ORDER BY userName ASC LIMIT 100`, 
  (req.body.search_term ? '%'+req.body.search_term.toLowerCase()+'%' : '' ), (e,r,f) => {
    if ( e ) {
      res.status(400).json( { success: false, error: 'Database query failed.' } );
    }else{
      const responseArray = [];
      if ( r.length > 0 ) {
        r.forEach((i) => {
          responseArray.push( {id: i.userID, name: i.userName} );
        });
      }
      res.status(200).json( { success: true, user_count: r.length, users: responseArray } );
    }
  });
});