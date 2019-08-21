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
            console.error(`Can not convert input "${input}" to a number. Returning a medium sized image`);
            return ImageWidth.w667
        }

        console.log("input width", width);
        return breakpoints.find(breakpoint => breakpoint >= width) || ImageWidth.w1920;
    } catch (error) {
        console.error(`Can not convert input "${input}" to a number. Returning a medium sized image`);
        return ImageWidth.w667;
    }

}