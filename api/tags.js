const express = require('express');
const router = express.Router();
const db = require('../modules/db');
const auth = require('../modules/auth');

/**
 * @api {post} /tags/ Get Tags #_IN_PROGRESS_#
 * @apiName tags
 * @apiVersion 1.0.0
 * @apiGroup Tags
 * @apiDescription Without search parameter this API call will response 20 most popular tags. With search parameter this API call will return search results.
 *
 * @apiParam {Integer} session_id Session ID
 * @apiParam {String} session_token Session Token
 * @apiParam {String} [search] Search Tags by Value
 * @apiParam {Integer{1-100}} [amount=20] Maximum amount of Tags
 * @apiParam {String="popularity","alphabetical"} [order_by="popularity"] Maximum amount of Tags
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded
 * @apiSuccess {String[]} tags List (Array) of Tags
 * 
 * @apiError {Boolean} success (false) API Call failed
 * @apiError {String} error Error description
 * 
 * @apiPermission LOGGED_IN
 */
router.post('/', (req,res,next) => {
  auth(req).then( (r) => {
      if ( r.session ) {
        let sqlLimit = 10;
        if ( typeof req.body.amount != 'undefined' && !isNaN(parseFloat(req.body.amount)) ) {
          if ( parseInt(req.body.amount) > 0 && parseInt(req.body.amount) < 101 ) {
            sqlLimit = parseInt(req.body.amount);
          }
        }
        let resultsOrderingType = 0;
        if ( typeof req.body.order_by != 'undefined' ) {
            if ( req.body.order_by == 'alphabetical' ) resultsOrderingType = 1;
        }
        // SELECT tag, COUNT(lttpID) FROM tags, linkingsTagToPost WHERE tagID=lttpTagLID GROUP BY tag
        db.query("SELECT tag, COUNT(lttpID) AS popularity FROM tags, linkingsTagToPost WHERE tagID=lttpTagLID GROUP BY tag "+( resultsOrderingType == 1 ? ' ORDER BY tag ASC' : ' ORDER BY popularity DESC' )+" LIMIT ?", sqlLimit, (e,r,f) => {
          if ( e == null) {
            if ( r.length > 0 ) {
              const arrayOfTags = [];
              for(let i=0;i<r.length;i++){
                arrayOfTags.push(r[i].tag);
              }
              res.status(200).json( { success: true, tags: arrayOfTags } );  
            }else{
              res.status(200).json( { success: true, tags: [] } );  
            }
          }else{
            res.status(200).json( { success: false, value: 'Database query failed.' } );  
          }
        });  
        }else{
          res.status(200).json( { success: false, value: r.error } );
        }
  });
});

module.exports = router;