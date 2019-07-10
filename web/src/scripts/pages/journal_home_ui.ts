// tslint:disable-next-line:no-implicit-dependencies
import "@styles/pages/journal_home.scss"
import {initializeArticlePage} from "@web/articleCommon";
import Vue from "vue";

initializeArticlePage();

document.addEventListener('DOMContentLoaded', () => {
    console.log("journal_home loaded");
});

new Vue({
  el: "#menuParent",
  data: {
    isOpen: false
  },
  methods:{
    toggle: function(){
      this.isOpen = !this.isOpen
    }
  }
})

new Vue({
  el: "#reflectParent",
  data: {
    doReflect: false
  },
})
