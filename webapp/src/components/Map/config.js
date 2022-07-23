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


// --- Materials ---
export const MAT_POINT = (size, color = 0x000000, opacity = 0.9) => new THREE.PointsMaterial( { size: size, color: color, opacity: opacity, transparent: true } );
export const MAT_LINE = (color = 0x000000) => new THREE.LineBasicMaterial({color: color});
export const MAT_MESH = (color = 0x000000, opacity = 0.9, wireframe = true) => new THREE.MeshBasicMaterial( { color: color, opacity: opacity, wireframe: wireframe, transparent: true } );
