import {promisify} from "util";

const path = require("path");
const fs = require("fs");
import {getConfig} from "@api/config/configService";
import * as admin from "firebase-admin";
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
            await promisify(fs.mkdir)(folder, {recursive: true});
        } catch (error){
            // console.debug("Unable to create folder " + folder, error);
        }

        try {
            await promisify(fs.writeFile)(filePath, data);
            return true;
        } catch (error){
            console.error("Failed to write to file", filePath, error);
            return false
        }
    } catch (e){
        console.error("Failed to write to file/storage", e);
        return false;
    }

}

export async function writeTextToStorage(filePath:string, data:any): Promise<string|boolean> {
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    // await file.setMetadata({contentType: "text/plain"});
    try{
        await file.save(data);
        console.log("Upload success. File: ", filePath);
        return filePath;
    } catch (error){
        console.error("Failed to upload to cloud storage", error);
        return false;
    }

}