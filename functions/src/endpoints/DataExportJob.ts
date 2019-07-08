import {getConfig} from "@api/config/configService";
import * as functions from "firebase-functions";
import {JWT} from "google-auth-library";
import axios, {AxiosError} from "axios";
import {AttachmentColor, sendEngineeringMessage, SlackAttachment} from "@api/slack/slack";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import {Operation} from "@shared/types/FirestoreTypes";
import {formatDuration} from "@shared/util/DateUtil";
import {Storage} from "@google-cloud/storage";
import {writeToFile} from "@api/util/FileUtil";

const Config = getConfig();

const firestoreService = AdminFirestoreService.getSharedInstance();
const firestoreAdminVersion = 'v1';
const betaVersion = '';

const serviceAccount = Config.firestore_backups_service_account;
const backupsConfig = Config.backups_config;

const defaultScopes = [
    "https://www.googleapis.com/auth/datastore",
    "https://www.googleapis.com/auth/cloud-platform",
];

export const prefixFilename = "latest-prefix.txt";

export async function backupFirestore(message?: functions.pubsub.Message, context?: functions.EventContext): Promise<void> {
    const collectionIds = await getCollectionIds();
    console.log("collectionIds", collectionIds);

    const startTime = new Date();
    await sendEngineeringMessage({
        text: `Starting database backup job.`,
        attachments: [
            {
                text: `Collection IDs:\n \`\`\`${collectionIds.join(", ")}\`\`\``,
                color: AttachmentColor.info,
                ts: `${(new Date()).getTime() / 1000}`
            }
        ]
    });

    try {
        const [
            exportOperation,
            bigQueryOperation
        ] = await Promise.all([
            exportForBackup(),
            exportForBigQuery(collectionIds)
        ]);

        const endTime = new Date();

        const attachments: SlackAttachment[] = [
            buildOperationAttachment("Firestore Backup", exportOperation.operation, formatDuration(startTime, exportOperation.endTime), exportOperation.error),
            buildOperationAttachment("Big Query Export", bigQueryOperation.operation, formatDuration(startTime, bigQueryOperation.endTime), bigQueryOperation.error),
        ];

        await sendEngineeringMessage({
            text: `Export Completed after ${formatDuration(startTime, endTime)}`,
            attachments,
        });
    } catch (e) {
        console.error("failed to backup", e);
        await sendEngineeringMessage(`Failed to backup ${JSON.stringify(e, null, 2)}`);
    }


}

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
        webLink = `https://console.cloud.google.com/storage/browser/${bucketPath}?project=${serviceAccount.project_id}`;
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

    const {operation, error} = await initializeBackup(serviceAccount.project_id, backupsConfig.firestore_backups_bucket);
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

async function exportForBigQuery(collectionIds: string[]): Promise<{ operation?: Operation, endTime: Date, error?: any }> {
    // const operation = await initializeBackup(serviceAccount.project_id, backupsConfig.bigquery_import_bucket, collectionIds);
    const analyticsProjectId = backupsConfig.analytics_project_id;

    console.log("got bucket");
    // firebase.storage().bucket

    const date = new Date();
    const nextPrefix = date.toISOString();
    try {
        const storage = new Storage({projectId: analyticsProjectId, credentials: serviceAccount});
        const bucket = storage.bucket(backupsConfig.bigquery_import_bucket);
        const tmpFilePath = `/tmp/${prefixFilename}`;
        await writeToFile(tmpFilePath, nextPrefix);
        await bucket.upload(tmpFilePath);
    } catch (error) {
        console.error("Failed to upload new prefix for bigquery export file to storage", error)
        return {endTime: new Date(), error}
    }

    const {operation, error: initError} = await initializeBackup(serviceAccount.project_id,
        `${backupsConfig.bigquery_import_bucket}/${nextPrefix}`,
        collectionIds);

    if (!operation) {
        return {endTime: new Date(), error: initError || {message: "Failed to initialize bigqury export operation"}}
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

export async function getOperation(name: string): Promise<Operation | undefined> {
    const uri = `https://firestore.googleapis.com/v1/${name}`;
    try {
        const response = await axios.get(uri, {
            headers: {
                ...(await getAuthHeaders())
            }
        });
        // await sendEngineeringMessage({
        //     text: "Fetched operation",
        //     attachments: [{
        //         text: `\`\`\`${JSON.stringify(response.data, null, 2)}\`\`\``,
        //         color: "good"
        //     }]
        // });

        return response.data;
    } catch (error) {
        if (error.isAxiosError) {
            const axiosError = error as AxiosError;
            console.error(`Failed to get operation. Code ${axiosError.code}. ${JSON.stringify(axiosError.response, null, 2)}`);
            await sendEngineeringMessage({text: `Failed to get operation. Code ${axiosError.code}.\n\`\`\`${JSON.stringify(axiosError.response, null, 2)}\`\`\``})
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
        await sendEngineeringMessage(":rotating-light: Failed to get access token for firestore backup")
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