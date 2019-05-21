import "styles/index.scss"
import {Config} from "scripts/config.js"
import {init as initAnalytics, gtag} from 'scripts/analytics'


console.log("Config", Config)

initAnalytics()

document.addEventListener('DOMContentLoaded', function() {
    // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
    // // The Firebase SDK is initialized and available here!
    //
    // firebase.auth().onAuthStateChanged(user => { });
    // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
    // firebase.messaging().requestPermission().then(() => { });
    // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
    //
    // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

    // try {
    //     let app = firebase.app();
    //     let features = ['auth', 'database', 'messaging', 'storage'].filter(feature => typeof app[feature] === 'function');
    //     document.getElementById('load').innerHTML = `Firebase SDK loaded with ${features.join(', ')}`;
    // } catch (e) {
    //     console.error(e);
    //     document.getElementById('load').innerHTML = 'Error loading the Firebase SDK, check the console.';
    // }

    gtag('event', "document loaded", {
        'event_category': "test category",
        'event_label': "test label",
        'value': "test value"
    });
});