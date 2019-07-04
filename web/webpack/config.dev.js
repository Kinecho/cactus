const stageConfig = require("./config.stage");

module.exports = {
    ...stageConfig,
    isDev: true,
    __API_DOMAIN__: "http://localhost:5000/cactus-app-stage/us-central1",
    __PUBLIC_DOMAIN__ : "http://localhost:8080",
};
