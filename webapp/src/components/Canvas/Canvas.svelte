<script>
    
    // import scripts
    import { computeResizeFactor, load_image, load_json, load_svg_elements } from './scripts.js';

    // ui elements
    let imgCanvas, imgContext, overlayCanvas, overlayContext;
    let canvasWidth, canvasHeight;

    // variables
    let display = false;


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


    function animate(svg_elements, svg_infos, animation) {

        // clear Overlay
        overlayContext.clearRect(0, 0, canvasWidth, canvasHeight);

        // go through animation
        animation.forEach(step => {

            // destructure
            const { ID, ANIMATION_TYPE, START_TIME_IN_MS, END_TIME_IN_MS, SVG_ELEMENTS } = step;

            // animate
            setTimeout(() => {

                svg_elements.forEach((svg_element, i) => {

                    // destructure info
                    const { id, opacity } = svg_infos[i];

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
                })

            }, START_TIME_IN_MS);
        })
    }

    
    // function to launch the image box
    export async function show(image_url, objects_url, animation_url){

        // set display flag
        display = false;

        // load image asset
        const image_asset = await load_image(image_url);
        if (image_asset === undefined || image_asset === null) return;

        // load svg objects asset
        const [svg_elements, svg_infos] = await load_svg_elements(objects_url);
        if (svg_infos === undefined || svg_infos === null) return;

        // load animation asset
        const animation = await load_json(animation_url);
        if (animation === undefined || animation === null) return;

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

            // animate objects
            animate(svg_elements, svg_infos, animation);

        }, 150);
    }

</script>

<!-- The Image Box -->
{#if display}
    <aside id="image_box" class="fade-in">
        <div id="canvas-container">
            <canvas id="img-canvas"></canvas>
            <canvas id="overlay-canvas"></canvas>
            <svg id="svg-div"></svg>
        </div>
    </aside>
{/if}


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
    }

    #image_box #canvas-container {
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

    /* --- Transtions --- */
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

</style>