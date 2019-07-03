import {promisify} from "util";
const path = require("path");
const fs = require("fs-extra");

/**
 * write data to a file
 * @param {string} filePath
 * @param {any} data
 * @returns Promise<boolean> - boolean if the operation was successful
 */
export async function writeToFile(filePath:string, data: any): Promise<string|boolean>{
    try {
        const folder = path.dirname(filePath);
        console.log("attempting to make foilder", folder);
        try {
            await fs.mkdirp(folder, {recursive: true});
        } catch (error){
            console.debug("Unable to create folder " + folder, error);
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