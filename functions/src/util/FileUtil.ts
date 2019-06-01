import {promisify} from "util";

const path = require("path");
const fs = require("fs");


/**
 * write data to a file
 * @param {string} filePath
 * @param {any} data
 * @returns Promise<boolean> - boolean if the operation was successful
 */
export async function writeToFile(filePath:string, data: any): Promise<boolean>{

    const folder = path.dirname(filePath);
    const fullPath = path.resolve(filePath);
    console.log("fullPath is", fullPath);
    console.log("folder is", folder);
    try {
        await promisify(fs.mkdir)(folder, {recursive: true});
        console.log("created folder", folder);
    } catch (error){
        console.debug("Unable to create folder " + folder, error);
    }

    try {
        await promisify(fs.writeFile)(filePath, data);
        console.log("wrote to file", filePath);
        return true;
    } catch (error){
        console.error("Failed to write to file", filePath, error);
        return false
    }
}