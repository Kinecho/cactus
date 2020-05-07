// tslint:disable:prefer-for-of
import * as d3 from "d3";
import { RadarChartData, RadarChartDataPoint } from "@shared/charts/RadarChartData";

const max = Math.max;
const sin = Math.sin;
const cos = Math.cos;
const HALF_PI = Math.PI / 2;

export interface RadarChartConfig {
    w: number,
    h: number,
    margin: { top: number, right: number, bottom: number, left: number },
    levels: number,
    maxValue: number,
    labelFactor: number,
    wrapWidth: number,
    opacityArea: number,
    dotRadius: number,
    opacityCircles: number,
    strokeWidth: number,
    roundStrokes: boolean,
    circleFillBaseColor: string,
    showLevelLabel: boolean,
    showTooltip: boolean,
    // color: d3.ScaleOrdinal<string, string>,
    format: string,
    unit: string,
    legend: boolean | { title: string, translateX: number, translateY: number },
    colorValues: string[],
    fontSizePx: number,
    showLabels: boolean,
}


/**
 * Default config
 * @type {{strokeWidth: number; margin: {top: number; left: number; bottom: number; right: number}; color: ScaleOrdinal<string, string>; maxValue: number; legend: boolean; h: number; format: string; opacityCircles: number; roundStrokes: boolean; opacityArea: number; wrapWidth: number; labelFactor: number; unit: string; w: number; levels: number; dotRadius: number}}
 */
const DEFAULT_CONFIG = (): RadarChartConfig => ({
    w: 200,				//Width of the circle
    h: 200,				//Height of the circle
    circleFillBaseColor: "#CDCDCD",
    showLevelLabel: false,
    margin: { top: 60, right: 60, bottom: 60, left: 60 }, //The margins of the SVG
    levels: 5,				//How many levels or inner circles should there be drawn
    maxValue: 5, 			//What is the value that the biggest circle will represent
    labelFactor: 1.25, 	//How much farther than the radius of the outer circle should the labels be placed
    wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
    opacityArea: 0.75, 	//The opacity of the area of the blob
    dotRadius: 4, 			//The size of the colored circles of each blog
    opacityCircles: 0.1, 	//The opacity of the circles of each blob
    strokeWidth: 2, 		//The width of the stroke around each blob
    roundStrokes: true,	//If true the area and stroke will follow a round path (cardinal-closed)
    format: ',d',
    unit: '',
    legend: false,
    showTooltip: false,
    colorValues: [
        "#CC33A1",
        "#6590ED",
    ],
    fontSizePx: 12,
    showLabels: false,
});

//Wraps SVG text - Taken from http://bl.ocks.org/mbostock/7555321

const wrapText = (textInput: d3.Selection<SVGTextElement, any, any, any>, width: number) => {
    textInput.each(function () {
        const text = d3.select(this);
        const words = text.text().split(/\s+/).reverse();
        let word: string | undefined;
        let line: any[] = [];
        let lineNumber = 0;
        const lineHeight = 1.4; // ems
        const y = text.attr("y");
        const x = text.attr("x");
        const dy = parseFloat(text.attr("dy"));
        let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
        word = words.pop()
        while (word) {
            line.push(word);
            tspan.text(line.join(" "));
            if ((tspan.node()?.getComputedTextLength() ?? -1) > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                .attr("x", x)
                .attr("y", y)
                .attr("dy", ++lineNumber * lineHeight + dy + "em")
                .text(word);
            }
            word = words.pop()
        }
    });
}

export function drawRadarChartD3(parent_selector: string, data: RadarChartData[], options: Partial<RadarChartConfig>) {
    const cfg = Object.assign({}, DEFAULT_CONFIG(), options);

    const color = d3.scaleOrdinal<string>().range(cfg.colorValues ?? DEFAULT_CONFIG().colorValues);

    //If the supplied maxValue is smaller than the actual one, replace by the max in the data
    // var maxValue = max(cfg.maxValue, d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))}));
    let maxValue = cfg.maxValue;

    for (let j = 0; j < data.length; j++) {
        for (let i = 0; i < data[j].axes.length; i++) {
            data[j].axes[i].id = data[j].name;
            if (data[j].axes[i].value > maxValue) {
                maxValue = data[j].axes[i].value;
            }
        }
    }
    maxValue = max(cfg.maxValue, maxValue);

    data.forEach(r => {
        r.axes = r.axes.sort((a, b) => a.axis.localeCompare(b.axis));
    })

    const allAxisNames = data[0].axes.map((i, j) => i.axis).sort(),	//Names of each axis
    total = allAxisNames.length,					//The number of different axes
    radius = Math.min(cfg.w / 2, cfg.h / 2), 	//Radius of the outermost circle
    Format = d3.format(cfg.format),			 	//Formatting
    angleSlice = Math.PI * 2 / total;		//The width in radians of each "slice"

    //Scale for the radius
    const rScale = d3.scaleLinear()
    .range([0, radius])
    .domain([0, maxValue]);

    /////////////////////////////////////////////////////////
    //////////// Create the container SVG and g /////////////
    /////////////////////////////////////////////////////////
    const parent = d3.select<d3.BaseType, RadarChartDataPoint>(parent_selector);

    //Remove whatever chart with the same id/class was present before
    parent.select("svg").remove();

    //Initiate the radar chart SVG
    const svg = parent.append("svg")
    .attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
    .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
    .attr("class", "radar");

    //Append a g element
    const g = svg.append("g")
    .attr("transform", "translate(" + (cfg.w / 2 + cfg.margin.left) + "," + (cfg.h / 2 + cfg.margin.top) + ")");

    /////////////////////////////////////////////////////////
    ////////// Glow filter for some extra pizzazz ///////////
    /////////////////////////////////////////////////////////

    //Filter for the outside glow
    const filter = g.append('defs').append('filter').attr('id', 'glow'),
    feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur'),
    feMerge = filter.append('feMerge'),
    feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
    feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    /////////////////////////////////////////////////////////
    /////////////// Draw the Circular grid //////////////////
    /////////////////////////////////////////////////////////

    //Wrapper for the grid & axes
    const axisGrid = g.append("g").attr("class", "axisWrapper");

    //Draw the background circles
    axisGrid.selectAll(".levels")
    .data(d3.range(1, (cfg.levels + 1)).reverse())
    .enter()
    .append("circle")
    .attr("class", "gridCircle")
    .attr("r", d => radius / cfg.levels * d)
    .style("fill", cfg.circleFillBaseColor)
    .style("stroke", cfg.circleFillBaseColor)
    .style("fill-opacity", cfg.opacityCircles)
    .style("filter", "url(#glow)");

    if (cfg.showLevelLabel) {
        //Text indicating at what % each level is
        axisGrid.selectAll(".axisLabel")
        .data(d3.range(1, (cfg.levels + 1)).reverse())
        .enter().append("text")
        .attr("class", "axisLabel")
        .attr("x", 4)
        .attr("y", d => -d * radius / cfg.levels)
        .attr("dy", "0.4em")
        .style("font-size", "10px")
        .attr("fill", "#737373")
        .text(d => Format(maxValue * d / cfg.levels) + cfg.unit);
    }


    /////////////////////////////////////////////////////////
    //////////////////// Draw the axes //////////////////////
    /////////////////////////////////////////////////////////

    //Create the straight lines radiating outward from the center
    const axis = axisGrid.selectAll(".axis")
    .data(allAxisNames)
    .enter()
    .append("g")
    .attr("class", "axis");
    //Append the lines
    axis.append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", (d, i) => rScale(maxValue * 1.1) * cos(angleSlice * i - HALF_PI))
    .attr("y2", (d, i) => rScale(maxValue * 1.1) * sin(angleSlice * i - HALF_PI))
    .attr("class", "line")
    .style("stroke", "white")
    .style("stroke-width", "2px");


    //Append the labels at each axis
    if (cfg.showLabels) {
        axis.append("text")
        .attr("class", "legend")
        .style("font-size", `${ cfg.fontSizePx }px`)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => rScale(maxValue * cfg.labelFactor) * cos(angleSlice * i - HALF_PI))
        .attr("y", (d, i) => rScale(maxValue * cfg.labelFactor) * sin(angleSlice * i - HALF_PI))
        .text(d => d)
        .call(wrapText, cfg.wrapWidth);

    }

    /////////////////////////////////////////////////////////
    ///////////// Draw the radar chart blobs ////////////////
    /////////////////////////////////////////////////////////

    //The radial line function
    const radarLine = d3.lineRadial<RadarChartDataPoint>()
    .curve(d3.curveLinearClosed)
    .radius((d) => rScale(d.value))
    .angle((d, i) => i * angleSlice);

    if (cfg.roundStrokes) {
        radarLine.curve(d3.curveCardinalClosed)
    }

    //Create a wrapper for the blobs
    const blobWrapper = g.selectAll(".radarWrapper")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "radarWrapper");

    //Append the backgrounds
    blobWrapper
    .append("path")
    .attr("class", "radarArea")
    .attr("d", d => radarLine(d.axes))
    .style("fill", (d, i) => color(`${ i }`))
    .style("fill-opacity", cfg.opacityArea)
    .on('mouseover', function (d, i) {
        //Dim all blobs
        parent.selectAll(".radarArea")
        .transition().duration(200)
        .style("fill-opacity", 0.1);
        //Bring back the hovered over blob
        d3.select(this)
        .transition().duration(200)
        .style("fill-opacity", 0.7);
    })
    .on('mouseout', () => {
        //Bring back all blobs
        parent.selectAll(".radarArea")
        .transition().duration(200)
        .style("fill-opacity", cfg.opacityArea);
    });

    //Create the outlines
    blobWrapper.append("path")
    .attr("class", "radarStroke")

    .attr("d", function (d, i) {
        return radarLine(d.axes);
    })
    .style("stroke-width", cfg.strokeWidth + "px")
    .style("stroke", (d, i) => color(`${ i }`))
    .style("fill", "none")
    .style("filter", "url(#glow)");

    //Append the circles
    blobWrapper.selectAll(".radarCircle")
    .data(d => d.axes)
    .enter()
    .append("circle")
    .attr("class", "radarCircle")
    .attr("r", cfg.dotRadius)
    .attr("cx", (d, i) => rScale(d.value) * cos(angleSlice * i - HALF_PI))
    .attr("cy", (d, i) => rScale(d.value) * sin(angleSlice * i - HALF_PI))
    .style("fill", (d) => color(`${ d.id }`))
    .style("fill-opacity", 0.8);

    /////////////////////////////////////////////////////////
    //////// Append invisible circles for tooltip ///////////
    /////////////////////////////////////////////////////////

    if (cfg.showTooltip) {


        //Wrapper for the invisible circles on top
        const blobCircleWrapper = g.selectAll(".radarCircleWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarCircleWrapper");

        //Append a set of invisible circles on top for the mouseover pop-up
        blobCircleWrapper.selectAll(".radarInvisibleCircle")
        .data(d => d.axes)
        .enter().append("circle")
        .attr("class", "radarInvisibleCircle")
        .attr("r", cfg.dotRadius * 1.5)
        .attr("cx", (d, i) => rScale(d.value) * cos(angleSlice * i - HALF_PI))
        .attr("cy", (d, i) => rScale(d.value) * sin(angleSlice * i - HALF_PI))
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function (d, i) {
            tooltip
            .attr('x', this.cx.baseVal.value - 10)
            .attr('y', this.cy.baseVal.value - 10)
            .transition()
            .style('display', 'block')
            .text(Format(d.value) + cfg.unit);
        })
        .on("mouseout", function () {
            tooltip.transition()
            .style('display', 'none').text('');
        });

        const tooltip = g.append("text")
        .attr("class", "tooltip")
        .attr('x', 0)
        .attr('y', 0)
        .style("font-size", "12px")
        .style('display', 'none')
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em");
    }
    if (cfg.legend !== false && typeof cfg.legend === "object") {
        const legendZone = svg.append('g');
        const names = data.map(el => el.name);
        if (cfg.legend?.title) {
            //append title
            legendZone.append("text")
            .attr("class", "title")
            .attr('transform', `translate(${ cfg.legend.translateX },${ cfg.legend.translateY })`)
            .attr("x", cfg.w - 70)
            .attr("y", 10)
            .attr("font-size", "12px")
            .attr("fill", "#404040")
            .text(cfg.legend.title);
        }
        const legend = legendZone.append("g")
        .attr("class", "legend")
        .attr("height", 100)
        .attr("width", 200)
        .attr('transform', `translate(${ cfg.legend.translateX },${ cfg.legend.translateY + 20 })`);
        // Create rectangles markers
        legend.selectAll('rect')
        .data(names)
        .enter()
        .append("rect")
        .attr("x", cfg.w - 65)
        .attr("y", (d, i) => i * 20)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", (d, i) => color(`${ i }`));
        // Create labels
        legend.selectAll('text')
        .data(names)
        .enter()
        .append("text")
        .attr("x", cfg.w - 52)
        .attr("y", (d, i) => i * 20 + 9)
        .attr("font-size", "11px")
        .attr("fill", "#737373")
        .text(d => d);
    }
    return svg;
}