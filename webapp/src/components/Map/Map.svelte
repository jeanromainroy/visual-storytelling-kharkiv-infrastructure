<script>

    // properties
    export let canvas;
    export let camera, renderer, scene, raycaster, mouse, controls;
    export let object_markers, object_countries, object_earth;
    export let ready = false;

    // import libs
    import { onMount } from "svelte";
    import * as THREE from 'three';
    import * as topojson from 'topojson-client';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
    import { centerPoint } from "../../libs/geospatial.js";

    // import scripts
    import { build_earth, build_paths, build_markers, build_lines, vertex, increase_radius_of_point, normalize } from "./scripts.js";

    // import config
    import { fov, near, far, MAX_DISTANCE, MIN_DISTANCE, EARTH_RADIUS_PX, MAT_MESH, MOVE_TO_RADIUS } from './config.js';

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


    onMount(async () => {

        // grab canvas
        canvas = document.querySelector('#bg');

        // init elements
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, near, far );
        renderer = new THREE.WebGLRenderer({ alpha: true, canvas: canvas, antialias: true });
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

        // set controls speed
        controls.rotateSpeed = 0.0007
        controls.panSpeed = 0.0007
        controls.zoomSpeed = 0.0007

        // disable user controls
        controls.enabled = false;

        // set listeners
        // set_listeners();

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


    function set_listeners() {

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
            const [ _x, _y, _z ] = increase_radius_of_point(x, y, z, MOVE_TO_RADIUS )

            // animate moving to
            animate_to_xyz(_x, _y, _z)
        })

    }


    function cartesian_to_spherical(vect3){

        // destructure
        const { x, y, z } = vect3;

        // convert
        const r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
        const theta = Math.acos(z / r);
        let phi = Math.atan(y / x);

        // add cadrant
        if (x < 0 && y >= 0) {
            phi += Math.PI;
        } else if (x < 0 && y < 0) {
            phi -= Math.PI;
        } else if (x == 0 && y > 0) {
            phi = Math.PI / 2.0;
        } else if (x == 0 && y < 0) {
            phi = -Math.PI / 2.0;
        }

        return {
            'phi': phi,
            'theta': theta
        }        
    }


    function coordinates_to_sphere_parameters(coordinates) {

        // find center point
        const center = centerPoint(coordinates);
        const center_lng = center[1];
        const center_lat = center[0];

        // extract min/max latitudes and longitudes
        const lngs = coordinates.map(d => d[0]);
        const lats = coordinates.map(d => d[1]);
        const max_lat = Math.max(...lats);
        const min_lat = Math.min(...lats);
        const max_lng = Math.max(...lngs);
        const min_lng = Math.min(...lngs);


        // project lat/lng
        const center_px = vertex([center_lng, center_lat]);
        const min_lat_px = vertex([center_lng, min_lat]);
        const max_lat_px = vertex([center_lng, max_lat]);
        const min_lng_px = vertex([min_lng, center_lat]);
        const max_lng_px = vertex([max_lng, center_lat]);

        // PHI is lat
        // THETA is lat
        // spherical
        const phiStart = Math.PI / 2.0 -0.1 + (1.0 - (max_lat / 90.0)) * (Math.PI / 2.0); // cartesian_to_spherical(min_lat_px)['phi'];
        const phiLength = (Math.PI / 2.0) * (( max_lng - max_lng ) / 90.0); // Math.abs(cartesian_to_spherical(max_lat_px)['phi'] - phiStart) * 100.0;
        const thetaStart = (Math.PI / 2.0) * (max_lng / 90.0) + 0.4 // cartesian_to_spherical(min_lng_px)['theta'];
        const thetaLength = (Math.PI / 2.0) * (( max_lat - min_lat ) / 90.0) // Math.abs(cartesian_to_spherical(max_lng_px)['theta'] - thetaStart) * 100.0;
        console.log('phiStart', phiStart)
        console.log('phiLength', phiLength)
        console.log('thetaStart', thetaStart)
        console.log('thetaLength', thetaLength)
        console.log('\n\n')

        // // normalize
        // const center_normalized = normalize(center_px['x'], center_px['y'], center_px['z'])

        return { phiStart, phiLength, thetaStart, thetaLength };
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


    export const highlight_marker = (incident_id) => {

        // colors
        const dark_red = '0xff0000';
        const light_red = '0xffcccb';

        // reset
        if (incident_id === undefined || incident_id === null) {
            object_markers.children.forEach(obj => obj.material.color.setHex( dark_red ));
            return;
        }

        // update color
        object_markers.children.forEach(obj => {

            // destructure
            const id = obj['properties']['ID'];

            // check
            if (+id === +incident_id) {
                obj.material.color.setHex( dark_red )
            } else {
                obj.material.color.setHex( light_red )
            }
        });
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
        background-color: #333;
    }

</style>