import * as d3 from "d3";
import Logger from "@shared/Logger"

import {
    BarChartDataPoint,
    BarChartDatum,
    BarXType,
    getKeys,
    mergeConfig,
    processDataPoints,
    StackedBarChartConfig,
    StackedBarChartOptions
} from "@shared/charts/StackedBarChartTypes";
import { Colors } from "@shared/util/ColorUtil";
import { ToneColorMap, ToneID } from "@shared/api/ToneAnalyzerTypes";
import { curveCardinal, line as d3Line } from "d3";
import { isNull } from "@shared/util/ObjectUtil";

const logger = new Logger("stackedBarChart");

const DEFAULT_CONFIG = (): StackedBarChartConfig => ({
    w: 400,
    h: 225,
    ensureConsecutive: true,
    margin: { top: 0, left: 0, bottom: 10, right: 0 },
    colors: [
        Colors.dolphin,
        Colors.mediumDolphin,
        Colors.lightDolphin,
        Colors.lightPink,
        Colors.pink,
        Colors.lightRoyal,
        Colors.royal
    ],
    barWidth: 12,
    showYAxis: false,
    showXAxisLine: false,
    showLegend: false,
    axisColor: Colors.borderLight,
    fontFamily: "Lato, sans-serif",
    ticks: {
        every: 1,
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

export function drawStackedBarChart(selector: string, dataPoints: BarChartDataPoint<Date, ToneID>[], options: StackedBarChartOptions) {
    const config = mergeConfig(DEFAULT_CONFIG(), options);
    const { w, h, margin, colors, showYAxis, ticks, axisColor, fontFamily, showXAxisLine, barWidth, ensureConsecutive, showLegend } = config
    const data: BarChartDatum[] = processDataPoints(dataPoints, ensureConsecutive)
    logger.info("Bar width", barWidth)
    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;

    const x = d3.scaleBand<Date>()
    .rangeRound([0, width])
    .domain(data.map(d => new Date(d.x)))
    .padding(barWidth ? 0 : 0.2)

    const y = d3.scaleLinear<number>()
    .rangeRound([height, margin.bottom])

    const yMax = d3.max(data, d => d.total) ?? 0
    y.domain([0, yMax]).nice()

    const getColor = (key: string) => {
        return ToneColorMap[key as ToneID] ?? Colors.bgDolphin
    }
    const xAxis = d3.axisBottom<Date>(x)
    .tickFormat(d3.timeFormat("%-m/%-d"))
    .ticks(d3.timeDay.every(1))
    .tickSize(ticks.x.size)
    .tickPadding(ticks.x.padding)

    const parent = d3.select<d3.BaseType, BarChartDataPoint<Date, ToneID>>(selector)
    parent.select("svg").remove()

    const svg = parent.append("svg")
    // .style("font-family", Colors.fo)
    .style("font-family", fontFamily)
    .attr("viewBox", `0 0 ${ w + margin.left + margin.right } ${ h + margin.top + margin.bottom }`)
    .append('g')

    const dataKeys: string[] = getKeys(dataPoints)
    const layers = d3.stack<BarChartDatum>().keys(dataKeys)(data)
    logger.info("layers", layers)
    // if (layers.length > 0) {
    //     y.domain([0, d3.max(layers[layers.length - 1], d => (d[0] + d[1]))!]).nice()
    // }

    const layer = svg.selectAll('layer')
    .data(layers)
    .enter()
    .append('g')
    .attr('class', 'layer')
    .style('fill', (d, i) => getColor(d.key))
    .sort((a, b) => b.index - a.index)

    const _w = barWidth ?? x.bandwidth()

    const barHeight = barHeightFactory(y, height, _w)
    const barY = barYFactory(y, height, _w)

    layer.selectAll('rect')
    .data(d => d)
    .enter()

    .append('rect')
    .attr('x', d => x(new Date(d.data.x))!)
    .attr('y', barY)
    .attr('height', barHeight)
    .attr('width', _w)
    .attr("transform", `translate(${ barWidth ? (x.bandwidth() / 2 - (barWidth ?? 0) / 2) : 0 }, 0)`)
    .attr("rx", _w / 2)

    const xAxisSvg = svg.append('g')
    .attr('transform', `translate(0,${ height })`)
    .style("font-size", `${ ticks.x.fontSize }`)
    .style("font-family", fontFamily)
    .attr("color", ticks.x.fontColor)
    .attr("class", "xaxis axis")
    .call(xAxis);

    xAxisSvg.selectAll("path").style("stroke", axisColor);
    if (!showXAxisLine) {
        xAxisSvg.selectAll("path").remove()
    }

    //remove ticks as necessary
    svg.selectAll(".xaxis .tick")
    .each(function (_, i) {
        if ((i % ticks.every) !== 0) d3.select(this).select("text").remove()
    });

    const line = d3.line<BarChartDatum>()
    .curve(curveCardinal)
    .defined(d => !isNull(d.total) && d.total > 0)
    .x(d => x(new Date(d.x))!)
    .y(d => y(d.value ?? 0))


    const dotRadius = 4;
    //add dots to the undefined values
    svg.selectAll<d3.BaseType, BarChartDatum>("undefinedCircles")
    .data(data.filter(d => isNull(d.total) || d.total === 0))
    .enter()
    .append("circle")
    .attr("fill", Colors.lightGray)
    .attr("stroke", "none")
    .attr("cx", d => x(new Date(d.x))!)
    .attr("cy", d => y(0))
    .attr("transform", `translate(${ (barWidth ? (x.bandwidth() / 2 - (barWidth ?? 0) / 2) : 0) + dotRadius * 2 }, -4)`)
    .attr("r", dotRadius)


    if (showYAxis) {
        const yAxis = d3.axisLeft(y)
        svg.append('g')
        .style("font-size", `${ ticks.x.fontSize }`)
        .style("font-family", fontFamily)
        .attr("class", "yaxis axis")
        .attr('transform', `translate(${ 0 },0)`)
        .call(yAxis)
    }

    if (showLegend) {
        const legendX = margin.left
        // add the legend
        const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate( ${ legendX } , 10)`);

        const legendRectHeight = 18;
        const legendSpacing = 6;

        legend.selectAll('rect')
        .data(layers.reverse())
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', function (d, i) {
            return i * (legendRectHeight + legendSpacing);
        })
        .attr('width', legendRectHeight)
        .attr('height', legendRectHeight)
        .attr('fill', (d, i) => getColor(d.key))
        .attr("rx", legendRectHeight / 2);

        legend.selectAll('text')
        .data(layers)
        .enter()
        .append('text')
        .text((d, i) => d.key)
        .attr('x', legendRectHeight + legendSpacing)
        .attr('y', (d, i) => i * (legendRectHeight + legendSpacing))
        .style("font-family", fontFamily)
        .attr('text-anchor', 'start')
        .attr('alignment-baseline', 'hanging');
    }
}

function barYFactory(y: d3.ScaleLinear<number, number>, chartHeight: number, barWidth: number) {
    return (d: d3.SeriesPoint<BarChartDatum>) => {
        const barY = y(d[1])
        return isNaN(barY) ? 0 : (barY - barWidth)
    }
}

function barHeightFactory(y: d3.ScaleLinear<number, number>, chartHeight: number, barWidth: number) {
    return (d: d3.SeriesPoint<BarChartDatum>): number => {
        const barHeight = y(d[0]) - y(d[1])
        return isNaN(barHeight) ? 0 : (barHeight + barWidth)
    }
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