const config = require('./config.prod')
module.exports = {
    ...config,
    // START: Use stage values for analytics stuff
    __GOOGLE_ANALYTICS_ID__: 'UA-127159143-6',
    __GOOGLE_OPTIMIZE_ID__: 'GTM-KFBRFFG',
    __FACEBOOK_PIXEL_ID__: '1028725524153114',
    // END: Use stage values for analytics stuff

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
