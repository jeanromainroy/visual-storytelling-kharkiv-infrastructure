'use strict';

// helper functions to validate basic data types
export function isString(el){
    return el !== undefined && el !== null && typeof(el) === 'string';
}

export function isStringNonEmpty(el){
    return isString(el) && el.trim().length > 0;
}
