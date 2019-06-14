import {BaseCommand} from "@scripts/run";

import {getCollectionRef} from "@api/services/firestoreService";
import {Collection} from "@shared/models/FirestoreBaseModels";
// import
export default class First extends BaseCommand {

    constructor(){
        super({useAdmin: true});
    }

    async run():Promise<any>{
        const app = await super.getFirebaseApp();
        console.log("Hello!");

        if (!app){
            console.error("Unable to use admin app");
            return;
        }

        console.log("Got app", app.name);

        // const db = app.firestore();
        // const collections = await db.listCollections();
        // const ids = collections.map((collection) => {
        //     return collection.id
        // });
        // console.log("Collection names", JSON.stringify(ids, null, 2));


        const snapshot = await getCollectionRef(Collection.testModels).get();
        snapshot.forEach((doc) => {
            console.log("got document id", doc.id);
        });

        return;
    }
}
