<script>

    // import scripts
    import { computeResizeFactor, load_image, load_svg_elements } from './scripts.js';

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


    function render_overlay (svg_elements) {

        // clear Overlay
        overlayContext.clearRect(0, 0, canvasWidth, canvasHeight);

        svg_elements.forEach((svg_element, i) => {

            // destructure
            const { type, data, style } = svg_element;
        
            setTimeout(() => {

                // init styling to default
                overlayContext.strokeWidth = 1.0;
                overlayContext.globalAlpha = 1.0;
                overlayContext.strokeStyle = 'none';
                overlayContext.fillStyle = 'none';

                if (type === 'polyline') {

                    // make path
                    overlayContext.beginPath()
                    overlayContext.moveTo(data[0][0], data[0][1])
                    
                    // move line around
                    for (const point of data) {
                        const [x, y] = point;
                        overlayContext.lineTo(x, y)
                    }

                    // init
                    let isStroke = false;

                    // set styling
                    style.forEach(styling => {
                        
                        // destructure
                        const [ name, value ] = styling;

                        // set
                        if (name === 'opacity') overlayContext.globalAlpha = +value;
                        if (name === 'stroke') overlayContext.strokeStyle = value;

                        if (name === 'stroke' && value !== 'none') {
                            isStroke = true;
                            overlayContext.strokeStyle = value;
                        }
                    })

                    // draw
                    if (isStroke) overlayContext.stroke()
                }


                if (type === 'polygon' || type === 'rect') {

                    // make path
                    overlayContext.beginPath()
                    overlayContext.moveTo(data[0][0], data[0][1])
                    
                    // move line around
                    for (const point of data) {
                        const [x, y] = point;
                        overlayContext.lineTo(x, y)
                    }

                    // close
                    overlayContext.closePath()

                    // init
                    let isFill = false;
                    let isStroke = false;

                    // set styling
                    style.forEach(styling => {
                        
                        // destructure
                        const [ name, value ] = styling;

                        // set
                        if (name === 'opacity') overlayContext.globalAlpha = +value;
                        if (name === 'stroke-width') overlayContext.strokeWidth = value;

                        if (name === 'stroke' && value !== 'none') {
                            isStroke = true;
                            overlayContext.strokeStyle = value;
                        }

                        if (name === 'fill' && value !== 'none') {
                            isFill = true;
                            overlayContext.fillStyle = value;
                        }
                    })

                    // draw
                    if (isStroke) overlayContext.stroke();
                    if (isFill) overlayContext.fill();
                }

                
                // PATH 
                if (type === 'path') {

                    // convert to path
                    const path = new Path2D(data);

                    // init
                    let isFill = false;
                    let isStroke = false;

                    // set styling
                    if (Array.isArray(style)) {
                        style.forEach(styling => {
                            
                            // destructure
                            const [ name, value ] = styling;

                            // set
                            if (name === 'opacity') overlayContext.globalAlpha = +value;
                            if (name === 'stroke') overlayContext.strokeStyle = value;

                            if (name === 'stroke' && value !== 'none') {
                                isStroke = true;
                                overlayContext.strokeStyle = value;
                            }

                            if (name === 'fill' && value !== 'none') {
                                isFill = true;
                                overlayContext.fillStyle = value;
                            }
                        })
                    } else { 
                        overlayContext.fillStyle = 'black';
                    }
                    

                    // draw
                    if (isStroke) overlayContext.stroke(path);
                    if (isFill) overlayContext.fill(path);
                }              
                

            }, i * 50)
        })
    }


    // function to launch the image box
    export async function show(image_url, svg_url){

        // set display flag
        display = false;

        // load image asset
        const asset = await load_image(image_url);
        if (asset === undefined || asset === null) return;

        // load svg asset
        const svg_elements = await load_svg_elements(svg_url);
        if (svg_elements === undefined || svg_elements === null) return;

        // compute width, height and rotation
        const image_width = asset.width;
        const image_height = asset.height;

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
            const { width, height } = computeResizeFactor(clientWidth, clientHeight, image_width, image_height);

            // resize canvas
            imgCanvas.style.width = `${width}px`;
            imgCanvas.style.height = `${height}px`;
            overlayCanvas.style.width = `${width}px`;
            overlayCanvas.style.height = `${height}px`;

            // draw image
            imgContext.drawImage(asset, 0, 0, image_width, image_height);

            // draw svg elements
            setTimeout(() => {
                render_overlay(svg_elements);
            }, 2000);

        }, 1000);
    }

</script>

<!-- The Image Box -->
{#if display}
<aside id="image_box" class="fade-in">
    <div id="canvas-container">
        <canvas id="img-canvas"></canvas>
        <canvas id="overlay-canvas"></canvas>
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
    }

    #img-canvas {
        opacity: 0.5;
    }


    /* --- Transtions --- */
    .fade-in {
        animation: fadeIn 1.5s;
        -webkit-animation: fadeIn 1.5s;
        -moz-animation: fadeIn 1.5s;
        -o-animation: fadeIn 1.5s;
        -ms-animation: fadeIn 1.5s;
        opacity: 1.0;
    }

    .fade-in-long {
        animation: fadeIn 3.0s;
        -webkit-animation: fadeIn 3.0s;
        -moz-animation: fadeIn 3.0s;
        -o-animation: fadeIn 3.0s;
        -ms-animation: fadeIn 3.0s;
        opacity: 1.0;
    }

    .fade-out {
        animation: fadeOut 0.5s;
        -webkit-animation: fadeOut 0.5s;
        -moz-animation: fadeOut 0.5s;
        -o-animation: fadeOut 0.5s;
        -ms-animation: fadeOut 0.5s;
        opacity: 0.0;
    }

    .footer-up {
        animation: moveUp 0.5s;
        -webkit-animation: moveUp 0.5s;
        -moz-animation: moveUp 0.5s;
        -o-animation: moveUp 0.5s;
        -ms-animation: moveUp 0.5s;
        height: var(--footer-height);
    }


    /* --- Fade in --- */
    @keyframes fadeIn {
        0% {opacity:0;}
        100% {opacity:1;}
    }

    @-moz-keyframes fadeIn {
        0% {opacity:0;}
        100% {opacity:1;}
    }

    @-webkit-keyframes fadeIn {
        0% {opacity:0;}
        100% {opacity:1;}
    }

    @-o-keyframes fadeIn {
        0% {opacity:0;}
        100% {opacity:1;}
    }

    @-ms-keyframes fadeIn {
        0% {opacity:0;}
        100% {opacity:1;}
    }


    /* --- Move Up --- */
    @keyframes moveUp {
        0% {height: 0px}
        100% {height: var(--footer-height);}
    }

    @-moz-keyframes moveUp {
        0% {height: 0px}
        100% {height: var(--footer-height);}
    }

    @-webkit-keyframes moveUp {
        0% {height: 0px}
        100% {height: var(--footer-height);}
    }

    @-o-keyframes moveUp {
        0% {height: 0px}
        100% {height: var(--footer-height);}
    }

    @-ms-keyframes moveUp {
        0% {height: 0px}
        100% {height: var(--footer-height);}
    }


    /* --- Fade Out --- */
    @keyframes fadeOut {
        0% {opacity:1;}
        100% {opacity:0;}
    }

    @-moz-keyframes fadeOut {
        0% {opacity:1;}
        100% {opacity:0;}
    }

    @-webkit-keyframes fadeOut {
        0% {opacity:1;}
        100% {opacity:0;}
    }

    @-o-keyframes fadeOut {
        0% {opacity:1;}
        100% {opacity:0;}
    }

    @-ms-keyframes fadeOut {
        0% {opacity:1;}
        100% {opacity:0;}
    }

</style>