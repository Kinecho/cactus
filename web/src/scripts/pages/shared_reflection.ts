// tslint:disable-next-line:no-implicit-dependencies
import {commonInit} from "@web/common";

import Page from "@components/SharedReflectionPage.vue";
import Logger from "@shared/Logger";

const logger = new Logger("shared_reflection.ts");
commonInit();

new Page({
    el: "#reflection-app"
});

document.addEventListener('DOMContentLoaded', () => {
    logger.log("shared_reflection loaded");
});
