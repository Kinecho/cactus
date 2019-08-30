import FlamelinkModel from "@shared/FlamelinkModel";
import {Image} from "@shared/models/PromptContent";
import {isBlank} from "@shared/util/StringUtil";

export function fromFlamelinkData<T extends FlamelinkModel>(data: any, Type: { new(): T }): T {
    // const transformed = convertTimestampToDate(data);
    //not transforming timestamps yet
    const model = Object.assign(new Type(), data);
    model.updateFromData(data);
    return model;
}

export function hasImage(image: Image | undefined) {
    if (!image) {
        return false;
    }

    return !(isBlank(image.storageUrl) && isBlank(image.flamelinkFileName) && isBlank(image.url) && isBlank(image.storageUrl) && (!image.fileIds || image.fileIds.length === 0));
}