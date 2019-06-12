import {getAdmin, Project} from "@scripts/config";
import {Command} from "@scripts/run";

export default class Test implements Command {
    async run():Promise<any>{
        console.log("Hello!");

        const app = await getAdmin(Project.STAGE, {useAdmin: true});

        console.log("Got app", app.name);

        const db = app.firestore();

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