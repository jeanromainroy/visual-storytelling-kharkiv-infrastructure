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
                'stroke': false,
                'opacity': 1.0
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

            // set opacity
            if (name === 'opacity') style_dict[className]['opacity'] = +value;
        })
    });

    return style_dict;
}


function parse_svg(response){

    // init
    let raw_elements = [];
    let svg_elements = [];

    // grab style
    const styles = parse_style(response.querySelector('style').textContent);

    // grab svg elements
    const elements = response.querySelectorAll('polygon,polyline,path,rect');
    
    // go through
    for (const element of elements) {

        // check
        if (!ACCEPTED_SVG_ELEMENTS.includes(element.nodeName)) continue;

        // get id
        let id = element.getAttribute('id')

        // IF NO ID, check parent
        if (id === undefined || id === null) {
            const id_parent = element.parentNode.getAttribute('id');
            if (id_parent === undefined || id_parent === null) {
                console.error(`Cannot find id of `, element);
                continue;
            }
            id = id_parent;
        }

        // set element
        element.setAttribute('id', id);

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
            'fill': styling_dict['fill'],
            'opacity': styling_dict['opacity']
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
        raw_elements.push(element);
        svg_elements.push(svg_element)
    }

    return [raw_elements, svg_elements]
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
    let response = null;
    let success = false;

    // send a request for the image
    await new Promise(function (resolve, reject) {

        // init xml requests
        const xhr = new XMLHttpRequest();

        // set MIME type
        xhr.overrideMimeType("application/json");

        // configure request
        xhr.open("GET", url, false);

        // on response
        xhr.onload = () => {
            success = true;

            // parse response
            response = JSON.parse(xhr.responseText);
            
            resolve();
        }
        xhr.onerror = () => {
            resolve();
        }

        // send request
        xhr.send(null);
    })

    // validate
    if (!success) return null;

    return response;
}



export async function load_svg_elements(svg_url) {

    // init
    let response = null;
    let success = false;

    // send a request for the image
    await new Promise(function (resolve, reject) {

        // init xml requests
        const xhr = new XMLHttpRequest();

        // set MIME type
        xhr.overrideMimeType("image/svg+xml");

        // configure request
        xhr.open("GET", svg_url, false);

        // on response
        xhr.onload = () => {
            success = true;

            // grab response
            const _response = xhr.responseXML;

            // parse response
            response = parse_svg(_response);
            
            resolve();
        }
        xhr.onerror = () => {
            resolve();
        }

        // send request
        xhr.send(null);
    })

    // validate
    if (!success) return null;

    return response;
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

