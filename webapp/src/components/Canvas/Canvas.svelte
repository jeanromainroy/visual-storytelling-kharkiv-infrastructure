<script>
    
    // import libs
    import { onMount } from 'svelte';

    // import scripts
    import { computeResizeFactor, load_image, load_json, load_svg_elements } from './scripts.js';

    // ui elements
    let imgCanvas, imgContext, overlayCanvas, overlayContext;
    let canvasWidth, canvasHeight;

    // variables
    let displayed_canvas = false;
    let being_animated = false;
    let display = false;

    // animation variables
    let image_url = null;
    let video_url = null;
    let svg_elements = null;
    let svg_infos = null;
    let animation = null;


    function reset(){

        // Get the image canvas
        imgCanvas = document.getElementById('img-canvas')
        imgContext = imgCanvas.getContext('2d')
        overlayCanvas = document.getElementById('overlay-canvas')
        overlayContext = overlayCanvas.getContext('2d')

        // Set canvas style dimensions
        imgCanvas.width = canvasWidth
        imgCanvas.height = canvasHeight
        overlayCanvas.width = canvasWidth
        overlayCanvas.height = canvasHeight

        // clear the canvas
        imgContext.clearRect(0, 0, canvasWidth, canvasHeight)
        overlayContext.clearRect(0, 0, canvasWidth, canvasHeight)
    }


    function animate() {
        
        // check if already being animated
        if (being_animated) { console.log('already being animated'); return; }
        console.log('starting animation');

        // set flag to true
        being_animated = true;

        // hide svg elements
        svg_elements.forEach(svg_element => { svg_element.style.display = 'none'; });

        // clear Overlay
        overlayContext.clearRect(0, 0, canvasWidth, canvasHeight);

        // get the length of the animate
        const END_TIME_IN_MS = Math.max(...animation.map(step => step['START_TIME_IN_MS'])) + 3000;

        // set flag to done when end time is reached
        setTimeout(() => {
            being_animated = false;
        }, END_TIME_IN_MS);


        // go through animation
        animation.forEach(step => {

            // destructure
            const { ID, START_TIME_IN_MS, SVG_ELEMENTS } = step;

            // animate
            setTimeout(() => {

                svg_elements.forEach((svg_element, i) => {

                    // destructure info
                    const { id, type, opacity } = svg_infos[i];

                    // check
                    if (!SVG_ELEMENTS.includes(id)) return;

                    // display
                    svg_element.style.display = 'block';

                    // set animation class
                    if (opacity === 1.0) {
                        svg_element.classList.add('fadein-15-10');
                    } else if (opacity === 0.7) {
                        svg_element.classList.add('fadein-15-07');
                    }


                    if (type === 'polygon' || type === 'polyline' || (type === 'path' && id[0] !== 't' && id[0] !== 's')) {

                        // get path info
                        const path_length = svg_element.getTotalLength();

                        // set
                        svg_element.style['stroke-dasharray'] = path_length;
                        svg_element.style['stroke-dashoffset'] = path_length;

                        // animate
                        svg_element.classList.add('draw-path');
                    }
                })

            }, START_TIME_IN_MS);
        })
    }


    function set_section_scroll_observer() {

        // grab sections
        const section = document.querySelector("#canvas-container");

        // init observer
        const observer = new IntersectionObserver(function(entries) {
            // isIntersecting is true when element and viewport are overlapping
            // isIntersecting is false when element and viewport don't overlap

            // if overlap, set as displayed section
            displayed_canvas = entries[0].isIntersecting;

        }, { threshold: [0.5] });

        // set target
        observer.observe(section);  
    }


    // on canvas scrolled in view, animate objects
    $: if(displayed_canvas) {
        animate();
    }
    // on canvas scrolled out of view, hide svg elements
    $: if(!displayed_canvas) {
        if (!being_animated && Array.isArray(svg_elements)) svg_elements.forEach(svg_element => { svg_element.style.display = 'none'; });
    }
    
    
    // function to launch the image box
    export async function show(_image_url, objects_url, animation_url, _video_url){

        // set display flag
        display = false;

        // load image asset
        const image_asset = await load_image(_image_url);
        if (image_asset === undefined || image_asset === null) return;

        // load svg objects asset
        const [_svg_elements, _svg_infos] = await load_svg_elements(objects_url);
        if (_svg_elements === undefined || _svg_elements === null || 
            _svg_infos === undefined || _svg_infos === null) return;

        // load animation asset
        const _animation = await load_json(animation_url);
        if (_animation === undefined || _animation === null) return;

        // set
        image_url = _image_url;
        video_url = _video_url;
        svg_elements = _svg_elements;
        svg_infos = _svg_infos;
        animation = _animation;

        // compute width, height and rotation
        const image_width = image_asset.width;
        const image_height = image_asset.height;

        // set canvas width and height
        canvasWidth = image_width;
        canvasHeight = image_height;

        // set display flag
        display = true;

        // draw
        setTimeout(async () => {

            // reset canvas
            reset();

            // set dimensions of canvas
            const { clientWidth, clientHeight } = document.getElementById('canvas-container');

            // resize factor
            const { width, height, resizeFactor } = computeResizeFactor(clientWidth, clientHeight, image_width, image_height);

            // resize canvas
            imgCanvas.style.width = `${width}px`;
            imgCanvas.style.height = `${height}px`;
            overlayCanvas.style.width = `${width}px`;
            overlayCanvas.style.height = `${height}px`;

            // draw image
            imgContext.drawImage(image_asset, 0, 0, image_width, image_height);

            // get svg div
            const svg_div = document.getElementById('svg-div');

            // resize svg div
            svg_div.style.width = `${image_width}px`;
            svg_div.style.height = `${image_height}px`;

            // draw svg elements
            svg_elements.forEach((svg_element, i) => {

                // destructure processed element
                const { id, type, data, style, fill, stroke } = svg_infos[i];

                // set styling
                style.forEach(styling => {

                    // destructure
                    const [ name, value ] = styling;

                    // update
                    svg_element.style[name] = value;
                })

                // hide
                svg_element.style.display = 'none';

                // append raw element
                svg_div.appendChild(svg_element);
            })

            // resize svg div
            svg_div.setAttribute('transform', `scale(${resizeFactor})`);

        }, 150);
    }


    // on UI loaded
    onMount(() => {
        set_section_scroll_observer(); 
    });


</script>


<!-- The Image Box -->
<aside id="image_box" style="display: {display ? 'block' : 'none'}" class="fadein-15-10">

    <!-- Container #1 -->
    <div id="video-container" class="container">
        {#if video_url !== undefined && video_url !== null}
        <video autoplay muted>
            <source src="{video_url}" type="video/mp4">
        </video>
        {/if}
    </div>
    
    <!-- Container #2 -->
    <div id="canvas-container" class="container">
        <canvas id="img-canvas"></canvas>
        <canvas id="overlay-canvas"></canvas>
        <svg id="svg-div"></svg>
    </div>


    <!-- Container #3 -->
    <div id="after-container" class="container">
        
    </div>
</aside>


<style>

    /***** Pop Up Image Box *****/
    #image_box {
        position: absolute;
        top: 8vh;
        left: 8vh;
        right: 8vh;
        bottom: 8vh;
        border: 1px solid #999;
        padding: 32px;
        background-color: rgb(255, 255, 255);
        z-index: 9;
        overflow-y: scroll;
    }

    #image_box .container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
    }

    #image_box canvas {
        position: absolute;
        width: 100%;
        height: 100%;
    }

    #image_box #svg-div {
        position: absolute;
        overflow: visible;
    }

    video {
        width: 70vw;
        height: auto;
    }


    /* --------------------------------------------------------------------------- */
    /* --------------------------------------------------------------------------- */
    /* --------------------------------------------------------------------------- */

    :global(.fadein-15-10) {
        animation: fadeIn10 1.5s;
    }

    :global(.fadein-15-07) {
        animation: fadeIn07 1.5s;
    }

    :global(.fadein-15-05) {
        animation: fadeIn05 1.5s;
    }

    :global(.fadein-15-03) {
        animation: fadeIn03 1.5s;
    }

    /* --- Fade in --- */
    @keyframes fadeIn10 {
        0% {opacity:0;}
        100% {opacity:1;}
    }

    @keyframes fadeIn07 {
        0% {opacity:0;}
        100% {opacity:0.7;}
    }

    @keyframes fadeIn05 {
        0% {opacity:0;}
        100% {opacity:0.5;}
    }

    @keyframes fadeIn03 {
        0% {opacity:0;}
        100% {opacity:0.3;}
    }


    /* --------------------------------------------------------------------------- */
    /* --------------------------------------------------------------------------- */
    /* --------------------------------------------------------------------------- */

    :global(.draw-path) {
        animation: dash 3s linear forwards;
    }

    @keyframes dash {
        to {
            stroke-dashoffset: 0;
        }
    }

</style>