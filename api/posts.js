const express = require('express');
const router = express.Router();
const db = require('../modules/db');
const auth = require('../modules/auth');
const formatTime = require('../modules/time-formatting');

/**
 * @api {post} /posts/ Get Array of Post IDs with Custom filtering
 * @apiName posts
 * @apiVersion 1.0.0
 * @apiGroup Posts
 * 
 * @apiDescription Please note that only Filtering option witouth session is "Landing".
 *
 * @apiParam {Integer} [session_id] Session ID
 * @apiParam {String} [session_token] Session Token
 * @apiParam {String="Home", "Landing", "Tag", "TagSearch", "User"} [filter_by] Search filter. With no Session "Landing" will be used.
 * @apiParam {String} [filter_string] Tag name / Tag search string / UserName
 * 
 * @apiPermission LOGGED_IN
 * 
 * @apiSuccess {Boolean} success (true) API Call succeeded
 * @apiSuccess {Array} post_data Array of Post item objects, array key defined by Post ID
 * 
 * @apiError {Boolean} success (false) API Call failed
 * @apiError {String} error Error description
 */
router.post('/', (req,res,next) => {
  auth(req).then( (r) => {
    if ( r.session ) {
      let response = { success : 1 }
      db.query("SELECT postID FROM posts ORDER BY postAddTime DESC", (e,r,f) => {
        response.posts_count  = r.length;
        response.posts = [];
        r.forEach((i) => {
          response.posts.push ( i.postID );
        });
        res.status(200).json((response));
      });
    }else{
      res.status(400).json( { success: 0, error: 'No valid session.' } );
    }
  });
});

/**
 * @api {post} /posts/getcontent Get Content of Posts by ID as an Object
 * @apiName getcontent
 * @apiVersion 1.0.0
 * @apiGroup Posts
 *
 * @apiParam {Integer} session_id Session ID.
 * @apiParam {String} session_token Session Token
 * @apiParam {String} items Post IDs, separated with -
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded.
 * @apiSuccess {Array} post_data Array of Post item objects, array key defined by Post ID
 * 
 * @apiError {Boolean} success (false) API Call failed
 * @apiError {String} error Error description
 * 
 * @apiPermission LOGGED_IN
 */
router.post('/getcontent', (req,res,next) => {
  let response = { success : false };  
  console.log(req.body);
  const items = req.body.items.split("-");
  let queryWhereParams = '';
  if ( items.length > 0 ) {
    for (i=0; i<items.length; i++){
      if ( !isNaN(parseFloat(items[i])) && isFinite(items[i]) ) {
        if ( queryWhereParams != '' ) queryWhereParams += ' OR ';
        queryWhereParams += 'postID='+items[i];
        }
      }
    }
  db.query("SELECT postID, postAddTime, postAddedBy, postMediaURI, post, postMediaType, users.userName, users.userID FROM posts, users WHERE postAddedBy=users.userID AND ("+queryWhereParams+")", (e,r,f) => {
    if ( e == null) {
      response.posts_count  = r.length;
      response.post_data = {}
      r.forEach((i) => {
        const dataItem = { added : formatTime.unixTimeAsDate(i.postAddTime) , added_ago : formatTime.timeAgo(i.postAddTime), addedby_user : i.userName
          , url : 'img/' + i.postMediaURI, media_type : i.postMediaType, post : i.post, user_pic : 'img/usr/' + i.userID + '.png'
          , tags : ['Demo', 'Please', 'DoThis'], 'pets' : ['DemoPet1', 'Pet2'], my_rate: ''
          , comments : 5
          , latest_comment : { sender : 'samuli_v', added_ago: '999 mins ago', comment: 'bla bla bla this is a big bla bla bla and you may consider shortening this in frontend, right? bla bla bla bla bla long enough? bla bla bla bla' } }
        response.post_data[i.postID] = ( dataItem );
      });
      response.success = true;
    }else{
      response.error = 'Database query failed.';
    }
    res.status(200).json((response));
  });
});


/**
 * @api {delete} /posts/delete Delete post by Post ID #_IN_PROGRESS_#
 * @apiName delete
 * @apiVersion 1.0.0
 * @apiGroup Posts
 *
 * @apiParam {Integer} session_id Session ID.
 * @apiParam {String} session_token Session Token.
 * @apiParam {Integer} post_id Post ID to be deleted.
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded, post deleted.
 * 
 * @apiError {Boolean} success (false) API Call failed.
 * @apiError {String} error Error description.
 * 
 * @apiPermission POST_DELETE, (or owner of the post)
 */
router.delete('/posts/delete', (req,res,next) => {
  res.status(200).json( {do: 'this'} );
});


router.post('/', (req,res,next) => {
  res.status(200).json({
    message: 'Handling POST requests to /users'
  });
});


/**
 * @api {post} /posts/upload Upload new Post #_IN_PROGRESS_#
 * @apiName upload
 * @apiVersion 1.0.0
 * @apiGroup Posts
 *
 * @apiParam {Integer} session_id Session ID.
 * @apiParam {String} session_token Session Token.
 * 
 * @apiParam {File} upload_file A file to upload
 * @apiParam {String} post Text of the post
 * @apiParam {String} [tags] Tags separated by space (max 5).
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded, a new post is uploaded
 * 
 * @apiError {Boolean} success (false) API Call failed.
 * @apiError {String} error Error description.
 * 
 * @apiPermission POST_UPLOAD
 */
router.post('/posts/upload', (req,res,next) => {
  res.status(200).json( {do: 'this'} );
});


router.post('/', (req,res,next) => {
  res.status(200).json({
    message: 'Handling POST requests to /users'
  });
});


module.exports = router;