// noinspection MissingOrObsoleteGoogRequiresInspection
let projectId = process.env.GCLOUD_PROJECT
let isProd = projectId === 'cactus-app-prod'

if (!projectId) {
    throw new Error('No project ID was found on the process. Can not build project')
}

let config
if (isProd) {
    config = require('./webpack.config.prod-alt')
} else {
    config = require('./webpack.config.stage-alt')
}


module.exports = config
