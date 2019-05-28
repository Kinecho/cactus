const path = require("path");
const webRoot = path.resolve(__dirname, "..");

module.exports = {
    webRoot: webRoot,
    srcDir: path.resolve(webRoot, "src"),
    scriptDir: path.resolve(webRoot, "src", "scripts"),
    publicDir: path.resolve(webRoot, "public"),
    sharedDir: path.resolve(webRoot, "..", "shared", "src")

}