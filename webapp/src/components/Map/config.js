'use strict';

// import libs
import * as THREE from 'three';


// --- DEBUG ---
export const DEBUG = false;


// --- Camera ---
// fov — Camera frustum vertical field of view.
export const fov = 50;

// near — Camera frustum near plane.
export const near = 0.1;

// far — Camera frustum far plane.
export const far = 1000;


// --- Objects Properties ---
export const EARTH_RADIUS_PX = 228;
export const MARKER_SIZE = 0.001;

export const MAX_DISTANCE = EARTH_RADIUS_PX * 3;
export const MIN_DISTANCE = EARTH_RADIUS_PX * 1.0005;

export const EARTH_COLOR = '#ccc';

export const MOVE_TO_RADIUS = EARTH_RADIUS_PX * 1.0005;


// colors
export const MARKER_COLOR_HIGHLIGHTED = '0xff0000';
export const MARKER_COLOR_LOWLIGHTED = '0xffcccb';
export const MARKER_COLOR_DEFAULT = '0xff0000';


// --- Materials ---
export const MAT_POINT = (size, color = 0x000000, opacity = 0.9) => new THREE.PointsMaterial( { size: size, color: color, opacity: opacity, transparent: true } );
export const MAT_LINE = (color = 0x000000) => new THREE.LineBasicMaterial({color: color, transparent: true, opacity: 0.4});
export const MAT_MESH = (color = 0x000000, opacity = 0.9, wireframe = true) => new THREE.MeshBasicMaterial( { color: color, opacity: opacity, wireframe: wireframe, transparent: true } );
