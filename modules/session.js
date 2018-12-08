'use strict';

const db = require('../modules/db');
const md7 = require('../modules/md7');
const timeFormatting = require('../modules/time-formatting');

const createSession = ( userID ) => {
  return new Promise((resolve,reject) => {
    const token = md7( Math.floor((Math.random() * 10000) + 1) + userID + Math.floor((Math.random() * 10000) + 1) + userID + timeFormatting.systemTimestamp() );
    db.query("INSERT INTO `sessions` SET sessionUserLID=?, sessionStartTime=?, sessionLastActive=?, sessionToken=?"
    , [userID, timeFormatting.systemTimestamp(), timeFormatting.systemTimestamp(), token]
    , (e,r,f) => {
      if ( e ) {
        resolve( null );
      }else{
        resolve( { session_id : r.insertId, token : token } )
      }
    });  
  });
};

const tryLogin = async ( username, password ) => {
  return new Promise((resolve,reject) => {
    db.query("SELECT userID FROM users WHERE `userName`=? AND `userPassword`=? LIMIT 1", [username, md7(password)], (e,r,f) => {
      if ( e ) {
        resolve( null );
      }else{
        if (r.length == 1 ) {
          createSession ( r[0].userID ).then ( (session) => {
            if ( session ) {
              resolve ( { success: true, session_id: session.session_id, token: session.token } );
            }else{
              resolve ( { success: false, error: 'Username or password is incorrect.' } );
            }
          });
        }else{
          resolve( null );
        }
      }
    });
  });
};

module.exports = { tryLogin };