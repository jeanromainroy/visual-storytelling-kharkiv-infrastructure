<script>

    // ------- STYLING -------
    const textBottomPadding = 2
    const textFontStyle = 'bold 14px Arial'
    const overlayBlackout_color = 'black';
    const overlayBlackout_opacity = '1.0';
    const overlayFailed_color = 'red';
    const overlayFailed_opacity = '0.2';
    const overlayNull_color = 'orange';
    const overlayNull_opacity = '0.2';
    const overlayString_color = 'SaddleBrown';
    const overlayString_opacity = '0.2';
    const overlayEmpty_color = 'SkyBlue';
    const overlayEmpty_opacity = '0.4';
    const overlayDecoded_color = 'green';
    const overlayDecoded_opacity = '0.2';
    const overlayOnMouseOver_color = 'white';
    const overlayOnMouseOver_opacity = '0.8';
    // -----------------------

    // ui elements
    let imgCanvas, imgContext, overlayCanvas, overlayContext;
    let canvasWidth, canvasHeight;

    // variables
    let image = null;
    let display = false;
    let ready = false;


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


    function computeResizeFactor(image_width, image_height) {

        // set actual width
        const { clientWidth, clientHeight } = document.getElementById('canvas-container');

        // init
        let offsetLeft, offsetTop, width, height, resizeFactor;

        if (image_width < clientWidth && image_height < clientHeight) {
            // if smaller than canvas
            offsetLeft = Math.round((clientWidth - image_width) / 2.0)
            offsetTop = Math.round((clientHeight - image_height) / 2.0)
            width = image_width;
            height = image_height;
            resizeFactor = 1.0;

        } else {
            // if bigger than canvas
            resizeFactor = Math.min(clientWidth / (1.0 * image_width), clientHeight / (1.0 * image_height))
            width = Math.floor(image_width * resizeFactor)
            height = Math.floor(image_height * resizeFactor)
            offsetLeft = Math.round((clientWidth - width) / 2.0)
            offsetTop = Math.round((clientHeight - height) / 2.0)
        }

        return {
            'offsetLeft': offsetLeft,
            'offsetTop': offsetTop,
            'width': width,
            'height': height,
            'resizeFactor': resizeFactor
        }
    }


    async function load_lines(svg_url) {

        // init
        let multilines = []
        let success = false;

        // send a request for the image
        await new Promise(function (resolve, reject) {

            // init xml requests
            const xhr = new XMLHttpRequest();
            xhr.open("GET", svg_url, false);

            // Following line is just to be on the safe side;
            // not needed if your server delivers SVG with correct MIME type
            xhr.overrideMimeType("image/svg+xml");
            xhr.onload = () => {
                success = true;
                
                // extract polygons
                const polygons = xhr.responseXML.getElementsByTagName('polygon');
                
                // go through
                for (const polygon of polygons) {

                    // init line
                    let multiline = [];

                    // push points
                    for (const point of polygon['points']) {

                        // destructure
                        const { x, y } = point;

                        // push
                        multiline.push( [ x, y ] )
                    }

                    // push 
                    multilines.push(multiline)
                }
                
                resolve();
            }
            xhr.onerror = () => {
                resolve();
            }

            xhr.send("");
        })

        // validate
        if (!success) return null;

        return multilines;
    }


    async function load_image(image_url){

        // init
        let asset; 
        let success = false;

        // send a request for the image
        await new Promise(function (resolve, reject) {
            asset = new Image()
            asset.onload = () => {
                resolve(asset);
                success = true;
            }
            asset.onerror = () => {
                resolve(null);
            }
            asset.src = image_url
        })

        // validate
        if (!success) return null;

        return asset;
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
                overlayContext.globalAlpha = overlayBlackout_opacity
                overlayContext.strokeStyle = 'red'
                overlayContext.stroke()

            }, i * 50)
        })
    }
    

    // function to launch the image box
    export async function show(image_url, svg_url){

        // load image asset
        const asset = await load_image(image_url);
        if (asset === undefined || asset === null) return;

        // load svg asset
        const multilines = await load_lines(svg_url);

        // compute width, height and rotation
        let image_width = asset.width;
        let image_height = asset.height;

        // set canvas width and height
        canvasWidth = image_width;
        canvasHeight = image_height;

        // draw
        setTimeout(async () => {

            // reset canvas
            reset();

            // resize factor
            const { width, height, resizeFactor } = computeResizeFactor(image_width, image_height);

            // draw (with the rotation)
            imgContext.drawImage(asset, 0, 0, asset.width, asset.height);

            // resize
            imgCanvas.style.width = `${width}px`;
            imgCanvas.style.height = `${height}px`;
            overlayCanvas.width = width
            overlayCanvas.height = height

            // offset
            const offsetLeft = 0;
            const offsetTop = 0;

            // init 
            let multilines_resized = [];

            // resize the rectangles
            multilines.forEach(multiline => {

                // init
                let multiline_resized = [];

                // go through
                multiline.forEach(point => {

                    // destructure
                    const [x, y] = point;

                    // resize
                    const x_resized = Math.round(x * resizeFactor + offsetLeft);
                    const y_resized = Math.round(y * resizeFactor + offsetTop);

                    // push
                    multiline_resized.push([x_resized, y_resized]);
                })

                // push
                multilines_resized.push(multiline_resized);
            })

            // overlay the data on top of the image
            render_overlay(multilines_resized);

        }, 150);
    }

</script>

<!-- The Image Box -->
<aside id="image_box">
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