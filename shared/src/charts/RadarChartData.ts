export interface RadarChartDataPoint {
    axis: string
    value: number,
    id?: string,
}

export interface RadarChartData {
    name: string,
    axes: RadarChartDataPoint[],
}