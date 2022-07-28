<script>

    // properties
    export let canvas;
    export let camera, renderer, scene, raycaster, mouse, controls;
    export let object_markers, object_countries, object_earth;
    export let ready = false;

    // import libs
    import { onMount } from "svelte";
    import * as THREE from 'three';
    import * as d3 from 'd3';
    import * as topojson from 'topojson-client';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

    // import scripts
    import { build_earth, build_paths, build_markers, build_lines, vertex, increase_radius_of_point, normalize } from "./libs.js";

    // import config
    import { fov, near, far, DEBUG, MAX_DISTANCE, MIN_DISTANCE, EARTH_RADIUS_PX, MAT_MESH } from './config.js';

    // import geojsons
    import topology from './assets/world-topography-110m.json';
    import incidents from '../../../dist/incidents.json';

    // prepare the world's GeoJSON MultiLineString in spherical coordinates
    const countries = topojson.mesh(topology, topology['objects']['countries']);

    // set config
    THREE.Object3D.DefaultUp.set(0.0, 0.0, 1.0);

    // build earth
    object_earth = build_earth();
    object_countries = build_paths(countries['coordinates']);
    object_markers = build_markers(incidents['features']);

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

        // check if the mouse intersects with markers (i.e. first children, because added first)
        const intersects = raycaster.intersectObjects([scene.children[0]]);

        return intersects;
    }


    onMount(async () => {

        // grab canvas
        canvas = document.querySelector('#bg');

        // init elements
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, near, far );
        renderer = new THREE.WebGLRenderer({ alpha: true, canvas: canvas });
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2()

        // create control
        controls = new OrbitControls( camera, renderer.domElement );
        
        // set renderer attributes
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );

        // add to scene (do not change order)
        scene.add(object_markers);
        scene.add(object_earth);
        scene.add(object_countries);
        
        // update controls
        controls.update();

        // render
        renderer.render( scene, camera );

        // set controls attributes
        controls.enableDamping = true;
        controls.maxDistance = MAX_DISTANCE;
        controls.minDistance = MIN_DISTANCE;

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

            // TODO
            intersects.forEach(intersect => {
                const properties = intersect['object']['properties'];
                const position = intersect['object']['position'];
                console.log(intersect)
                console.log('\n\n')
            })

            // move to
            const { x, y, z } = intersects[0]['object']['position'];

            // increase radius
            const [ _x, _y, _z ] = increase_radius_of_point(x, y, z, EARTH_RADIUS_PX * 1.001)

            // animate moving to
            animate_to_xyz(_x, _y, _z)
        })

        // set flag ready
        ready = true;
    })


    export const load_image = (url, center_lat, center_lng, width, height, transparent = false ) => {

        // project lat/lng
        const center = vertex([center_lng, center_lat]);

        // normalize
        const center_normalized = normalize(center['x'], center['y'], center['z'])

        // load image as texture
        const texture = new THREE.TextureLoader().load( url );

        // immediately use the texture for material creation
        const material = new THREE.MeshBasicMaterial( { map: texture, transparent: transparent } );

        // create plane
        const geometry = new THREE.PlaneGeometry( width, height );
        const plane = new THREE.Mesh( geometry, material );

        // set position
        plane.position.set(center['x'], center['y'], center['z']);

        // rotate to face opposite of earths center
        plane.lookAt( center_normalized['x'] * EARTH_RADIUS_PX * 2, center_normalized['y'] * EARTH_RADIUS_PX * 2, center_normalized['z'] * EARTH_RADIUS_PX * 2 );

        // add to scene
        scene.add( plane );

        // add sphere 
        // sphere.position.set(center['x'], center['y'], center['z']);
        // const sphere = new THREE.Mesh( new THREE.SphereGeometry(0.001, 12, 12), MAT_MESH(0x00FF00, 1.0, false))
        // scene.add( sphere );

        // update control
        controls.update();

        // render
        renderer.render( scene, camera );
    }


    export const move_to_latlng = (lat, lng, radius) => {

        // convert to px
        const { x, y, z } = vertex([lng, lat], radius);

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


    export const distance_between_points = (x0, y0, z0, x1, y1, z1) => {
        return Math.sqrt( Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2) + Math.pow(z1 - z0, 2) );
    }


    export const animate_to_xyz = async (x1, y1, z1) => {

        // get current position
        const x0 = camera.position['x'];
        const y0 = camera.position['y'];
        const z0 = camera.position['z'];

        // compute distance to destination
        const distance = distance_between_points(x0, y0, z0, x1, y1, z1);

        // init accumulated steps towards destination 
        let t = 0.0;

        await new Promise((resolve) => {
            
            function animate(){

                // compute distance to destination
                const distance_remaining = distance_between_points(camera.position.x, camera.position.y, camera.position.z, x1, y1, z1);

                // compute step
                const step = Math.sqrt(distance_remaining / (1.0 * distance)) * 0.01;
                
                // increment
                t += step;

                // make a step towards the destination
                const _x0 = (x1 - x0) * t + x0;
                const _y0 = (y1 - y0) * t + y0;
                const _z0 = (z1 - z0) * t + z0;

                // position the camera right above
                camera.position.x = _x0;
                camera.position.y = _y0;
                camera.position.z = _z0;

                // update control
                controls.update();

                // render
                renderer.render( scene, camera );

                // stop 
                if (t >= 1.0) {
                    resolve();
                    return;
                }

                // animate
                requestAnimationFrame( animate );
            }

            animate();
        });
    }


    export const animate_to_latlng = async (lat, lng, radius) => {

        // get current position
        const x0 = camera.position['x'];
        const y0 = camera.position['y'];
        const z0 = camera.position['z'];

        // get destination position
        const destination = vertex([lng, lat], radius);
        const x1 = destination['x'];
        const y1 = destination['y'];
        const z1 = destination['z'];

        // compute distance to destination
        const distance = distance_between_points(x0, y0, z0, x1, y1, z1);

        // init accumulated steps towards destination 
        let t = 0.0;

        await new Promise((resolve) => {
            
            function animate(){

                // compute distance to destination
                const distance_remaining = distance_between_points(camera.position.x, camera.position.y, camera.position.z, x1, y1, z1);

                // compute step
                const step = Math.sqrt(distance_remaining / (1.0 * distance)) * 0.01;
                
                // increment
                t += step;

                // make a step towards the destination
                const _x0 = (x1 - x0) * t + x0;
                const _y0 = (y1 - y0) * t + y0;
                const _z0 = (z1 - z0) * t + z0;

                // position the camera right above
                camera.position.x = _x0;
                camera.position.y = _y0;
                camera.position.z = _z0;

                // update control
                controls.update();

                // render
                renderer.render( scene, camera );

                // stop 
                if (t >= 1.0) {
                    resolve();
                    return;
                }

                // animate
                requestAnimationFrame( animate );
            }

            animate();
        });
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
        background-color: #333;
        z-index: 1;
    }

</style>