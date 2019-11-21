const path = require("path");
const scriptsRoot = path.resolve(__dirname, "..");
const webHelpers = require("@web-root/helpers.js");
const commandsDirRelativeToSource = "commands";

const publicCommandsDirRelativeToSource =`${commandsDirRelativeToSource}`;
const projectRoot = path.resolve(scriptsRoot, "..");
export default {
    projectRoot: projectRoot,
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
    appAssociationFile: path.resolve(projectRoot, "apple-app-site-association")
}