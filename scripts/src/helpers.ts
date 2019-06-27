const path = require("path");
const scriptsRoot = path.resolve(__dirname, "..");
const webHelpers = require("../../web/helpers.js");
const commandsDirRelativeToSource = "commands";

const publicCommandsDirRelativeToSource =`${commandsDirRelativeToSource}`;

export default {
    projectRoot: path.resolve(scriptsRoot, ".."),
    scriptsRoot: scriptsRoot,
    srcDir: path.resolve(scriptsRoot, "src"),
    commandsDirRelativeToSource,
    publicCommandsDirRelativeToSource,
    commandsDir: path.resolve(scriptsRoot, "src", commandsDirRelativeToSource),
    publicCommandsDir: path.resolve(scriptsRoot, "src", commandsDirRelativeToSource),
    sharedDir: path.resolve(scriptsRoot, "..", "shared"),
    webHelpers,
}