'use strict';

const express = require('express');
const router = express.Router();
const db = require('../modules/db');
const auth = require('../modules/auth');
const global = require('../modules/global');
const timeFormatting = require('../modules/time-formatting');
const user = require('../modules/user');

/**
 * @api {post} /follow/ Follow User
 * @apiName follow
 * @apiVersion 1.0.0
 * @apiGroup Follow
 *
 * @apiParam {Integer} session_id Session ID
 * @apiParam {String} session_token Session Token
 * @apiParam {Integer} user_id User ID
 * 
 * @apiPermission LOGGED_IN
 * 
 * @apiSuccess {Boolean} success (true) API Call succeeded
 * 
 * @apiError {Boolean} success (false) API Call failed
 * @apiError {String} error Error description
 */
router.post('/', (req,res,next) => {
  /* Check Session */
  auth(req).then( (r) => {
    if ( !r.session ) {
      res.status(400).json( { success: false, error: 'You are not logged in.' } );
    }else{
      req.user_id = r.user_id;
      next();
    }
  });
});
/* Check are required parameters provided */
router.post('/', (req,res,next) => {
  // Check required parameters
  if ( global.issetIsNumeric(req.body.user_id) ) {
    next();
  }else{
    res.status(400).json( { success: false, error: 'Required variables (user_id) are not set - or values are in invalid format.' } );
  }
});
/* Check does the User Exists */
router.post('/', (req,res,next) => {
  user.userExists(req.body.user_id).then( (userExists) => {
    if ( userExists ) {
      req.follow_user_id = parseInt(req.body.user_id);
      next();
    }else{
      res.status(400).json( { success: false, error: 'User does not exists.' } );
    }
  });
});
/* 'Myself' check */
router.post('/', (req,res,next) => {
  if ( req.follow_user_id == req.user_id ) {
    res.status(400).json( { success: false, error: 'You cannot follow yourself!' } );
  }else{
    next();
  }
});
/* Check does the Request User already follow requested Follow User */
router.post('/', (req,res,next) => {
    db.query(`SELECT COUNT(lfuID) AS countFollowing FROM linkingsFollowingUser WHERE lfuFollowerUserLID=? AND lfuFollowingUserLID=?`,
    [req.user_id, req.follow_user_id], (e,r,f) => {
      if ( e ) {
        res.status(400).json( { success: false, error: 'Database query failed (already following check).' } );
      }else{
        if ( r[0].countFollowing == 1 ) {
          res.status(200).json( { success: true, warning: 'You already follow this user.' } );
        }else{
          next();
        }
      }
    });
  });
/* Add Follow to the Database */
router.post('/', (req,res,next) => {
    db.query(`INSERT INTO linkingsFollowingUser (lfuFollowerUserLID, lfuFollowingUserLID, lfuFollowingStarted) VALUES (?, ?, ?)`,
    [ req.user_id, req.follow_user_id, timeFormatting.systemTimestamp() ], (e,r,f) => {
      if ( e ) {
          console.log(e);
        res.status(400).json( { success: false, error: 'Database query failed (add follow to the database).' } );
      }else{
        res.status(200).json( { success: true } );
      }
    });
  });

/**
 * @api {delete} /follow/ Unfollow User
 * @apiName unfollow
 * @apiVersion 1.0.0
 * @apiGroup Follow
 *
 * @apiParam {Integer} session_id Session ID
 * @apiParam {String} session_token Session Token
 * @apiParam {Integer} user_id User ID
 * 
 * @apiPermission LOGGED_IN
 * 
 * @apiSuccess {Boolean} success (true) API Call succeeded
 * 
 * @apiError {Boolean} success (false) API Call failed
 * @apiError {String} error Error description
 */
router.delete('/', (req,res,next) => {
    /* Check Session */
    auth(req).then( (r) => {
      if ( !r.session ) {
        res.status(400).json( { success: false, error: 'You are not logged in.' } );
      }else{
        req.user_id = r.user_id;
        next();
      }
    });
  });
  /* Check are required parameters provided */
  router.delete('/', (req,res,next) => {
    // Check required parameters
    if ( global.issetIsNumeric(req.body.user_id) ) {
      req.follow_user_id = parseInt(req.body.user_id);
      next();
    }else{
      res.status(400).json( { success: false, error: 'Required variables (user_id) are not set - or values are in invalid format.' } );
    }
  });
/* 'Myself' check */
router.delete('/', (req,res,next) => {
    if ( req.follow_user_id == req.user_id ) {
      res.status(400).json( { success: false, error: 'You cannot unfollow yourself!' } );
    }else{
      next();
    }
  });  
  /* Check does the Request User already follow requested Follow User */
  router.delete('/', (req,res,next) => {
      db.query(`SELECT COUNT(lfuID) AS countFollowing FROM linkingsFollowingUser WHERE lfuFollowerUserLID=? AND lfuFollowingUserLID=?`,
      [req.user_id, req.follow_user_id], (e,r,f) => {
        if ( e ) {
          res.status(400).json( { success: false, error: 'Database query failed (already following check).' } );
        }else{
          if ( r[0].countFollowing == 1 ) {
            next();
          }else{
            console.log(r);
            res.status(200).json( { success: true, warning: 'You do not follow this user - cannot unfollow.' } );
          }
        }
      });
    });
  /* Remove Follow from the Database */
  router.delete('/', (req,res,next) => {
      db.query(`DELETE FROM linkingsFollowingUser WHERE lfuFollowerUserLID=? AND lfuFollowingUserLID=? LIMIT 1`,
      [ req.user_id, req.follow_user_id ], (e,r,f) => {
        if ( e ) {
          res.status(400).json( { success: false, error: 'Database query failed (add follow to the database).' } );
        }else{
          res.status(200).json( { success: true } );
        }
      });
    });

module.exports = router;