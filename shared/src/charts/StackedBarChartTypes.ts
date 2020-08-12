import { EdgeInsets } from "@shared/util/LayoutUtil";
import { TickSetting } from "@shared/charts/ChartTypes";
import { RecursivePartial } from "@shared/util/ObjectUtil";
import Logger from "@shared/Logger"

const logger = new Logger("StackedBarChartTypes");

export interface Numeric {
    valueOf(): number;
}

export interface Stringable {
    toString(): string;
}

// export type BarXType = Numeric & Stringable
export type BarXType = Date
export type SeriesType = Record<string, number>

export interface BarChartDataPoint<T extends BarXType> {
    x: T,
    series: Record<string, number>
    // [key: string]: number
    total?: number
}

export interface BarChartDatum {
    total: number,
    x: number,

    [key: string]: number
}

export interface StackedBarChartConfig {
    w: number,
    h: number,
    margin: EdgeInsets,
    showYAxis: boolean,
    fontFamily: string,
    axisColor: string,
    showXAxisLine: boolean,
    barWidth: number | null,
    colors: string[],
    ticks: {
        x: TickSetting<Date>,
        y: TickSetting<number>,
    }
}

export type StackedBarChartOptions = RecursivePartial<StackedBarChartConfig>

export function mergeConfig(defaultConfig: StackedBarChartConfig, options: StackedBarChartOptions) {
    logger.info("Merge config options", options);
    const cfg = Object.assign(defaultConfig, options);
    cfg.ticks = {
        x: Object.assign(defaultConfig.ticks.x, options.ticks?.x ?? {}),
        y: Object.assign(defaultConfig.ticks.y, options.ticks?.y ?? {})
    }
    return cfg;
}

export function getKeys<T extends BarXType>(data: BarChartDataPoint<T>[]): string[] {
    const keys = new Set<string>()
    data.forEach(d => Object.keys(d.series).forEach(k => keys.add(k)))
    return [...keys]

}


export function processDataPoints<T extends BarXType>(data: BarChartDataPoint<T>[]): BarChartDatum[] {
    return data.map(d => {
        const total = getSeriesTotal(d)
        // const {x, (...rest as {[key: string]: number})} = d
        return { ...d.series, total, x: d.x.valueOf() }
    })
}

export function getSeriesTotal<T extends BarXType>(data: BarChartDataPoint<T>): number {
    return Object.values(data.series).reduce((t, value) => {
        return t + value
    }, 0);
}