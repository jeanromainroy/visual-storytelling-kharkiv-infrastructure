<script>

    // properties
    export let canvas;
    export let camera, renderer, scene, controls;
    export let ready = false;

    // import libs
    import { onMount } from "svelte";
    import * as THREE from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

    // import scripts
    import { distance_between_points_3D } from './libs/geometry.js';
    import { vertex, coordinates_to_sphere_parameters } from './libs/geospatial.js';
    import { build_earth, build_countries, build_markers } from "./scripts.js";

    // import config
    import { fov, near, far, 
            MAX_DISTANCE, MIN_DISTANCE, 
            EARTH_RADIUS_PX, MOVE_TO_RADIUS,
            MARKER_COLOR_LOWLIGHTED, MARKER_COLOR_HIGHLIGHTED, MARKER_COLOR_DEFAULT } from './config.js';

    // set config
    THREE.Object3D.DefaultUp.set(0.0, 0.0, 1.0);

    // constants
    const OBJECT_TYPE_KEY = '_object_type';
    const OBJECT_TYPE_MARKER = '_markers';



    onMount(async () => {

        // grab canvas
        canvas = document.querySelector('#bg');

        // init elements
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, near, far );
        renderer = new THREE.WebGLRenderer({ alpha: true, canvas: canvas, antialias: true });

        // set renderer attributes
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );

        // create control
        controls = new OrbitControls( camera, renderer.domElement );
        
        // set controls attributes
        controls.enableDamping = true;
        controls.maxDistance = MAX_DISTANCE;
        controls.minDistance = MIN_DISTANCE;

        // set controls speed
        controls.rotateSpeed = 0.0007
        controls.panSpeed = 0.0007
        controls.zoomSpeed = 0.0007

        // disable user controls
        controls.enabled = false;

        // build earth
        const object_earth = build_earth();
        const object_countries = build_countries();
        
        // add earth to scene
        scene.add(object_earth);
        scene.add(object_countries);
        
        // user control animation
        animate();

        // rotate
        controls.autoRotate = true;

        // set flag ready
        ready = true;
    })


    // animate map
    function animate(){
        requestAnimationFrame( animate );

        // update control
        controls.update();

        // render
        renderer.render( scene, camera );
    }


    export const load_image = (url, coordinates, transparent = false, opacity = 1.0 ) => {

        // load image as texture
        const texture = new THREE.TextureLoader().load( url );

        // convert coordinates to sphere parameters
        const { phiStart, phiLength, thetaStart, thetaLength } = coordinates_to_sphere_parameters(coordinates);

        // immediately use the texture for material creation
        let material = new THREE.MeshBasicMaterial( { color: new THREE.Color( 0xff0000 ) } );
        // if (transparent) {
        //     material = new THREE.MeshBasicMaterial( { map: texture, opacity: opacity } );
        // } else {
        //     material = new THREE.MeshBasicMaterial( { map: texture } );
        // }

        // create object
        const geometry = new THREE.SphereGeometry( EARTH_RADIUS_PX, 128, 128, phiStart, phiLength, thetaStart, thetaLength );
        const object = new THREE.Mesh( geometry, material );

        // set position
        // object.position.set(center['x'], center['y'], center['z']);
        object.position.set(0, 0, 0);

        // rotate to face opposite of earths center
        // object.lookAt( center_normalized['x'] * EARTH_RADIUS_PX * 2, center_normalized['y'] * EARTH_RADIUS_PX * 2, center_normalized['z'] * EARTH_RADIUS_PX * 2 );

        // add to scene
        scene.add( object );

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
    }


    export const animate_to_latlng = async (lat, lng, radius = MOVE_TO_RADIUS) => {

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
        const distance = distance_between_points_3D(x0, y0, z0, x1, y1, z1);

        // init accumulated steps towards destination 
        let t = 0.0;

        await new Promise((resolve) => {
            
            function animate(){

                // compute distance to destination
                const distance_remaining = distance_between_points_3D(camera.position.x, camera.position.y, camera.position.z, x1, y1, z1);

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


    export const animate_to_xyz = async (x1, y1, z1) => {

        // get current position
        const x0 = camera.position['x'];
        const y0 = camera.position['y'];
        const z0 = camera.position['z'];

        // compute distance to destination
        const distance = distance_between_points_3D(x0, y0, z0, x1, y1, z1);

        // init accumulated steps towards destination 
        let t = 0.0;

        await new Promise((resolve) => {
            
            function animate(){

                // compute distance to destination
                const distance_remaining = distance_between_points_3D(camera.position.x, camera.position.y, camera.position.z, x1, y1, z1);

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


    export const draw_markers = (features) => {

        // only keep 'MultiPoint' and 'Point'
        const point_features = features.filter(feature => ['MultiPoint', 'Point'].includes(feature['geometry']['type']))

        // build object
        const object_markers = build_markers(point_features);

        // set id
        object_markers[OBJECT_TYPE_KEY] = OBJECT_TYPE_MARKER;

        // add to scene
        scene.add(object_markers);
    }


    export const highlight_marker = (incident_id) => {

        // init
        let object_markers = [];

        // grab all immediate markers objects from scene
        const objects_markers = scene.children.filter(child => child[OBJECT_TYPE_KEY] === OBJECT_TYPE_MARKER);

        // go through and push children
        objects_markers.forEach(object_marker => {
            object_marker.children.forEach(marker => {
                object_markers.push(marker);
            })
        })

        // IF NO INCIDENT ID, set all to default
        if (incident_id === undefined || incident_id === null) {
            object_markers.forEach(marker => {
                marker.material.color.setHex( MARKER_COLOR_DEFAULT )
            })
            return;
        }

        // lowlight all markers
        object_markers.forEach(marker => {
            marker.material.color.setHex( MARKER_COLOR_LOWLIGHTED )
        })

        // highlight the input marker
        object_markers.forEach(marker => {
            if (+marker['properties']['ID'] === +incident_id) {
                marker.material.color.setHex( MARKER_COLOR_HIGHLIGHTED )
            }
        })
    }

</script>

<canvas id="bg" class="fade-in"></canvas>

<style>

    canvas {
        position: absolute;
        top: 0px;
        left: 0px;
        right: 0px;
        bottom: 0px;
        width: 100%;
        height: 100%;
        background-color: #ccc;
    }

</style>