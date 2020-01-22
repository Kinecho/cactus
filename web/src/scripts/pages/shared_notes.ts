// @ts-ignore
import SharedNotesPage from "@components/SharedNotesPage.vue"
import Vue from "vue";
import {commonInit} from "@web/common";
import NavBar from "@components/NavBar.vue";
import Footer from "@components/StandardFooter.vue";
import Logger from "@shared/Logger";

const logger = new Logger("SharedNotesPage");
commonInit();

new Vue({
    el: "#app",
    template: `
<div class="shared-notes-page">
  <NavBar v-bind:isSticky="false"/>
  <SharedNotesPage/>
  <Footer/>
</div>`,
    components: {
        SharedNotesPage,
        NavBar,
        Footer,
    }
});

//enables hot reload
if (module.hot) {
    module.hot.accept((error: any) => {
        logger.error("Error accepting hot reload", error);
    })
}