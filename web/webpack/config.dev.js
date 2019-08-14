const stageConfig = require("./config.stage");


module.exports = {
    ...stageConfig,
    isDev: true,
    __BUILD_ENV__:"dev",
    __API_DOMAIN__: "http://localhost:5000/cactus-app-stage/us-central1",
    __PUBLIC_DOMAIN__ : "http://localhost:8080",

    //Dev uses the cactus-app-stage config for flamelink. The EnvID will need to change if we switch to using prod
    __FLAMELINK_ENV_ID__: "dev",
    __FLAMELINK_FIREBASE_CONFIG__: {
        apiKey: 'AIzaSyA8q6tz-bzx5NM9bqEYS8xZ7NHpCffo-q0',
        authDomain: 'cactus-app-stage.firebaseapp.com',
        databaseURL: 'https://cactus-app-stage.firebaseio.com',
        projectId: 'cactus-app-stage',
        storageBucket: 'cactus-app-stage.appspot.com',
        messagingSenderId: '88457335033',
        appId: '1:88457335033:web:e731bd6b336daeb6',
    },
};
