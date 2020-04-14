import {promisify} from "util";
import Logger from "@shared/Logger";

const path = require("path");
const fs = require("fs-extra");
const logger = new Logger("FileUtil");
/**
 * write data to a file
 * @param {string} filePath
 * @param {any} data
 * @returns Promise<boolean> - boolean if the operation was successful
 */
export async function writeToFile(filePath: string, data: any): Promise<boolean> {
    try {
        const folder = path.dirname(filePath);
        try {
            await fs.mkdirp(folder, {recursive: true});
        } catch (error) {
            console.debug("Unable to create folder " + folder, error);
        }

        try {
            await promisify(fs.writeFile)(filePath, data);
            return true;
        } catch (error) {
            logger.error("Failed to write to file", filePath, error);
            return false
        }
    } catch (e) {
        logger.error("Failed to write to file/storage", e);
        return false;
    }

}