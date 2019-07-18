const path = require("path");
const scriptsRoot = path.resolve(__dirname, "..");
const webHelpers = require("../../web/helpers.js");
const commandsDirRelativeToSource = "commands";

const publicCommandsDirRelativeToSource =`${commandsDirRelativeToSource}`;

export default {
    projectRoot: path.resolve(scriptsRoot, ".."),
    scriptsRoot: scriptsRoot,
    srcDir: path.resolve(scriptsRoot, "src"),
    dataDir: path.resolve(scriptsRoot, "src", "data"),
    commandsDirRelativeToSource,
    publicCommandsDirRelativeToSource,
    commandsDir: path.resolve(scriptsRoot, "src", commandsDirRelativeToSource),
    publicCommandsDir: path.resolve(scriptsRoot, "src", commandsDirRelativeToSource),
    sharedDir: path.resolve(scriptsRoot, "..", "shared"),
    outputDir: path.resolve(scriptsRoot, "output"),
    webHelpers,
}