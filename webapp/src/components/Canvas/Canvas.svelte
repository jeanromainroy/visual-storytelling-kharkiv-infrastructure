<script>

    // import scripts
    import { computeResizeFactor, load_image, load_lines, resize_multilines } from './scripts.js';

    // import config
    import { line_opacity, line_color } from './config.js';

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


    function render_overlay (multilines) {

        // clear Overlay
        overlayContext.clearRect(0, 0, canvasWidth, canvasHeight);

        multilines.forEach((multiline, i) => {
        
            setTimeout(() => {

                // make path
                overlayContext.beginPath()
                overlayContext.moveTo(multiline[0][0], multiline[0][1])
                
                for (const point of multiline) {

                    // destructure
                    const [x, y] = point;

                    // line
                    overlayContext.lineTo(x, y)
                }
                overlayContext.closePath();

                // failed
                overlayContext.globalAlpha = line_opacity
                overlayContext.strokeStyle = line_color
                overlayContext.stroke()

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
        const multilines = await load_lines(svg_url);
        if (multilines === undefined || multilines === null) return;

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
            const { width, height, resizeFactor } = computeResizeFactor(clientWidth, clientHeight, image_width, image_height);

            // draw (with the rotation)
            imgContext.drawImage(asset, 0, 0, image_width, image_height);

            // resize
            imgCanvas.style.width = `${width}px`;
            imgCanvas.style.height = `${height}px`;
            overlayCanvas.width = width
            overlayCanvas.height = height

            // resize 
            const multilines_resized = resize_multilines(multilines, resizeFactor)

            // overlay the data on top of the image
            render_overlay(multilines_resized);

        }, 150);
    }

</script>

<!-- The Image Box -->
<aside id="image_box" style="display: {display ? 'block' : 'none'};">
    <section>
        <div id="canvas-container">
            <canvas id="img-canvas"></canvas>
            <canvas id="overlay-canvas"></canvas>
        </div>
    </section>
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
        background-color: rgb(255, 255, 255);
        z-index: 2;
    }

    #image_box section{
        position: absolute;
        top: 32px;
        left: 32px;
        right: 32px;
        bottom: 32px;
        display: flex;
        overflow: hidden;
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

</style>