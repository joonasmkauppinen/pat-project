const express = require('express');
const router = express.Router();
const db = require('../modules/db');
const auth = require('../modules/auth');
const tf = require('../modules/time-formatting');

/**
 * @api {post} /:postID Get Comments by Post ID
 * @apiName comments
 * @apiVersion 1.0.0
 * @apiGroup Comments
 *
 * @apiParam {Integer} [session_id] Session ID
 * @apiParam {String} [session_token] Session Token
 * @apiParam {Integer} [post_id] Post ID
 * 
 * @apiPermission LOGGED_IN
 * 
 * @apiSuccess {Boolean} success (true) API Call succeeded
 * @apiSuccess {Object} comments Object Comments
 * 
 * @apiError {Boolean} success (false) API Call failed
 * @apiError {String} error Error description
 */
router.post('/:commentID', (req,res,next) => {
  auth(req).then( (r) => {
    if ( r.session ) {
      next();
    }else{
      res.status(400).json( { success: false, error: 'You are not logged in / no valid session.' } );
    }
  });
});
router.post('/:commentID', (req,res,next) => {
  // 
  db.query(`SELECT commentID, commentAddTime, comment, userName
            FROM comments, users
            WHERE commentPostLID=? AND users.userID=commentUserLID
            ORDER BY commentAddTime DESC`, 
  [req.params.commentID] ,(e,r,f) => {
    if ( e ) {
      res.status(400).json( { success: false, error: 'Database query failed.' } );
    }else{
      if ( r.length == 0 ) {
        res.status(200).json( { success: true, amount: 0 ,  comments: {} } );
      }else{
        const responseComments = [];
        for ( let i=0; i<r.length; i++){
          responseComments.push( { id: r[i].commentID, user_name: r[i].userName, added: tf.unixTimeAsDate(r[i].commentAddTime), added_ago: tf.timeAgo(r[i].commentAddTime), comment: r[i].comment } );
        }
        console.log(responseComments);
        res.status(200).json( { success: true, amount: responseComments.length, comments: responseComments } );
      }
    }
  });
});

module.exports = router;