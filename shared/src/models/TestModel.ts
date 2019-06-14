import {Collection, BaseModel} from "@shared/models/FirestoreBaseModels";

export default class TestModel extends BaseModel {
    collection = Collection.testModels;

    name?: string;
    description?: string;


    static fromJSON(json:any):TestModel {
        const model = new TestModel();
        model.decodeJSON(json);

        return model;
    }
}
