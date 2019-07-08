require("module-alias/register");
import {endpoints} from "./index";


/**
 * this is a special pass-through file to ensure we require & register the module alias mapper before any other code.
 * This file should not need to be updated. To add new functions, see functions/src/index.ts
 */
module.exports = endpoints;