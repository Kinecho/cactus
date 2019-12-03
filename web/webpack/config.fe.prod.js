const prodConfig = require("./config.prod");

module.exports = {
    ...prodConfig,
    isDev: true,
    __BUILD_ENV__:"dev",
    __API_DOMAIN__: "https://us-central1-cactus-app-prod.cloudfunctions.net",
    __PUBLIC_DOMAIN__ : "http://localhost:8080",
};
