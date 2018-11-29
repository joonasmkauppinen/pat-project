const express = require('express');
const router = express.Router();
const db = require('../modules/db');
const auth = require('../modules/auth');

/**
 * @api {get} /tags/ xxx
 * @apiName xxx
 * @apiGroup Tags
 *
 * @apiParam {Integer} session_id Session ID.
 * @apiParam {String} session_token Session Token.
 *
 * @apiSuccess {Boolean} success (true) API Call succeeded.
 * @apiSuccess {Array} permissions List of user's permissions as an array.
 * 
 * @apiPermission LOGGED_IN
 */
router.get('/', (req,res,next) => {
  auth(req).then( (r) => {
      if ( r.success ) {
          res.status(200).json( { success: true, tags: 'exportTagsHere-ThisIsATest' } );
        }else{
          res.status(200).json( { success: false, value: r.error } );
        }
  });
});

module.exports = router;