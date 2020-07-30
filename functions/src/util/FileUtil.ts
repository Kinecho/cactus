import {promisify} from "util";
const path = require("path");
const fs = require("fs-extra");
import {getConfig} from "@admin/config/configService";
import * as admin from "firebase-admin";
import Logger from "@shared/Logger";

const logger = new Logger("FileUtil");

/**
 * write data to a file
 * @param {string} filePath
 * @param {any} data
 * @returns Promise<boolean> - boolean if the operation was successful
 */
export async function writeToFile(filePath:string, data: any): Promise<string|boolean>{
    try {
        const config = getConfig();
        if (!config.isEmulator){
            return writeTextToStorage("inbound/emails/" + path.parse(filePath).name + path.parse(filePath).ext, data)
        }

        const folder = path.dirname(filePath);
        try {
            await fs.mkdirp(folder, {recursive: true});
        } catch (error){
            logger.error(error);
            // logger.debug("Unable to create folder " + folder, error);
        }

        try {
            await promisify(fs.writeFile)(filePath, data);
            return true;
        } catch (error){
            logger.error("Failed to write to file", filePath, error);
            return false
        }
    } catch (e){
        logger.error("Failed to write to file/storage", e);
        return false;
    }

}

export async function writeTextToStorage(filePath:string, data:any): Promise<string|boolean> {
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    // await file.setMetadata({contentType: "text/plain"});
    try{
        await file.save(data);
        logger.log("Upload success. File: ", filePath);
        return filePath;
    } catch (error){
        logger.error("Failed to upload to cloud storage", error);
        return false;
    }

}