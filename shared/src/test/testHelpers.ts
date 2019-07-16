process.env.FIRESTORE_EMULATOR_HOST = "localhost:5005";
// tslint:disable-next-line:no-implicit-dependencies
import * as firebase from "@firebase/testing";
import {setTimestamp} from "@shared/util/FirestoreUtil";
// import * as admin from "firebase-admin"
import * as fs from "fs";
import helpers from "@shared/helpers";

expect.extend({
    async toAllow(x) {
        let pass = false;
        try {
            await firebase.assertSucceeds(x);
            pass = true;
        } catch (err) {
        }

        return {
            pass,
            message: () => 'Expected Firebase operation to be allowed, but it was denied'
        };
    }
});

expect.extend({
    async toDeny(x) {
        let pass = false;
        try {
            await firebase.assertFails(x);
            pass = true;
        } catch (err) {
        }
        return {
            pass,
            message: () =>
                'Expected Firebase operation to be denied, but it was allowed'
        };
    }
});

// @ts-ignore
export async function getDb(auth: any, data?: any): Promise<{ db: firebase.firestore.Firestore, app: firebase.app.App }> {
    const projectId = `rules-spec-${Date.now()}`;
    await firebase.clearFirestoreData({projectId});

    const app = await firebase.initializeTestApp({
        projectId,
        auth
    });

    const adminApp = await firebase.initializeAdminApp({projectId});
    const adminDb = adminApp.firestore();

    const db = app.firestore();


    // firebase.loadFirestoreRules({projectId})

    // Write mock documents before rules
    if (data) {
        for (const key in data) {
            const ref = adminDb.doc(key);
            await ref.set(data[key]);
        }
    }

    const members = await db.collection("members").get();
    members.docs.forEach(m => {
        console.log(m.data())
    })

    // Apply rules
    await firebase.loadFirestoreRules({
        projectId,
        rules: fs.readFileSync(`${helpers.projectRoot}/firestore.rules`, 'utf8')
    });

    return {db, app};
}

// @ts-ignore
export async function getAdmin(data?: any): Promise<{ db: firebase.firestore.Firestore, app: firebase.app.App }> {
    const projectId = `rules-spec-${Date.now()}`;

    const app = await firebase.initializeAdminApp({
        projectId,
    });

    setTimestamp(firebase.firestore.Timestamp);

    const db = app.firestore();

    // Write mock documents before rules
    if (data) {
        for (const key in data) {
            const ref = db.doc(key);
            await ref.set(data[key]);
        }
    }


    // Apply rules
    await firebase.loadFirestoreRules({
        projectId,
        rules: fs.readFileSync(`${helpers.projectRoot}/firestore.rules`, 'utf8')
    });

    return {db, app};
}
