import {init as initAnalytics, startFullstory} from '@web/analytics'
import Vue from "vue";
// @ts-ignore
import NavBar from "@components/NavBar";
import * as firebase from "firebase/app";
import {Config} from "@web/config";

initAnalytics();
startFullstory();

const app = firebase.initializeApp(Config.firebase);




function setupNavigation(){
    const $headers = document.getElementsByTagName("header");
    const $header = $headers ? $headers.item(0) : undefined;

    const $nav = document.getElementById("#top-nav");


    if (!$nav && !$header){
        console.error("Can not find the Vue root element for the nav bar. Not initializing");
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

    // @ts-ignore

    // Vue.component()

    setupNavigation()

});