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
const fs = require('fs');
const createthumbnail = require('../modules/createthumbnail');

const multer = require('multer');
const upload = multer({dest: './public/img/'});

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
 * @api {patch} /users/profile Update User Profile Data
 * @apiName users-profile
 * @apiVersion 1.0.0
 * @apiGroup Users
 *
 * @apiParam {Number} session_id Session ID
 * @apiParam {String} session_token Session Token
 * @apiParam {Number} user_id User ID
 * 
 * @apiParam {String} [description] User description.
 * @apiParam {File} [upload_file] New profile picture.
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded.
 * 
 * @apiError {Boolean} success (false) API Call failed.
 * @apiError {String} error Error description.
 * 
 * @apiPermission Logged in
 */
router.patch('/', upload.single('upload_file'), (req,res,next) => {
  if ( req.file ) {
    // Define Supported Mime Types for Uploads:
    const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

    // Check, is the MimeType supported, otherwise throw an error
    if ( supportedMimeTypes.indexOf(req.file.mimetype) != -1 ) {
      // Export file extension from FileName
      const fileExtension = req.file.originalname.split('.').pop();
      req.file_extension = fileExtension;
      req.mimetype = req.file.mimetype;
      req.file_uploaded = true;
      next();
    }else{
      res.status(400).json( { success: false, error: 'The File MimeType of the Uploaded Image is not supported.' } );
    }
  }else{
    // no file
    req.file_uploaded = false;
    next();
  }
});
router.patch('/', (req,res,next) => {
  if ( global.issetIsNumeric ( req.body.user_id ) ) {
    next();
  }else{
    res.status(400).json( { success: false, error: 'Parameter user_id is required and it must be a number.' } );
  }
});
router.patch('/', (req,res,next) => {
  auth(req).then( (r) => {
    if ( r.session ) {
      req.user_id = r.user_id;
      if ( r.permissions.indexOf('USER_PROFILE_EDIT') != -1 ) {
        req.USER_PROFILE_EDIT = 1;
      }else{
        req.USER_PROFILE_EDIT = 0;
      }
      next();
    }else{
      res.status(400).json( { success: false, error: 'You are not logged in / no valid session.' } );
    }
  });
});
router.patch('/', (req,res,next) => {
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
router.patch('/', (req,res,next) => {
  if ( req.body.user_id == req.user_id ) {
    // User is modifying its own account.
    next();
  }else{
    // User tries to delete other users account
    if ( req.USER_PROFILE_EDIT ) {
      next();
    }else{
      res.status(400).json( { success: false, error: 'Unauthorized! You do not have permission to modify other users\' accounts!' } );
    }
  }
});
router.patch('/', (req,res,next) => {
  if ( typeof req.body.description != 'undefined' ) {
    db.query(`UPDATE users SET userDescription=? WHERE userID=? LIMIT 1`, 
    [req.body.description, parseInt(req.body.user_id)], (e,r,f) => {
      if ( !e ) {
        next();
      }else{
        res.status(400).json( { success: false, error: 'Database query failed.' } );
      }
    });
  }
});
router.patch('/', (req,res,next) => {
  if ( req.file_uploaded ) {
    const imgFile = './public/img/usr/' + parseInt(req.body.user_id) + '.png';
    fs.unlink(imgFile, (e) => {
      createthumbnail.createThumb(req.file.path, 300, imgFile, next);
    });
  }else{
    res.status(200).json( { success: true } );
  }
});
router.patch('/', (req,res,next) => {
  res.status(200).json( { success: true } );  
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
      req.auth = r;
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
  db.query(`SELECT lfuID FROM linkingsFollowingUser WHERE lfuFollowerUserLID=? AND lfuFollowingUserLID=? LIMIT 1`, 
  [req.auth.user_id, parseInt(req.body.user_id)], (e,r,f) => {
    if ( !e ) {
      if ( r.length == 1 ){
        res.following = true;
      }else{
        res.following = false;
      }
      next();
    }else{ res.status(400).json( { success: false, error: 'Failted to fetch following this.' } ) }
  });
});  
router.post('/profile', (req,res,next) => {
  res.status(200).json( { success: true,
                          user_id: parseInt(req.body.user_id),
                          user_name: req.userData.userName,
                          user_description : req.userData.userDescription,
                          following: req.following,
                          followers: req.followers,
                          posts: req.postCount,
                          i_am_following: res.following,
                          profile_pic_uri: (fs.existsSync('public/img/usr/' + req.userData.userID + '.png') ? 'img/usr/' + req.userData.userID + '.png' : null),
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
 * @api {delete} /users Delete User
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
// Session check
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
// Check does the user exists
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
// Check permissions
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
// Get all post ID's for file deletion
router.delete('/', (req,res,next) => {
  user.getAllPostIDsByUser(req.body.user_id).then( (userPostIDs) => {
    req.user_posts = userPostIDs;
    // TODO: delete actual media files
    next();
  });  
});
router.delete('/', (req,res,next) => {
  next();
});
router.delete('/', (req,res,next) => {
  console.log(`DELETE FROM users WHERE userID=? LIMIT 1`);
  db.query(`DELETE FROM users WHERE userID=? LIMIT 1`, 
  parseInt(req.body.user_id), (e,r,f) => {
    if ( e ) {
      res.status(400).json( { success: false, error: 'Database query failed.' } );
    }else{
      res.status(200).json( { success: true } );
    }
  });    
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

/**
 * @api {post} /get-user-id Get User ID by Username
 * @apiName users/get-user-id
 * @apiVersion 1.0.0
 * @apiGroup Users
 *
 * @apiParam {Number} session_id Session ID
 * @apiParam {String} session_token Session Token
 * @apiParam {String} user_name Search term
 * 
 * @apiPermission Logged in
 * 
 * @apiSuccess {Boolean} success (true) API Call succeeded
 * @apiSuccess {Number} user_id User ID
 * 
 * @apiError {Boolean} success (false) API Call failed
 * @apiError {String} error Error description
 */
router.post('/get-user-id', (req,res,next) => {
  if ( global.issetVar(req.body.user_name) ){
    next();
  }else{
    res.status(400).json( { success: false, error: 'Parameter user_name is required' } );
  }
});
router.post('/get-user-id', (req,res,next) => {
  auth(req).then( (r) => {
    if ( r.session ) {
      next();
    }else{
      res.status(400).json( { success: false, error: 'You are not logged in / no valid session.' } );
    }
  });
});
router.post('/get-user-id', (req,res,next) => {
  db.query(`SELECT userID FROM users  WHERE userName=? ORDER BY userName ASC LIMIT 1`, 
  [req.body.user_name], (e,r,f) => {
    if ( e ) {
      res.status(400).json( { success: false, error: 'Database query failed.' } );
    }else{
      if ( r.length == 1 ) {
        res.status(200).json( { success: true, user_id: r[0].userID } );
      }else{
        res.status(400).json( { success: false, error: 'User not found.' } );
      }
    }
  });
});