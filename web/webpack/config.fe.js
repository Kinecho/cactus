const stageConfig = require("./config.stage");

module.exports = {
    ...stageConfig,
    __API_DOMAIN__: "https://us-central1-cactus-app-stage.cloudfunctions.net",
    __PUBLIC_DOMAIN__ : "http://localhost:8080",
};
