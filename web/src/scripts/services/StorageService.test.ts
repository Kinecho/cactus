import ReflectionResponse from "@shared/models/ReflectionResponse";
import StorageService from "@web/services/StorageService";
import {LocalStorageKey} from "@web/util";

describe("storage service tests", () => {
    beforeEach(() => {
        console.log("clearing localstorage before test");
        localStorage.clear();
    });
    test("save reflection response", () => {
        const model = new ReflectionResponse();
        model.cactusMemberId = "abc";
        model.createdAt = new Date(1566270057996);

        const encodedString = StorageService.toBase64(model.toJSON());

        StorageService.saveModel(LocalStorageKey.anonReflectionResponse, model);
        expect(localStorage.getItem(LocalStorageKey.anonReflectionResponse)).not.toBeNull();
        expect(localStorage.getItem(LocalStorageKey.anonReflectionResponse)).toEqual(encodedString);
    });

    test("retrieve reflection response", () => {
        const model = new ReflectionResponse();
        model.cactusMemberId = "abc";
        model.createdAt = new Date(1566270057996);

        StorageService.saveModel(LocalStorageKey.anonReflectionResponse, model);
        const retrieved = StorageService.getModel(LocalStorageKey.anonReflectionResponse, ReflectionResponse);
        expect(retrieved).not.toBeNull();
        if (retrieved) {
            expect(retrieved.cactusMemberId).toEqual("abc");
            expect(retrieved.createdAt).toEqual(new Date(1566270057996));
        }
    });


    test("retrieve reflection response with IDs", () => {

        const model = new ReflectionResponse();
        model.promptId = "123";
        model.cactusMemberId = "abc";
        model.createdAt = new Date(1566270057996);

        StorageService.saveModel(LocalStorageKey.anonReflectionResponse, model, model.promptId);
        const retrieved = StorageService.getModel(LocalStorageKey.anonReflectionResponse, ReflectionResponse, model.promptId);
        expect(retrieved).not.toBeNull();
        if (retrieved) {
            expect(retrieved.cactusMemberId).toEqual("abc");
            expect(retrieved.createdAt).toEqual(new Date(1566270057996));
        }
    });

    test("get decoded model map", () => {
        const model = new ReflectionResponse();
        model.promptId = "123";
        model.cactusMemberId = "abc";
        model.createdAt = new Date(1566270057996);

        const model2 = new ReflectionResponse();
        model2.promptId = "234";
        model2.cactusMemberId = "abc";
        model2.createdAt = new Date(1566270057000);

        StorageService.saveModel(LocalStorageKey.anonReflectionResponse, model, model.promptId);
        StorageService.saveModel(LocalStorageKey.anonReflectionResponse, model2, model2.promptId);


        const map = StorageService.getDecodeModelMap(LocalStorageKey.anonReflectionResponse, ReflectionResponse);
        expect(Object.keys(map)).toHaveLength(2);

        expect(map[model.promptId]).toEqual(model);
        expect(map[model2.promptId]).toEqual(model2);
    })
});