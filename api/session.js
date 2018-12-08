const express = require('express');
const router = express.Router();
const db = require('../modules/db');
const md7 = require('../modules/md7');
const auth = require('../modules/auth');
const tf = require('../modules/time-formatting');
const global = require('../modules/global');
const session = require('../modules/session');

/**
 * @api {post} /session/check Check is session valid and get permissions
 * @apiName check
 * @apiVersion 1.0.0
 * @apiGroup Session
 *
 * @apiParam {Integer} session_id Session ID.
 * @apiParam {String} session_token Session Token.
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded.
 * @apiSuccess {String[]} permissions List of user's permissions as a String Array.
 * 
 * @apiError {Boolean} success (false) API Call failed.
 * @apiError {String} error Error description.
 * 
 * @apiPermission LOGGED_IN
 */
router.post('/check', (req,res,next) => {
  auth(req).then( (r) => {
    if ( r.session ) {
      res.status(200).json( {success: 1, session_exists: 1, permissions : r.permissions, user_id : r.user_id } )
    }else{
      res.status(400).json( {success: 0, session_exists: 0, permissions: [] } );
    }
  });
});

/**
 * @api {post} /session/logout Log out
 * @apiName logout
 * @apiVersion 1.0.0
 * @apiGroup Session
 *
 * @apiParam {Integer} session_id Session ID.
 * @apiParam {String} session_token Session Token.
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded.
 * 
 * @apiError {Boolean} success (false) API Call failed.
 * @apiError {String} error Error description.
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
 * @api {post} /session/login Log in
 * @apiName login
 * @apiVersion 1.0.0
 * @apiGroup Session
 *
 * @apiParam {String} username Username.
 * @apiParam {String} password Password.
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded.
 * @apiSuccess {Integer} session_id Session ID.
 * @apiSuccess {String} token Session token.
 * 
 * @apiError {Boolean} success (false) API Call failed.
 * @apiError {String} error Error description.
 * 
 * @apiPermission (HAS_ACCOUNT)
 */
router.post('/login', (req,res,next) => {
  if ( global.issetVar(req.body.username) && global.issetVar(req.body.password) ) {
    next();
  }else{
    res.status(200).json({ success: 0, error: 'Parameters username and password are required.'});
  }
});
router.post('/login', (req,res,next) => {
  session.tryLogin(req.body.username, req.body.password).then ( (session) => {
    if ( session ) {
      if ( session.success ) {
        res.status(200).json( session );
      }else{
        res.status(400).json( { success: 0, error: session.error } );
      }
    }else{
      res.status(400).json( { success: 0, error: 'Login failed.'} );
    }
  });
});

module.exports = router;