import {Collection, BaseModel} from "@shared/FirestoreBaseModels";
import * as firebase from "firebase";
import {fromDocumentSnapshot, fromFirestoreData, fromJSON, setTimestamp} from "@shared/util/FirebaseUtil";
import DocumentSnapshot = firebase.firestore.DocumentSnapshot;
import DocumentReference = firebase.firestore.DocumentReference;
import SnapshotMetadata = firebase.firestore.SnapshotMetadata;



const testDate = new Date();

class TestModel extends BaseModel {
    collection = Collection.testModels;
    name?: string;
    age?: number;


    constructor(){
        super();
        this.createdAt = testDate;
    }

    sayHi() {
        return `Hi ${this.name}`
    }

    decodeJSON(json:any){
        super.decodeJSON(json);

        this.name = json.name.toUpperCase();
    }

}

beforeEach(() => {
    setTimestamp(firebase.firestore.Timestamp);
});


describe("to firestore data", () => {
    test("convert Test object to firestore data", async () => {
        const model = new TestModel();
        model.name = "Test";
        model.age = 1;
        model.id = "123";

        const data = await model.toFirestoreData();
        expect(data).toEqual({
            createdAt: firebase.firestore.Timestamp.fromDate(testDate),
            age: 1,
            name: "Test",
            deleted: false
        })
    });

    test("undefined should not be present on result", async () => {
        const model = new TestModel();
        model.age = 1;
        model.id = "123";
        model.name = undefined;

        const data = await model.toFirestoreData();
        expect(data).toEqual({
            createdAt: firebase.firestore.Timestamp.fromDate(testDate),
            age: 1,
            deleted: false,
        });

        expect(Object.keys(data).includes("name")).toBeFalsy()
    });

    test("convert Test object to firestore data, don't exclude id", async () => {
        const model = new TestModel();
        model.name = "Test";
        model.age = 1;
        model.id = "123";

        const data = await model.toFirestoreData([]);
        expect(data).toEqual({
            createdAt: firebase.firestore.Timestamp.fromDate(testDate),
            age: 1,
            name: "Test",
            id: "123",
            collection: Collection.testModels,
            deleted: false
        })
    });

    test("exclude deleted Test object to firestore data, don't exclude id", async () => {
        const model = new TestModel();
        model.name = "Test";
        model.age = 1;
        model.id = "123";

        const data = await model.toFirestoreData(["deleted"]);
        expect(data).toEqual({
            createdAt: firebase.firestore.Timestamp.fromDate(testDate),
            age: 1,
            name: "Test",
            id: "123",
            collection: Collection.testModels,
        })
    })
});


describe("from firestore data", () => {
    test("convert firestore data to test model", async () => {
        const data = {createdAt: firebase.firestore.Timestamp.fromDate(testDate), age: 1, name: "Test"};
        const model:TestModel = await fromFirestoreData(data, TestModel);

        expect(model.name).toEqual("Test");
        expect(model.age).toEqual(1);
        expect(model.createdAt).toEqual(testDate);
        expect(model.sayHi()).toEqual("Hi Test");
        expect(model.collection).toEqual(Collection.testModels);
        expect(model.id).toEqual(undefined);
    });

    test("convert firestore data to test model with id", async () => {
        const data = {createdAt: firebase.firestore.Timestamp.fromDate(testDate), age: 1, name: "Test", id: "123"};
        const model:TestModel = await fromFirestoreData(data, TestModel);

        expect(model.name).toEqual("Test");
        expect(model.age).toEqual(1);
        expect(model.createdAt).toEqual(testDate);
        expect(model.sayHi()).toEqual("Hi Test");
        expect(model.collection).toEqual(Collection.testModels);
        expect(model.id).toEqual("123");
        expect(model.deleted).toBeFalsy();
    });
});



describe("from firestore document snapshot", () => {

    test("convert firestore data to test model, ensure id exists", async () => {
        //spoof document snapshot
        const data:DocumentSnapshot = {
            data() {
                return {
                    createdAt: firebase.firestore.Timestamp.fromDate(testDate),
                    age: 1,
                    name: "Test"
                }
            },
            id: "123",
            exists: true,
            ref: {} as DocumentReference,
            get() {
                //no op
            },
            metadata: {} as SnapshotMetadata,
            isEqual(other): boolean {return true}
        };

        const model = await fromDocumentSnapshot(data, TestModel);
        expect(model).not.toBeNull();
        if (!model){
            return;
        }
        expect(model.name).toEqual("Test");
        expect(model.age).toEqual(1);
        expect(model.createdAt).toEqual(testDate);
        expect(model.sayHi()).toEqual("Hi Test");
        expect(model.collection).toEqual(Collection.testModels);
        expect(model.id).toEqual("123");
        expect(model.deleted).toBeFalsy();
    });
});


describe("fromJSON", () => {
    test("test model", () => {
        const json = {createdAt: testDate.getTime(), updatedAt: testDate.getTime(), name: "my name", id: "4"};

        const model = fromJSON(json, TestModel);

        expect(model.createdAt).toEqual(testDate);
        expect(model.updatedAt).toEqual(testDate);
        expect(model.deletedAt).toBeUndefined();
        expect(model.id).toEqual("4");
        expect(model.name).toEqual("MY NAME");
    })
});

describe("toJSON", () => {
    test("test model", async () => {
        const json = {createdAt: testDate.getTime(), updatedAt: testDate.getTime(), name: "my name", id: "4"};
        const output = {createdAt: testDate.getTime(), updatedAt: testDate.getTime(), name: "MY NAME", id: "4", deleted: false};
        const model = fromJSON(json, TestModel);

        expect(await model.toJSON()).toEqual(output);
    })
});
