const path = require("path");

const sharedRoot = __dirname;
const projectRoot = path.resolve(sharedRoot, "..", "..");
export default {
    sharedRoot,
    projectRoot,
}