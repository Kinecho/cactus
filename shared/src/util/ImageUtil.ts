import {stripQueryParams} from '@shared/util/StringUtil'
import Logger from "@shared/Logger";

const logger = new Logger("ImageUtil.ts");

export enum ImageWidth {
    w50 = 50,
    w150 = 150,
    w375 = 375,
    w667 = 667,
    w900 = 900,
    w1080 = 1080,
    w1440 = 1440,
    w1920 = 1920,
}

const breakpoints = Object.values(ImageWidth).map(widthString => Number(widthString));

export function getImageBreakpointWidth(input: string | number | ImageWidth): number {
    try {
        const width = Number(input);

        if (isNaN(width)) {
            logger.error(`Can not convert input "${input}" to a number. Returning a medium sized image`);
            return ImageWidth.w667
        }

        logger.log("input width", width);
        return breakpoints.find(breakpoint => breakpoint >= width) || ImageWidth.w1920;
    } catch (error) {
        logger.error(`Can not convert input "${input}" to a number. Returning a medium sized image`);
        return ImageWidth.w667;
    }

}

export function getCloudinaryUrlFromStorageUrl(options: {
        storageUrl: string, 
        width: string | number, 
        transforms?: Array<string>
    }): string {

    const isSVG = stripQueryParams(options.storageUrl).url.endsWith(".svg");
    let transformations = [];
    if (isSVG) {
        transformations.push(`w_${getImageBreakpointWidth(options.width)}`);
    }
    if (options.transforms) {
        transformations = transformations.concat(options.transforms);
    }
    let manipulationSlug = "";
    if (transformations.length > 0) {
        manipulationSlug = `${transformations.join(",")}/`
    }

    return `https://res.cloudinary.com/cactus-app/image/fetch/${manipulationSlug}${encodeURIComponent(options.storageUrl)}`;
}