// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/$PAGE_NAME$.scss"
import {commonInit} from "@web/common";

commonInit();

document.addEventListener('DOMContentLoaded', () => {
    console.log("$PAGE_NAME$ loaded");
});
