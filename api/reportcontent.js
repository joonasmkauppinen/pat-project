const express = require('express');
const router = express.Router();
const db = require('../modules/db');
const auth = require('../modules/auth');
const global = require('../modules/global');
const post = require('../modules/post');
const report = require('../modules/report');

/**
 * @api {post} /reportcontent/ Report Post by ID
 * @apiName reportbypostid
 * @apiVersion 1.0.0
 * @apiGroup ReportContent
 *
 * @apiParam {Integer} session_id Session ID
 * @apiParam {String} session_token Session Token
 * @apiParam {Integer} post_id Post ID
 * @apiParam {Integer} report_type Report Type ID
 * @apiParam {String{..255}} report_description Report Description
 * 
 * @apiPermission LOGGED_IN
 * 
 * @apiSuccess {Boolean} success (true) API Call succeeded
 * 
 * @apiError {Boolean} success (false) API Call failed
 * @apiError {String} error Error description
 */
router.post('/', (req,res,next) => {
  /* Check Session */
  auth(req).then( (r) => {
    if ( !r.session ) {
      res.status(200).json( { success: false, error: 'You are not logged in.' } );
    }else{
      next();
    }
  });
});
/* Check are required parameters provided */
router.post('/', (req,res,next) => {
  // Check required parameters
  if ( global.issetIsNumeric(req.body.post_id) && global.issetIsNumeric(req.body.report_type) && global.issetVar(req.body.report_description) ) {
    next();
  }else{
    res.status(200).json( { success: false, error: 'Required variables are not set - or values are in invalid format.' } );
  }
});
/* Check does the Post Exists */
router.post('/', (req,res,next) => {
  post.postExists(req.body.post_id).then( (postExists) => {
    if ( postExists ) {
      next();
    }else{
      res.status(200).json( { success: false, error: 'Post does not exists.' } );
    }
  });
});
/* Check does the Content Report Type Exists */
router.post('/', (req,res,next) => {
    report.reportTypeExists(req.body.report_type).then( (reportTypeExists) => {
      if ( reportTypeExists ) {
        next();
      }else{
        res.status(200).json( { success: false, error: 'Report Type does not exists.' } );
      }
    });
  });
router.post('/', (req,res,next) => {
  // TODO
  res.status(200).json( { success: true, error: 'suggesshh!' } );
  });  

/**
 * @api {get} /reportcontent/types Get Content Report Types #_INPROGRESS_#
 * @apiName types
 * @apiVersion 1.0.0
 * @apiGroup ReportContent
 *
 * @apiPermission all
 * 
 * @apiSuccess {Boolean} success (true) API Call succeeded
 * @apiSuccess {Object[]} report_types Array of Objects containing ID's and Names of different Report Types
 * 
 * @apiError {Boolean} success (false) API Call failed
 * @apiError {String} error Error description
 */
router.get('/types', (req,res,next) => {
  db.query("SELECT crtID, crt FROM contentReportTypes ORDER BY crt ASC ", (e,r,f) => {
    if ( e ) {
      res.status(200).json( { success: false, error: 'Database query failed.' } );
    }else{
      let reportTypes = [];
      if ( r.length > 0 ) {
        for ( let i=0; i<r.length; i++ ) {
          reportTypes.push( { id: r[i].crtID, type: r[i].crt } );
        }
      }
      res.status(200).json( { success: true, report_types : reportTypes } );
    }
  });
});

module.exports = router;