import { EdgeInsets } from "@shared/util/LayoutUtil";

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
}

export type StackedBarChartOptions = Partial<StackedBarChartConfig>

export function mergeConfig(config: StackedBarChartConfig, options: StackedBarChartOptions) {
    return Object.assign(config, options);
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