import {BaseCommand} from "@scripts/run";

export default class Test extends BaseCommand {

    constructor(){
        super({useAdmin: true});
    }

    async run():Promise<any>{
        await super.run();
        console.log("Hello!");

        if (!this.app){
            console.error("Unable to use admin app");
            return;
        }

        console.log("Got app", this.app.name);

        const db = this.app.firestore();
        const collections = await db.listCollections();
        const ids = collections.map((collection) => {
            return collection.id
        });
        console.log("Collection names", JSON.stringify(ids, null, 2));
        return;
    }
}


//
// start().then(() => {
//     console.log("done");
// }).catch(error => {
//     console.error("Failed to execute script", error);
// });