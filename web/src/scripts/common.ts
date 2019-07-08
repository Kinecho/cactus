import {init as initAnalytics, startFullstory} from '@web/analytics'
import Vue from "vue";
import NavBar from "@components/NavBar.vue";
import {initializeFirebase} from "@web/firebase";

initAnalytics();
startFullstory();

initializeFirebase();

function setupNavigation(){
    const $headers = document.getElementsByTagName("header");
    const $header = $headers ? $headers.item(0) : undefined;
    const $nav = document.getElementById("#top-nav");

    if (!$nav && !$header){
        console.warn("Can not find the Vue root element for the nav bar. Not initializing");
        return;
    }
    console.log("Found a navigation header, initializing");

    // @ts-ignore
    window.NavBar = new Vue({
        el: $nav || $header,
        template: '<NavBar/>',
        components: {NavBar: NavBar}
    });
}

document.addEventListener('DOMContentLoaded', function () {
    setupNavigation();
});