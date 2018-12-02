'use strict';

const db = require('../modules/db');

const removeDuplicatesFromArray = (array) => {
    return [...new Set(array)];
};

const parseTagName = (tag) => {
    console.log('Parse TagName:')
    console.log(tag);
    return tag.toLowerCase();
};

const parseTagArrayNames = (tagsArray) => {
    console.log('PARSE');
    console.log(tagsArray);
    const newArray = [];
    for(let i=0;i<tagsArray.length;i++){
        console.log('TAGSARRAY');
        console.log(tagsArray[i]);
        newArray.push(parseTagName(tagsArray[i]));
    }
    return newArray;
};

const constructTagWhereSelector = (tagsArray) => {
    let outputString = '';
    const tagsArrayParsed = parseTagArrayNames(tagsArray);
    for(let i=0;i<tagsArray.length;i++){
        if ( i != 0 ) outputString += ` OR `;
        outputString += `LOWER(tag)=?`;
    }
    return `(${outputString}) `;
};

/* Test is String or String[] array of tags are acceptable  */
const isAcceptableTag = (tag) => {
    const regex = /^[a-zA-Z0-9-_]{2,16}$/;
    if ( Array.isArray(tag) ) {
        if ( tag.length == 0 ) {
            return false;
        }else{
            for(let i=0; i<tag.length; i++){
                if ( regex.test(tag[i]) == false ) return false;
            }
            return true;
        }
    }else{
        return regex.test(tag);
    }
};

const findTagsIDs = (tags) => {
    return new Promise((resolve, reject) => {
        const whereSelector = constructTagWhereSelector(tags);
        db.query(`SELECT tagID, tag FROM tags WHERE ${whereSelector}`, parseTagArrayNames(tags), (e,r,f) => {
            if ( e == null ) {
                const tagsByKey = [];
                const justKeys = [];
                for (let i=0;i<tags.length;i++) { tagsByKey[parseTagName(tags[i])] = 0;}   
                for (let i=0;i<r.length;i++) { tagsByKey[parseTagName(r[i].tag)] = r[i].tagID; }
                const insertNewTags = [];
                for (let i in tagsByKey) { if ( tagsByKey[i] == 0 ) insertNewTags.push(i); }
                if ( insertNewTags.length != 0 ) {
                    let newTagsSQLValues = '';
                    for (let i=0;i<insertNewTags.length;i++) {
                        newTagsSQLValues += "(?)" + (i==insertNewTags.length-1 ? '; ' : ', ');
                    }
                    db.query("INSERT INTO `tags` (tag) VALUES " +newTagsSQLValues, insertNewTags, (e,r,f) => {
                        if ( e == null ) {
                            for (let i=0;i<insertNewTags.length;i++) { tagsByKey[insertNewTags[i]] = r.insertId + i; }
                            for (let i in tagsByKey) { justKeys.push(tagsByKey[i]); }
                            resolve( justKeys );
                        }else{
                            resolve( [] );
                        }
                    });    
                }else{
                    for (let i in tagsByKey) { justKeys.push(tagsByKey[i]); }
                    resolve ( justKeys );
                }
            }else{
                resolve( [] );
            }
        });
    });
};

const addTagsToPost = (tagsArray, postID) => {
    return new Promise((resolve, reject) => {
        findTagsIDs(removeDuplicatesFromArray(parseTagArrayNames(tagsArray))).then((r) => {
            if ( r.length > 0 ) {
                const addTags = r;
                db.query("SELECT lttpTagLID FROM `linkingsTagToPost` WHERE lttpPostLID=?", postID, (e,r,f) => {
                    if ( e == null ) {
                        if ( r.length > 0 ) {
                            for(let i=0;i<r.length;i++){
                                addTags.pop(r[i]);
                            }
                        }
                        if ( addTags.length > 0 ) {
                            let newTagsSQLValues = '';
                            for (let i=0;i<addTags.length;i++) {
                                newTagsSQLValues += `(?, ${postID})` + (i==addTags.length-1 ? '; ' : ', ');
                            }
                            db.query("INSERT INTO `linkingsTagToPost` (lttpTagLID,lttpPostLID) VALUES " + newTagsSQLValues, addTags, (e,r,f) => {
                                if ( e == null ) {
                                    resolve( true );
                                }else{
                                    console.log('addTagsToPost: SQL Clause failed!');
                                    console.log(e);
                                    resolve( false );
                                }
                            });    
                        }else{
                            resolve ( true );
                        }

                    }else{
                        resolve( false );
                    }                    
                });
            }
        });
        resolve(1);
    });
};

const removeAllTagsFromPost = (postID) => {
    return new Promise((resolve, reject) => {
        db.query("DELETE FROM `linkingsTagToPost` WHERE lttpPostLID=?", [postID], (e,r,f) => {
            if ( e == null ){
                resolve(true);
            }else{
                resolve(false);
            }
        });
    });
};

module.exports = { addTagsToPost, removeAllTagsFromPost, isAcceptableTag };