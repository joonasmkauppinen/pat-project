'use strict';

const db = require('../modules/db');

const reportTypeExists = (id) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT COUNT(crtID) AS crtCount FROM contentReportTypes WHERE crtID=? LIMIT 1", id, (e,r,f) => {
          if ( e ) {
            resolve(false);
          }else{
            if ( r[0].crtCount == 1 ) {
              resolve(true);
            }else{
              resolve(false);
            }
          }
        });
      });
};

module.exports = { reportTypeExists };