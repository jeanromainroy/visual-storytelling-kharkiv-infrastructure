'use strict';

// import config
import { ACCEPTED_STYLING, ACCEPTED_SVG_ELEMENTS } from './config.js';


function parse_style(style_str) {

    // init dict
    let style_dict = {};

    // helper functions
    const split_classnames = (str) => str.trim().split(',').map(className => className.replace('.', '')).map(d => d.trim());
    const split_stylings = (str) => str.trim().split(';').map(styling => styling.trim()).filter(styling => styling.length > 0).map(d => d.trim());
    const clean_stylings = (stylings) => stylings.map(d => d.split(':').map(_d => _d.trim())).filter(d => ACCEPTED_STYLING.includes(d[0]))

    // convert to array
    let styles = style_str.trim().split('}');
    styles = styles.map(d => d.trim().replace('}', '').trim());
    styles = styles.map(d => d.trim().split('{')).filter(d => d.length === 2).map(d => {
        return [split_classnames(d[0]), split_stylings(d[1])]
    })

    // scaffold the dict
    styles.forEach(d => {

        // destructure
        const classNames = d[0]

        // init
        classNames.forEach(className => {
            style_dict[className] = {
                'style': [],
                'fill': false,
                'stroke': false
            };
        })
    })

    // populate with stylings
    styles.forEach(d => {

        // destructure
        const [classNames, stylings] = d

        // push stylings
        classNames.forEach(className => {
            for (const styling of stylings) {
                style_dict[className]['style'].push(styling);
            }
        })
    })

    // parse 
    Object.keys(style_dict).forEach(className => {
        
        // only uniques
        style_dict[className]['style'] = [...new Set(style_dict[className]['style'])];

        // parse
        style_dict[className]['style'] = clean_stylings(style_dict[className]['style'])
    });


    // set drawing flags
    Object.keys(style_dict).forEach(className => {
        style_dict[className]['style'].forEach(styling => {

            // destructure
            const [name, value] = styling

            // check 
            if (name === 'fill' && value !== 'none') style_dict[className]['fill'] = true;
            if (name === 'stroke-width' || (name === 'stroke' && value !== 'none')) style_dict[className]['stroke'] = true;

        })
    });

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
                const styling_dict = className === null ? null : styles[className];

                // init parsed element
                let svg_element = {
                    'id': id,
                    'type': element.nodeName,
                    'data': null,
                    'style': styling_dict['style'],
                    'stroke': styling_dict['stroke'],
                    'fill': styling_dict['fill']
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

