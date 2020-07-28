import Experiment from "@shared/models/Experiment";
import { ExperimentType } from "@shared/models/ExperimentTypes";
import CactusMember from "@shared/models/CactusMember";
import ExperimentManager from "@web/managers/ExperimentManager";

const manager = ExperimentManager.shared

const exp1 = new Experiment({
    name: "Test1",
    type: ExperimentType.redirect,
    redirects: {
        variants: [
            { name: "one", path: "/one" },
            { name: "two", path: "/two" },
            { name: "three", path: "/one" }
        ]
    }
});
let member = CactusMember.fromMemberData({ id: "m1", email: "test@test.com" })


describe("Get variants from member", () => {
    beforeEach(() => {
        member = CactusMember.fromMemberData({ id: "m1", email: "test@test.com" })
    })

    test("No experiments on member", () => {
        expect(manager.getVariantFromMember({ member, experiment: exp1 })).toBeNull()
    })

    test("Experiment on member - valid names", () => {
        member.experiments = {
            "Test1": "one",
        }
        expect(manager.getVariantFromMember({ member, experiment: exp1 })).toEqual("one")
    })

    test("Experiment not member", () => {
        member.experiments = {
            "different": "one",
        }
        expect(manager.getVariantFromMember({ member, experiment: exp1 })).toBeNull()
    })

    test("Invalid variant for experiment", () => {
        member.experiments = {
            "Test1": "invalid",
        }
        expect(manager.getVariantFromMember({ member, experiment: exp1 })).toBeNull()
    })
})

describe("Persist experiments to device", () => {
    beforeEach(() => {
        console.log("clearing localstorage before test");
        localStorage.clear();
        member = CactusMember.fromMemberData({ id: "m1", email: "test@test.com" })
    })

    test("add experiments to local storage", () => {
        manager.persistVariantToDevice({ experimentName: exp1.name, variant: "one", overwrite: true })
        const experiments = { "Test1": "one" };
        expect(manager.getDeviceExperiments()).toEqual(experiments)
    })

    test("don't overwrite existing experiments in local storage", () => {
        manager.persistVariantToDevice({ experimentName: exp1.name, variant: "one" })
        const experiments = { "Test1": "one" };
        expect(manager.getDeviceExperiments()).toEqual(experiments)

        manager.persistVariantToDevice({ experimentName: exp1.name, variant: "two" })
        expect(manager.getDeviceExperiments()).toEqual(experiments)
    })

    test("overwrite existing experiments in local storage", () => {
        manager.persistVariantToDevice({ experimentName: exp1.name, variant: "one" })
        const experiments = { "Test1": "one" };
        expect(manager.getDeviceExperiments()).toEqual(experiments)

        manager.persistVariantToDevice({ experimentName: exp1.name, variant: "two", overwrite: true })
        expect(manager.getDeviceExperiments()).toEqual({ "Test1": "two" })
    })
})

describe("apply device experiments to member", () => {

    beforeEach(() => {
        console.log("clearing localstorage before test");
        localStorage.clear();
        member = CactusMember.fromMemberData({ id: "m1", email: "test@test.com" })
    })

    test("no changes when there are no device experiments", () => {
        const changed = manager.applyDeviceExperimentsToMember(member);
        expect(changed).toBeFalsy()
    })

    test("device experiments are applied when member has none", () => {
        manager.persistVariantToDevice({ experimentName: exp1.name, variant: "one", overwrite: true })
        const experiments = { "Test1": "one" };
        expect(manager.getDeviceExperiments()).toEqual(experiments)
        const changed = manager.applyDeviceExperimentsToMember(member);
        expect(changed).toBeTruthy()
        expect(member.experiments).toEqual(experiments)
    })

    test("no changes when member has current, different experiments", () => {
        manager.persistVariantToDevice({ experimentName: exp1.name, variant: "two", overwrite: true })
        const deviceExperiments = { "Test1": "two" };
        const memberExperiments = { "Test1": "one" };
        member.experiments = memberExperiments
        expect(manager.getDeviceExperiments()).toEqual(deviceExperiments)
        const changed = manager.applyDeviceExperimentsToMember(member);
        expect(changed).toBeFalsy()
        expect(member.experiments).toEqual(memberExperiments)
    })

    test("member has existing experimenmts, but device has new ones", () => {
        manager.persistVariantToDevice({ experimentName: "two", variant: "abc", overwrite: true })
        const deviceExperiments = { "two": "abc" };
        const memberExperiments = { "Test1": "one" };
        member.experiments = memberExperiments
        expect(manager.getDeviceExperiments()).toEqual(deviceExperiments)
        const changed = manager.applyDeviceExperimentsToMember(member);
        expect(changed).toBeTruthy()
        expect(member.experiments).toEqual({ ...memberExperiments, ...deviceExperiments })
    })
})