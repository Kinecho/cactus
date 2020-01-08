import {getConfig} from "@admin/config/configService";
import {JWT} from "google-auth-library";
import axios, {AxiosError} from "axios";
import AdminFirestoreService from "@admin/services/AdminFirestoreService";
import {Operation} from "@shared/types/FirestoreTypes";
import {formatDuration} from "@shared/util/DateUtil";
import {Storage} from "@google-cloud/storage";
import {BigQuery} from "@google-cloud/bigquery";
import * as fs from "fs";
import {promisify} from "util";
import {snakeCase} from "lodash";
import bigqueryTypes from "@google-cloud/bigquery/build/src/types";
import IJob = bigqueryTypes.IJob;
import AdminSlackService, {SlackAttachment} from "@admin/services/AdminSlackService";
import {JobMetadataResponse} from "@google-cloud/bigquery/build/src/table";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const Config = getConfig();

const firestoreService = AdminFirestoreService.getSharedInstance();
const slackService = AdminSlackService.getSharedInstance();

const firestoreAdminVersion = 'v1';
const betaVersion = '';

const firestoreServiceAccount = Config.firestore_backups_service_account;
const bigQueryServiceAccount = Config.bigquery_service_account;
const backupsConfig = Config.backups_config;

const defaultScopes = [
    "https://www.googleapis.com/auth/datastore",
    "https://www.googleapis.com/auth/cloud-platform",
];

export const latestBigQueryExportFileName = "latest-prefix.txt";

/**
 * Exports firestore and ingests into big query
 * @return {Promise<void>}
 */
export async function exportFirestoreToBigQuery() {
    // await slackService.sendEngineeringMessage(`*BigQuery Ingest* Starting Job`);

    const collectionIds = await getCollectionIds();
    console.log("collectionIds", collectionIds);

    const startTime = new Date();
    const attachments: SlackAttachment[] = [
        // {
        //     text: `Collection IDs:\n \`\`\`${collectionIds.join(", ")}\`\`\``,
        //     color: AttachmentColor.info,
        //     ts: `${(new Date()).getTime() / 1000}`
        // }
    ];
    const slackMessage = {
        text: `*BigQuery Ingest* Finished`,
        attachments,
    };

    try {
        const [
            bigQueryOperation
        ] = await Promise.all([
            exportForBigQuery(collectionIds)
        ]);

        // attachments.push(
        //     buildOperationAttachment("Firestore Export to Analytics", bigQueryOperation.operation, formatDuration(startTime, bigQueryOperation.endTime), bigQueryOperation.error),
        // );

        if (bigQueryOperation.nextPrefix) {
            const ingestStartTime = new Date();
            try {
                const bigueryResults = await bigqueryIngestFirestore(bigQueryOperation.nextPrefix);
                const ingestEndTime = new Date();
                const flatResults: IJob[] = [];
                bigueryResults.forEach(resultsList => flatResults.push(...resultsList));
                const processedResults = flatResults.map(r => {
                    return {
                        tableId: (r.configuration && r.configuration.load && r.configuration.load.destinationTable) ? r.configuration.load.destinationTable.tableId : null,
                        badRecords: (r.statistics && r.statistics.load) ? r.statistics.load.badRecords : 0,
                    }
                });

                const badRecordsCount = processedResults.reduce((count, record) => {
                    return count + Number(record.badRecords) || 0;
                }, 0);
                if (badRecordsCount > 0) {
                    attachments.push({
                        text: `*BigQuery Ingest* completed with ${badRecordsCount} bad records after ${formatDuration(ingestStartTime, ingestEndTime)}\nJob Results:\n\`\`\`\n${JSON.stringify(processedResults, null, 2)}\n\`\`\``,
                        color: "warning"
                    })
                }
                // attachments.push({
                //     text: `*BigQuery Ingest* completed successfully after ${formatDuration(ingestStartTime, ingestEndTime)}\nJob Results:\n\`\`\`\n${JSON.stringify(processedResults, null, 2)}\n\`\`\``,
                //     color: "good"
                // })
            } catch (bigqueryError) {
                const ingestEndTime = new Date();
                attachments.push({
                    text: `:warning: Big Query Ingest failed after ${formatDuration(ingestStartTime, ingestEndTime)}\n\`\`\`${JSON.stringify(bigqueryError)}\`\`\``,
                    color: "warning"
                })
            }
        }

        const endTime = new Date();

        if (attachments.length > 0) {
            attachments.push({
                text: `*Big Query Ingest Job* Completed after ${formatDuration(startTime, endTime)}`,
                color: "good"
            });
            await slackService.sendEngineeringMessage(slackMessage);
        }
    } catch (e) {
        console.error("failed to backup", e);
        await slackService.sendEngineeringMessage(`Failed to backup ${JSON.stringify(e, null, 2)}`);
    }
}

export async function backupFirestore(): Promise<void> {
    const startTime = new Date();
    try {

        await exportForBackup();
        const endTime = new Date();
        console.log("Export firestore for backup finished in ", formatDuration(startTime, endTime));
    } catch (e) {
        console.error("failed to backup", e);
        await slackService.sendEngineeringMessage(`Failed to backup firestore \`\`\`${JSON.stringify(e, null, 2)}\`\`\``);
    }
}

export async function bigqueryIngestFirestore(bucketPrefix?: string): Promise<IJob[][]> {
    let latestPrefix: string | undefined = bucketPrefix;

    const collectionIds = await getCollectionIds();

    const projectId = bigQueryServiceAccount.project_id;
    const datasetId = backupsConfig.bigquery_dataset_id;
    const bigqueryImportBucketName = backupsConfig.bigquery_import_bucket;
    const metadata = {
        sourceFormat: "DATASTORE_BACKUP",
        writeDisposition: "WRITE_TRUNCATE", // Overwrite bigquery tables
    };
    const bigquery = new BigQuery({projectId, credentials: bigQueryServiceAccount});
    const storage = new Storage({projectId, credentials: bigQueryServiceAccount});

    if (!latestPrefix) {
        console.log("Prefix not found on message, trying to read it from file in Storage");
        const tmpPrefixFilePath = `/tmp/${latestBigQueryExportFileName}`;
        await storage.bucket(bigqueryImportBucketName)
            .file(latestBigQueryExportFileName)
            .download({destination: tmpPrefixFilePath});

        latestPrefix = await readFile(tmpPrefixFilePath, "utf8");
        console.log("got latest prefix from file", latestPrefix);
    }

    if (!latestPrefix) {
        throw new Error("No prefix could be determined - unable to find firestore backup to ingest");
    }

    const importTasks: Promise<IJob[]>[] = [];

    collectionIds.forEach(collectionId => {
        try {
            const filename = `${latestPrefix}/all_namespaces/kind_${collectionId}/all_namespaces_kind_${collectionId}.export_metadata`;

            const tableId = snakeCase(collectionId);
            console.log("starting the import for fileName ", filename, "into table", tableId);
            // Loads data from a Google Cloud Storage file into the table
            const job = new Promise<JobMetadataResponse>(async resolve => {
                const jobResult = await bigquery
                    .dataset(datasetId)
                    .table(tableId)
                    .load(storage.bucket(bigqueryImportBucketName).file(filename), metadata);
                console.log(`Finished import task for ${tableId}. Jobs Results:`);
                jobResult.forEach(r => {
                    console.log(`[${tableId}] finished job - id=${r.id} | status=${r.status}`);
                });

                resolve(jobResult);
            });

            importTasks.push(job);

        } catch (e) {
            console.error("failed to process collection", e);
        }
    });

    const taskResults = await Promise.all(importTasks);
    // taskResults.forEach((jobs, index) => {
    //     jobs.forEach(job => {
    //         console.log(`finished job #${index} - id=${job.id} | status=${job.status}`);
    //     })
    // });

    console.log(`finished all ${taskResults.length} import tasks`);
    return taskResults;

}

// @ts-ignore
function buildOperationAttachment(displayName: string, operation?: Operation, duration?: string, error?: any): SlackAttachment {
    if (error) {
        return {
            text: `*${displayName}* error occurred ${duration ? `after ${duration}` : ""}\n\`\`\`${JSON.stringify(error, null, 2)}\`\`\``,
            color: "danger",
            ts: `${(new Date()).getTime() / 1000}`
        }
    }

    if (!operation) {
        return {
            text: `*${displayName}* Unable to get completed operation `,
            color: "danger",
            ts: `${(new Date()).getTime() / 1000}`
        }
    }

    let webLink: string | undefined = undefined;
    let outputUriPrefix: string | undefined = undefined;
    if (operation.metadata) {
        outputUriPrefix = operation.metadata.outputUriPrefix;
    }
    let linkString = "";
    if (outputUriPrefix) {
        const bucketPath = outputUriPrefix.replace("gs://", "");
        webLink = `https://console.cloud.google.com/storage/browser/${bucketPath}?project=${firestoreServiceAccount.project_id}`;
        linkString = `<${webLink}|View Bucket>`
    }

    return {
        text: `*${displayName}* completed successfully after ${duration}. ${linkString}\nOperation details\n\`\`\`${JSON.stringify(operation, null, 2)}\`\`\``,
        color: "good",
        ts: `${(new Date()).getTime() / 1000}`
    }
}

// @ts-ignore
async function exportForBackup(): Promise<{ operation?: Operation, endTime: Date, error?: any }> {

    const {operation, error} = await initializeBackup(firestoreServiceAccount.project_id, backupsConfig.firestore_backups_bucket);
    if (!operation) {
        return {endTime: new Date(), error: error || {message: "Unable to initialize operation"}};
    }

    try {
        const finishedOperation = await pollForOperation(operation.name);
        const endTime = new Date();
        return {operation: finishedOperation, endTime};

    } catch (e) {
        const endTime = new Date();
        return {endTime, error: e};
    }
}

async function exportForBigQuery(collectionIds: string[]): Promise<{ operation?: Operation, endTime: Date, error?: any, nextPrefix?: string }> {
    // const operation = await initializeBackup(serviceAccount.project_id, backupsConfig.bigquery_import_bucket, collectionIds);
    const analyticsProjectId = backupsConfig.analytics_project_id;

    console.log("got bucket");
    // firebase.storage().bucket

    const date = new Date();
    const nextPrefix = date.toISOString();
    try {
        const storage = new Storage({projectId: analyticsProjectId, credentials: firestoreServiceAccount});
        const bucket = storage.bucket(backupsConfig.bigquery_import_bucket);
        const tmpFilePath = `/tmp/${latestBigQueryExportFileName}`;
        await writeFile(tmpFilePath, nextPrefix);
        await bucket.upload(tmpFilePath);
    } catch (error) {
        console.error("Failed to upload new prefix for bigquery export file to storage", error)
        return {endTime: new Date(), error}
    }

    const {operation, error: initError} = await initializeBackup(firestoreServiceAccount.project_id,
        `${backupsConfig.bigquery_import_bucket}/${nextPrefix}`,
        collectionIds);

    if (!operation) {
        return {endTime: new Date(), error: initError || {message: "Failed to initialize bigqury export operation"}}
    }


    try {
        const finishedOperation = await pollForOperation(operation.name);
        const endTime = new Date();
        return {operation: finishedOperation, endTime, nextPrefix: nextPrefix};

    } catch (e) {
        const endTime = new Date();
        return {endTime, error: e};
    }

}

export async function getOperation(name: string): Promise<Operation | undefined> {
    const uri = `https://firestore.googleapis.com/v1/${name}`;
    try {
        const response = await axios.get(uri, {
            headers: {
                ...(await getAuthHeaders())
            }
        });

        return response.data;
    } catch (error) {
        if (error.isAxiosError) {
            const axiosError = error as AxiosError;
            console.error(`Failed to get operation. Code ${axiosError.code}. ${JSON.stringify(axiosError.response, null, 2)}`);
            await slackService.sendEngineeringMessage({text: `Failed to get operation. Code ${axiosError.code}.\n\`\`\`${JSON.stringify(axiosError.response, null, 2)}\`\`\``})
        } else {
            console.error("Failed to get operation" + name, error);
        }
        return;
    }
}

export async function pollForOperation(name: string, delayMs: number = 20000, maxCount = 100): Promise<Operation | undefined> {
    async function task(resolve: (operation: Operation | undefined) => void, reject: (error: any) => void, count: number) {
        if (count >= maxCount) {
            reject({error: `Task was not finished after ${count} invocations`});
            return;
        }

        const operation = await getOperation(name);
        if (!operation) {
            resolve(undefined);
            return;
        }

        if (operation.done) {
            resolve(operation);
            return;
        } else {
            setTimeout(async () => {
                await task(resolve, reject, count + 1)
            }, delayMs);
        }
    }

    return new Promise<Operation | undefined>(async (resolve, reject) => {
        await task(resolve, reject, 0);
    })

}

/**
 * Get the URL for the export command
 * @param {string} projectId - the id of the firebase project to export
 * @returns {string}
 */
function buildExportUrl(projectId: string): string {
    return `https://firestore.googleapis.com/${firestoreAdminVersion}${betaVersion}/projects/${projectId}/databases/(default):exportDocuments`;
}


async function getCollectionIds() {
    const collections = await firestoreService.listCollections();
    return collections.map(collection => collection.id);
}


/**
 * get a JWT access token
 * @param {Array<String>} scopes - the scopes requested for the JWT
 * @returns {Promise<string>}
 */
async function getAccessToken(scopes = defaultScopes): Promise<string | null | undefined> {
    const credentials = Config.firestore_backups_service_account;
    const jwtClient = new JWT(
        credentials.client_email,
        undefined,
        credentials.private_key,
        scopes
    );
    const authorization = await jwtClient.authorize();
    return authorization.access_token;
}

async function getAuthHeaders(): Promise<{ [key: string]: string }> {
    const accessToken = await getAccessToken();

    if (!accessToken) {
        await slackService.sendEngineeringMessage(":rotating-light: Failed to get access token for firestore backup")
    }

    return {
        Authorization: `Bearer ${accessToken}`,
    }
}

/**
 * @param {string} projectId - the ID of the firebase project to back up
 * @param {string} outputBucket - the google cloud storage bucket prefix to export to
 * @param {Array<String>} [collectionIds] - optional list of collection ids to export. If undefined, it will export all collections
 * @returns {Promise<*>}
 */
async function initializeBackup(projectId: string, outputBucket: string, collectionIds?: string[]): Promise<{ operation?: Operation, error?: any }> {
    console.log("starting backup job for project", projectId);
    console.log("output bucket", outputBucket);
    const exportUrl = buildExportUrl(projectId);
    console.log("got access token and exportUrl = ", exportUrl);
    try {
        const response = await axios.post(exportUrl, {
            outputUriPrefix: `gs://${outputBucket}`,
            collectionIds,
        }, {
            headers: {
                "Content-Type": "application/json",
                ...(await getAuthHeaders()),
            },
        });

        const operation = response.data as Operation;

        console.log("backup response data", operation);
        return {operation};

    } catch (error) {
        console.error("failed to initialize backup", error);
        return {error};
    }
}