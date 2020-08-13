import { EdgeInsets } from "@shared/util/LayoutUtil";
import { TickSetting } from "@shared/charts/ChartTypes";
import { RecursivePartial } from "@shared/util/ObjectUtil";
import Logger from "@shared/Logger"
import { getDatesBetween } from "@shared/util/DateUtil";

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
    ensureConsecutive: boolean,
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


export function processDataPoints<T extends BarXType>(data: BarChartDataPoint<T>[], ensureConsecutive: boolean = true): BarChartDatum[] {
    const processed: BarChartDatum[] = []
    let last: BarChartDataPoint<T> | null = data[0] ?? null;
    data.sort((d1, d2) => {
        return d1.x.valueOf() - d2.x.valueOf()
    }).forEach(d => {
        const fillerDays = last?.x ? getDatesBetween(last.x, d.x) : [];

        fillerDays.forEach(filler => {
            processed.push({ total: 0, x: filler.valueOf() })
        })

        const total = getSeriesTotal(d)
        const datum = { ...d.series, total, x: d.x.valueOf() }
        processed.push(datum)
        last = d;
    })
    return processed
}

export function getSeriesTotal<T extends BarXType>(data: BarChartDataPoint<T>): number {
    return Object.values(data.series).reduce((t, value) => {
        return t + value
    }, 0);
}