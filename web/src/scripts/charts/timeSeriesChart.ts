import {
    area,
    axisBottom,
    axisLeft,
    BaseType,
    curveCardinal,
    extent,
    max as d3Max,
    scaleLinear,
    scaleTime,
    select,
    timeDay,
    timeFormat,
    AxisScale,
    scaleOrdinal,
} from "d3";
import Logger from "@shared/Logger"
import { isBlank } from "@shared/util/StringUtil";
import { Colors } from "@shared/util/ColorUtil";
import { TimeSeriesConfig, TimeSeriesDataPoint } from "@shared/charts/TimeSeriesChartTypes";
import { TickSetting } from "@shared/charts/ChartTypes";
import * as d3 from "d3";
import { isNull } from "@shared/util/ObjectUtil";

const logger = new Logger("timeSeriesChart");

export const DEFAULT_TICK_SETTINGS_X = (): TickSetting<Date> => ({
    size: 0,
    format: timeFormat("%-m/%-d"),
    padding: 10,
    fontSize: 14,
    interval: 2,
    fontColor: Colors.lightText
})

export const DEFAULT_TICK_SETTINGS_Y = (): TickSetting<number> => ({
    size: 0,
    format: () => "",
    padding: 3,
    fontSize: 14,
    fontColor: Colors.lightText
})

export function createTickSettingsX(params: Partial<TickSetting<Date>>): TickSetting<Date> {
    return {
        ...DEFAULT_TICK_SETTINGS_X(),
        ...params,
    }
}

export function createTickSettingsY(params: Partial<TickSetting<number>>): TickSetting<number> {
    return {
        ...DEFAULT_TICK_SETTINGS_Y(),
        ...params,
    }
}

export const DEFAULT_CONFIG = (): TimeSeriesConfig => ({
    w: 400,
    h: 300,
    margin: { top: 10, right: 0, bottom: 30, left: 0 },
    gradient: [
        { offset: "0%", color: Colors.royal },
        { offset: "100%", color: Colors.green }
    ],
    labels: {
        x: null,
        y: null,
    },
    fixedDateRange: true,
    axisColor: Colors.borderLight,
    fontFamily: "Lato, sans-serif",
    ticks: {
        x: DEFAULT_TICK_SETTINGS_X(),
        y: DEFAULT_TICK_SETTINGS_Y(),
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
    const { w, h, margin, gradient, showYAxis, labels, ticks, fontFamily, axisColor, fixedDateRange } = config;

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


    // Calculate Y Axis Range
    const maxY = d3Max<TimeSeriesDataPoint, number>(data, d => +d.value)!;
    logger.info("Max y = ", maxY)

    const y = scaleLinear()
    .domain([0, maxY]).nice()
    .range([height, margin.bottom + margin.top]);

    const [d1, d2] = extent<TimeSeriesDataPoint, Date>(data, d => d.date) as [Date, Date] //cast this to [Date, Date]

    let x: AxisScale<Date>;
    if (!fixedDateRange) {
        x = scaleTime()
        .range([0, width])
        .domain([d1, d2])
    } else {
        x = d3.scaleTime()
        .range([0, width])
        .domain([d1, d2]).nice()
    }

    //Create the x-axis svg
    const xAxis = axisBottom<Date>(x)
    .tickFormat(ticks.x.format)
    // .ticks(timeDay.every(ticks.x.interval ?? 1))
    .tickSize(ticks.x.size)
    .tickPadding(ticks.x.padding)

    //Add the X-Axis
    const xSvg = g.append("g");

    xSvg.attr("color", ticks.x.fontColor)
    .style("font-size", `${ ticks.x.fontSize }`)
    .style("font-family", fontFamily)
    .attr("class", "xaxis axis")
    .attr("transform", `translate(${ 0 }, ${ height })`)
    .call(xAxis)
    .selectAll("path").style("stroke", axisColor)


    if (data.length > 0) {
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
    }

    if (showYAxis) {
        // Append the YAxis SVG
        const yAxis = axisLeft<number>(y)
        .tickFormat(ticks.y.format)
        .tickSize(ticks.y.size)
        .tickPadding(ticks.y.padding)

        g.append("g")
        .style("font-family", fontFamily)
        .attr("color", ticks.y.fontColor)
        .attr("class", "yaxis axis")
        .call(yAxis)
        .selectAll("path").style("stroke", axisColor);
    }

    const chartArea = area<TimeSeriesDataPoint>()
    .defined(d => !isNaN(d.value) && !isNull(d.value))
    .x(d => x(d.date))
    .y0(y(0))
    .y1(d => y(d.value));

    const undefArea = area<TimeSeriesDataPoint>()
    .defined(d => isNull(d.value))
    .x(d => x(d.date))
    .y0(y(0))
    .y1(d => y(1))

    //create a mask from the data set that is null
    const mask = g.append("mask")
    .attr("id", "area-null-data")

    //apply a full width/height white rectangle for the mask.
    mask.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "white");

    //apply the path of the null value area chart, fill it with black for the mask to work.
    mask.append("path")
    .datum(data)
    .attr("fill", "black")
    .attr("d", undefArea);

    // add normal, defined data
    g.append("path")
    .datum(data.filter(chartArea.defined()))
    .attr("fill", "url(#temperature-gradient)")
    .attr("mask", "url(#area-null-data)")
    .attr("d", chartArea.curve(curveCardinal));

    //add line
    const line = d3.line()
    // .curve(curveCardinal)
    .defined(d => !isNaN(d.value) && !isNull(d.value))
    .x(d => x(d.date))
    .y(d => y(d.value))


    //add dots to the undefined values
    g.selectAll("myCircles")
    .data(data.filter(d => !line.defined()(d)))
    .enter()
    .append("circle")
    .attr("fill", Colors.lightDolphin)
    .attr("stroke", "none")
    .attr("cx", d => x(d.date))
    .attr("cy", d => y(d.value))
    .attr("r", 3)


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

    //remove ticks as necessary
    if (!isNull(ticks.x.interval)) {
        svg.selectAll(".tick text")
        .each(function (_, i) {
            if (i % (ticks.x.interval ?? 1) !== 0) d3.select(this).remove();
        });
    }

}