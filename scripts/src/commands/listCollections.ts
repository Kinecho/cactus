import {FirebaseCommand} from "@scripts/run";
import {listCollections} from "@api/services/firestoreService";
import * as admin from "firebase-admin";

export default class ListCollections extends FirebaseCommand {

    constructor(){
        super({useAdmin: true, name: "ListCollections"});
    }

    async run(app: admin.app.App):Promise<any>{
        const collections = await listCollections();
        console.group("Collection Names:");
        collections.forEach(collection => {
            console.log(`${collection.id}`);
        });

        console.groupEnd();

        return;
    }
}
