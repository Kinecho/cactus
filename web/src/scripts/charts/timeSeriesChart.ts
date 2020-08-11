import {
    select,
    BaseType,
    scaleTime,
    extent,
    axisBottom,
    scaleLinear,
    area,
    timeParse,
    axisLeft,
    max as d3Max,
} from "d3";
import { EdgeInsets } from "@web/util";
import Logger from "@shared/Logger"

const logger = new Logger("timeSeriesChart");


export interface TimeSeriesDataPoint {
    date: Date,
    label: string,
    value: number,
}

export interface TimeSeriesConfig {
    w: number,
    h: number,
    margin: EdgeInsets,
}

export const DEFAULT_CONFIG = (): TimeSeriesConfig => ({
    w: 460,
    h: 400,
    margin: { top: 10, right: 30, bottom: 30, left: 50 },
})


export function drawTimeSeriesChart(selector: string, data: TimeSeriesDataPoint[], options: Partial<TimeSeriesConfig> = {}) {
    const config = Object.assign(DEFAULT_CONFIG(), options)
    const { w, h, margin } = config;
// set the dimensions and margins of the graph

    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;
    logger.info("chart height width:", { height, width })
    const parent = select<BaseType, TimeSeriesDataPoint>(selector)

    //clear any existing chart in the svg
    parent.select("svg").remove();


    const svg = parent
    .append("svg")
    .attr("viewBox", `0 0 ${ w + margin.left + margin.right } ${ h + margin.top + margin.bottom }`);
    // .attr("width", width + margin.left + margin.right)
    // .attr("height", height + margin.top + margin.bottom)


    //TODO: Not sure what this G does
    svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    // Add X axis --> it is a date format
    const xExtent = extent(data, d => d.date) as [Date, Date] //cast this to [Date, Date]

    const xAxis = scaleTime()
    .domain(xExtent)
    .range([0, width]);

    const xAxisG = svg.append("g");

    xAxisG
    .attr("transform", "translate(0," + height + ")")
    .call(axisBottom(xAxis));

    // Calculate Y Axis Range
    const y = scaleLinear()
    .domain([0, d3Max(data, d => +d.value)!])
    .range([height, 0]);

    // Append the YAxis SVG
    svg.append("g")
    .call(axisLeft(y));

    // Add the area
    svg.append("path")
    .datum(data)
    .attr("fill", "#cce5df")
    .attr("stroke", "#69b3a2")
    .attr("stroke-width", 1.5)
    .attr("d", area<TimeSeriesDataPoint>()
    .x(d => xAxis(d.date))
    .y0(y(0))
    .y1(d => y(d.value))
    )


}