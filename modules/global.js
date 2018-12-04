'use strict';

const isNumeric = (n) => { 
    return !isNaN(parseFloat(n)) && isFinite(n);
    };

const issetIsNumeric = (n) => {
    if ( typeof n == 'undefined' ) {
        return false;
    }else{
        return isNumeric (n);
    }
}

module.exports = { isNumeric, issetIsNumeric };