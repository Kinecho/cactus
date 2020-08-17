import { EdgeInsets } from "@shared/util/LayoutUtil";
import { TickSetting } from "@shared/charts/ChartTypes";
import { RecursivePartial } from "@shared/util/ObjectUtil";
import Logger from "@shared/Logger"
import { ensureConsecutive, getDatesBetween } from "@shared/util/DateUtil";
import { ToneID } from "@shared/api/ToneAnalyzerTypes";
import { DateTime } from "luxon";

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

export interface BarChartDataPoint<T extends BarXType, S extends string> {
    x: T,
    series: Record<S, number>
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
    showLegend: boolean,
    fontFamily: string,
    axisColor: string,
    showXAxisLine: boolean,
    barWidth: number | null,
    colors: string[],
    ticks: {
        every: number,
        x: TickSetting<Date>,
        y: TickSetting<number>,
    }
}

export type StackedBarChartOptions = RecursivePartial<StackedBarChartConfig>

export function mergeConfig(defaultConfig: StackedBarChartConfig, options: StackedBarChartOptions) {
    logger.info("Merge config options", options);
    const cfg = Object.assign(defaultConfig, options, {
        ticks: {
            every: options.ticks?.every ?? defaultConfig.ticks.every,
            x: Object.assign(defaultConfig.ticks.x, options.ticks?.x ?? {}),
            y: Object.assign(defaultConfig.ticks.y, options.ticks?.y ?? {})
        }
    });

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
        const datum = { ...d.series, total, x: d.x }
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

export const mockEmotionsData = (): BarChartDataPoint<Date>[] => ensureConsecutive({
    createEmpty: d => ({ x: d, series: {} }),
    getDate: item => item.x,
    start: DateTime.local(2020, 8, 1).toJSDate(),
    end: DateTime.local(2020, 8, 14).toJSDate(),
    data: [
        {
            x: DateTime.local(2020, 8, 1).toJSDate(),
            series: { [ToneID.sadness]: 0.75, [ToneID.tentative]: 0.9 }
        },
        {
            x: DateTime.local(2020, 8, 2).toJSDate(),
            series: { [ToneID.sadness]: 0.73, [ToneID.anger]: 1 }
        },
        {
            x: DateTime.local(2020, 8, 3).toJSDate(),
            series: { [ToneID.anger]: 0.5 }
        },
        {
            x: DateTime.local(2020, 8, 5).toJSDate(),
            series: {
                [ToneID.sadness]: 3,
                [ToneID.tentative]: 0.8,
                // [ToneID.confident]: 1,
                // [ToneID.joy]: 1,
                // [ToneID.confident]: 1,
                [ToneID.analytical]: 1,
            }
        },
        {

            x: DateTime.local(2020, 8, 6).toJSDate(),
            series: {
                [ToneID.sadness]: 1,
                // [ToneID.analytical]: 0.9,
                [ToneID.confident]: 1,
                // [ToneID.joy]: 1,
                [ToneID.fear]: 0.5
            }
        },
        {
            x: DateTime.local(2020, 8, 10).toJSDate(),
            series: {
                [ToneID.sadness]: 1,
                // [ToneID.analytical]: 0.9,
                // [ToneID.confident]: 1,
                // [ToneID.joy]: 1,
                // [ToneID.fear]: 0.5
            }
        },
    ]
});