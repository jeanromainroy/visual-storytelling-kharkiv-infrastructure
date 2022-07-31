'use strict';

// import Map config
import { CENTER_LNG, CENTER_LAT, START_RADIUS, END_RADIUS } from './config.js';

// import raster info
import rasters from '../dist/rasters/info.json';
import basemaps from '../dist/basemaps/info.json';

// import incidents
import incidents from '../dist/incidents.json';



export async function update(section_id, controls, move_to_func, highlight_func) {

    // log
    console.log(`Section ${section_id} as just become visible in screen`);


    if (+section_id === 1) {

        // zoom back
        await move_to_func(CENTER_LAT, CENTER_LNG, START_RADIUS);

        // turn on rotation
        controls.autoRotate = true;
    } 
    

    if (+section_id === 2) {

        // turn off rotation
        controls.autoRotate = false;

        // clear highlighted markers
        highlight_func(); 

        // zoom to whole city of kharkiv
        await move_to_func(CENTER_LAT, CENTER_LNG, END_RADIUS);
    } 
    

    for (let i=0 ; i<incidents['features'].length ; i++) {

        // compute section id
        const _section_id = i + 3;

        // destructure
        const incident_id = incidents['features'][i]['properties']['ID']

        if (+section_id === _section_id) {

            // highlight incident markers
            highlight_func(incident_id);

            // move to incident
            await move_to_incident(incident_id, move_to_func);

            // stop loop
            break;
        }
    }
}


async function move_to_incident(incident_id, move_to_func) {

    // select incident
    const rand_incident = incidents['features'].filter(incident => +incident['properties']['ID'] === incident_id)[0];

    // destructure
    const geometry_type = rand_incident['geometry']['type'];
    const coordinates = rand_incident['geometry']['coordinates'];
    const properties = rand_incident['properties'];

    // extract location
    const location = geometry_type === 'Point' ? coordinates : coordinates[0];
    const lng = location[0];
    const lat = location[1];

    // move to animation
    await move_to_func(lat, lng);
}


function load_rasters(load_image){
    rasters.forEach(d => {

        // destructure
        const { filename, coordinates } = basemap;

        // load
        load_image(`rasters/${filename}.tif.png`, coordinates);
    })
}


export function load_basemaps(load_image){
    basemaps.forEach(basemap => {

        // destructure
        const { filename, coordinates } = basemap;

        // set opacity
        if (filename.includes('highway')) {

            return;
            // set opacity
            const opacity = 0.5;

            // load
            load_image(`basemaps/${filename}.tif.png`, coordinates, true, opacity );

        } else if (filename.includes('building')) {

            return;
            // set opacity
            const opacity = 0.3;

            // load
            load_image(`basemaps/${filename}.tif.png`, coordinates, true, opacity );

        } else if (filename.includes('terrain')) {

            // set opacity
            const opacity = 0.25;

            // load
            load_image(`basemaps/${filename}.jpeg`, coordinates, true, opacity );
        }
    });
}
