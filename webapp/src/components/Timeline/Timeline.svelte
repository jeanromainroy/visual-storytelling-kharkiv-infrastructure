<script>

    // import incidents
    import incidents from '../../../dist/incidents.json';

    // import libs
    import * as d3 from 'd3';
    import { onMount } from 'svelte';
    import { isStringNonEmpty } from '../../libs/datatype.js';

    // parse incidents
    const incidents_properties = incidents['features'].map(feature => feature['properties']);
    const incidents_dates = incidents_properties.filter(incident => isStringNonEmpty(incident['DATE'])).map(incident => {
    
        // destructure
        const [year, month, day] = incident['DATE'].split('-');

        // format to date
        return {
            'ID': incident['ID'],
            'DATE': new Date(+year, (+month) - 1, +day)
        }
    });

    // variables
    let g_dates;

    function remove_px(str) {
        return +str.split('px')[0];
    }


    export const highlight_marker = (incident_id) => {

        // colors
        const dark_red = '#ff0000';
        const light_red = '#ffcccb';

        // reset
        if (incident_id === undefined || incident_id === null) {
            g_dates.selectAll('circle').attr('fill', dark_red);
            return;
        }

        // update color
        g_dates.selectAll('circle').attr('fill', function(){
            return +this.dataset['id'] === +incident_id ? dark_red : light_red;
        });
    }


    onMount(() => {

        // grab elements
        const track = d3.select("#track");

        // timeline attributes
        const track_width = remove_px(track.style("width"));
        const track_height = remove_px(track.style("height"));
        
        // scales
        const scale = d3.scaleTime().range([0, track_width]);
        const axis = d3.axisBottom(scale);

        // we init the svg inside the track
        const trackSvg = track.select("svg")    // we grab the SVG object inside of the track html object
            .attr("width", track_width)       // set the width and height
            .attr("height", track_height);

        // create dates
        const min_date = new Date(2022, 1, 24);
        const max_date = new Date(2022, 7, 18);
        
        // Set the scale
        scale.domain([ min_date, max_date ]);

        // set the axis
        trackSvg.append("g")
            .attr("class", "axis")
            .call(axis); 

        // incidents group
        g_dates = trackSvg.append("g");

        // draw the incidents 
        incidents_dates.forEach(incident => {

            // destructure 
            const { ID, DATE } = incident;

            // convert date to px
            const cx = scale(DATE);

            g_dates.append('circle')
                .attr('data-id', ID)
                .attr('cx', cx)
                .attr('cy', 0)
                .attr('r', 6)
                .attr('fill', '#ff0000')
                .attr('opacity', 0.7)
        });
    })

</script>


<div id="timeline">
    <div id="track">
        <svg></svg>
    </div>
</div>


<style>

    /***** Time track & Sliders *****/
    #timeline {
        position: absolute;
        left: 0px;
        right: 0px;
        bottom: 0px;
        height: 30px;
        display: flex;
        justify-content: center;
        z-index: 3;
        padding-top: 20px;
        background-color: #fff;
        /* border-top: 0.5px solid #000; */
        box-shadow: 2px 2px 5px rgba(0, 0, 0, .5);
    }


    #track {
        position: relative;
        width: 90vw; 
        color: black;
    }

    :global(#track .axis) {
        shape-rendering: crispEdges;
        font-size: 10px;
    }

    svg {
        overflow: unset;
    }


</style>