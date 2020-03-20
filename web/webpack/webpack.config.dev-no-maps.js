const merge = require("webpack-merge");
const getCommonWebpackConfig = require("./webpack.config.common")
const getDevServerConfig = require("./devserver.config")
const config = require('./config.dev-proxy')
const minimizersConfig = require('./minimizers.config')

config.isDev = true;

module.exports = () => {
  return getCommonWebpackConfig(config).then(common => {
      return merge(common, minimizersConfig, {
          mode: "development",
          // devtool: "none",
          devtool: "cheap-module-eval-source-map",
      }, getDevServerConfig(config))
  })
}