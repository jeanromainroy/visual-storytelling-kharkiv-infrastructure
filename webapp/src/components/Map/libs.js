'use strict';

// import libs
import * as THREE from 'three';

// import config
import { EARTH_RADIUS_PX, MARKER_SIZE, MAT_MESH, MAT_LINE } from './config.js';



export function get_object_screen_position(object, camera){

    // get north pole marker
    const { x, y, z } = object.position;

    // copy to vector
    var vector = new THREE.Vector3();
    vector.set( x, y, z );

    // map to normalized device coordinate (NDC) space
    vector.project( camera );

    // map to 2D screen space
    const north_pole_x = vector.x + 1;
    const north_pole_y = - vector.y + 1;

    return {
        'x': north_pole_x,
        'y': north_pole_y
    };
}


export function build_earth(){
    const earth_geometry = new THREE.SphereGeometry( EARTH_RADIUS_PX - 0.5, 128, 128);
    const earth_material = MAT_MESH(0xFFFFFF, 1.0, false);
    const object_earth = new THREE.Mesh( earth_geometry, earth_material );
    return object_earth;
}


export function build_north_pole(){
    return createMarkerFromLatLng(90.0, 0.0, 0);
}


export function build_paths(paths) {

    // init ensemble object
    let object = new THREE.Object3D();

    // go through paths
    paths.forEach(line => {

        // project each point
        const points_projected = line.map(point => vertex(point));

        // pair points
        const points_projected_paired = pairs(points_projected)

        // create object
        const geometry = new THREE.BufferGeometry().setFromPoints( points_projected_paired );

        // build material
        const material = MAT_LINE();

        // add
        object.add(new THREE.LineSegments(geometry, material));
    });

    return object;
}


export function build_lines(features) {

    // init ensemble object
    let object = new THREE.Object3D();
    
    // go through features
    features.forEach(feature => {

        // destructure
        const type = feature['geometry']['type'];

        // build material
        const material = MAT_LINE();

        if ( type === 'LineString' ) {

            // extract coordinates
            const line = feature['geometry']['coordinates'];

            // project each point
            const points_projected = line.map(point => vertex(point));

            // pair points
            const points_projected_paired = pairs(points_projected)

            // create object
            const geometry = new THREE.BufferGeometry().setFromPoints( points_projected_paired );

            // add
            object.add(new THREE.LineSegments(geometry, material));
        } 

        if ( type === 'MultiLineString' ) {

            // extract coordinates
            const lines = feature['geometry']['coordinates'];

            lines.forEach(line => {

                // project each point
                const points_projected = line.map(point => vertex(point));

                // pair points
                const points_projected_paired = pairs(points_projected)

                // create object
                const geometry = new THREE.BufferGeometry().setFromPoints( points_projected_paired );

                // add
                object.add(new THREE.LineSegments(geometry, material));
            });        
        }
    });

    return object;
}


export function build_markers(features) {
    
    // init ensemble object
    let object = new THREE.Object3D();
    
    // go through features
    features.forEach(feature => {

        // destructure
        const { properties, geometry } = feature;

        if ( geometry['type'] === 'MultiPoint' ) {
            geometry['coordinates'].forEach(point => {
                const [lng, lat] = point;
                const object_marker = createMarkerFromLatLng(lat, lng, MARKER_SIZE);
                object_marker['properties'] = properties;
                object.add(object_marker);
            })
        } 
                
        if ( geometry['type'] === 'Point' ) {
            const [lng, lat] = geometry['coordinates'];
            const object_marker = createMarkerFromLatLng(lat, lng, MARKER_SIZE);
            object_marker['properties'] = properties;
            object.add(object_marker);
        }
    });

    return object;
}


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

function orbit_angle(point, radius, angle_increase = 0.01) {

    // destructure
    const [adjacent, opposite] = point;

    // get current angle
    const current_angle = Math.atan2(opposite, adjacent);

    // increment angle
    let next_angle = current_angle + angle_increase;

    // reset
    if (next_angle > 2 * Math.PI) next_angle = 0.0;

    // convert back to position
    const _opposite = Math.sin(next_angle) * radius;
    const _adjacent = Math.cos(next_angle) * radius;

    return [_adjacent, _opposite]
}
