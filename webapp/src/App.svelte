<script>

    // import 
    import { EARTH_RADIUS_PX } from './components/Map/config';
    import { vertex } from './components/Map/libs';

    // import components
    import Loader from './components/Loader.svelte';
    import Map from './components/Map/Map.svelte';

    // map variables
    let map_ready;
    let hide = true;
    let camera, renderer, scene;
    let markers, countries, earth;
    let orient_north_up;

    // city of interest
    const START_RADIUS = EARTH_RADIUS_PX * 3;
    const END_RADIUS = EARTH_RADIUS_PX * 1.02;
    const AOE_LAT = 36.2304;
    const AOE_LNG = 49.9935;

    // init
    let _radius = START_RADIUS;


    function orbit_angle(point, radius, angle_increase = 0.01) {

        // destructure
        const [adjacent, opposite] = point;

        // get current angle
        const current_angle = Math.atan2(opposite, adjacent);

        // increment angle
        let next_angle = current_angle + angle_increase;

        // reset
        if (next_angle > 2 * Math.PI) next_angle = 0.0;

        // convert back to position
        const _opposite = Math.sin(next_angle) * radius;
        const _adjacent = Math.cos(next_angle) * radius;

        return [_adjacent, _opposite]
    }

    
    async function move_above(camera, lat, lng) {

        // convert to px
        const { x, y, z } = vertex([lat, lng], _radius);

        // position the camera right above
        camera.position.x = x;
        camera.position.y = y;
        camera.position.z = z;

        // rotate the camera to face origin
        camera.lookAt( 0, 0, 0 );

        // orient north pole up
        await orient_north_up();
    }

    // on map ready
    $: if(map_ready){ 
        init(); 
    }

    async function init() {

        hide = true;
        await move_above(camera, AOE_LAT, AOE_LNG);
        hide = false;

        animate();
    }

    // animate map
    async function animate(){

        // update radius
        if (_radius > END_RADIUS) _radius = _radius * 0.99;

        // convert to px
        const { x, y, z } = vertex([AOE_LAT, AOE_LNG], _radius);

        // position the camera right above
        camera.position.x = x;
        camera.position.y = y;
        camera.position.z = z;

        // render
        renderer.render( scene, camera );

        // animate
        requestAnimationFrame( animate );
    }


</script>


{#if hide}
    <Loader/>
{/if}


<!-- 3D Background -->
<Map
    bind:ready={map_ready} 
    bind:camera={camera} bind:scene={scene} bind:renderer={renderer} 
    bind:object_countries={countries} bind:object_earth={earth} bind:object_markers={markers}
    bind:orient_north_up={orient_north_up}
/>


<style>
    
</style>
