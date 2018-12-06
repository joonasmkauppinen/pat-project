'use strict';

const express = require('express');
const router = express.Router();
const db = require('../modules/db');
const auth = require('../modules/auth');
const tf = require('../modules/time-formatting');
const global = require('../modules/global');
const post = require('../modules/post');

/**
 * @api {post} /ratings/ Rate Post
 * @apiName ratings
 * @apiVersion 1.0.0
 * @apiGroup Ratings
 *
 * @apiParam {Integer} session_id Session ID
 * @apiParam {String} session_token Session Token
 * @apiParam {Integer} post_id Post ID
 * @apiParam {Integer{1..5}} rating Rating
 * 
 * @apiPermission LOGGED_IN
 * 
 * @apiSuccess {Boolean} success (true) API Call succeeded
 * 
 * @apiError {Boolean} success (false) API Call failed
 * @apiError {String} error Error description
 */
router.post('/', (req,res,next) => {
  if ( global.issetIsNumeric ( req.body.post_id ) && global.issetIsNumeric ( req.body.rating ) ) {
        if ( req.body.rating > 0 && req.body.rating < 6 ) {
            next();
        }else{
            res.status(400).json( { success: false, error: 'Rating must be integer from 1 to 5.' } );
        }
  }else{
    res.status(400).json( { success: false, error: 'Parameters post_id and rating are required and they must be numbers.' } );
  }
});
router.post('/', (req,res,next) => {
  auth(req).then( (r) => {
    if ( r.session ) {
      req.user_id = r.user_id;
      next();
    }else{
      res.status(400).json( { success: false, error: 'You are not logged in / no valid session.' } );
    }
  });
});
router.post('/', (req,res,next) => {
  post.postExists(req.body.post_id).then( (postExists) => {
    if ( postExists ) {
      next();
    }else{
      res.status(400).json( { success: false, error: 'Post does not exists.' } );
    }
  });
});
router.post('/', (req,res,next) => {
  db.query(`SELECT rateID, rating FROM ratings WHERE ratingPostLID=? AND ratingByUserLID=? LIMIT 1`, 
  [req.body.post_id, req.user_id] ,(e,r,f) => {
    if ( e ) {
      res.status(400).json( { success: false, error: 'Database query failed.' } );
    }else{
      if ( r.length == 1 ) {
        req.ext_rating_id     = r[0].rateID;
        req.ext_rating_value  = r[0].rating;
      }
      next();
    }
  });
});
router.post('/', (req,res,next) => {
    if ( req.ext_rating_id ) {
      if ( req.ext_rating_value != req.body.rating ) {
        // Rating for this post item is already done with different value, updating the value.
        db.query(`UPDATE ratings SET rating=? WHERE rateID=? LIMIT 1`, 
        [req.body.rating, req.ext_rating_id] ,(e,r,f) => {
          if ( e ) {
            res.status(400).json( { success: false, error: 'Database query failed (2).' } );
          }else{
            res.status(200).json( { success: true } );
          next();
          }
        });
      }else{
        // Rating for this post item is already done with the same value. No need to update.
        res.status(200).json( { success: true } );
      }
    }else{
      // No previous rating found in the database, have to add new one.
      db.query(`INSERT INTO ratings (ratingPostLID, ratingByUserLID, rating) VALUES (?, ?, ?)`, 
      [req.body.post_id, req.user_id, req.body.rating] ,(e,r,f) => {
        if ( e ) {
          res.status(400).json( { success: false, error: 'Database query failed (3).' } );
        }else{
          res.status(200).json( { success: true } );
        }
      });      
    }
  });
    
module.exports = router;