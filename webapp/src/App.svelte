<script>

    // import components
    import Loader from './components/Loader.svelte';
    import Map from './components/Map/Map.svelte';

    // import config
    import { CENTER_LAT, CENTER_LNG, START_RADIUS, END_RADIUS } from './config.js';

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

        // Upper Left ( 309683.500, 5546495.000) ( 36d20'31.37"E, 50d 2'25.04"N)
        // Lower Left ( 309683.500, 5546190.000) ( 36d20'31.92"E, 50d 2'15.18"N)
        // Upper Right ( 309992.500, 5546495.000) ( 36d20'46.89"E, 50d 2'25.40"N)
        // Lower Right ( 309992.500, 5546190.000) ( 36d20'47.44"E, 50d 2'15.53"N)
        // Center ( 309838.000, 5546342.500) ( 36d20'39.40"E, 50d 2'20.29"N)
        
        const images = [
            { 'url': '1.jpg', 'center': { 'lat': 50.04028889, 'lng': 36.34204722 }, 'width': 0.0, 'height': 0.0 }
        ];


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
        // load_images();

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
