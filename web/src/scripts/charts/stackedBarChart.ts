import * as d3 from "d3";
import Logger from "@shared/Logger"

import {
    BarChartDataPoint,
    BarChartDatum, BarXType, getKeys,
    getSeriesTotal,
    mergeConfig,
    Numeric,
    processDataPoints,
    SeriesType,
    StackedBarChartConfig,
    StackedBarChartOptions
} from "@shared/charts/StackedBarChartTypes";
import { Colors } from "@shared/util/ColorUtil";

const logger = new Logger("stackedBarChart");


const DEFAULT_CONFIG = (): StackedBarChartConfig => ({
    w: 400,
    h: 400,
    margin: { top: 20, left: 0, bottom: 20, right: 0 },
    colors: [
        Colors.dolphin,
        Colors.mediumDolphin,
        Colors.lightDolphin,
        Colors.coral,
        Colors.pink,
        Colors.indigo,
        Colors.royal
    ],
    barWidth: null,
    showYAxis: false,
    showXAxisLine: false,
    axisColor: Colors.borderLight,
    fontFamily: "Lato, sans-serif",
    ticks: {
        y: {
            size: 0,
            format: () => "",
            padding: 3,
            fontSize: 14,
            fontColor: Colors.lightText
        },
        x: {
            size: 0,
            format: d3.timeFormat("%-m/%-d"),
            padding: 10,
            fontSize: 14,
            fontColor: Colors.lightText
        }
    }

})

export function drawStackedBarChart(selector: string, dataPoints: BarChartDataPoint<Date>[], options: StackedBarChartOptions) {
    const config = mergeConfig(DEFAULT_CONFIG(), options);
    const data: BarChartDatum[] = processDataPoints(dataPoints)
    const { w, h, margin, colors, showYAxis, ticks, axisColor, fontFamily, showXAxisLine, barWidth } = config
    logger.info("Bar width", barWidth)
    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;

    const x = d3.scaleBand<Date>()
    .rangeRound([0, width])
    .padding(barWidth ? 0 : 0.2)

    const y = d3.scaleLinear<number>()
    .rangeRound([height, 0])

    const z = d3.scaleOrdinal(colors)

    const xAxis = d3.axisBottom<Date>(x)
    .tickFormat(d3.timeFormat("%-m/%-d"))
    .tickSize(ticks.x.size)
    .tickPadding(ticks.x.padding)

    const parent = d3.select<d3.BaseType, BarChartDataPoint<Date>>(selector)
    parent.select("svg").remove()

    const svg = parent.append("svg")
    // .style("font-family", Colors.fo)
    .style("font-family", fontFamily)
    .attr("viewBox", `0 0 ${ w + margin.left + margin.right } ${ h + margin.top + margin.bottom }`)
    .append('g')
    .attr('transform', `translate(${ margin.left },${ margin.top })`)

    const dataKeys: string[] = getKeys(dataPoints)

    const layers = d3.stack<BarChartDatum>().keys(dataKeys)(data)

    x.domain(layers[0].map(d => new Date(d.data.x)))
    y.domain([0, d3.max(layers[layers.length - 1], d => (d[0] + d[1]))!]).nice()

    const layer = svg.selectAll('layer')
    .data(layers)
    .enter()
    .append('g')
    .attr('class', 'layer')
    .style('fill', (d, i) => (z(d.key))!)

    const _w = barWidth ?? x.bandwidth()

    const heightOffset = _w;
    layer.selectAll('rect')
    .data(d => d)
    .enter()

    .append('rect')
    .attr('x', d => x(new Date(d.data.x))!)
    .attr('y', d => y(d[0] + d[1]) - heightOffset)
    .attr('height', d => y(d[0]) - y(d[1] + d[0]) + heightOffset)
    .attr('width', barWidth ?? x.bandwidth())
    .attr("transform", `translate(${ barWidth ? x.bandwidth() / 2 - (barWidth ?? 0) / 2 : 0 }, 0)`)
    .attr("rx", _w/2)

    const xAxisSvg = svg.append('g')
    .attr('transform', `translate(0,${ height })`)
    .style("font-size", `${ ticks.x.fontSize }`)
    .style("font-family", fontFamily)
    .attr("class", "xaxis axis")
    .call(xAxis);

    xAxisSvg.selectAll("path").style("stroke", axisColor);
    if (!showXAxisLine) {
        xAxisSvg.selectAll("path").remove()
    }


    if (showYAxis) {
        const yAxis = d3.axisLeft(y)
        svg.append('g')
        .style("font-size", `${ ticks.x.fontSize }`)
        .style("font-family", fontFamily)
        .attr("class", "yaxis axis")
        .attr('transform', `translate(${ 0 },0)`)
        .call(yAxis)
    }
    // create the svg


}

function bar(x: number, y: number, w: number, h: number, r: number, _f?: number | undefined) {
    let f = _f
    // Flag for sweep:
    if (f === undefined) {
        f = 1;
    }

    // x coordinates of top of arcs
    const x0 = x + r;
    const x1 = x + w - r;
    // y coordinates of bottom of arcs
    const y0 = y - h + r;
    // just for convenience (slightly different than above):
    const l = "L", a = "A";

    const parts = ["M", x, y, l, x, y0, a, r, r, 0, 0, f, x0, y - h, l, x1, y - h, a, r, r, 0, 0, f, x + w, y0, l, x + w, y, "Z"];
    return parts.join(" ");
}

function buildTooltip<T extends BarXType>(svg: d3.Selection<d3.BaseType, BarChartDatum, any, any>) {

    // Prep the tooltip bits, initial display is hidden
    const tooltip = svg.append("g")
    .attr("class", "tooltip")
    .style("display", "none");

    tooltip.append("rect")
    .attr("width", 60)
    .attr("height", 20)
    .attr("fill", "white")
    .style("opacity", 0.5);

    tooltip.append("text")
    .attr("x", 30)
    .attr("dy", "1.2em")
    .style("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", "bold");

    return tooltip;
}