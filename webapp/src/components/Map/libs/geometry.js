'use strict';


export function distance_between_points_3D(x0, y0, z0, x1, y1, z1){
    return Math.sqrt( Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2) + Math.pow(z1 - z0, 2) );
}
