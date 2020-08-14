import { EdgeInsets } from "@shared/util/LayoutUtil";
import { GradientPoint } from "@shared/util/ColorUtil";
import { TickSetting } from "@shared/charts/ChartTypes";

export interface TimeSeriesDataPoint {
    date: Date,
    label: string,
    value: number|null,
}

export const createMockPositivityData = (): TimeSeriesDataPoint[] => [
    { date: new Date('2020-01-01'), value: 0.65, label: "One" },
    { date: new Date('2020-01-02'), value: 0.7, label: "Three" },
    { date: new Date('2020-01-03'), value: 0.6, label: "Three" },
    { date: new Date('2020-01-04'), value: 0.4, label: "Three" },
    { date: new Date('2020-01-05'), value: 0.5, label: "Two" },
    { date: new Date('2020-01-06'), value: 0.9, label: "Four" },
    { date: new Date('2020-01-07'), value: 0.95, label: "Six" },
]

export interface TimeSeriesConfig {
    w: number,
    h: number,
    margin: EdgeInsets,
    gradient: GradientPoint[],
    showYAxis: boolean,
    axisColor: string,
    fixedDateRange: boolean,
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