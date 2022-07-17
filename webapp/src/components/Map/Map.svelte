<script>

    // properties
    export let camera, renderer, scene;
    export let object_markers, object_countries, object_earth;
    export let ready = false;

    // import libs
    import { onMount } from "svelte";
    import * as THREE from 'three';
    import * as d3 from 'd3';
    import * as topojson from 'topojson-client';

    // import scripts
    import { createMarkerFromXYZ, createMarkerFromLatLng, 
                build_paths, build_markers, 
                get_object_screen_position } from "./libs.js";

    // import config
    import { fov, near, far, 
              EARTH_RADIUS_PX,
              MAT_MESH } from './config.js';

    // import world topology
    import topology from '../../assets/world-topography-50m.json';

    // import landmarks
    import landmarks from '../../assets/landmarks.json';

    // prepare the world's GeoJSON MultiLineString in spherical coordinates
    const countries = topojson.mesh(topology, topology['objects']['countries']);

    // build earth
    const earth_geometry = new THREE.SphereGeometry( EARTH_RADIUS_PX - 0.5, 128, 128);
    const earth_material = MAT_MESH(0xFFFFFF, 1.0, false);
    object_earth = new THREE.Mesh( earth_geometry, earth_material );

    // build paths
    object_countries = build_paths(countries['coordinates'])

    // build markers
    object_markers = build_markers(landmarks['features']);

    // build north pole
    const object_north_pole = createMarkerFromLatLng(90.0, 0.0, 0);

    onMount(() => {

        // grab canvas
        const canvas = document.querySelector('#bg');

        // init elements
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, near, far );
        renderer = new THREE.WebGLRenderer({ alpha: true, canvas: canvas });
        let raycaster = new THREE.Raycaster();
        let mouse = new THREE.Vector2()

        // set renderer attributes
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );

        // add to scene (do not change order)
        scene.add(object_earth);
        scene.add(object_countries);
        scene.add(object_markers);
        scene.add(object_north_pole);

        // set onclick listener
        canvas.addEventListener('click', event => {
            event.preventDefault();

            // destructure event
            const { clientX, clientY } = event;

            // set mouse x,y attributes
            mouse.x = (clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(clientY / window.innerHeight) * 2 + 1;

            // update
            camera.updateMatrixWorld();
            raycaster.setFromCamera(mouse, camera);

            // check intersect with earth (i.e. first children, because added first)
            const intersects = raycaster.intersectObjects([scene.children[0]]);

            // add markers
            intersects.forEach(intersect => {
                    
                // destructure
                const { x, y, z } = intersect.point;
                
                // create marker at intersection point
                const object_marker = createMarkerFromXYZ(x, y, z);

                // add to ensemble object
                object_markers.add(object_marker);
            })

            // render
            renderer.render( scene, camera );
        })

        // render
        renderer.render( scene, camera );
        
        // set flag ready
        ready = true;
    })


    export const orient_north_up = async () => {

        // init process variables
        let last_last_y = 0;
        let last_y = 0;

        await new Promise(resolve => {

            function brute_force(){
                
                // extract marker of north pole
                const { x, y } = get_object_screen_position(object_north_pole, camera);

                // check
                if (last_last_y > last_y && last_y < y) {
                    resolve();
                    return;
                }
                
                // update
                last_last_y = last_y;
                last_y = y;
                
                // rotate camera
                camera.rotation.z += 0.05;

                // render
                renderer.render( scene, camera );

                // animate
                requestAnimationFrame( brute_force );
            }

            brute_force();
        })        
    }

</script>

<canvas id="bg" class="fade-in-long"></canvas>

<style>

    canvas {
        position: absolute;
        top: 0px;
        left: 0px;
        right: 0px;
        bottom: 0px;
        width: 100%;
        height: 100%;
        background-color: #eee;
        z-index: 1;
    }

</style>