import {writeToFile} from "@api/util/FileUtil";
import {promisify} from "util";

const fs = require("fs");
const path = require("path");

const __outdir = process.cwd();
const testFiles: Array<string> = [];

function getFile(filename: string): string {
    return path.resolve(`${__outdir}`, "output", "test", filename);
}


afterEach(async () => {
    const tasks: Array<Promise<any>> = [];
    testFiles.forEach(filename => {
        console.log("deleting file", filename);
        tasks.push(promisify(fs.unlink)(filename));
    });

    await Promise.all(tasks);
    console.log("**** Removed all files ****");
});

describe("writeToFile tests, using emulator", () => {
    beforeEach(() => {
        process.env.IS_EMULATOR = "true";
    });

    test("plain string", async () => {
        const input = "hello!";
        const filepath = getFile("file.txt");

        testFiles.push(filepath);
        const success = await writeToFile(filepath, input);
        expect(success).toBeTruthy();
        expect(fs.existsSync(filepath)).toBeTruthy();
    })
});