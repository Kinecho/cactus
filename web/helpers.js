const path = require("path");
const webRoot = path.resolve(__dirname);

module.exports = {
    webRoot: webRoot,
    srcDir: path.resolve(webRoot, "src"),
    pagesDir: path.resolve(webRoot, "src"),
    scriptDir: path.resolve(webRoot, "src", "scripts"),
    pagesScriptsDir: path.resolve(webRoot, "src", "scripts", "pages"),

    stylesDir: path.resolve(webRoot, "src", "styles"),
    pagesStylesDir: path.resolve(webRoot, "src", "styles", "pages"),

    publicDir: path.resolve(webRoot, "public"),
    sharedDir: path.resolve(webRoot, "..", "shared", "src")

}