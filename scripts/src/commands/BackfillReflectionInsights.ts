import {FirebaseCommand} from "@scripts/CommandTypes";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import * as admin from "firebase-admin";
import {CactusConfig} from "@shared/CactusConfig";
import {Project} from "@scripts/config";
import {DateTime} from "luxon";
import AdminCactusMemberService from "@admin/services/AdminCactusMemberService";
import AdminReflectionResponseService from "@admin/services/AdminReflectionResponseService";
import GoogleLanguageService from "@admin/services/GoogleLanguageService";
import {stringifyJSON} from "@shared/util/ObjectUtil";
import CactusMember from "@shared/models/CactusMember";
import Logger from "@shared/Logger";

export interface MemberResult {
    error?: string,
    processedInsights?: boolean,
    numReflections?: number
}

export interface MemberBatchResult {
    batchNumber: number,
    numReflectionsProcessed: number,
    numSkipped: number,
}

export interface TotalResult {
    numReflectionsProcessed: number,
    numSkipped: number,
    numBatches: number
}


export default class BackfillReflectionInsights extends FirebaseCommand {
    name = "Backfill Member Reflection Insights";
    description = "Analyze and store word insights for reflection response text content.";
    showInList = true;
    logger = new Logger("BackfillReflectionInsights");

    protected async run(app: admin.app.App, firestoreService: AdminFirestoreService, config: CactusConfig): Promise<void> {
        const project = this.project || Project.STAGE;
        console.log("Using project", project);


        await this.process();
        return;

    }

    async reportResults(batchResults: MemberBatchResult[], totalDuration: number,): Promise<void> {
        const total: TotalResult = {
            numReflectionsProcessed: 0,
            numSkipped: 0,
            numBatches: batchResults.length
        };

        batchResults.forEach(r => {
            total.numSkipped += r.numSkipped;
            total.numReflectionsProcessed += r.numReflectionsProcessed;
        });

        this.logger.info(`\n\nFinished after ${totalDuration}ms\nResults: \n `, stringifyJSON(total, 2));
        return;
    }

    async handleMemberBatch(members: CactusMember[], batchNumber: number): Promise<MemberBatchResult> {
        const batch = AdminFirestoreService.getSharedInstance().getBatch();
        const tasks = members.map(member => {
            return this.processMember(member, batch);
        });

        const results = await Promise.all(tasks);
        const commitResult = await batch.commit();
        return this.createBatchResult(results, commitResult, batchNumber);
    }

    createBatchResult(memberResults: MemberResult[], batchResults: FirebaseFirestore.WriteResult[], batchNumber: number): MemberBatchResult {
        const total = {
            batchNumber,
            numReflectionsProcessed: 0,
            numSkipped: 0
        };

        memberResults.forEach(r => {
            total.numSkipped += r.processedInsights ? 0 : 1;
            total.numReflectionsProcessed += r.numReflections ? r.numReflections : 0;
        });

        return total;
    }

    async processMember(member: CactusMember, batch: FirebaseFirestore.WriteBatch): Promise<MemberResult> {
        try {
            const sixtyDaysAgo = DateTime.fromJSDate(new Date()).minus({days: 60}).toJSDate();
            let numReflections = 0;
            
            // get member reflections, loop through and trigger insights for them
            if (member.id) {
                const reflections = await AdminReflectionResponseService.getSharedInstance().getResponsesForMember(member.id);
                
                for (const rr of reflections) {
                    if (rr.updatedAt && 
                        rr.updatedAt > sixtyDaysAgo && 
                        rr.content?.text) {
                        
                        const insightsResult = await GoogleLanguageService.getSharedInstance().insightWords(rr.content.text);
                        if (insightsResult) {
                            // for now, don't store all this raw data (it's huge)
                            // later we will store this in a separate collection
                            delete insightsResult.syntaxRaw;
                            delete insightsResult.entitiesRaw;

                            rr.insights = insightsResult;

                            // save words to the reflection response
                            await AdminReflectionResponseService.getSharedInstance().save(rr);

                            numReflections++;
                        }
                    }
                }
            }

            return {
                processedInsights: numReflections > 0, 
                numReflections: numReflections
            }
        } catch (error) {
            this.logger.error(`Unexpected error while processing member ${member.email}`, error);
            return {error: error.message, processedInsights: false, numReflections: 0};
        }
    }

    async process(): Promise<void> {
        const startTime = Date.now();
        this.logger.info("Starting backfill job");

        const batchResults: MemberBatchResult[] = [];
        await AdminCactusMemberService.getSharedInstance().getAllBatch({
            batchSize: 10,
            onData: async (members, batchNumber) => {
                const batchStart = Date.now();
                this.logger.info("Processing batch", batchNumber);
                const batchResult = await this.handleMemberBatch(members, batchNumber);
                const batchEnd = Date.now();
                this.logger.info(`Finished batch ${batchNumber} after ${batchEnd - batchStart}ms`);
                batchResults.push(batchResult);
            }
        });
        const endTime = Date.now();

        await this.reportResults(batchResults, endTime - startTime);

        return;
    }
}