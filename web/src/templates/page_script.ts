// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/$PAGE_NAME$.scss"
import {initializeArticlePage} from "@web/articleCommon";

initializeArticlePage();

document.addEventListener('DOMContentLoaded', () => {
    console.log("$PAGE_NAME$ loaded");
});
