export interface TickSetting<T> {
    size: number,
    padding: number,
    fontSize: number,
    fontColor: string,
    format: ((value: T, index: number) => string),
}