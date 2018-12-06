const express = require('express');
const router = express.Router();
const db = require('../modules/db');
const auth = require('../modules/auth');
const tf = require('../modules/time-formatting');
const global = require('../modules/global');
const post = require('../modules/post');
const comment = require('../modules/comment');

/**
 * @api {post} /comments/ Get Comments by Post ID
 * @apiName comments
 * @apiVersion 1.0.0
 * @apiGroup Comments
 *
 * @apiParam {Integer} session_id Session ID
 * @apiParam {String} session_token Session Token
 * @apiParam {Integer} post_id Post ID
 * 
 * @apiPermission LOGGED_IN
 * 
 * @apiSuccess {Boolean} success (true) API Call succeeded
 * @apiSuccess {Object} comments Object Comments
 * 
 * @apiError {Boolean} success (false) API Call failed
 * @apiError {String} error Error description
 */
router.post('/', (req,res,next) => {
  if ( global.issetIsNumeric ( req.body.post_id ) ) {
    next();
  }else{
    res.status(400).json( { success: false, error: 'Parameter post_id is required and it must be a number.' } );
  }
});
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
  // 
  db.query(`SELECT commentID, commentAddTime, comment, userName
            FROM comments, users
            WHERE commentPostLID=? AND users.userID=commentUserLID
            ORDER BY commentAddTime DESC`, 
  [req.body.post_id] ,(e,r,f) => {
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

/**
 * @api {post} /comments/add Add Comment
 * @apiName comments/add
 * @apiVersion 1.0.0
 * @apiGroup Comments
 *
 * @apiParam {Integer} session_id Session ID
 * @apiParam {String} session_token Session Token
 * @apiParam {Integer} post_id Post ID
 * @apiParam {Integer} comment Comment
 * 
 * @apiPermission LOGGED_IN
 * 
 * @apiSuccess {Boolean} success (true) API Call succeeded
 * 
 * @apiError {Boolean} success (false) API Call failed
 * @apiError {String} error Error description
 */
router.post('/add', (req,res,next) => {
  if ( global.issetIsNumeric ( req.body.post_id ) ) {
    next();
  }else{
    res.status(400).json( { success: false, error: 'Parameter post_id is required and it must be a number.' } );
  }
});
router.post('/add', (req,res,next) => {
  if ( global.issetVar ( req.body.comment ) ) {
    next();
  }else{
    res.status(400).json( { success: false, error: 'Parameter comment is required.' } );
  }
});
router.post('/add', (req,res,next) => {
  auth(req).then( (r) => {
    if ( r.session ) {
      req.user_id = r.user_id;
      next();
    }else{
      res.status(400).json( { success: false, error: 'You are not logged in / no valid session.' } );
    }
  });
});
router.post('/add', (req,res,next) => {
  post.postExists(req.body.post_id).then( (postExists) => {
    if ( postExists ) {
      next();
    }else{
      res.status(400).json( { success: false, error: 'Post does not exists.' } );
    }
  });
});
router.post('/add', (req,res,next) => {
  db.query(`INSERT INTO comments (commentPostLID, commentUserLID, commentAddTime, comment) VALUES (?, ?, ?, ?)`, 
  [req.body.post_id, req.user_id, tf.systemTimestamp(), req.body.comment] ,(e,r,f) => {
    if ( !e ) {
      res.status(200).json( { success: true } );
    }else{
      console.log(e);
      res.status(400).json( { success: false, error: 'Database query failed.' } );
    }
  });
});

/**
 * @api {delete} /comments Delete Comment
 * @apiName comments/delete
 * @apiVersion 1.0.0
 * @apiGroup Comments
 *
 * @apiParam {Integer} session_id Session ID
 * @apiParam {String} session_token Session Token
 * @apiParam {Integer} comment_id Post ID
 * 
 * @apiPermission COMMENT_DELETE or logged in user deleting own comment
 * 
 * @apiSuccess {Boolean} success (true) API Call succeeded
 * 
 * @apiError {Boolean} success (false) API Call failed
 * @apiError {String} error Error description
 */
router.delete('/', (req,res,next) => {
  if ( global.issetIsNumeric ( req.body.comment_id ) ) {
    next();
  }else{
    res.status(400).json( { success: false, error: 'Parameter comment_id is required and it must be a number.' } );
  }
});
router.delete('/', (req,res,next) => {
  auth(req).then( (r) => {
    if ( r.session ) {
      req.user_id = r.user_id;
      if ( r.permissions.indexOf('COMMENT_DELETE') ) {
        req.COMMENT_DELETE = 1;
      }else{
        req.COMMENT_DELETE = 0;
      }
      next();
    }else{
      res.status(400).json( { success: false, error: 'You are not logged in / no valid session.' } );
    }
  });
});
router.delete('/', (req,res,next) => {
  comment.getComment(req.body.comment_id).then( (comment) => {
    if ( comment ) {
      req.comment = comment;
      next();
    }else{
      res.status(400).json( { success: false, error: 'Comment not found by ID' } );
    }
  });
});
router.delete('/', (req,res,next) => {
  if ( req.COMMENT_DELETE || req.user_id == req.comment.commentUserLID ) {
    next();
  }else{
    res.status(400).json( { success: false, error: 'Unauthorized request. You can only delete own comments.' } );
  }
});
router.delete('/', (req,res,next) => {
  comment.deleteComment(req.body.comment_id).then((deleteCommentSuccess) => {
    if ( deleteCommentSuccess ) {
      res.status(200).json( { success: true } );
    }else{
      res.status(400).json( { success: false, error: 'Trying to delete, but database query failed.' } );
    }
  });
});

module.exports = router;