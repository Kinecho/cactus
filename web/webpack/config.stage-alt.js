const config = require('./config.stage')
module.exports = {
    ...config,
    __PUBLIC_DOMAIN__: 'https://cactus-app-stage-alt.web.app',
    __FIREBASE_CONFIG__: {
        ...config.__FIREBASE_CONFIG__,
        authDomain: 'cactus-app-stage-alt.firebaseapp.com',
    },
    __FLAMELINK_FIREBASE_CONFIG__: {
        ...config.__FLAMELINK_FIREBASE_CONFIG__,
        authDomain: 'cactus-app-stage-alt.firebaseapp.com',
    },
}



