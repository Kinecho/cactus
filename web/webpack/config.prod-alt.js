const config = require('./config.prod')
module.exports = {
    ...config,
    __PUBLIC_DOMAIN__: 'https://cactus-app-prod-alt.web.app',
    __FIREBASE_CONFIG__: {
        ...config.__FIREBASE_CONFIG__,
        authDomain: 'cactus-app-prod-alt.firebaseapp.com',
    },
    __FLAMELINK_FIREBASE_CONFIG__: {
        ...config.__FLAMELINK_FIREBASE_CONFIG__,
        authDomain: 'cactus-app-prod-alt.firebaseapp.com',
    },
}
