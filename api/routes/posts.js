const express = require('express');
const router = express.Router();
const db = require('../../db');


function unixTimeAsDate(unix_timestamp) {
  const date = new Date(unix_timestamp*1000);
  const hours = "0" + date.getHours();
  const  minutes = "0" + date.getMinutes();
  const  seconds = "0" + date.getSeconds();
  return formattedTime = date.getDate() + "." + date.getMonth() + "." + date.getFullYear() + " " +  hours.substr(-2) + ':' + minutes.substr(-2) //+ ':' + seconds.substr(-2);
}

function timeAgo(ts) {

  var d=new Date();  // Gets the current time
  var nowTs = Math.floor(d.getTime()/1000); // getTime() returns milliseconds, and we need seconds, hence the Math.floor and division by 1000
  var seconds = nowTs-ts;

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



router.post('/', (req,res,next) => {
  // ** REQUIRE SESSION ! WITH SOME PARAMS
  let response = { success : 1 }
  db.query("SELECT postID FROM posts ORDER BY postAddTime DESC", (e,r,f) => {
    response.posts_count  = r.length;
    response.posts = [];
    r.forEach((i) => {
      response.posts.push ( i.postID );
    });
    res.status(200).json((response));
  });
});

router.post('/getcontent', (req,res,next) => {

  let response = { success : 1 };
  
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
  

  db.query("SELECT postID, postAddTime, postAddedBy, postMediaURI, post, postMediaType, users.userName FROM posts, users WHERE postAddedBy=users.userID AND ("+queryWhereParams+")", (e,r,f) => {
    let response = { success: 0 };
    if ( e == null) {
      response.posts_count  = r.length;
      response.post_data = {}
      r.forEach((i) => {
        const dataItem = { added : unixTimeAsDate(i.postAddTime) , added_ago : timeAgo(i.postAddTime), addedby_user : i.userName, 'url' : i.postMediaURI, 'media_type' : i.postMediaType, 'post' : i.post }
        response.post_data[i.postID] = ( dataItem );
      });
      response.success = 1;
    }
    res.status(200).json((response));
  });
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