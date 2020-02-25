import CactusMember from "@shared/models/CactusMember";
import {flattenUnique, removeDuplicates} from "@shared/util/FirestoreUtil";

function createMember(id: string | undefined): CactusMember {
    const m = new CactusMember();
    m.id = id;
    return m;
}


test("remove duplicates", () => {
    const m1 = createMember("1");
    const m2 = createMember("2");
    const m3a = createMember("3");
    m3a.email = "m3a";
    const m3b = createMember("3");
    m3b.email = "m3b";
    const m4 = createMember("4");
    const none = createMember(undefined);

    const models = [m1, m2, m3a, m3b, m4, none];


    const pruned = removeDuplicates(models);
    expect(models.length).toEqual(6);
    expect(pruned.length).toEqual(4);

    expect(pruned).toEqual([m1, m2, m3a, m4]);
    expect(pruned).not.toEqual([m1, m2, m3b, m4]);
});


test("uniqueFlatten", () => {
    const m1 = createMember("1");
    const m2 = createMember("2");
    const m3a = createMember("3");
    m3a.email = "m3a";
    const m3b = createMember("3");
    m3b.email = "m3b";
    const m4 = createMember("4");
    const none = createMember(undefined);

    const g1 = [m1, m3a];
    const g2 = [] as CactusMember[];
    const g3 = [none, m4];
    const g4 = [m2, m3a, m3b, m4];

    const flat = flattenUnique([g1, g2, g3, g4]);
    expect(flat.length).toEqual(4);
    expect(flat).toEqual([m1, m2, m3a, m4]);

});
