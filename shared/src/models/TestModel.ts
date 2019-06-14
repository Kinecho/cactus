import {Collection, BaseModel} from "@shared/models/FirestoreBaseModels";

export default class TestModel extends BaseModel {
    collection = Collection.testModels;

    name?: string;
    description?: string;


}