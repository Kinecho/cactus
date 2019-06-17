import {start} from "./createPage";

start().then(() => {
    console.log("done");
}).catch(error => {
    console.error("error running createPage", error);
});