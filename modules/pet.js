'use strict';

const db = require('../modules/db');

const removePetLinkingsForPost = (postID) => {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM linkingsPetToPost WHERE lptpPostLID=?", [postID], (e,r,f) => {
            if ( e == null ){
                resolve(true);
            }else{
                resolve(false);
            }
        });
    });
};


module.exports = { removePetLinkingsForPost };