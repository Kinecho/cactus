export interface TickSetting<T> {
    size: number,
    padding: number,
    fontSize: number,
    fontColor: string,
    interval?: number,
    format: ((value: T, index: number) => string),
}

export interface ChartDataResult<DATA> {
    nonEmptyCount: number,
    data: DATA[]
}