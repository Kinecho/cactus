import {getImageBreakpointWidth, ImageWidth} from "@shared/util/ImageUtil";

describe("get image breakpoint", () => {
    test("string 10", () => {
        const input = "10";
        expect(getImageBreakpointWidth(input)).toEqual(ImageWidth.w50);
    });

    test("numeric 10", () => {
        const input = 10;
        expect(getImageBreakpointWidth(input)).toEqual(ImageWidth.w50);
    });

    test("ImageWidth.50", () => {
        const input = ImageWidth.w50;
        expect(getImageBreakpointWidth(input)).toEqual(ImageWidth.w50);
    });

    test("Crazy big number", () => {
        const input = 999999999999;
        expect(getImageBreakpointWidth(input)).toEqual(ImageWidth.w1920);
    });

    test("Not a number", () => {
        const input = "alkdjfsa";
        expect(getImageBreakpointWidth(input)).toEqual(ImageWidth.w667);
    });

    test("decimal number", () => {
        const input = 310.31;
        expect(getImageBreakpointWidth(input)).toEqual(ImageWidth.w375);
    });
});