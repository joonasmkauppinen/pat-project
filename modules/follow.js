'use strict';

const db = require('../modules/db');

const getFollowingArrayByUserID = (userID) => {
    return new Promise((resolve, reject) => {
        db.query(`SELECT lfuFollowingUserLID FROM linkingsFollowingUser WHERE lfuFollowerUserLID=?`, [userID], (e,r,f) => {
            if ( !e ) {
                if ( r.length > 0 ) {
                    let responseArray = [];
                    for ( let i=0; i<r.length; i++ ) {
                        responseArray.push(r[i].lfuFollowingUserLID);
                    }
                    resolve ( responseArray );
                }else{
                    resolve( [] );
                }
            }else{
                resolve( [] );
            }
        });        
    });
};


module.exports = { getFollowingArrayByUserID };