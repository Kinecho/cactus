import {
    select,
    BaseType,
    scaleTime,
    extent,
    axisBottom,
    scaleLinear,
    area,
    timeDay,
    curveCardinal,
    axisLeft,
    timeFormat,
    max as d3Max,
} from "d3";
import { EdgeInsets } from "@web/util";
import Logger from "@shared/Logger"
import { isBlank } from "@shared/util/StringUtil";
import { Colors } from "@shared/util/ColorUtil";

const logger = new Logger("timeSeriesChart");


export interface TimeSeriesDataPoint {
    date: Date,
    label: string,
    value: number,
}

export interface GradientPoint {
    offset: string,
    color: string,
}

export interface TickSetting<T> {
    size: number,
    padding: number,
    fontSize: number,
    format: ((value: T, index: number) => string),
}

export interface TimeSeriesConfig {
    w: number,
    h: number,
    margin: EdgeInsets,
    gradient: GradientPoint[],
    showYAxis: boolean,
    axisColor: string,
    labels: {
        x: string | null,
        y: string | null
    },
    fontFamily: string,
    ticks: {
        x: TickSetting<Date>,
        y: TickSetting<number>,
    }
}

export const DEFAULT_CONFIG = (): TimeSeriesConfig => ({
    w: 400,
    h: 400,
    margin: { top: 10, right: 30, bottom: 30, left: 50 },
    gradient: [
        { offset: "0%", color: "#294FA3" },
        { offset: "50%", color: "#6590ED" },
        { offset: "100%", color: "#33CCAB" }
    ],
    labels: {
        x: null,
        y: null,
    },
    axisColor: Colors.borderLight,
    fontFamily: "Lato, sans-serif",
    ticks: {
        x: {
            size: 0,
            format: timeFormat("%-m/%-d"),
            padding: 3,
            fontSize: 12,
        },
        y: {
            size: 0,
            format: () => "",
            padding: 3,
            fontSize: 12,
        }
    },
    showYAxis: false,
})


/**
 * Draws a line chart.
 * For date formatting see [D3 Time Format](https://github.com/d3/d3-time-format#locale_format)
 *
 * @param {string} selector
 * @param {TimeSeriesDataPoint[]} data
 * @param {Partial<TimeSeriesConfig>} options
 */
export function drawTimeSeriesChart(selector: string, data: TimeSeriesDataPoint[], options: Partial<TimeSeriesConfig> = {}) {
    const config = Object.assign(DEFAULT_CONFIG(), options)
    const { w, h, margin, gradient, showYAxis, labels, ticks, fontFamily, axisColor } = config;
// set the dimensions and margins of the graph

    const { x: labelX, y: labelY } = labels ?? {}

    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;
    logger.info("chart height width:", { height, width })
    const parent = select<BaseType, TimeSeriesDataPoint>(selector)

    //clear any existing chart in the svg
    parent.select("svg").remove();

    const svg = parent
    .append("svg")
    .style("font-family", fontFamily)
    .attr("viewBox", `0 0 ${ w + margin.left + margin.right } ${ h + margin.top + margin.bottom }`)

    // Create the main G container
    const g = svg.append("g")
    .style("font-family", fontFamily)
    .attr("transform", `translate(${ margin.left }, ${ margin.top })`);


    // Add X axis --> it is a date format
    const xExtent = extent<TimeSeriesDataPoint, Date>(data, d => d.date) as [Date, Date] //cast this to [Date, Date]
    const xAxisScale = scaleTime()
    .domain(xExtent)
    .range([0, width]);

    //Create the x-axis svg
    const xAxis = axisBottom<Date>(xAxisScale)
    .tickFormat(ticks.x.format)
    .ticks(timeDay)
    .tickSize(ticks.x.size)
    .tickPadding(10)


    g.append("g")
    .attr("color", Colors.textDefault)
    .style("font-size", `${ ticks.x.fontSize }`)
    .style("font-family", fontFamily)
    .attr("class", "xaxis axis")
    .attr("transform", `translate(${ 0 }, ${ height })`)
    .call(xAxis)
    .selectAll("path").style("stroke", axisColor);;

    // Calculate Y Axis Range
    const maxY = d3Max<TimeSeriesDataPoint, number>(data, d => +d.value)!;
    logger.info("Max y = ", maxY)
    const y = scaleLinear()

    .domain([0, maxY])
    .range([height, 0]);


    svg.append("linearGradient")
    .attr("id", "temperature-gradient")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", 0).attr("y1", y(0))
    .attr("x2", 0).attr("y2", y(maxY))
    .selectAll("stop")
    .data(gradient)
    .enter().append("stop")
    .attr("offset", function (d) {
        return d.offset;
    })
    .attr("stop-color", function (d) {
        return d.color;
    });


    if (showYAxis) {
        // Append the YAxis SVG
        const yAxis = axisLeft<number>(y)
        .tickFormat(ticks.y.format)
        .tickSize(ticks.y.size)
        .tickPadding(ticks.y.padding)

        g.append("g")
        .style("font-family", fontFamily)
        .attr("color", Colors.textDefault)
        .attr("class", "yaxis axis")
        .call(yAxis)
        .selectAll("path").style("stroke", axisColor);
    }

    const chartArea = area<TimeSeriesDataPoint>()
    .curve(curveCardinal)
    .x(d => xAxisScale(d.date))
    .y0(y(0))
    .y1(d => y(d.value));

    // Add the area
    g.append("path")
    .datum(data)
    .attr("fill", "url(#temperature-gradient)")
    .attr("d", chartArea)


    if (!isBlank(labelX)) {
        g.append("text")
        .style("font-family", fontFamily)
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${ width / 2 }, ${ height + margin.top + margin.bottom })`)
        .attr("fill", Colors.textDefault)
        .text(labelX)
    }

    if (!isBlank(labelY)) {
        g.append("text")
        .style("font-family", fontFamily)
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${ -2 * margin.left / 3 }, ${ height / 2 })rotate(-90)`)
        .attr("fill", Colors.textDefault)
        .text(labelY)
    }

}