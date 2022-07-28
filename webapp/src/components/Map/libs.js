'use strict';

// import libs
import * as THREE from 'three';

// import config
import { EARTH_RADIUS_PX, MARKER_SIZE, MAT_MESH, MAT_LINE, EARTH_COLOR, DEBUG } from './config.js';



export function get_object_screen_position(object, camera){

    // get north pole marker
    const { x, y, z } = object.position;

    // copy to vector
    var vector = new THREE.Vector3();
    vector.set( x, y, z );

    // map to normalized device coordinate (NDC) space
    vector.project( camera );

    // map to 2D screen space
    const _x = vector.x + 1;
    const _y = - vector.y + 1;

    return {
        'x': _x,
        'y': _y
    };
}


export const increase_radius_of_point = (x, y, z, radius) => {

    const r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
    const theta = Math.acos(z / r);
    let phi = Math.atan(y / x);

    // add cadrant
    if (x < 0 && y >= 0) {
        phi += Math.PI;
    } else if (x < 0 && y < 0) {
        phi -= Math.PI;
    } else if (x == 0 && y > 0) {
        phi = Math.PI / 2.0;
    } else if (x == 0 && y < 0) {
        phi = -Math.PI / 2.0;
    }

    const _x = radius * Math.cos(phi) * Math.sin(theta);
    const _y = radius * Math.sin(phi) * Math.sin(theta);
    const _z = radius * Math.cos(theta);
    
    return [_x, _y, _z];
}


export function normalize(x, y, z) {
    
    const r = Math.round(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2))) * 1.0;

    return {
        'x': x / r,
        'y': y / r,
        'z': z / r
    }
}

export function rotate_on_own_axis() {

    // // rotation matrix
    // const rotMat = new THREE.Matrix4();
    // rotMat.makeRotationAxis( new THREE.Vector3(normalized_position['x'], normalized_position['y'], normalized_position['z']), 0.0 )

    // // apply
    // plane.applyMatrix4(rotMat);
}


export function build_earth(){
    const earth_geometry = new THREE.SphereGeometry( EARTH_RADIUS_PX - 0.5, 128, 128);
    const earth_material = DEBUG ? MAT_MESH(0xFFFFFF, 0.0, false) : MAT_MESH(EARTH_COLOR, 1.0, false);
    const object_earth = new THREE.Mesh( earth_geometry, earth_material );
    return object_earth;
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


export const orient_north_up = async (camera, renderer, scene, object_north_pole) => {

    // init process variables
    let last_last_y = 0;
    let last_y = 0;

    // rotate the camera to face origin
    camera.lookAt( 0, 0, 0 );

    // initial camera rotation
    const initial_rotation = camera.rotation.z;

    await new Promise(resolve => {

        function brute_force(){
            
            // extract marker of north pole
            const { x, y } = get_object_screen_position(object_north_pole, camera);

            // check
            if (last_last_y > last_y && last_y < y) {
                resolve();
                return;
            }
            
            // update
            last_last_y = last_y;
            last_y = y;
            
            // rotate camera
            camera.rotation.z += 0.02;
                
            // render
            renderer.render( scene, camera );

            // animate
            requestAnimationFrame( brute_force );
        }

        brute_force();
    })
                
    // render
    renderer.render( scene, camera );

    return camera.rotation.z - initial_rotation;
}
