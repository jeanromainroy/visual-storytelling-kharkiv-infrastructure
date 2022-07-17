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
    import { pairs, vertex, createMarkerFromXYZ, createMarkerFromLatLng } from "./libs.js";

    // import config
    import { fov, near, far, 
              EARTH_RADIUS_PX, MARKER_SIZE,
              MAT_POINT, MAT_LINE, MAT_MESH } from './config.js';

    // import world topology
    import topology from '../../assets/world-topography-50m.json';

    // import landmarks
    import landmarks from '../../assets/landmarks.json';

    onMount(() => {

        // prepare the world's GeoJSON MultiLineString in spherical coordinates
        const countries = topojson.mesh(topology, topology['objects']['countries']);

        // grab canvas
        const canvas = document.querySelector('#bg');

        // init elements
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, near, far );
        renderer = new THREE.WebGLRenderer({
            alpha: true,
            canvas: canvas
        });

        // set renderer attributes
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );

        // create earth
        const geometry = new THREE.SphereGeometry( EARTH_RADIUS_PX - 0.5, 128, 128);
        object_earth = new THREE.Mesh( geometry, MAT_MESH(0xFFFFFF, 1.0, false) );

        // create countries
        object_countries = new THREE.Object3D();
        countries['coordinates'].forEach(line => {

            // project each point
            const points_projected = line.map(point => vertex(point));

            // pair points
            const points_projected_paired = pairs(points_projected)

            // create object
            const geometry = new THREE.BufferGeometry().setFromPoints( points_projected_paired );

            // add
            object_countries.add(new THREE.LineSegments(geometry, MAT_LINE()));
        })


        // create markers
        object_markers = new THREE.Object3D();
        object_markers.add(createMarkerFromLatLng(90.0, 0.0, 0)); // north pole
        landmarks['features'].forEach(feature => {

            // destructure
            const { properties, geometry } = feature;

            if ( geometry['type'] === 'MultiPoint' ) {
                geometry['coordinates'].forEach(point => {
                    const [lng, lat] = point;
                    const object_marker = createMarkerFromLatLng(lat, lng, MARKER_SIZE);
                    object_markers.add(object_marker);
                })
            } else if ( geometry['type'] === 'Point' ) {
                const [lng, lat] = geometry['coordinates'];
                const object_marker = createMarkerFromLatLng(lat, lng, MARKER_SIZE);
                object_markers.add(object_marker);
            }
        });

        // add to scene
        scene.add(object_earth);
        scene.add(object_countries);
        scene.add(object_markers);

        // Use of the Raycaster inspired by  webgl_interactive_cubes.html, in the THREE.js project examples directory
        let raycaster = new THREE.Raycaster();
        let mouse = new THREE.Vector2()

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
            scene.children[0].updateMatrixWorld()
            const intersects = raycaster.intersectObjects([scene.children[0]]);

            // add markers
            if (intersects.length > 0) {
                intersects.forEach(intersect => {
                    
                    // destructure
                    const { x, y, z } = intersect.point;
                    
                    // create marker at intersection point
                    const object_marker = createMarkerFromXYZ(x, y, z);

                    // add to ensemble object
                    object_markers.add(object_marker);
                })
            }

            // render
            renderer.render( scene, camera );
        })

        // render
        renderer.render( scene, camera );
        
        // set flag ready
        ready = true;
    })


</script>

<canvas id="bg" class="fade-in-long"></canvas>

<style>

    canvas {
        position: absolute;
        top: 0px;
        left: 0px;
        width: 100%;
        background-color: #eee;
    }

</style>