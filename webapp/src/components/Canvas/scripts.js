'use strict';


export function computeResizeFactor(canvas_width, canvas_height, image_width, image_height) {

    // init
    let offsetLeft, offsetTop, width, height, resizeFactor;

    if (image_width < canvas_width && image_height < canvas_height) {
        // if smaller than canvas
        offsetLeft = Math.round((canvas_width - image_width) / 2.0)
        offsetTop = Math.round((canvas_height - image_height) / 2.0)
        width = image_width;
        height = image_height;
        resizeFactor = 1.0;

    } else {
        // if bigger than canvas
        resizeFactor = Math.min(canvas_width / (1.0 * image_width), canvas_height / (1.0 * image_height))
        width = Math.floor(image_width * resizeFactor)
        height = Math.floor(image_height * resizeFactor)
        offsetLeft = Math.round((canvas_width - width) / 2.0)
        offsetTop = Math.round((canvas_height - height) / 2.0)
    }

    return {
        'offsetLeft': offsetLeft,
        'offsetTop': offsetTop,
        'width': width,
        'height': height,
        'resizeFactor': resizeFactor
    }
}


export async function load_lines(svg_url) {

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


export async function load_image(image_url){

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


export function resize_multilines(multilines, resizeFactor) {

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
            const x_resized = Math.round(x * resizeFactor);
            const y_resized = Math.round(y * resizeFactor);

            // push
            multiline_resized.push([x_resized, y_resized]);
        })

        // push
        multilines_resized.push(multiline_resized);
    })

    return multilines_resized;
}
