<script>

    // import 
    import { EARTH_RADIUS_PX } from './components/Map/config';
    import { vertex } from './components/Map/libs';

    // import components
    import Loader from './components/Loader.svelte';
    import Map from './components/Map/Map.svelte';

    // import config
    import { START_RADIUS, MAX_DISTANCE, MIN_DISTANCE, CENTER_LAT, CENTER_LNG, END_RADIUS } from './config.js';

    // map variables
    let map_ready;
    let camera, renderer, scene, controls;
    let markers, countries, earth;
    let orient_north_up, move_to_LatLng;

    // app variables
    let hide = true;
    let rotation_for_north_up = 0.0;
    let zoom_completed = false;
    let _radius = START_RADIUS;


    // on map ready
    $: if(map_ready){ 
        init(); 
    }

    async function init() {

        // disable controls
        controls.enabled = false;

        // set hide flag
        hide = true;

        // move to lat/lng
        const [x, y, z] = move_to_LatLng(CENTER_LAT, CENTER_LNG, _radius);

        // rotate
        rotation_for_north_up = await orient_north_up();

        // set hide flag
        hide = false;

        // // set controls attributes
        controls.enableDamping = true;
        controls.maxDistance = MAX_DISTANCE;
        controls.minDistance = MIN_DISTANCE;

        // normalize coordinates
        const x_norm = (x / window.innerWidth) * 2 - 1;
        const y_norm = (y / window.innerHeight) * 2 - 1;

        // set target on center
        controls.target.set(x_norm, y_norm, 0);

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
        controls.panSpeed = 0.5 * (2 * distance_ratio);
        controls.zoomSpeed = 1.0 * (2 * distance_ratio);

        // update control
        controls.update();

        // TODO
        // camera.rotation.z += rotation_for_north_up;
        
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
    bind:orient_north_up={orient_north_up} bind:move_to_LatLng={move_to_LatLng}
/>


<style>
    
</style>
