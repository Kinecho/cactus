const stageConfig = require("./config.stage");

stageConfig.__API_DOMAIN__ = "https://us-central1-cactus-app-stage.cloudfunctions.net";

module.exports = stageConfig;


// Extend the stage config
// module.exports = {
//     __GOOGLE_ANALYTICS_ID__: "UA-127159143-6",
//     __API_DOMAIN__: "https://us-central1-cactus-app-stage.cloudfunctions.net",
//     __FULL_STORY_TEAM_ID__: "",
//     __FIREBASE_CONFIG__: {
//         apiKey: "AIzaSyA8q6tz-bzx5NM9bqEYS8xZ7NHpCffo-q0",
//         authDomain: "cactus-app-stage.firebaseapp.com",
//         databaseURL: "https://cactus-app-stage.firebaseio.com",
//         projectId: "cactus-app-stage",
//         storageBucket: "cactus-app-stage.appspot.com",
//         messagingSenderId: "88457335033",
//         appId: "1:88457335033:web:e731bd6b336daeb6"
//     }
// }
