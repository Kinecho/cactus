import * as d3 from "d3";

import {
    BarChartDataPoint,
    BarChartDatum, BarXType, getKeys, getSeriesTotal,
    mergeConfig, Numeric,
    processDataPoints, SeriesType,
    StackedBarChartConfig,
    StackedBarChartOptions
} from "@shared/charts/StackedBarChartTypes";
import { formatDate, formatDateTime, getISODate } from "@shared/util/DateUtil";

const DEFAULT_CONFIG = (): StackedBarChartConfig => ({
    w: 400,
    h: 400,
    margin: { top: 20, left: 30, bottom: 20, right: 50 }
})

export function drawStackedBarChart(selector: string, dataPoints: BarChartDataPoint<Date>[], options: StackedBarChartOptions) {
    const config = mergeConfig(DEFAULT_CONFIG(), options);
    const data: BarChartDatum[] = processDataPoints(dataPoints)
    const { w, h, margin } = config

    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;

    const x = d3.scaleBand<Date>()
    .rangeRound([0, width])

    const y = d3.scaleLinear<number>()
    .rangeRound([height, 0])

    const z = d3.scaleOrdinal(d3.schemeCategory10)

    const xAxis = d3.axisBottom<Date>(x)
    .tickFormat(d3.timeFormat("%-m/%-d"))

    const yAxis = d3.axisRight(y)
    const parent = d3.select<d3.BaseType, BarChartDataPoint<Date>>(selector)
    parent.select("svg").remove()

    const svg = parent.append("svg")
    // .style("font-family", Colors.fo)
    .attr("viewBox", `0 0 ${ w + margin.left + margin.right } ${ h + margin.top + margin.bottom }`)
    // .attr('width', width + margin.left + margin.right)
    // .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

    const dataKeys: string[] = getKeys(dataPoints)

    const layers = d3.stack<BarChartDatum>().keys(dataKeys)(data)
    console.log("Layers", layers)
    x.domain(layers[0].map(d => new Date(d.data.x)))

    // const yMax = d3.max<BarChartDataPoint<T>, number>(dataPoints,d => getSeriesTotal(d)) ?? 0
    y.domain([0, d3.max(layers[layers.length - 1], d => (d[0] + d[1]) )!]).nice()

    const layer = svg.selectAll('layer')
    .data(layers)
    .enter()
    .append('g')
    .attr('class', 'layer')
    .style('fill', (d, i) => (z(d.key) ))

    layer.selectAll('rect')
    .data(d => d)
    .enter()
    .append('rect')
    .attr('x', d => x(new Date(d.data.x))!)
    .attr('y', d => y(d[0] + d[1]))
    .attr('height', d => y(d[0]) - y(d[1] + d[0]))
    .attr('width', x.bandwidth() - 1)

    svg.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)

    svg.append('g')
    .attr('class', 'axis axis--y')
    .attr('transform', `translate(${width},0)`)
    .call(yAxis)

    // create the svg



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