# Canvas

This component takes as input **1. URL** to an image, **2. URL to a SVG file** and **3. URL to an animation scheduling JSON file** and displays the image with the SVG elements animated on top of it. 

The supported SVG elements are 'polyline', 'polygon', 'rect' and 'path'. They should all have a unique id (e.g. id="f-0.4").

The structure of the animation scheduling looks as follows, 

    [
        {
            "ID": 1,
            "ANIMATION_TYPE": "FADE-IN"
            "START_TIME_IN_MS": 500,
            "END_TIME_IN_MS": 2000,
            "SVG_ELEMENTS": [
                "f-0.1", 
                "f-0.2", 
                "f-0.3", 
                "f-0.4", 
                ...
            ]
        },
        {
            "ID": 2,
            "ANIMATION_TYPE": "FADE-OUT"
            "START_TIME_IN_MS": 1500,
            "END_TIME_IN_MS": 3500,
            "SVG_ELEMENTS": [
                "r-0.1", 
                "r-0.2", 
                "r-0.3", 
                "r-0.4", 
                ...
            ]
        },
        ...
    ]
