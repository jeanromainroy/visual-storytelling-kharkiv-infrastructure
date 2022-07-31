'use strict';

// import config
import { ACCEPTED_STYLING, ACCEPTED_SVG_ELEMENTS } from './config.js';


function parse_style(style_str) {

    // init dict
    let style_dict = {};

    // break at }.
    let styles = style_str.trim().split('}');

    // clean
    styles = styles.map(d => d.trim().replace('}', '').trim());

    // split
    styles = styles.map(d => d.trim().split('{')).filter(d => d.length === 2).map(d => {
        return [d[0].trim(), d[1].trim()]
    })

    // go through
    styles.forEach(d => {

        // destructure
        const [classNamesStr, stylingsStr] = d

        // break all affected classes
        const classNames = classNamesStr.split(',').map(className => className.replace('.', '')).map(d => d.trim())

        // init
        classNames.forEach(className => {
            style_dict[className] = [];
        })
    })

    // populate with styling
    styles.forEach(d => {

        // destructure
        const [classNamesStr, stylingsStr] = d

        // break all affected classes
        const classNames = classNamesStr.split(',').map(className => className.replace('.', '')).map(d => d.trim())

        // break stylings
        const stylings = stylingsStr.split(';').map(styling => styling.trim()).filter(styling => styling.length > 0);

        classNames.forEach(className => {
            for (const styling of stylings) {
                style_dict[className].push(styling.trim());
            }
        })
    })

    // final 
    Object.keys(style_dict).forEach(className => {
        
        // only uniques
        style_dict[className] = [...new Set(style_dict[className])];

        // parse
        style_dict[className] = style_dict[className].map(d => d.split(':').map(_d => _d.trim())).filter(d => ACCEPTED_STYLING.includes(d[0]))
    })

    console.log(style_dict)

    return style_dict;
}


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


export async function load_json(url) {

    // init
    let result = null;
    let success = false;

    // send a request for the image
    await new Promise(function (resolve, reject) {

        // init xml requests
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);

        // Following line is just to be on the safe side;
        // not needed if your server delivers SVG with correct MIME type
        xhr.onload = () => {
            success = true;

            console.log(xhr)

            // set result
            result = xhr.response;
            
            resolve();
        }
        xhr.onerror = () => {
            resolve();
        }

        xhr.send("");
    })

    // validate
    if (!success) return null;

    return result;
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

            // grab style
            const styles = parse_style(response.querySelector('style').textContent);

            // grab svg elements
            const elements = response.querySelectorAll('polygon,polyline,path,rect');
            
            // go through
            for (const element of elements) {

                // check
                if (!ACCEPTED_SVG_ELEMENTS.includes(element.nodeName)) continue;

                // get id
                const id = element.getAttribute('id')

                // get class name
                const className = element.getAttribute('class');

                // get this class's style
                const style = className === null ? null : styles[className];

                // init parsed element
                let svg_element = {
                    'id': id,
                    'type': element.nodeName,
                    'data': null,
                    'style': style
                }

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

                    // set
                    svg_element['data'] = multiline;
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

                    // set
                    svg_element['data'] = multiline;
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

                    // set
                    svg_element['data'] = multiline;
                }

                // PATH
                if (element.nodeName === 'path') {

                    // destructure
                    const d = element.getAttribute('d');

                    // set
                    svg_element['data'] = d;
                }

                // push
                svg_elements.push(svg_element)
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

