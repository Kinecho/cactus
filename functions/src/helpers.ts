const path = require("path");

const apiRoot = __dirname;
const projectRoot = path.resolve(apiRoot, "..", "..");
export default {
    apiRoot,
    projectRoot,
}