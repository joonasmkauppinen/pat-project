'use strict';

const db = require('../modules/db');

const deleteComment = (commentID) => {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM comments WHERE commentID=?", [commentID], (e,r,f) => {
            if ( e == null ){
                resolve(true);
            }else{
                resolve(false);
            }
        });        
    });
};

const getComment = (commentID) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM comments WHERE commentID=?", [commentID], (e,r,f) => {
            if ( e == null ){
                resolve(r[0]);
            }else{
                resolve(null);
            }
        });        
    });
};

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


module.exports = { removeAllCommentsByUser, removeAllCommentsForPost, getComment, deleteComment };