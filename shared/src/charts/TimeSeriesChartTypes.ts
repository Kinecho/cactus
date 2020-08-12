export interface TimeSeriesDataPoint {
    date: Date,
    label: string,
    value: number,
}

export interface GradientPoint {
    offset: string,
    color: string,
}


export const createMockData = (): TimeSeriesDataPoint[] => [
    { date: new Date('2020-01-01'), value: 0.65, label: "One" },
    { date: new Date('2020-01-02'), value: 0.7, label: "Three" },
    { date: new Date('2020-01-03'), value: 0.6, label: "Three" },
    { date: new Date('2020-01-04'), value: 0.4, label: "Three" },
    { date: new Date('2020-01-05'), value: 0.5, label: "Two" },
    { date: new Date('2020-01-06'), value: 0.9, label: "Four" },
    { date: new Date('2020-01-07'), value: 0.95, label: "Six" },
]