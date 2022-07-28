<script>

    // import components
    import Loader from './components/Loader.svelte';
    import Map from './components/Map/Map.svelte';

    // import raster info
    import rasters from '../dist/rasters/info.json';

    // import libs
    import { centerPoint, approx_distance_between_coordinates_km, km_to_px } from './libs/geospatial.js';

    // import config
    import { CENTER_LAT, CENTER_LNG, START_RADIUS, END_RADIUS } from './config.js';
import { EARTH_RADIUS_PX } from './components/Map/config';

    // map variables
    let map_ready;
    let camera, renderer, scene, controls;
    let markers, countries, earth;
    let animate_to_latlng, move_to_latlng, load_image;

    // app variables
    let hide = true;


    // on map ready
    $: if(map_ready){ 
        init(); 
    }

    function load_rasters(){

        const images = rasters.map(d => {

            // destructure
            const { filename, wgs84Extent, size } = d;
            const coordinates = wgs84Extent['coordinates'][0];
            
            // find center point
            const center = centerPoint(coordinates);

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
                'url': `rasters/${filename}.tif.png`, 'center': { 'lat': center[1], 'lng': center[0] }, 'width': width_px, 'height': height_px
            }
        })

        images.forEach(image => {

            // destructure
            const { url, center, width, height } = image;

            // load
            load_image(url, center['lat'], center['lng'], width, height);
        })
    }

    async function init() {

        // disable controls
        controls.enabled = false;

        // set hide flag
        hide = true;

        // adjust controls depending on zoom level
        // const distance_ratio = (controls.getDistance() - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)
        controls.rotateSpeed = 0.0007
        controls.panSpeed = 0.0007
        controls.zoomSpeed = 0.0007

        // rotate
        controls.autoRotate = true;

        // load images
        load_rasters();

        // set initial position
        move_to_latlng(CENTER_LAT, CENTER_LNG, START_RADIUS);

        // normalize coordinates
        // const x_norm = (x / window.innerWidth) * 2 - 1;
        // const y_norm = (y / window.innerHeight) * 2 - 1;

        // // set target on center
        // controls.target.set(x_norm, y_norm, 0.0);

        // set hide flag
        hide = false;
    
        // enable controls
        controls.enabled = true;

        // zoom
        setTimeout(async () => {

            controls.autoRotate = false;

            // zoom animation
            await animate_to_latlng(CENTER_LAT, CENTER_LNG, END_RADIUS);
            
        }, 3000);

        // user control animation
        animate();
    }
    

    // animate map
    function animate(){
        requestAnimationFrame( animate );

        // update control
        controls.update();

        // render
        renderer.render( scene, camera );
    }


</script>


{#if hide}
    <Loader/>
{/if}


<!-- 3D Background -->
<Map
    bind:ready={map_ready} 
    bind:camera={camera} bind:scene={scene} bind:renderer={renderer} bind:controls={controls}
    bind:object_countries={countries} bind:object_earth={earth} bind:object_markers={markers}
    bind:move_to_latlng={move_to_latlng} bind:animate_to_latlng={animate_to_latlng} bind:load_image={load_image}
/>


<style>
    
</style>
