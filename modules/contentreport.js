'use strict';

const db = require('../modules/db');

const removeAllContentReportsForPost = (postID) => {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM contentReports WHERE crPostLID=?", [postID], (e,r,f) => {
            if ( e == null ){
                resolve(true);
            }else{
                resolve(false);
            }
        });
    });
};


module.exports = { removeAllContentReportsForPost };