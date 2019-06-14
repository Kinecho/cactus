import {Collection, BaseModel} from "@shared/models/FirestoreBaseModels";
import * as firebase from "firebase";
import {fromDocumentSnapshot, fromFirestoreData, setTimestamp} from "@shared/util/FirebaseUtil";
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
            collection: Collection.testModels,
            deleted: false
        })
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
        expect(model.id).toEqual("123")
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
            get() {},
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


