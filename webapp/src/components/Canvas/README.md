# Canvas

This component takes as input **1. URL** to an image, **2. URL to a SVG file** and **3. URL to an animation scheduling JSON file** and displays the image with the SVG elements animated on top of it. 

The supported SVG elements are 'polyline', 'polygon', 'rect' and 'path'. They should all have a unique id (e.g. id="f-0.4").

The structure of the animation scheduling looks as follows, 

    [
        {
            "ID": 1,
            "START_TIME_IN_MS": 1000,
            "SVG_ELEMENTS": [
                "o-1"
            ]
        },
        {
            "ID": 2,
            "START_TIME_IN_MS": 3500,
            "SVG_ELEMENTS": [
                "w-1" 
            ]
        },
        {
            "ID": 3,
            "START_TIME_IN_MS": 4500,
            "SVG_ELEMENTS": [
                "c-1"
            ]
        },
        ...
    ]