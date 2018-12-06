const express = require('express');
const router = express.Router();
const db = require('../modules/db');
const auth = require('../modules/auth');
const formatTime = require('../modules/time-formatting');
const global = require('../modules/global');
const post = require('../modules/post');
const comment = require('../modules/comment');
const tag = require('../modules/tag');
const createthumbnail = require('../modules/createthumbnail');
const jimp = require('jimp');
const md5 = require('md5');

const fs = require('fs');
const multer = require('multer');
const upload = multer({dest: './public/img/'});

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
    
    let filteringMethod = 'landing';
    if ( r.session ) {
      // enable other filtering methods here...
      if ( typeof req.body.filter_by != 'undefined' ) {
        switch ( req.body.filter_by.toLowerCase() ) {
          case 'home':
            break;
          case 'tag':
            break;
          case 'tagsearch':
            break;
          case 'tagsearch':
            break;
          default:
            res.status(400).json( { success:false, error: 'Unsupported filtering type provided: ' + req.body.filter_by } );
        }
      }
    }

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
  db.query(`SELECT postID, postAddTime, postAddedBy, postMediaURI, post, postColor, postMediaType, users.userName, users.userID, GROUP_CONCAT(tag SEPARATOR ' ') AS linkedTags
            FROM posts
            LEFT JOIN linkingsTagToPost ON linkingsTagToPost.lttpPostLID=postID
            LEFT JOIN tags ON linkingsTagToPost.lttpTagLID=tagID
            LEFT JOIN users ON posts.postAddedBy=users.userID
            WHERE postAddedBy=users.userID AND (`+queryWhereParams+`)
            GROUP BY postID`,
  (e,r,f) => {
    if ( e == null) {
      response.posts_count  = r.length;
      response.post_data = {}
      r.forEach( (i) => {
          const dataItem = { 
                added : formatTime.unixTimeAsDate(i.postAddTime), 
                added_ago : formatTime.timeAgo(i.postAddTime), 
                addedby_user : i.userName, 
                url : 'img/' + i.postID + '_' + i.postMediaURI, 
                media_type : i.postMediaType, 
                mime: i.postMimeType, 
                post : i.post, 
                color : i.postColor,
                user_pic : 'img/usr/' + i.userID + '.png',
                tags : ( i.linkedTags == null || i.linkedTags == '' ? [] : i.linkedTags.split( ' ' ) ), 
                pets : ['DemoPet1', 'Pet2'],
                my_rate: '',
                comments : 5 }
          response.post_data[i.postID] = ( dataItem );      
      });
      response.success = true;
    }else{
      console.log(e);
      response.error = 'Database query failed.';
    }
    res.status(200).json((response));
  });
});

/**
 * @api {delete} /posts/delete Delete Post by ID
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
router.delete('/:postID', (req,res,next) => {
  if (global.issetIsNumeric(req.params.postID)) {
    const postID = parseInt(req.params.postID);
    auth(req).then( (auth_response) => {
      if ( auth_response.session ) {
          post.deletePost(postID, auth_response).then((deletePostResponse) => {
            if ( deletePostResponse == 'success' ) {
              res.status(200).json( { success: true } );
            }else{
              res.status(400).json( { success: false, error: deletePostResponse } );
            }
          });        
      }else{
        res.status(400).json( { success: false, error: 'You are not logged in. If not trying to delete own post, delete requires permission POST_DELETE' } );
      }
      });
  }else{
    res.status(400).json( { success: false, error: 'ID is not defined.' } );
  }
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
 * @apiParam {String} [description] Post description
 * @apiParam {String} [tags] Tags separated by space
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded, a new post is uploaded
 * 
 * @apiError {Boolean} success (false) API Call failed.
 * @apiError {String} error Error description.
 * 
 * @apiPermission POST_UPLOAD
 */
router.post('/upload', upload.single('upload_file'), (req,res,next) => {
  req.upload_error = false;
  req.upload_error_description = '';
  // First step : Upload the File to the Server

  // Define Supported Mime Types for Uploads:
  const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 
  'video/x-m4v', 'video/mpeg', 'video/mp4', 'video/ogg', 'video/webm', 'video/quicktime'];
  
  /* Preferred audio types if we want to use AUDIO uploading: 'audio/x-aac', 'audio/midi', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/webm', 'audio/x-wav' */

  // Check, is the MimeType supported, otherwise throw an error
  if ( supportedMimeTypes.indexOf(req.file.mimetype) != -1 ) {
    // Export file extension from FileName
    const fileExtension = req.file.originalname.split('.').pop();
    req.file_extension = fileExtension;
    req.mimetype = req.file.mimetype;
    req.mediatype = req.file.mimetype.substring(0,1); // Mediatype: i = image, v = video
  }else{
    req.upload_error = true;
    req.upload_error_description = 'The File MimeType of the Uploaded File is not supported.';
  }
next();
});
router.post('/upload', (req,res,next) => {
  if ( !req.upload_error ) {
    let postDescription = '';
    if ( typeof req.body.description != 'undefined' ) {
      postDescription = req.body.description;
      if ( postDescription.length > process.env.POST_UPLOAD_DESCRIPTION_MAX_LENGTH ) {
          req.upload_error = true;
          req.upload_error_description = 'Description is too long. Maximum length allowed is ' + process.env.POST_UPLOAD_DESCRIPTION_MAX_LENGTH + ' characters.';
      }else{
        req.description = postDescription;
      }
    }else{
      req.description = '';
    }
  }
next();
});
router.post('/upload', (req,res,next) => {
  if ( !req.upload_error ) {
    createthumbnail.createThumb(req.file.path, 2000, './public/img/' + req.file.filename + '_orig', next);
  }
});
router.post('/upload', (req,res,next) => {
  if ( !req.upload_error ) {
    createthumbnail.createThumb(req.file.path, 300, './public/img/thumb/' + req.file.filename, next);
  }
});
router.post('/upload', (req,res,next) => {
  if ( !req.upload_error ) {
    createthumbnail.createOnePixel(req.file.path, './public/img/1px/' + req.file.filename + '.' + req.file_extension, next);
  }
});
router.post('/upload', (req,res,next) => {
  if ( !req.upload_error ) {
    jimp.read( './public/img/1px/' + req.file.filename + '.' + req.file_extension, (err, image) => {
      if ( !err ) {
        const pixelColour = parseInt(image.getPixelColor(0,0));
        req.hexColour = (pixelColour.toString(16).substring(0,6));
        console.log('=)')
        console.log(req.hexColour)
        // Remove temporary 1x1 image file for colour
        fs.unlinkSync('./public/img/1px/' + req.file.filename + '.' + req.file_extension);
        next();
      }else{
        req.hexColour = '';
        next();
      }
    });
  }
});
router.post('/upload', (req,res,next) => {
  if ( !req.upload_error ) {
    if ( typeof req.body.tags != 'tags' ) {
      const tg = req.body.tags.split(' ');
      req.tags = [];
      if ( tg.length > 0 ) {
        for(let i=0;i<tg.length;i++){
          if ( tag.isAcceptableTag( tg[i]) ) {
            req.tags.push(tg[i]);
          }
        }
      }
    }
  }
  next();
});
router.post('/upload', (req,res,next) => {
  if ( !req.upload_error ) {
    auth(req).then((r) => {
      if ( r.session ) {
        const mediaURI = md5( formatTime.systemTimestamp() + req.file.path ) + '.' + req.file_extension;
        req.mediaURI = mediaURI;
        db.query("INSERT INTO `posts` (postAddTime, postAddedBy, postMediaType, postMimeType, postMediaURI, postColor, post) VALUES (?, ?, ?, ?, ?, ?, ?)", 
                [formatTime.systemTimestamp(), r.user_id, req.mediatype, req.mimetype, mediaURI, req.hexColour, req.description]
                , (e,r,f) => {
          if ( e == null ) {
              req.addID = r.insertId;
              // Add tags to the post
              if ( req.tags.length > 0 ) {
                console.log(req.tags);
                tag.addTagsToPost(req.tags,r.insertId).then((r)=>{
                  if ( r == true ) {
                    // SUCCESS !
                    next();
                  }else{
                    // WARNING, ERROR WHILE ADDING TAGS!
                    next();
                  }
                });
                }else{
                  // SUCCESS !
                  next();
                }
            }else{
              console.log('ERROR.');
              console.log(e);
              req.upload_error = true;
              req.upload_error_description = 'Database query error.';
              next();
            }
        });      
      }else{
        req.upload_error = true;
        req.upload_error_description = 'You are not logged in.';
        next();
      }
    });
  }
});
router.post('/upload', (req,res,next) => {
  if ( !req.upload_error ) {
    console.log('ADDID: ' + req.addID);
    fs.rename('./public/img/' + req.file.filename + '_orig', './public/img/' + req.addID + '_' + req.mediaURI, (e) => {
      fs.rename('./public/img/thumb/' + req.file.filename, './public/img/thumb/' + req.addID + '_' + req.mediaURI, (e) => {
        //fs.unlinkSync('./public/img/' + req.file.filename);
      });
    });
  }else{
    console.log('errors');
  }
  next();
});
router.post('/upload', (req,res,next) => {
  // handle final response to the user
  if ( req.upload_error ) {
    res.status(400).json( { success: false, error: req.upload_error_description } );
  }else{
    res.status(200).json( { success: true } );
  }
});

module.exports = router;