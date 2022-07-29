'use strict';

// import libs
import { centerPoint, approx_distance_between_coordinates_km, km_to_px } from './libs/geospatial.js';

// import Map config
import { EARTH_RADIUS_PX } from './components/Map/config';
import { CENTER_LNG, CENTER_LAT, START_RADIUS, END_RADIUS } from './config.js';


// import raster info
import rasters from '../dist/rasters/info.json';
import basemaps from '../dist/basemaps/info.json';

// import incidents
import incidents from '../dist/incidents.json';


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


export async function update(section_id, controls, move_to_func, highlight_func) {

    // log
    console.log(`Section ${section_id} as just become visible in screen`);

    if (+section_id === 1) {

        // move back 
        await move_to_func(CENTER_LAT, CENTER_LNG, START_RADIUS);

        // rotate
        controls.autoRotate = true;
        
    } else if (+section_id === 2) {

        // rotate
        controls.autoRotate = false;

        // move back 
        highlight_func();
        await move_to_func(CENTER_LAT, CENTER_LNG, END_RADIUS);

    } else if (+section_id === 3) {

        // go to first incident
        highlight_func(1)
        await move_to_incident(1, move_to_func);

    } else if (+section_id === 4) {

        // go to first incident
        highlight_func(16)
        await move_to_incident(16, move_to_func);
    }

        // load images
        // load_basemaps();
        // load_rasters();

        // move
        // await move_to_random_incident();

        // const image_url = 'pictures/16.jpeg';
        // const svg_url = 'pictures/16.svg';

        // setTimeout(() => {
        //     show_image(image_url, svg_url)
        // }, 2000)

        // enable controls
        // controls.enabled = true;

        // zoom
        // setTimeout(async () => {

        //     controls.autoRotate = false;

        //     // zoom animation
        //     await animate_to_latlng(CENTER_LAT, CENTER_LNG, END_RADIUS);

        //     setTimeout(async () => {

        //         // move
        //         await move_to_random_incident();

        //         const image_url = 'pictures/16.jpeg';
        //         const svg_url = 'pictures/16.svg';

        //         show_image(image_url, svg_url)

        //     }, 2000)

        //     // // start random animation
        //     // animate_random_incidents();
            
        // }, 6000);


        // set
        // controls.addEventListener( "change", event => {  
        //     const { x, y, z } = controls.object.position;
        //     const r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
        //     console.log( r ); 
        // });
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


function load_rasters(){
    rasters.forEach(d => {

        // destructure
        const { filename, wgs84Extent, size } = d;
        const coordinates = wgs84Extent['coordinates'][0];
        
        // find center point
        const center = centerPoint(coordinates);

        // find width & height
        const { width, height } = coordinates_to_width_height(coordinates);

        // load
        load_image(`rasters/${filename}.tif.png`, center[1], center[0], width, height);
    })
}


export function load_basemaps(load_image){
    basemaps.forEach(d => {

        // destructure
        const { filename, wgs84Extent, size } = d;
        const coordinates = wgs84Extent['coordinates'][0];
        
        // find center point
        const center = centerPoint(coordinates);

        // find width & height
        const { width, height } = coordinates_to_width_height(coordinates);

        // set opacity
        let opacity = 1.0;
        if (filename.includes('highway')) {
            opacity = 0.8;
        } else {
            opacity = 0.3;
        }

        // load
        load_image(`basemaps/${filename}.tif.png`, center[1], center[0], width, height, true, opacity );
    });
}
