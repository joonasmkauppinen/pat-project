'use strict';

const db = require('../modules/db');

const removeAllCommentsByUser = (userID) => {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM comments WHERE commentUserLID=?", [userID], (e,r,f) => {
            if ( e == null ){
                resolve(true);
            }else{
                resolve(false);
            }
        });
    });
};

const removeAllCommentsForPost = (postID) => {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM comments WHERE commentPostLID=?", [postID], (e,r,f) => {
            if ( e == null ){
                resolve(true);
            }else{
                resolve(false);
            }
        });
    });
};


module.exports = { removeAllCommentsByUser, removeAllCommentsForPost };