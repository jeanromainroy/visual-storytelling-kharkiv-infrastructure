<script>

    // import components
    import Loader from './components/Loader.svelte';
    import Map from './components/Map/Map.svelte';
    import Canvas from './components/Canvas/Canvas.svelte';

    // import raster info
    import rasters from '../dist/rasters/info.json';
    import basemaps from '../dist/basemaps/info.json';

    // import libs
    import { onMount } from 'svelte';
    import { centerPoint, approx_distance_between_coordinates_km, km_to_px } from './libs/geospatial.js';

    // import config
    import { CENTER_LAT, CENTER_LNG, START_RADIUS, END_RADIUS } from './config.js';
    import { EARTH_RADIUS_PX } from './components/Map/config';

    // map variables
    let map_ready;
    let camera, renderer, scene, controls;
    let markers;
    let animate_to_latlng, move_to_latlng, load_image;

    // canvas variables
    let show_image;

    // app variables
    let hide = true;


    // on map ready
    $: if(map_ready){ 
        init(); 
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


    function load_basemaps(){
        basemaps.forEach(d => {

            // destructure
            const { filename, wgs84Extent, size } = d;
            const coordinates = wgs84Extent['coordinates'][0];
            
            // find center point
            const center = centerPoint(coordinates);

            // find width & height
            const { width, height } = coordinates_to_width_height(coordinates);

            if (filename.includes('highway')) return;

            // load
            load_image(`basemaps/${filename}.tif.png`, center[1], center[0], width, height, true);
        });
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
        load_basemaps();
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



    onMount(() => {

        const image_url = 'pictures/16.jpeg';
        const svg_url = 'pictures/16.svg';

        show_image(image_url, svg_url)
    })

</script>


{#if hide}
    <Loader/>
{/if}


<!-- 3D Background -->
<Map
    bind:ready={map_ready} 
    bind:camera={camera} bind:scene={scene} bind:renderer={renderer} bind:controls={controls}
    bind:move_to_latlng={move_to_latlng} bind:animate_to_latlng={animate_to_latlng} bind:load_image={load_image}
/>

<Canvas bind:show={show_image}/>


<style>
    
</style>
