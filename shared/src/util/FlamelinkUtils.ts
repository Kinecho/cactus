import FlamelinkModel from "@shared/FlamelinkModel";

export function fromFlamelinkData<T extends FlamelinkModel>(data: any, Type: { new(): T }): T {
    // const transformed = convertTimestampToDate(data);
    //not transforming timestamps yet
    const model = new Type();
    return Object.assign(model, data) as T;
}