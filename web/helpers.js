const path = require("path");
const webRoot = path.resolve(__dirname);
const pages = require("./pages");

module.exports = {
    projectRoot: path.resolve(webRoot, ".."),
    webRoot: webRoot,
    srcDir: path.resolve(webRoot, "src"),
    scriptDir: path.resolve(webRoot, "src", "scripts"),
    pagesFile: pages,
    htmlDir: path.resolve(webRoot, "src", "html"),

    stylesDir: path.resolve(webRoot, "src", "styles"),
    pagesStylesDir: path.resolve(webRoot, "src", "styles", "pages"),

    publicDir: path.resolve(webRoot, "public"),
    sharedDir: path.resolve(webRoot, "..", "shared", "src"),

    questionsSiteMap: path.resolve(webRoot, "src", "assets", "sitemaps", "questions.txt"),
}