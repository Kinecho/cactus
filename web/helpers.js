const path = require("path");
const webRoot = path.resolve(__dirname);

module.exports = {
    projectRoot: path.resolve(webRoot, ".."),
    webRoot: webRoot,
    srcDir: path.resolve(webRoot, "src"),
    scriptDir: path.resolve(webRoot, "src", "scripts"),
    componentsDir: path.resolve(webRoot, "src", "scripts", "components"),
    pagesScriptsDir: path.resolve(webRoot, "src", "scripts", "pages"),
    assetsDir: path.resolve(webRoot, "src", "assets"),
    imagesDir: path.resolve(webRoot, "src", "assets", "images"),
    webpackDir: path.resolve(webRoot, "webpack"),
    htmlDir: path.resolve(webRoot, "src", "html"),
    stylesDir: path.resolve(webRoot, "src", "styles"),
    pagesStylesDir: path.resolve(webRoot, "src", "styles", "pages"),
    publicDir: path.resolve(webRoot, "public"),
    sharedDir: path.resolve(webRoot, "..", "shared", "src"),
    questionsSiteMap: path.resolve(webRoot, "src", "assets", "sitemaps", "questions.txt"),
}