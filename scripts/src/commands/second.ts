import {BaseCommand} from "@scripts/run";
import * as admin from "firebase-admin";

export default class TestTwo extends BaseCommand {

    constructor(){
        super({useAdmin: true, name: "TestTwo"});
    }

    async run(app: admin.app.App):Promise<any>{
        const db = app.firestore();
        const collections = await db.listCollections();
        const ids = collections.map((collection) => {
            return collection.id
        });
        console.log("Collection names", JSON.stringify(ids, null, 2));
        return;
    }
}
