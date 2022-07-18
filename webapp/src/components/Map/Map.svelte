<script>

    // properties
    export let camera, renderer, scene, raycaster, mouse, controls;
    export let object_markers, object_countries, object_earth, object_streets;
    export let ready = false;

    // import libs
    import { onMount } from "svelte";
    import * as THREE from 'three';
    import * as d3 from 'd3';
    import * as topojson from 'topojson-client';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

    // import scripts
    import { build_earth, build_paths, build_markers, build_lines, build_north_pole,
            get_object_screen_position, vertex } from "./libs.js";

    // import config
    import { fov, near, far } from './config.js';

    // import geojsons
    import topology from '../../assets/world-topography-110m.json';
    import streets from '../../assets/streets.json';
    import landmarks from '../../assets/landmarks.json';

    // prepare the world's GeoJSON MultiLineString in spherical coordinates
    const countries = topojson.mesh(topology, topology['objects']['countries']);

    // build earth
    object_earth = build_earth();
    object_countries = build_paths(countries['coordinates']);
    object_streets = build_lines(streets['features'])
    object_markers = build_markers(landmarks['features']);
    const object_north_pole = build_north_pole();

    // variables
    let marker_highlighted = false;


    // helper functions
    function reset_color_of_markers(){

        // check if we have highlighted markers
        if (!marker_highlighted) return;

        // reset color
        object_markers.children.forEach(obj => obj.material.color.setHex( 0xff0000 ));

        // set flag
        marker_highlighted = false;
    }


    function get_markers_from_mouse_event(event) {

        // destructure event
        const { clientX, clientY } = event;

        // set mouse x,y attributes
        mouse.x = (clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(clientY / window.innerHeight) * 2 + 1;

        // update
        camera.updateMatrixWorld();
        raycaster.setFromCamera(mouse, camera);

        // check intersect with earth (i.e. first children, because added first)
        const intersects = raycaster.intersectObjects([scene.children[3]]);

        return intersects;
    }


    onMount(async () => {

        // grab canvas
        const canvas = document.querySelector('#bg');

        // init elements
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, near, far );
        renderer = new THREE.WebGLRenderer({ alpha: true, canvas: canvas });
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2()
        controls = new OrbitControls( camera, renderer.domElement );

        // set renderer attributes
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );

        // add to scene (do not change order)
        scene.add(object_earth);
        scene.add(object_countries);
        scene.add(object_streets);
        scene.add(object_markers);
        scene.add(object_north_pole);

        // set onclick listener
        canvas.addEventListener('mousemove', event => {
            event.preventDefault();

            // get intersected markers
            const intersects = get_markers_from_mouse_event(event);

            // reset colors
            reset_color_of_markers();

            // check
            if (intersects.length === 0) return;

            // set color
            intersects.forEach(intersect => intersect.object.material.color.setHex( 0x00ff00 ))

            // set flag
            marker_highlighted = true;

            // render
            renderer.render( scene, camera );
        })


        canvas.addEventListener('click', event => {
            event.preventDefault();

            // get intersected markers
            const intersects = get_markers_from_mouse_event(event);

            // check
            if (intersects.length === 0) return;

            // set color
            intersects.forEach(intersect => {
                console.log(intersect['object']['properties'])
            })
        })


        // update control
        controls.update();

        // render
        renderer.render( scene, camera );
        
        // set flag ready
        ready = true;
    })



    export const move_to_LatLng = (lat, lng, radius) => {

        // convert to px
        const { x, y, z } = vertex([lat, lng], radius);

        // position the camera right above
        camera.position.x = x;
        camera.position.y = y;
        camera.position.z = z;

        // update control
        controls.update();

        // render
        renderer.render( scene, camera );

        return [x, y, z];
    }


    export const orient_north_up = async () => {

        // init process variables
        let last_last_y = 0;
        let last_y = 0;

        // rotate the camera to face origin
        camera.lookAt( 0, 0, 0 );

        // initial camera rotation
        const initial_rotation = camera.rotation.z;


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
                camera.rotation.z += 0.02;
                    
                // render
                renderer.render( scene, camera );

                // animate
                requestAnimationFrame( brute_force );
            }

            brute_force();
        })

        return camera.rotation.z - initial_rotation;
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