import {BaseCommand} from "@scripts/run";

export default class TestTwo extends BaseCommand {

    constructor(){
        super({useAdmin: true});
    }

    async run():Promise<any>{
        const app = await super.getFirebaseApp();
        console.log("Second Test!");

        if (!app){
            console.error("Unable to use admin app");
            return;
        }

        const db = app.firestore();
        const collections = await db.listCollections();
        const ids = collections.map((collection) => {
            return collection.id
        });
        console.log("Collection names", JSON.stringify(ids, null, 2));
        return;
    }
}
