<script>

    // import 
    import { EARTH_RADIUS_PX } from './components/Map/config';
    import { vertex } from './components/Map/libs';

    import * as THREE from 'three';

    // import components
    import Map from './components/Map/Map.svelte';

    // map variables
    let map_ready, first_run = true;
    let camera, renderer, scene;
    let markers, countries, earth;

    // city of interest
    const START_RADIUS = EARTH_RADIUS_PX * 3;
    const END_RADIUS = EARTH_RADIUS_PX * 1.02;
    const AOE_LAT = 36.2304;
    const AOE_LNG = 49.9935;

    // init
    let oriented = false;
    let last_last_y = 0;
    let last_y = 0;
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

    
    function move_above(camera, lat, lng) {

        // convert to px
        const { x, y, z } = vertex([lat, lng], _radius);

        // position the camera right above
        camera.position.x = x;
        camera.position.y = y;
        camera.position.z = z;

        // rotate the camera to face origin
        camera.lookAt( 0, 0, 0 );

    }

    function get_position_of_north_pole(){

        // get north pole marker
        const { x, y, z } = markers.children[0].position;

        // copy to vector
        var vector = new THREE.Vector3();
        vector.set( x, y, z );

        // map to normalized device coordinate (NDC) space
        vector.project( camera );

        // map to 2D screen space
        const north_pole_x = vector.x + 1;
        const north_pole_y = - vector.y + 1;

        return {
            'x': north_pole_x,
            'y': north_pole_y
        };
    }
    

    // animate map
    function animate(){
        requestAnimationFrame( animate );

        // ensure map is fully loaded
        if (!map_ready) return;

        if (first_run) {
            first_run = false;
            move_above(camera, AOE_LAT, AOE_LNG)
        }

        // ------------------------------------------------------------------------------
        // ------------------------------------------------------------------------------

        // extract marker of north pole
        const { x, y } = get_position_of_north_pole();

        // check
        if (last_last_y > last_y && last_y < y) { 
            oriented = true;

        } else {

            // update
            last_last_y = last_y;
            last_y = y;
            
            if (!oriented) camera.rotation.z += 0.05;
        }

        // ------------------------------------------------------------------------------
        // ------------------------------------------------------------------------------
       
        // rotate
        if (oriented) {

            // update radius
            if (_radius > END_RADIUS) _radius = _radius * 0.99;

            // convert to px
            const { x, y, z } = vertex([AOE_LAT, AOE_LNG], _radius);

            // position the camera right above
            camera.position.x = x;
            camera.position.y = y;
            camera.position.z = z;
        }

        // ------------------------------------------------------------------------------
        // ------------------------------------------------------------------------------

        // render
        renderer.render( scene, camera );
    }
    animate();
    

</script>


<main>

    <!-- Hide -->
    {#if !oriented}
        <div class="curtain"></div>
    {/if}
    
    <!-- 3D Background -->
    <Map
        bind:ready={map_ready} 
        bind:camera={camera} bind:scene={scene} bind:renderer={renderer} 
        bind:object_countries={countries} bind:object_earth={earth} bind:object_markers={markers}
    />

</main>


<style>
    
    main {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
		padding: 0px;
		text-align: center;
	}

    .curtain {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 99;
        background-color: #eee;
    }

</style>
