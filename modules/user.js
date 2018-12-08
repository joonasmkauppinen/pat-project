'use strict';

const db = require('../modules/db');

/* Check if the username meets the username criteria */
const isUsernameAcceptable = (userName) => {
    const regex = /^[a-zA-Z0-9-_]+$/;
    if(regex.test(userName)){
        if ( userName.length > 16) {
            return 'Username is too long. Max 16 characters!';
          }else if ( userName.length < 2 ) {
            return 'Username is too short. Min 2 characters!';
          }else if (userName == ''){
            return 'Username cannot be empty.';
          }else{
            return 'yes';
          }
      }else{
        return 'Username contains illegal characters. Only a-z, A-Z, 0-9 and marks - and _ allowed (no spaces)!';
      }
    }
  
  /* Check if the email meets the email criteria */
  const isEmailAcceptable = (email) => {
    const regex = /^(([^<>()[\]\\.,'";:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(regex.test(email)){
      return 'yes';
    }else{
      return 'Email address is invalid.';
    }
  };
  
  /* Check if the password meets the password criteria */
  const isPasswordAcceptable = (password) => {
    if ( password.length < 6 ) {
      return 'Password is too short. Should be at least 6 characters.';
    }else{
      return 'yes';
    }
  };
  
  /* Check if the username is available (not exists in Database) */
  const isUsernameAvailable = async (userName) => {
    return new Promise((resolve,reject) => {
      db.query("SELECT count(userID) AS `userCount` FROM users WHERE LOWER(userName)=?", userName.toLowerCase(), (e,r,f) => {
        if ( e != null ) {
            resolve(false);
          }else{
            if ( r[0].userCount != '0' ) {          
              resolve(false);
            }else{
              resolve(true);
            }
          }
        });
    });
  };
  
  /* Check if the email is available (not exists in Database) */
  const isEmailAvailable = async (emailAddress) => {
    return new Promise((resolve,reject) => {
      db.query("SELECT count(userID) AS `userCount` FROM users WHERE LOWER(userEmail)=?", emailAddress.trim().toLowerCase(), (e,r,f) => {
        if ( e != null ) {
            resolve(false);
          }else{
            if ( r[0].userCount != '0' ) {        
              resolve(false);
            }else{
              resolve(true);
            }
          }
        });
    });
  };

const userExists = (userID) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT COUNT(userID) AS userCount FROM users WHERE userID=? LIMIT 1", [userID], (e,r,f) => {
            if ( e == null ){
                if ( r[0].userCount == 1 ) {
                    resolve(true);
                }else{
                    resolve(false);
                }
            }else{
                resolve(false);
            }
        });        
    });
};

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



module.exports = { getUser, getAllPostIDsByUser, getAllPetIDsByUser, userExists, isEmailAcceptable, isEmailAvailable, isPasswordAcceptable, isUsernameAcceptable, isUsernameAvailable };