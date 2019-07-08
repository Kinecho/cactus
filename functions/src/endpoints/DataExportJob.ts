import {getConfig} from "@api/config/configService";
import * as functions from "firebase-functions";
import {JWT} from "google-auth-library";
import axios from "axios";
import {sendEngineeringMessage} from "@api/slack/slack";
import AdminFirestoreService from "@shared/services/AdminFirestoreService";
const Config = getConfig();

const firestoreService = AdminFirestoreService.getSharedInstance();

const defaultScopes = [
    "https://www.googleapis.com/auth/datastore",
    "https://www.googleapis.com/auth/cloud-platform",
];

export async function backupFirestore(message?: functions.pubsub.Message, context?: functions.EventContext):Promise<void>{
    const serviceAccount = Config.firestore_backups_service_account;
    const backupsConfig = Config.backups_config;
    const collectionIds = await getCollectionIds();
    console.log("collectionIds", collectionIds);
    await sendEngineeringMessage(`Backing up collections: ${collectionIds.join(", ")}\nsaving to bucket: ${backupsConfig.firestore_backups_bucket}`);

    await initializeBackup(serviceAccount.project_id,  backupsConfig.firestore_backups_bucket, collectionIds)
}

/**
 * Get the URL for the export command
 * @param {string} projectId - the id of the firebase project to export
 * @returns {string}
 */
function buildExportUrl(projectId:string):string {
    return `https://firestore.googleapis.com/v1beta1/projects/${projectId}/databases/(default):exportDocuments`;
}


async function getCollectionIds(){
    const collections = await firestoreService.listCollections();
    return collections.map(collection => collection.id);
}


/**
 * get a JWT access token
 * @param {Array<String>} scopes - the scopes requested for the JWT
 * @returns {Promise<string>}
 */
async function getAccessToken(scopes = defaultScopes):Promise<string|null|undefined> {
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

async function getAuthHeaders():Promise<{[key: string]: string}>{
    const accessToken = await getAccessToken();

    if (!accessToken){
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
async function initializeBackup(projectId:string, outputBucket:string, collectionIds?:string[]) {
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

        console.log("backup response data" ,response.data);
        await sendEngineeringMessage({
            text: "Successfully initialized backup",
            attachments: [{text: `\`\`\`${JSON.stringify(response.data)}\`\`\``, color: "good"}]
        })
    } catch (error){
        console.error("failed to initialize backup", error);
        await sendEngineeringMessage({
            text: "Failed to initialize backup",
            attachments: [{text: `\`\`\`${JSON.stringify(error)}\`\`\``, color: "danger"}]
        });
    }
}