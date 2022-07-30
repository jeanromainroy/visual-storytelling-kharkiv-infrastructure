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


export async function load_svg_elements(svg_url) {

    // init
    let svg_elements = []
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

            // grab response
            const response = xhr.responseXML;
            
            // extract elements
            const elements = response.querySelectorAll('polygon,polyline,path,rect');
            
            // go through
            for (const element of elements) {

                // POLYGON
                if (element.nodeName === 'polygon') {

                    // init line
                    let multiline = [];

                    for (const point of element['points']) {

                        // destructure
                        const { x, y } = point;

                        // push
                        multiline.push( [ x, y ] )
                    }

                    // push 
                    svg_elements.push(multiline)
                }

                // POLYLINE
                if (element.nodeName === 'polyline') {

                    // init line
                    let multiline = [];

                    for (const point of element['points']) {

                        // destructure
                        const { x, y } = point;

                        // push
                        multiline.push( [ x, y ] )
                    }

                    // push 
                    svg_elements.push(multiline)
                }

                // RECT
                if (element.nodeName === 'rect') {

                    // init line
                    let multiline = [];

                    // destructure
                    const x = +element.getAttribute('x');
                    const y = +element.getAttribute('y');
                    const width = +element.getAttribute('width');
                    const height = +element.getAttribute('height');

                    // push
                    multiline.push( [ x, y ] )
                    multiline.push( [ x + width, y ] )
                    multiline.push( [ x + width, y + height ] )
                    multiline.push( [ x, y + height ] )
                    multiline.push( [ x, y ] )

                    // push 
                    svg_elements.push(multiline)
                }


                // PATH
                if (element.nodeName === 'path') {

                    // destructure
                    const d = element.getAttribute('d');

                    // push 
                    svg_elements.push(d)
                }
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

    return svg_elements;
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

