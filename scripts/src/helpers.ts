const path = require("path");
const scriptsRoot = path.resolve(__dirname, "..");

const commandsDirRelativeToSource = "commands";

const publicCommandsDirRelativeToSource =`${commandsDirRelativeToSource}/public`;

export default {
    projectRoot: path.resolve(scriptsRoot, ".."),
    scriptsRoot: scriptsRoot,
    srcDir: path.resolve(scriptsRoot, "src"),
    commandsDirRelativeToSource,
    publicCommandsDirRelativeToSource,
    commandsDir: path.resolve(scriptsRoot, "src", commandsDirRelativeToSource),
    publicCommandsDir: path.resolve(scriptsRoot, "src", commandsDirRelativeToSource, "public"),
    sharedDir: path.resolve(scriptsRoot, "..", "shared"),
}