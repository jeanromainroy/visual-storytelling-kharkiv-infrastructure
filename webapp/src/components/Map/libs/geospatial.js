'use strict';

// constants
const EARTH_RADIUS_KM = 6371;
import { EARTH_RADIUS_PX } from "../config";



export function coordinates_to_sphere_parameters(){

}



function coordinates_to_width_height(coordinates) {

    // extract min/max latitudes and longitudes
    const lngs = coordinates.map(d => d[0]);
    const lats = coordinates.map(d => d[1]);
    const max_lat = Math.max(...lats);
    const min_lat = Math.min(...lats);
    const max_lng = Math.max(...lngs);
    const min_lng = Math.min(...lngs);
    const ave_lat = (max_lat + min_lat) / 2.0;
    const ave_lng = (max_lng + min_lng) / 2.0;

    // compute distance between extrema
    const width_km = approx_distance_between_coordinates_km(ave_lat, min_lng, ave_lat, max_lng);
    const height_km = approx_distance_between_coordinates_km(min_lat, ave_lng, max_lat, ave_lng);

    // find width & height
    const width_px = km_to_px(width_km, EARTH_RADIUS_PX);
    const height_px = km_to_px(height_km, EARTH_RADIUS_PX);

    return {
        'width': width_px, 
        'height': height_px
    }
}



// Converts a point [longitude, latitude] in degrees to a THREE.Vector3.
export function vertex(point, radius = EARTH_RADIUS_PX) {
    
    var lambda = point[0] * Math.PI / 180,
        phi = point[1] * Math.PI / 180,
        cosPhi = Math.cos(phi);

    return {
        'x': radius * cosPhi * Math.cos(lambda),
        'y': radius * cosPhi * Math.sin(lambda),
        'z': radius * Math.sin(phi)
    }
}



/**
 * Checks if a GPS point is inside a GPS polygon
 */
export function isPointInPolygon(longitude, latitude, polygon) {
	// ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var x = longitude, y = latitude;

    var inside = false;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i][0], yi = polygon[i][1];
        var xj = polygon[j][0], yj = polygon[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}


/**
 * Get the central point of a polygon
 *
 * @param polygon          	The polygon [[lat,lng],[lat,lng],...]
 */
export function centerPoint(polygon) {

    // init variables
    var sumX = 0.0;
    var sumY = 0.0;
    var counter = 0;

    // filter unique
    const polygon_str = polygon.map(lat_lng => lat_lng.join(';'));
    const polygon_str_unique = [...new Set(polygon_str)];
    const polygon_unique = polygon_str_unique.map(d => d.split(';'));

    // accumulate
    polygon_unique.forEach(point => {
        
        // destructure
        var x = +point[0], y = +point[1];

        sumX = sumX + x;
        sumY = sumY + y;
        counter = counter + 1;
    });

    var aveX = sumX/counter;
    var aveY = sumY/counter;

    return [aveX, aveY];
}


export function km_to_px(distance_in_km, radius_of_earth_in_px) {
    return distance_in_km * radius_of_earth_in_px / (1.0 * EARTH_RADIUS_KM);
}



export function approx_distance_between_coordinates_km(lat1, lon1, lat2, lon2) {

    const dLat = deg2rad(lat2-lat1);  // deg2rad below
    const dLon = deg2rad(lon2-lon1); 

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = EARTH_RADIUS_KM * c; // Distance in km

    return d;
}


export function deg2rad(deg) {
    return deg * (Math.PI/180)
}


