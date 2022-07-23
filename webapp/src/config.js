'use strict';

// import map config
import { EARTH_RADIUS_PX } from "./components/Map/config.js";

// city of interest
export const START_RADIUS = EARTH_RADIUS_PX * 3;
export const END_RADIUS = EARTH_RADIUS_PX * 1.002;

export const MAX_DISTANCE = START_RADIUS;
export const MIN_DISTANCE = EARTH_RADIUS_PX * 1.0005;

// --- Basic ---
export const CENTER_LNG = 36.2304;
export const CENTER_LAT = 49.9935;

