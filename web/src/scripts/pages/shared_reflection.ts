// tslint:disable-next-line:no-implicit-dependencies
import {commonInit} from "@web/common";
import Vue from "vue";

import Page from "@components/SharedReflectionPage.vue";

commonInit();

new Page({
    el: "#reflection-app"
})

document.addEventListener('DOMContentLoaded', () => {
    console.log("shared_reflection loaded");
});
