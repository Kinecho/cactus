import CactusMember from "@shared/models/CactusMember";
import { CoreValue } from "@shared/models/CoreValueTypes";

describe("core values getters", () => {
    test("get core value - with values", () => {
        const member = new CactusMember();
        member.coreValues = [CoreValue.Abundance, CoreValue.Accomplishment, CoreValue.Achievement];
        expect(member.getCoreValueAtIndex()).toEqual(CoreValue.Abundance);
        expect(member.getCoreValueAtIndex(0)).toEqual(CoreValue.Abundance);
        expect(member.getCoreValueAtIndex(1)).toEqual(CoreValue.Accomplishment);
        expect(member.getCoreValueAtIndex(2)).toEqual(CoreValue.Achievement);

        //should "loop through" values using modulo
        expect(member.getCoreValueAtIndex(3)).toEqual(CoreValue.Abundance);
        expect(member.getCoreValueAtIndex(4)).toEqual(CoreValue.Accomplishment);
        expect(member.getCoreValueAtIndex(5)).toEqual(CoreValue.Achievement);
        expect(member.getCoreValueAtIndex(6)).toEqual(CoreValue.Abundance);

        expect(member.getCoreValueAtIndex(7)).toEqual(CoreValue.Accomplishment);
        expect(member.getCoreValueAtIndex(8)).toEqual(CoreValue.Achievement);
        expect(member.getCoreValueAtIndex(9)).toEqual(CoreValue.Abundance);
    })

    test("get core value - no core values on their profile", () => {
        const member = new CactusMember();
        expect(member.getCoreValueAtIndex(1)).toBeUndefined();
        expect(member.getCoreValueAtIndex()).toBeUndefined()
        expect(member.getCoreValueAtIndex(10)).toBeUndefined()
        expect(member.getCoreValueAtIndex(2)).toBeUndefined()
    })
})
