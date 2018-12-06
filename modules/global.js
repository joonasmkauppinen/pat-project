'use strict';

const isNumeric = (n) => { 
    return !isNaN(parseFloat(n)) && isFinite(n);
    };

const issetIsNumeric = (n) => {
    if ( typeof n == 'undefined' || n == '' ) {
        return false;
    }else{
        return isNumeric (n);
    }
}

const issetVar = (n) => {
    if ( typeof n == 'undefined' || n == '' ) {
        return false;
    }else{
        return true;
    }
}


module.exports = { isNumeric, issetIsNumeric, issetVar };