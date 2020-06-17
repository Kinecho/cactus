import HoboCache from "@admin/HoboCache"
import PromptContent from "@shared/models/PromptContent";

jest.useFakeTimers()
describe("Ensure hobo cache resets", () => {

    beforeEach(() => {
        HoboCache.initialize(2000)
    })

    test("Reset function is called after the max age times out", async () => {

        const resetFn = jest.fn()
        HoboCache.shared.resetShared = resetFn;
        expect(setTimeout).toHaveBeenCalledTimes(1);

        jest.runOnlyPendingTimers()
        expect(resetFn).toHaveBeenCalledTimes(1)

        jest.resetAllMocks();
    })

    test("Resetting cache clears stored values", () => {
        const cache = HoboCache.shared;
        const p1 = new PromptContent();
        p1.entryId = "test1";

        cache.setPromptContent(p1.entryId, p1);
        cache.setPromptContent("not-found", undefined);

        expect(cache.getPromptContent("test1")).toBe(p1);
        expect(cache.getPromptContent("not-found")).toBeNull()

        cache.resetShared();
        expect(HoboCache.shared.getPromptContent("test1")).toBeUndefined()
        expect(HoboCache.shared.getPromptContent("not-found")).toBeUndefined()
        expect(HoboCache.shared.promptContentByEntryId).toEqual({});
    })

    test("has cached Prompt Content methods", () => {
        const cache = HoboCache.shared;
        const p1 = new PromptContent();
        p1.entryId = "test1";

        cache.setPromptContent(p1.entryId, p1);
        expect(cache.hasCachedPromptContent(p1.entryId)).toBeTruthy()
        expect(cache.hasCachedPromptContent("test2")).toBeFalsy()

        cache.setPromptContent("none", undefined);
        expect(cache.hasCachedPromptContent("none")).toBeTruthy();
    });

    test("get cached Prompt Content", () => {
        const cache = HoboCache.shared;
        const p1 = new PromptContent();
        p1.entryId = "test1";

        cache.setPromptContent(p1.entryId, p1);
        cache.setPromptContent("not-found", undefined);

        expect(cache.getPromptContent("test1")).toBe(p1);
        expect(cache.getPromptContent("none")).toBeUndefined()
        expect(cache.getPromptContent("not-found")).toBeNull()
    })
})