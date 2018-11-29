const express = require('express');
const router = express.Router();
const db = require('../modules/db');
const auth = require('../modules/auth');

const unixTimeAsDate = (unix_timestamp) => {
  const date = new Date(unix_timestamp*1000);
  const hours = "0" + date.getHours();
  const  minutes = "0" + date.getMinutes();
  const  seconds = "0" + date.getSeconds();
  return formattedTime = date.getDate() + "." + date.getMonth() + "." + date.getFullYear() + " " +  hours.substr(-2) + ':' + minutes.substr(-2) //+ ':' + seconds.substr(-2);
}

const timeAgo = (ts) => {

  let d=new Date();  // Gets the current time
  let nowTs = Math.floor(d.getTime()/1000); // getTime() returns milliseconds, and we need seconds, hence the Math.floor and division by 1000
  let seconds = nowTs-ts;

  if (seconds > 31104000) {
    return Math.floor(seconds/31104000) + " years ago";
    }
  if (seconds > 2592000) {
    return Math.floor(seconds/2592000) + " months ago";
    }
  if (seconds > 86400) {
    return Math.floor(seconds/86400) + " days ago";
    }
  if (seconds > 3600 ) {
    return Math.floor(seconds/3600) + " hours ago";
    }
  if (seconds > 60) {
     return Math.floor(seconds/60) + " minutes ago";
    }
  if (seconds > 1) {
    return Math.floor(seconds) + " seconds ago";
    }
}

/**
 * @api {post} /posts/ Get Array of Post IDs with Custom filtering.
 * @apiName Get Post IDs Array [IN PROGRESS]
 * @apiGroup Posts
 *
 * @apiParam {Integer} session_id Session ID.
 * @apiParam {String} session_token Session Token.
 * @apiParam {String} filter_by (optional) ['Home', 'Animal', 'Tag', 'User' ]
 * @apiParam {String} filter_by (optional) ['Home', 'Animal', 'Tag', 'User' ]
 * 
 * @apiPermission LOGGED_IN
 * 
 * @apiSuccess {Boolean} success (true) API Call succeeded.
 * @apiSuccess {Array} post_data Array of Post item objects, array key defined by Post ID
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
 * @apiGroup Posts
 *
 * @apiParam {Integer} session_id Session ID.
 * @apiParam {String} session_token Session Token.
 * @apiParam {String} items Post IDs, separated with -
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded.
 * @apiSuccess {Array} post_data Array of Post item objects, array key defined by Post ID
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
        const dataItem = { added : unixTimeAsDate(i.postAddTime) , added_ago : timeAgo(i.postAddTime), addedby_user : i.userName
          , 'url' : 'img/' + i.postMediaURI, 'media_type' : i.postMediaType, 'post' : i.post, 'user_pic' : 'img/usr/' + i.userID + '.png'
          , 'tags' : ['Demo', 'Please', 'DoThis'], 'pets' : ['DemoPet1', 'Pet2'] }
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
 * @api {delete} /posts/delete Delete post by Post ID
 * @apiName Delete Post
 * @apiGroup Posts
 *
 * @apiParam {Integer} session_id Session ID.
 * @apiParam {String} session_token Session Token.
 * @apiParam {Integer} post_id Post ID to be deleted.
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded, post deleted.
 * 
 * @apiPermission POST_DELETE
 */
router.delete('/posts/delete', (req,res,next) => {
  res.status(200).json( {do: 'this'} );
});


router.post('/', (req,res,next) => {
  res.status(200).json({
    message: 'Handling POST requests to /users'
  });
});



module.exports = router;