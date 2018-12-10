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
const follow = require('../modules/follow');
const user = require('../modules/user');
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);



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
  req.queryParameters = [];
  req.queryWhere = '';
  req.queryJoins = '';
  req.queryFromExt = '';
  auth(req).then( (authData) => {
    if ( authData.session ) {
      req.authData = authData;
    }
  next();
  });
});
router.post('/', (req,res,next) => {
  let errorHappened = 0;
  if ( global.issetVar(req.body.filter_string) ) {
    req.filter_string = req.body.filter_string;
  }
  if ( global.issetVar(req.body.filter_by) ) {
    if ( req.authData) {
      switch ( req.body.filter_by.toLowerCase() ) {
        case '':
          req.filter_by = 'home';
          break;
        case 'home':
        case 'landing':
          req.filter_by = req.body.filter_by.toLowerCase();
          break;
        case 'tag':
        case 'tagsearch':
        case 'user':
          if ( !req.filter_string ) {
            errorHappened = 1;
            res.status(400).json( { success:false, error: 'If you use filtering type tag, tagsearch or user filter_string is required!' } );
            }else{
              req.filter_by = req.body.filter_by.toLowerCase();
            }
          break;
      }
    }else{
      req.filter_by = '';
    }
  }else{
    if ( req.authData ) {
      req.filter_by = 'home';
    }else{
      req.filter_by = '';
    }
  }
  if ( !errorHappened ) next();
});
router.post('/', (req,res,next) => {
  if ( req.authData ) {
    // enable other filtering methods here...
      switch ( req.filter_by.toLowerCase() ) {
        case 'home':
        // Shows logged-in users following users posts
        follow.getFollowingArrayByUserID(req.authData.user_id).then( (following) => {
          req.queryWhere = ` WHERE (postAddedBy=${req.authData.user_id}`;
          for ( let i=0; i<following.length; i++ ){
            req.queryWhere += ' OR postAddedBy='+parseInt(following[i]);
          }
          req.queryWhere += ')';
          next();
        });
        break;
        case 'user':
        // Shows one user's posts
        if ( global.isNumeric(req.filter_string) ) {
          req.queryWhere = ' WHERE (postAddedBy=?)';
          req.queryParameters = [ req.filter_string ];
          next();
        }else{
          res.status(200).json( {success: false, error: 'When searching for user, filter_by should be set and numeric!' } );
        }
        break;        
      case 'tag':
        tag.getTagID(req.filter_string).then(tagID => {
          if ( tagID ) {
            req.queryFromExt = ', linkingsTagToPost';
            req.queryWhere = 'WHERE lttpPostLID=postID AND lttpTagLID=?';
            req.queryParameters = [ tagID ];
            next();
          }else{
            res.status(200).json( {success: true, posts_count: 0, posts_data: {}, warning: 'Tag not exists.' } );
          }
        });
        break;
      case 'tagsearch':
        tag.searchForTagIDs( req.filter_string ).then(tagIDs => {
          if ( tagIDs.length > 0 ) {
            req.queryFromExt = ', linkingsTagToPost';
            req.queryWhere = 'WHERE lttpPostLID=postID AND (';
            for ( let i=0; i<tagIDs.length; i++ ) {
              req.queryWhere += `${(i!=0?' OR ':'')}lttpTagLID=?`;
              req.queryParameters.push(tagIDs[i]);
            }
            req.queryWhere += ')';
            next();
          }else{
            res.status(200).json( {success: true, posts_count: 0, posts_data: {}, warning: 'No tags found.' } );
          }
        });
        break;
      case '':
      case 'landing':
        next();
        break;
      default:
        res.status(400).json( { success:false, error: 'Unsupported filtering type provided: ' + req.body.filter_by } );
    }
  }else{
    req.filter_by = '';
    next();    
  }
});
router.post('/', (req,res,next) => {
  let response = { success : 1 }
  db.query(`SELECT postID FROM posts${req.queryFromExt} ${req.queryJoins} ${req.queryWhere} ORDER BY postAddTime DESC`, req.queryParameters, (e,r,f) => {
    if ( e ) {
      console.log(e);
      res.status(400).json( {success: false, error: 'Database query failed.'} );
    }else{
      response.filter_by = req.filter_by;
      response.posts_count  = r.length;
      response.posts = [];
      r.forEach((i) => {
        response.posts.push ( i.postID );
      });
      res.status(200).json((response));
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
  auth(req).then((isAuth) => {
    if( isAuth.session ) {
      req.auth = isAuth;
    }
    next();
  });
});
router.post('/getcontent', (req,res,next) => {
  if ( global.issetVar(req.body.items) ) {
    next();
  }else{
    res.status(400).json( { success:false, error: 'Parameter items is required.' } );
  }
});
router.post('/getcontent', (req,res,next) => {
  let response = { success : false };    
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
  db.query(`SELECT postID, postAddTime, postAddedBy, postMediaURI, post, postColor, 
            postMediaType, users.userName, users.userID, ${(req.auth ? 'rating,' : '')} 
              ( SELECT COUNT(commentID) FROM comments WHERE commentPostLID=postID ) AS commentCount,
              ( SELECT GROUP_CONCAT(pet SEPARATOR '|') as pets 
                FROM linkingsPetToPost, pets
                WHERE lptpPostLID=postID AND pets.petID=linkingsPetToPost.lptpPetLID) AS pets,
              ( SELECT AVG(rating) FROM ratings WHERE ratingPostLID=postID ) AS averageRating,
            GROUP_CONCAT(tag SEPARATOR ' ') AS linkedTags
            FROM posts
            LEFT JOIN linkingsTagToPost ON linkingsTagToPost.lttpPostLID=postID
            LEFT JOIN tags ON linkingsTagToPost.lttpTagLID=tagID
            LEFT JOIN users ON posts.postAddedBy=users.userID
            ${(req.auth ? `LEFT JOIN ratings ON ratings.ratingPostLID=postID AND ratingByUserLID=${req.auth.user_id}` : '')}
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
                url : (fs.existsSync('public/img/' + i.postID + '_' + i.postMediaURI) ? 'img/' + i.postID + '_' + i.postMediaURI : null), 
                thumbnail : (fs.existsSync('public/img/thumb/' + i.postID + '_' + i.postMediaURI + (i.postMediaType == 'v' ? '.png' : '')) ? 'img/thumb/' + i.postID + '_' + i.postMediaURI + (i.postMediaType == 'v' ? '.png' : '') : null), 
                media_type : i.postMediaType, 
                mime: i.postMimeType, 
                post : i.post, 
                color : i.postColor,
                user_pic : ( fs.existsSync('public/img/usr/' + i.userID + '.png') ? 'img/usr/' + i.userID + '.png' : null ),
                tags : ( i.linkedTags == null || i.linkedTags == '' ? [] : i.linkedTags.split( ' ' ) ), 
                pets : ( i.pets == null || i.pets == '' ? [] : i.pets.split( '|' ) ),
                my_rate: ( i.rating ? i.rating : 0),
                avg_rating: (i.averageRating ? Math.round(i.averageRating) : 0),
                comments : i.commentCount }
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
 * @api {delete} /posts/ Delete Post by ID
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
router.delete('/', (req,res,next) => {
  if (global.issetIsNumeric(req.body.postID)) {
    const postID = parseInt(req.body.postID);
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
 * @api {patch} /posts/ Update Post
 * @apiName update-posts
 * @apiVersion 1.0.0
 * @apiGroup Posts
 *
 * @apiParam {Integer} session_id Session ID.
 * @apiParam {String} session_token Session Token.
 * @apiParam {Integer} post_id Post ID to be deleted.
 * 
 * @apiParam {String} [description] Post description
 * @apiParam {String} [tags] Tags separated by space
 * @apiParam {String} [pets] Pet ID's separated by space
 * 
 * @apiSuccess {Boolean} success (true) API Call succeeded, post is updated successfully.
 * 
 * @apiError {Boolean} success (false) API Call failed.
 * @apiError {String} error Error description.
 * 
 * @apiPermission POST_EDIT, (or owner of the post)
 */
router.patch('/', (req,res,next) => {
  if ( global.issetIsNumeric(req.body.post_id) ) {
    next();
  }else{
    res.status(400).json( { success:false, error: 'Parameter post_id (numeric) is required.' } );
  }
});
router.patch('/', (req,res,next) => {
  auth(req).then((r) => {
    if ( r.session ) {
      req.user_id = r.user_id;
      if ( r.permission.inArray('POST_UPDATE') != -1 ) {
        req.POST_UPDATE = 1;
      }
      next();
    }else{
      res.status(400).json( { success:false, error: 'You are not logged in / no session.' } );
    }
  });
});
router.patch('/', (req,res,next) => {
  if ( global.issetVar ( req.body.description ) ) {
    req.description = req.body.description;
  }
  if ( global.issetVar ( req.body.tags ) ) {
    req.tags = req.body.tags;
  }
  if ( global.issetVar ( req.body.pets ) ) {
    req.pets = req.body.pets;
  }
  next();
});
router.patch('/', (req,res,next) => {
  //todo continue..
});
router.patch('/', (req,res,next) => {
  res.status(400).json( { success:false, error: 'TODO' } );
});

/**
 * @api {post} /posts/upload Upload new Post
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
 * @apiParam {String} [pets] Pet ID's separated by space
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
  if ( req.file ) {
    // Define Supported Mime Types for Uploads:
    const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 
    'video/x-m4v', 'video/mpeg', 'video/mp4', 'video/ogg', 'video/webm', 'video/quicktime'];

    // Check, is the MimeType supported, otherwise throw an error
    if ( supportedMimeTypes.indexOf(req.file.mimetype) != -1 ) {
      // Export file extension from FileName
      const fileExtension = req.file.originalname.split('.').pop();
      req.file_extension = fileExtension;
      req.mimetype = req.file.mimetype;
      req.mediatype = req.file.mimetype.substring(0,1); // Mediatype: i = image, v = video
      console.log(`---  INFO   --- [Upload file mimetype: ${req.mimetype}}`);
      next();
    }else{
      res.status(400).json( { success: false, error: 'The File MimeType of the Uploaded File is not supported.' } );
    }
  }else{
    res.status(400).json( { success: false, error: 'Media upload failed.' } );
  }
});
router.post('/upload', (req,res,next) => {
    let postDescription = '';
    if ( typeof req.body.description != 'undefined' ) {
      postDescription = req.body.description;
      if ( postDescription.length > parseInt(process.env.POST_UPLOAD_DESCRIPTION_MAX_LENGTH) ) {
          req.upload_error = true;
          req.upload_error_description = 'Description is too long. Maximum length allowed is ' + process.env.POST_UPLOAD_DESCRIPTION_MAX_LENGTH + ' characters.';
      }else{
        req.description = postDescription;
      }
    }else{
      req.description = '';
    }
  next();
});
router.post('/upload', (req,res,next) => {
  if ( !req.upload_error && req.mediatype == 'i' ) {
    createthumbnail.createThumb(req.file.path, 800, './public/img/' + req.file.filename + '_orig', next);
  }else{
    next();
  }
});
router.post('/upload', (req,res,next) => {
  if ( !req.upload_error && req.mediatype == 'i' ) {
    createthumbnail.createThumb(req.file.path, 200, './public/img/thumb/' + req.file.filename, next);
  }else{
    next();
  }
});
router.post('/upload', (req,res,next) => {
  if ( !req.upload_error ) {
    if ( req.mediatype == 'i' ) {
      createthumbnail.createOnePixel(req.file.path, './public/img/1px/' + req.file.filename + '.' + req.file_extension, next);
    }else{
      // video thumb
      next();
    }
  }else{
    next();
  }
});
router.post('/upload', (req,res,next) => {
  if ( !req.upload_error ) {
    jimp.read( './public/img/1px/' + req.file.filename + '.' + req.file_extension, (err, image) => {
      if ( !err ) {
        const pixelColour = parseInt(image.getPixelColor(0,0));
        req.hexColour = (pixelColour.toString(16).substring(0,6));
        // Remove temporary 1x1 image file for colour
        fs.unlink('./public/img/1px/' + req.file.filename + '.' + req.file_extension, (e) => {
          if ( e ) console.log('--- WARNING --- Deleting 1px file failed!');
          next();
        });
      }else{
        console.log(`---  INFO   --- [Cannot read 1x1 Image Background Color, will be using default.]`);
        req.hexColour = '222222';
        next();
      }
    });
  }else{
    next();
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
                tag.addTagsToPost(req.tags,r.insertId).then((r)=>{
                  
                });                
              }
            }else{
              console.log('ERROR.');
              console.log(e);
              req.upload_error = true;
              req.upload_error_description = 'Database query error.';
            }
        next();
        });      
      }else{
        req.upload_error = true;
        req.upload_error_description = 'You are not logged in.';
        next();
      }
    });
  }else{
    next();
  }
});
router.post('/upload', (req,res,next) => {
  if ( !req.upload_error ) {
    if ( req.mediatype == 'i' ) {
      fs.rename('./public/img/' + req.file.filename + '_orig', './public/img/' + req.addID + '_' + req.mediaURI, (e) => {
          fs.rename('./public/img/thumb/' + req.file.filename, './public/img/thumb/' + req.addID + '_' + req.mediaURI, (e) => {
            //fs.unlinkSync('./public/img/' + req.file.filename);
            next();
          });
      });
    }else{
    const proc = ffmpeg(req.file.path)
    .takeScreenshots({count: 1, size: '300x300', filename: req.addID + '_' + req.mediaURI + '.png'},'./public/img/thumb/');
    next();
    }
  }else{
    console.log('errors');
    next();
  }
});
router.post('/upload', (req,res,next) => {
  // handle final response to the user
  if ( req.upload_error ) {
    res.status(400).json( { success: false, error: req.upload_error_description } );
    console.log(`--- WARNING --- [Media upload FAILED: ${req.upload_error_description}]`);
  }else{
    console.log('--- SUCCESS --- [Media upload succeeded!]');
    res.status(200).json( { success: true } );
  }
});

module.exports = router;