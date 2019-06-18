import {FirebaseCommand} from "@scripts/run";
import * as admin from "firebase-admin";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";

export default class TestTwo extends FirebaseCommand {

    constructor(){
        super({useAdmin: true, name: "TestTwo"});
    }

    async run(app: admin.app.App, firestoreService: AdminFirestoreService):Promise<any>{
        const db = app.firestore();
        const collections = await db.listCollections();
        const ids = collections.map((collection) => {
            return collection.id
        });
        console.log("Collection names", JSON.stringify(ids, null, 2));
        return;
    }
}
