import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {Project} from "@scripts/config";
import {CactusConfig} from "@shared/CactusConfig";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import {DocumentSnapshot} from "firebase-functions/lib/providers/firestore";
import {fromDocumentSnapshot} from "@shared/util/FirestoreUtil";
import ReflectionResponse from "@shared/models/ReflectionResponse";
import CactusMember from "@shared/models/CactusMember";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import chalk from "chalk";

const prompts = require("prompts");

export default class ReflectionResponseSetCactusMemberIdCommand extends FirebaseCommand {
    name = "Reflection Response: Backfill Cactus Member Id";
    description = "";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);


        const query = AdminReflectionResponseService.getSharedInstance().getCollectionRef();

        const snapshot = await query.get();
        const missingMemberDocs: DocumentSnapshot[] = [];
        const foundMembersDocs: DocumentSnapshot[] = [];

        snapshot.forEach(doc => {
            if (!doc.get("cactusMemberId")) {
                missingMemberDocs.push(doc);

            } else {
                foundMembersDocs.push(doc);
            }
        });


        console.log(`Found count ${foundMembersDocs.length}`);
        console.log(`Missing count ${missingMemberDocs.length}\nMissing IDs:\n`);
        console.log(chalk.cyan(`${missingMemberDocs.map(doc => doc.id).join("\n")}`));

        const continueResponse: { continue: boolean } = await prompts({
            name: "continue",
            message: "Do you want to back-fill these items now?",
            type: "confirm"
        });

        if (continueResponse) {
            const updateTasks = missingMemberDocs.map(doc => this.updateResponse(doc))
            try {
                await Promise.all(updateTasks);
                console.log(`successfully updated responses! Updated Count: ${updateTasks.length}`);
            } catch (error) {
                console.error("Error updating responses", error);
            }
        }


        return;
    }

    updateResponse(responseDoc: DocumentSnapshot): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            const response = fromDocumentSnapshot(responseDoc, ReflectionResponse);
            if (!response) {
                console.log(`No response was found for document id ${responseDoc.id}`)
                resolve();
                return;
            }

            if (response.cactusMemberId) {
                resolve(response);
            }

            const email = response.memberEmail;
            const mailchimpMemberId = response.mailchimpMemberId;

            let cactusMember: CactusMember | undefined;
            if (mailchimpMemberId) {
                cactusMember = await AdminCactusMemberService.getSharedInstance().getByMailchimpMemberId(mailchimpMemberId);
            }

            if (!cactusMember && email) {
                cactusMember = await AdminCactusMemberService.getSharedInstance().getMemberByEmail(email);
            }

            if (!cactusMember) {
                console.error(`Unable to get cactus member for responseId ${responseDoc.id}`);
                resolve();
                return;
            }

            if (cactusMember && cactusMember.id) {
                await responseDoc.ref.update({[ReflectionResponse.Field.cactusMemberId]: cactusMember.id});
            }

            resolve();
        })
    }

}