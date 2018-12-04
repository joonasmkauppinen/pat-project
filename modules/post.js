'use strict';

const db = require('../modules/db');
const tag = require('../modules/tag');
const pet = require('../modules/pet');
const comment = require('../modules/comment');
const contentreport = require('../modules/contentreport');


const deletePost = (postID, auth) => {
return new Promise((resolve, reject) => {
  let POST_DELETE = 0;
  if ( auth.permissions.indexOf('POST_DELETE') != -1) POST_DELETE = 1;
  db.query("SELECT postAddedBy, postMediaURI FROM posts WHERE postID=? LIMIT 1", postID, (e,r,f) => {
    if ( e == null ) {
      if ( r.length == 1 ) {
        // Deletion is allowed if permission POST_DELETE or original uploader tries to delete own post.
        if ( POST_DELETE || r[0].postAddedBy == auth.user_id ) {
          tag.removeAllTagsFromPost(postID).then((removeTagsSuccess) => {
            if ( removeTagsSuccess ) {
              comment.removeAllCommentsForPost(postID).then((removeCommentsSuccess) => {
                if ( removeCommentsSuccess ) {
                  contentreport.removeAllContentReportsForPost(postID).then((removeCRSuccess) => {
                    if ( removeCRSuccess ) {
                      pet.removePetLinkingsForPost(postID).then((removePetSuccess) => {
                        if ( removePetSuccess ) {
                            db.query("DELETE FROM posts WHERE postID=? LIMIT 1", postID, (e,r,f) => {
                                if ( e == null ) {
                                  // *** TODO: DELETE ALSO THE FILES HERE !!! *****************************************************************************
                                  resolve('success');
                                }else{
                                  resolve('Error processing DELETE request (actual post item deletion failed).');
                                }
                            });            
                        }else{ resolve('Error processing DELETE request (pet linkings deletion failed).'); }
                      });
                    }else{ resolve('Error processing DELETE request (content reports deletion failed).'); }
                  });
                }else{ resolve('Error processing DELETE request (comments deletion failed).'); }
                });
              }else{ resolve('Error processing DELETE request (tag deletion failed).'); }
            });
          }else{ resolve('Unauthorized request.'); }
        }else{ resolve('Post not found.'); }
      }else{ resolve('Database query failed.'); }
  });
});
};

module.exports = { deletePost };