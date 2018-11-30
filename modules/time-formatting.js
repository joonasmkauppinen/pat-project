'use strict';

/* Convert UNIX timestamp --> dd.mm.yyyy HH:mm*/
const unixTimeAsDate = (unix_timestamp) => {
    const date = new Date(unix_timestamp*1000);
    const hours = "0" + date.getHours();
    const minutes = "0" + date.getMinutes();
    const seconds = "0" + date.getSeconds();
    return date.getDate() + "." + date.getMonth() + "." + date.getFullYear() + " " +  hours.substr(-2) + ':' + minutes.substr(-2) //+ ':' + seconds.substr(-2);
    }

/* Convert UNIX timestamp --> "13 minutes ago"" */
const timeAgo = (ts) => {
    let d=new Date();  // Gets the current time
    let nowTs = Math.floor(d.getTime()/1000); // getTime() returns milliseconds, and we need seconds, hence the Math.floor and division by 1000
    let seconds = nowTs-ts;
    if (seconds > 31104000) {
        return Math.floor(seconds/31104000) + " years ago";
        }
    if (seconds > 2592000) {
        return Math.floor(seconds/2592000) + " months ago";
        }
    if (seconds > 86400) {
        return Math.floor(seconds/86400) + " days ago";
        }
    if (seconds > 3600 ) {
        return Math.floor(seconds/3600) + " hours ago";
        }
    if (seconds > 60) {
        return Math.floor(seconds/60) + " minutes ago";
        }
    if (seconds > 1) {
        return Math.floor(seconds) + " seconds ago";
        }   
  }

module.exports = { timeAgo, unixTimeAsDate };