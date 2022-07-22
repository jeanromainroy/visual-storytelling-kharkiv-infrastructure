<script>

    // import components
    import Loader from './components/Loader.svelte';
    import Map from './components/Map/Map.svelte';

    // import config
    import { START_RADIUS, MAX_DISTANCE, MIN_DISTANCE, CENTER_LAT, CENTER_LNG, END_RADIUS } from './config.js';

    // map variables
    let map_ready;
    let camera, renderer, scene, controls;
    let markers, countries, earth;
    let orient_north_up, move_to_LatLng, load_image;

    // app variables
    let hide = true;
    let rotation_for_north_up = 0.0;
    let zoom_completed = false;
    let _radius = START_RADIUS;


    // on map ready
    $: if(map_ready){ 
        init(); 
    }

    function load_images(){

        const images = [
            { 'url': '1.jpg', 'lat': 50.0177357160156, 'lng': 36.245435228443036, 'width': 0.05, 'height': 0.05 }
        ];

        images.forEach(image => {

            // destructure
            const { url, lat, lng, width, height } = image;

            // load
            load_image(url, lat, lng, width, height);
        })
    }

    async function init() {

        // disable controls
        controls.enabled = false;

        // set hide flag
        hide = true;

        // move to lat/lng
        // const [x, y, z] = move_to_LatLng(CENTER_LAT, CENTER_LNG, _radius);

        // // normalize coordinates
        // const x_norm = (x / window.innerWidth) * 2 - 1;
        // const y_norm = (y / window.innerHeight) * 2 - 1;

        // // set target on center
        // controls.target.set(x_norm, y_norm, 1.0);

        // set hide flag
        hide = false;

        // set controls attributes
        controls.enableDamping = true;
        controls.maxDistance = MAX_DISTANCE;
        controls.minDistance = MIN_DISTANCE;

        // load images
        load_images();

        // zoom animation
        await _zoom();
    
        // enable controls
        controls.enabled = true;

        // user control animation
        animate();
    }


    async function _zoom(){
        await new Promise(resolve => {
            function zoom() {

                // decrease radius
                _radius = _radius * 0.99;

                // stop 
                if ( _radius < END_RADIUS ) {
                    resolve();
                    return;
                }

                // zoom
                move_to_LatLng(CENTER_LAT, CENTER_LNG, _radius);
                
                // animate
                requestAnimationFrame( zoom );
            }
            zoom();
        })
    }
    


    // animate map
    function animate(){
        requestAnimationFrame( animate );

        // adjust controls depending on zoom level
        const distance_ratio = (controls.getDistance() - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)
        controls.rotateSpeed = 0.5 * (2 * distance_ratio);
        controls.panSpeed = 4.0 * distance_ratio;
        controls.zoomSpeed = 4.0 * distance_ratio;

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
    bind:orient_north_up={orient_north_up} bind:move_to_LatLng={move_to_LatLng} bind:load_image={load_image}
/>


<style>
    
</style>
