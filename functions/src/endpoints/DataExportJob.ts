import {getConfig} from "@api/config/configService";
import * as functions from "firebase-functions";
import {JWT} from "google-auth-library";
import axios, {AxiosError} from "axios";
import {sendEngineeringMessage} from "@api/slack/slack";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
import {Operation} from "@shared/types/FirestoreTypes";
import {formatDuration} from "@shared/util/DateUtil";

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

export async function backupFirestore(message?: functions.pubsub.Message, context?: functions.EventContext): Promise<void> {

    const collectionIds = await getCollectionIds();
    console.log("collectionIds", collectionIds);
    await sendEngineeringMessage(`Backing up collections:\n \`\`\`${collectionIds.join(", ")}\`\`\`\nsaving to bucket: \`${backupsConfig.firestore_backups_bucket}\``);

    await initializeBackup(serviceAccount.project_id, backupsConfig.firestore_backups_bucket, collectionIds)
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
async function initializeBackup(projectId: string, outputBucket: string, collectionIds?: string[]) {
    console.log("starting backup job for project", projectId);
    console.log("output bucket", outputBucket);
    const startTime = new Date();
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
        let webLink: string | undefined = undefined;
        let outputUriPrefix: string | undefined = undefined;
        if (operation && operation.metadata) {
            outputUriPrefix = operation.metadata.outputUriPrefix;
        }
        let linkString = "";
        if (outputUriPrefix) {
            const bucketPath = outputUriPrefix.replace("gs://", "");
            webLink = `https://console.cloud.google.com/storage/browser/${bucketPath}?project=${projectId}`;
            linkString = `<${webLink}|${outputUriPrefix}>`
        }
        await sendEngineeringMessage({
            text: `Successfully initialized backup ${linkString ? "to " + linkString : ""}`,
            attachments: [{text: `\`\`\`${JSON.stringify(response.data, null, 2)}\`\`\``, color: "good"}]
        });


        try {
            const finishedOperation = await pollForOperation(operation.name);
            const endTime = new Date();

            if (finishedOperation) {
                await sendEngineeringMessage({
                    text: `:white_check_mark: Completed firestore backup operation after ${formatDuration(startTime, endTime)}`,
                    attachments: [
                        {
                            text: `Operation details\n\`\`\`${JSON.stringify(finishedOperation, null, 2)}\`\`\``,
                            color: "good",
                            ts: `${(new Date()).getTime() / 1000}`
                        }
                    ]
                })
            }
        } catch (e) {
            const endTime = new Date();
            await sendEngineeringMessage({
                text: `Failed to find completed firestore backup operation after ${formatDuration(startTime, endTime)}`,
                attachments: [{
                    text: `Operation Name ${operation.name}\n\`\`\`${JSON.stringify(e, null, 2)}\`\`\``,
                    color: "danger",
                    ts: `${(new Date()).getTime() / 1000}`
                }]
            })
        }

    } catch (error) {
        console.error("failed to initialize backup", error);
        await sendEngineeringMessage({
            text: "Failed to initialize backup",
            attachments: [{text: `\`\`\`${JSON.stringify(error, null, 2)}\`\`\``, color: "danger", ts: `${(new Date()).getTime() / 1000}`}]
        });
    }
}