'use strict';

// import libs
import * as THREE from 'three';

// import config
import { EARTH_RADIUS_PX, MAT_MESH } from './config.js';


export function createMarkerFromXYZ(x, y, z, radius = 4) {

    // create sphere
    const geometry = new THREE.SphereGeometry(radius, 24, 24);
    const material = MAT_MESH(0xFF0000, 0.3, false);
    const sphere = new THREE.Mesh( geometry, material );

    // set position
    sphere.position.set(x, y, z);

    return sphere;
}


export function createMarkerFromLatLng(lat, lng, radius = 4) {

    // project lat/lng
    const vector = vertex([lng, lat]);

    // destructure
    const { x, y, z } = vector;

    // create sphere
    const geometry = new THREE.SphereGeometry(radius, 24, 24);
    const material = MAT_MESH(0xFF0000, 0.8, false);
    const sphere = new THREE.Mesh( geometry, material );

    // set position
    sphere.position.set(x, y, z);

    return sphere;
}


// Converts a point [longitude, latitude] in degrees to a THREE.Vector3.
export function vertex(point, radius = EARTH_RADIUS_PX) {
    
    var lambda = point[0] * Math.PI / 180,
        phi = point[1] * Math.PI / 180,
        cosPhi = Math.cos(phi);

    return new THREE.Vector3(
        radius * cosPhi * Math.cos(lambda),
        radius * cosPhi * Math.sin(lambda),
        radius * Math.sin(phi)
    );
}


export function pairs(values){
    let mpairs = [];
    _pairs(values, function(a, b) {
        mpairs.push(a, b)
    });
    return mpairs;
}

export function _pairs(values, pairof = pair) {
    const pairs = [];
    let previous;
    let first = false;
    for (const value of values) {
        if (first) pairs.push(pairof(previous, value));
        previous = value;
        first = true;
    }
    return pairs;
}

export function pair(a, b) {
    return [a, b];
}
