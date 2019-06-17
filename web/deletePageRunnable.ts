import {start} from "./deletePage";

start().then(() => {
    console.log("done");
}).catch(error => {
    console.error("error running deletePage", error);
});