<script>

    // import components
    import Map from './components/Map/Map.svelte';
    import Canvas from './components/Canvas/Canvas.svelte';
    import Timeline from './components/Timeline/Timeline.svelte';

    // import story scripts
    import { update, load_basemaps } from './script.js';

    // import incidents
    import incidents from '../dist/incidents.json';

    // import libs
    import { onMount } from 'svelte';
    
    // import config
    import { CENTER_LAT, CENTER_LNG, START_RADIUS } from './config.js';
    
    // map variables
    let map_ready;
    let controls;
    let move_to_latlng, animate_to_latlng, draw_markers, highlight_marker_map, load_image;
    let highlight_marker_timeline;

    // canvas variables
    let show_canvas;

    // app variables
    let hide = true;
    let displayed_section_id = null;


    async function init_map() {

        // set hide flag
        hide = true;

        // draw incidents
        draw_markers(incidents['features'])

        // set initial position
        move_to_latlng(CENTER_LAT, CENTER_LNG, START_RADIUS);

        // load images
        load_basemaps(load_image);
        
        // set hide flag
        hide = false;
    }
    

    function set_section_scroll_observer() {

        // grab sections
        const sections = document.querySelectorAll("#scroll-container section");

        // init observers for each section
        for (const section of sections) {
            
            const observer = new IntersectionObserver(function(entries) {
                // isIntersecting is true when element and viewport are overlapping
                // isIntersecting is false when element and viewport don't overlap

                // grab id
                const section_id = entries[0]['target'].dataset['id']

                // if overlap, set as displayed section
                if(entries[0].isIntersecting === true) displayed_section_id = section_id;

            }, { threshold: [0.5] });

            // set target
            observer.observe(section);  
        }      
    }


    const highlight_marker = (incident_id) => {
        highlight_marker_map(incident_id);
        highlight_marker_timeline(incident_id);
    }
    

    // on UI loaded
    onMount(() => {
        set_section_scroll_observer(); 
    })

    
    // on map ready
    $: if(map_ready){ 
        init_map(); 
    }


    // on section change
    $: if(displayed_section_id) {
        update(displayed_section_id, controls, animate_to_latlng, highlight_marker, show_canvas);
    }

</script>


<div class="fade-in" style="z-index: 2;">
    <!-- 3D Map Background -->
    <Map
        bind:ready={map_ready} 
        bind:controls={controls}
        bind:load_image={load_image} bind:move_to_latlng={move_to_latlng} bind:animate_to_latlng={animate_to_latlng} bind:draw_markers={draw_markers} bind:highlight_marker={highlight_marker_map}
    />

    <!-- Timeline -->
    <Timeline bind:highlight_marker={highlight_marker_timeline}/>
</div>


<!-- Story Container -->
<div id="scroll-container" style="z-index: 3;">

    <!-- Zoomed Out -->
    <section data-id="1">
        <h1>Kharkiv</h1>
    </section>


    <!-- Zoomed on the whole city of Kharkiv -->
    <section data-id="2">
        <h1>Civilian Infrastucture</h1>
    </section>


    <!-- Zoomed on each incident -->
    {#each incidents['features'] as incident, index} 
        <section data-id="{index + 3}">
            <h1>{incident['properties']['NAME']}</h1>
        </section>    
    {/each}

</div>


<!-- Image Container -->
<Canvas bind:show={show_canvas}/>


<style>

    /* global variables */
    :global(:root) {
        --main-color: #ca3433;
        --black: #333;
        --black-light: #777;
        --white: #fff;

        --font-size-very-very-very-small: 0.65em;
        --font-size-very-very-small: 0.8em;
        --font-size-very-small: 0.9em;
        --font-size-small: 1.0em;
        --font-size-normal: 1.3em;
        --font-size-large: 1.6em;
        --font-size-very-large: 2.5em;
    }


    :global(#app) {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
		text-align: center;
        overflow-y: scroll;
        overflow-x: hidden;
        z-index: 1;
	}


    :global(section){
        height: 100vh;
        scroll-snap-align: center;
        position: relative;
        text-align: center;
    }


    :global(::selection){
        background: var(--main-color);
        color: var(--white);
    }


    /* sticky scroll container */
    #scroll-container {
        height: 100vh;
        overflow-y: scroll;
        overflow-x: hidden;
        scroll-snap-type: y mandatory;
    }

    #scroll-container h1 {
        font-size: 64px;
        color: black;
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

    /* --- Fade in --- */
    @keyframes fadeIn {
        0% {opacity:0;}
        50% {opacity:0;}
        100% {opacity:1;}
    }

    @-moz-keyframes fadeIn {
        0% {opacity:0;}
        50% {opacity:0;}
        100% {opacity:1;}
    }

    @-webkit-keyframes fadeIn {
        0% {opacity:0;}
        50% {opacity:0;}
        100% {opacity:1;}
    }

    @-o-keyframes fadeIn {
        0% {opacity:0;}
        50% {opacity:0;}
        100% {opacity:1;}
    }

    @-ms-keyframes fadeIn {
        0% {opacity:0;}
        50% {opacity:0;}
        100% {opacity:1;}
    }
    
</style>
