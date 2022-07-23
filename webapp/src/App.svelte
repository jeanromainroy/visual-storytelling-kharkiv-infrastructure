<script>

    // import components
    import Loader from './components/Loader.svelte';
    import Map from './components/Map/Map.svelte';

    // import config
    import { MAX_DISTANCE, MIN_DISTANCE, CENTER_LAT, CENTER_LNG, START_RADIUS, END_RADIUS } from './config.js';

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

        // set controls attributes
        controls.enableDamping = true;
        controls.maxDistance = MAX_DISTANCE;
        controls.minDistance = MIN_DISTANCE;

        // adjust controls depending on zoom level
        // const distance_ratio = (controls.getDistance() - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE)
        controls.rotateSpeed = 0.0007
        controls.panSpeed = 0.0007
        controls.zoomSpeed = 0.0007

        // rotate
        controls.autoRotate = true;

        // load images
        load_images();

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
