const db = require('./db');

/* Check session from the Database, and return all the permissions for the user. */
const getSession = async ( id, token ) => {
    // return true / false
    return new Promise((resolve, reject) => {
    db.query(`SELECT sessionUserLID, userGroupLID, upName 
    FROM sessions, users 
    LEFT JOIN linkingsPermissionToGroup ON linkingsPermissionToGroup.lptgGroupLID=users.userGroupLID
    LEFT JOIN userPermissions ON userPermissions.upID=linkingsPermissionToGroup.lptgPermissionLID
    WHERE sessions.sessionUserLID=users.userID AND sessionID=? AND sessionToken=?`, [id, token], (e,r,f) => {    
      if ( typeof r == 'undefined' || r.length < 1 ) {
        //return false;
        resolve( { session: false } );
      }else{
          const permissionsArray = []
          r.forEach( (i) => {
            permissionsArray.push(i.upName);
          });
          resolve( { session: true, user_id: r[0].sessionUserLID, permissions: permissionsArray} );
        }
      });
    });
  }

/* Checks is there valid Session Cookies provided in the REQuest */
const isSessionCookiesSet = (request) => {
  if ( typeof request.body.session_id == 'undefined' || typeof request.body.session_token == 'undefined' 
       || request.body.session_id == '' || request.body.session_token == ''
       || !(!isNaN(parseFloat(request.body.session_id)) && isFinite(request.body.session_id))
       || request.body.session_token.length != 64 ) {
    return false;
  }else{
    return true;
  }
};

/* ---------------------------------------------------------------------------------------------------------+
 |  auth                                                                                                    |
 +----------------------------------------------------------------------------------------------------------+ 
 |  This function will automatically check the session from cookies & request.                              |
 |                                                                                                          |
 *  RESPONSE: If session exists the response will be:                                                       |
 |  { session: true, session_id: 9, session_token: 'az41..', permissions: ['POST_DELETE', 'USER_DELETE'] }  |
 |                                                                                                          |
 *  RESPONSE: If no session response will be:                                                               |
 |   { session: false }                                                                                     |
 +-------------------------------------------------------------------------------------------------------- */
const auth = async (req) => {
    return new Promise((resolve, reject) => {
        if ( !isSessionCookiesSet(req) ) {
            resolve( { session: false } );
        }else{
            getSession(req.body.session_id, req.body.session_token ).then( (r) => {
               if ( r.session ) {
                 resolve( { session: true, user_id: r.user_id, permissions : r.permissions, session_id : parseFloat(req.body.session_id), session_token : req.body.session_token } );
               }else{
                 resolve( { session: false } );
               }
            });
        }
    });
};

module.exports = auth;