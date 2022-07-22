<script>

    // properties
    export let canvas;
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
    import { build_earth, build_paths, build_markers, build_lines, vertex } from "./libs.js";

    // import config
    import { fov, near, far, DEBUG } from './config.js';

    // import geojsons
    import topology from './assets/world-topography-110m.json';
    import incidents from '../../../../data/incidents.json';
    // import streets from '../../assets/highways.json';

    // prepare the world's GeoJSON MultiLineString in spherical coordinates
    const countries = topojson.mesh(topology, topology['objects']['countries']);

    // set config
    THREE.Object3D.DefaultUp.set(0.0, 0.0, 1.0);

    // build earth
    object_earth = build_earth();
    object_countries = build_paths(countries['coordinates']);
    object_markers = build_markers(incidents['features']);

    // object_streets = build_lines(streets['features'])

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
        // scene.add(object_streets);
        
        // DEBUG MODE
        if (DEBUG) {
            const axesHelper = new THREE.AxesHelper( 100 );
            scene.add( axesHelper );
        }
        
        // update controls
        controls.update();

        // render
        renderer.render( scene, camera );

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

        // set flag ready
        ready = true;
    })


    export const load_image = (url, center_lat, center_lng, width, height) => {

        // load image as texture
        const texture = new THREE.TextureLoader().load( url );

        // get texture image info
        // const { height, width } = texture.image;

        // immediately use the texture for material creation
        const material = new THREE.MeshBasicMaterial( { map: texture, side: THREE.DoubleSide } );

        // create plane
        const geometry = new THREE.PlaneGeometry( width, height );
        const plane = new THREE.Mesh( geometry, material );

        // project lat/lng
        const vector = vertex([center_lng, center_lat]);

        // destructure
        const { x, y, z } = vector;

        // set position
        plane.position.set(x, y, z);

        // rotate
        plane.lookAt( 0, 0, 0 );

        // add to scene
        scene.add( plane );

        // update control
        controls.update();

        // render
        renderer.render( scene, camera );
    }


    export const move_to_LatLng = (lat, lng, radius) => {

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