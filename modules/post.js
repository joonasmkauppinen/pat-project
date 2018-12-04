'use strict';

const db = require('../modules/db');
const tag = require('../modules/tag');
const pet = require('../modules/pet');
const comment = require('../modules/comment');
const contentreport = require('../modules/contentreport');

/* Deletes all the files related to one post */
const deleteAllStoredPostFiles = (postID) => {
  return true;
}

/* Deletes all the linkings to one post (tags, comments, content reports and pet linkings) */
const deleteAllPostLinkings = (postID) => {
return new Promise((resolve, reject) => {
  tag.removeAllTagsFromPost(postID).then((removeTagsSuccess) => {
    comment.removeAllCommentsForPost(postID).then((removeCommentsSuccess) => {
      contentreport.removeAllContentReportsForPost(postID).then((removeCRSuccess) => {
        pet.removePetLinkingsForPost(postID).then((removePetSuccess) => {
          if ( removePetSuccess && removeCRSuccess && removeCommentsSuccess && removeTagsSuccess ) {
            resolve(true);
          }else{
            resolve(false);
          }
        });
      });
    });
  });
});  
};


const deletePost = (postID, auth) => {
return new Promise((resolve, reject) => {
  let POST_DELETE = 0;
  if ( auth.permissions.indexOf('POST_DELETE') != -1) POST_DELETE = 1;
  db.query("SELECT postAddedBy, postMediaURI FROM posts WHERE postID=? LIMIT 1", postID, (e,r,f) => {
    if ( e == null ) {
      if ( r.length == 1 ) {
        // Deletion is allowed if permission POST_DELETE or original uploader tries to delete own post.
        if ( POST_DELETE || r[0].postAddedBy == auth.user_id ) {
          deleteAllPostLinkings(postID).then((deleteSuccess) => {
            if ( deleteSuccess ) {
              db.query("DELETE FROM posts WHERE postID=? LIMIT 1", postID, (e,r,f) => {
                if ( e == null ) {
                  // Delete files to this post
                  deleteAllStoredPostFiles(postID);                  
                  resolve('success');
                }else{ resolve('Error processing DELETE request (actual post item deletion failed).'); }
              });    
            }else{ resolve('Post Linkings deletion failed.'); }
          });
          }else{ resolve('Unauthorized request.'); }
        }else{ resolve('Post not found.'); }
      }else{ resolve('Database query failed.'); }
  });
});
};

module.exports = { deletePost };