const stageConfig = require("./config.stage");

stageConfig.__API_DOMAIN__ = "http://localhost:5000/cactus-app-stage/us-central1";

module.exports = stageConfig;

// Just extend the stage config
// module.exports = {
//     __GOOGLE_ANALYTICS_ID__: "UA-127159143-6",
//     __API_DOMAIN__: "http://localhost:5000/cactus-app-stage/us-central1",
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
