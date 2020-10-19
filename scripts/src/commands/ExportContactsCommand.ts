import { FirebaseCommand } from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import { CactusConfig } from "@admin/CactusConfig";
import { Project } from "@scripts/config";
import { writeToFile } from "@scripts/util/FileUtil";
import helpers from '@scripts/helpers';
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";

import { formatDateTime } from "@shared/util/DateUtil";
import CactusMember from "@shared/models/CactusMember";
import { BillingPlatform, getSubscriptionBillingPlatform } from "@shared/models/MemberSubscription";

const { Parser } = require('json2csv');

interface ContactInfo {
    email?: string,
    memberId?: string,
    tier?: string,
    reflectionCount?: number;
    createdAt?: string;
    store?: BillingPlatform;
}

export default class ExportContactsCommand extends FirebaseCommand {
    name = "Export Contacts Command";
    description = "";
    showInList = true;

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);
        const filePath = `${ helpers.outputDir }/contacts/contacts_${ project }_filtered.csv`;

        console.log('writing to file');


        const contacts: ContactInfo[] = [];


        await AdminCactusMemberService.getSharedInstance().getAllBatch({
            batchSize: 500,
            onData: async (members: CactusMember[], batch: number) => {
                console.log('processing batch', batch)
                members.forEach((m: CactusMember) => {
                    if ((m.stats?.reflections?.totalCount ?? 0) === 0) {
                        return;
                    }

                    contacts.push({
                        email: m.email!,
                        tier: m.tier!,
                        createdAt: formatDateTime(m.createdAt!)!,
                        memberId: m.id!,
                        reflectionCount: m.stats?.reflections?.totalCount ?? 0,
                        store: getSubscriptionBillingPlatform(m.subscription)
                    })
                })
                return Promise.resolve();
            }
        })

        try {

            const opts = {
                fields: ["email",
                    "memberId",
                    "tier",
                    "reflectionCount",
                    "createdAt", "store"]
            }
            const parser = new Parser(opts);
            const csv = parser.parse(contacts);
            console.log(csv);
            await writeToFile(filePath, csv);
        } catch (error) {
            console.error('failed to convert to csv', error)
        }

        return;
    }

}