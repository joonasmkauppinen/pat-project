'use strict';

const db = require('../modules/db');

const getUser = (userID) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM users WHERE userID=? LIMIT 1", [userID], (e,r,f) => {
            if ( e == null ){
                resolve(r[0]);
            }else{
                resolve(null);
            }
        });        
    });
};

const getAllPostIDsByUser = (userID) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT postID, postMediaType, postMediaURI FROM posts WHERE postAddedBy=?", [userID], (e,r,f) => {
            if ( e == null ){
                if ( r.length == 0 ) {
                    resolve ( [] );
                }else{
                    const returnArray = [];
                    for (let i=0; i<r.length; i++){
                        returnArray.push( {id: r[i].postID, type: r[i].postMediaType, uri: r[i].postMediaURI} );
                    }
                    resolve ( returnArray );
                }
            }else{
                resolve(null);
            }
        });        
    });
};

const getAllPetIDsByUser = (userID) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT petID FROM pets WHERE petOwnerLID=?", [userID], (e,r,f) => {
            if ( e == null ){
                if ( r.length == 0 ) {
                    resolve ( [] );
                }else{
                    const returnArray = [];
                    for (let i=0; i<r.length; i++){
                        returnArray.push(r[i].petID);
                    }
                    resolve ( returnArray );
                }
            }else{
                resolve(null);
            }
        });        
    });
};



module.exports = { getUser, getAllPostIDsByUser, getAllPetIDsByUser };