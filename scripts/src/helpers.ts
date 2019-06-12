const path = require("path");
const scriptsRoot = path.resolve(__dirname, "..");

const commandsDirRelativeToSource = "commands";

export default {
    projectRoot: path.resolve(scriptsRoot, ".."),
    scriptsRoot: scriptsRoot,
    srcDir: path.resolve(scriptsRoot, "src"),
    commandsDirRelativeToSource,
    commandsDir: path.resolve(scriptsRoot, "src", commandsDirRelativeToSource),
    sharedDir: path.resolve(scriptsRoot, "..", "shared"),
}