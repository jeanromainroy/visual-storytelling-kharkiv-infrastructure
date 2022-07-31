'use strict';

// import libs
import * as topojson from 'topojson-client';
import * as THREE from 'three';
import { pairs } from './libs/datamanipulation.js';
import { vertex } from './libs/geospatial.js';

// import config
import { EARTH_RADIUS_PX, MARKER_SIZE, MAT_MESH } from './config.js';

// import textures
import texture_earth from './assets/texture.jpeg';

// import geojsons
import topo_countries from './assets/world-topography-50m.json';


export function build_earth(){

    // load image as texture
    const texture = new THREE.TextureLoader().load( texture_earth );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 12, 12 );
    const material = new THREE.MeshBasicMaterial( {  map: texture } );

    // build sphere geometry, slightly smaller radius for stuff above to be visible
    const geometry = new THREE.SphereGeometry( EARTH_RADIUS_PX - 0.5, 96, 96);

    // build object
    const object = new THREE.Mesh( geometry, material );

    return object;
}


export function build_countries(){

    // prepare the world's GeoJSON MultiLineString in spherical coordinates
    const countries = topojson.mesh(topo_countries, topo_countries['objects']['countries']);

    // format as geojson feature
    const feature = { 'type': 'MultiLineString', 'geometry': { 'coordinates': countries['coordinates'] } };

    // build object from paths
    const object = build_MultiLineString(feature);

    return object;
}


export function build_markers(features) {
    
    // init ensemble object
    let object = new THREE.Object3D();
    
    // go through features
    features.forEach(feature => {

        // destructure
        const { geometry } = feature;

        if ( geometry['type'] === 'MultiPoint' ) {
            build_MultiPoint(feature).forEach(object_point => {
                object.add(object_point);
            })            
        } 
                
        if ( geometry['type'] === 'Point' ) {
            object.add(build_Point(feature));
        }
    });

    return object;
}


export function build_LineString(feature) {

    // extract coordinates
    const points = feature['geometry']['coordinates'];

    // project each point
    const points_projected = points.map(point => vertex(point));

    // pair points to create lines
    const lines = pairs(points_projected)

    // create geometry
    const geometry = new THREE.BufferGeometry().setFromPoints( lines );

    // create material
    const material = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 });

    // build object
    const object_line = new THREE.LineSegments(geometry, material)

    return object_line;
}


export function build_MultiLineString(feature) {

    // init ensemble object
    let object = new THREE.Object3D();

    // go through lines
    feature['geometry']['coordinates'].forEach(line => {

        // format as geojson feature
        const feature = { 'type': 'LineString', 'geometry': { 'coordinates': line } };

        // build line object
        const object_line = build_LineString(feature);

        // add
        object.add(object_line);
    });  

    return object;
}


export function build_Point(feature, radius = MARKER_SIZE) {

    // destructure
    const [lng, lat] = feature['geometry']['coordinates'];

    // project lat/lng
    const { x, y, z } = vertex([lng, lat]);

    // create sphere
    const geometry = new THREE.SphereGeometry(radius, 24, 24);
    const material = new THREE.MeshBasicMaterial( { color: 0xFF0000, transparent: true, opacity: 0.8 } );
    const sphere = new THREE.Mesh( geometry, material );

    // set position
    sphere.position.set(x, y, z);

    // set properties
    sphere['properties'] = feature['properties'];
    
    return sphere;
}


export function build_MultiPoint(feature) {

    // init ensemble object
    let arr = []

    // go through lines
    feature['geometry']['coordinates'].forEach(point => {

        // format as geojson feature
        const _feature = { 'type': 'Point', 'geometry': { 'coordinates': point }, 'properties': feature['properties'] };

        // build line object
        const object_point = build_Point(_feature);

        // add
        arr.push(object_point);
    });  

    return arr;
}








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
