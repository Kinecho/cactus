declare module '*.vue' {
    import Vue from "vue";
    export default Vue;
}

interface Window {
    [key:string]: any; // Add index signature
}

interface FirebaseObject {
    [key:string]: any;
}

interface HTMLElement {
    __vueClickOutside__: EventListenerOrEventListenerObject|null
}