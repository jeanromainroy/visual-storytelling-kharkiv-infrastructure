'use strict';

export function remove_px(str) {
    if (str.endsWith('px')) return +str.slice(0, -2);
    return str;
}
