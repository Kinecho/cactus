import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {Project} from "@scripts/config";
import {CactusConfig} from "@admin/CactusConfig";
import {Collection} from "@shared/FirestoreBaseModels";
import User from "@shared/models/User";

export default class UserSyncWithAuthCommand extends FirebaseCommand {
    name = "User: Sync with Authentication";
    description = "Add any additional info to the user record that exists on the Auth record";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);

        const userCollection = AdminFirestoreService.getSharedInstance().getCollectionRef(Collection.users);
        const snapshot = await userCollection.get();
        console.log("fetched users");
        const auth = admin.auth();

        const tasks = snapshot.docs.map((userDoc) => {
            return new Promise(async resolve => {
                try {
                    const userRecord = await auth.getUser(userDoc.id);
                    const providerIds = userRecord.providerData.map(provider => provider.providerId);

                    await userDoc.ref.update({[User.Field.providerIds]: providerIds});

                    console.log(`updated provider data for ${userDoc.get(User.Field.email)}`);
                    resolve();
                } catch (e) {
                    console.log("Unable to find user in admin for userId", userDoc.id, "email", userDoc.get(User.Field.email));
                    resolve();
                }

            })
        });

        await Promise.all(tasks);
        console.log("Finished updating ", tasks.length, "users");

        return;
    }

}