const express = require("express");
const path = require("path");
const webpack = require("webpack");
const devMiddleware = require("webpack-dev-middleware");
const hotMiddleware = require("webpack-hot-middleware");

const { webpackConfig, DEV_SERVER_CONFIG } = require("./config/webpack.dev.js")
const {PORT,HOST,HMR_PATH} = DEV_SERVER_CONFIG;


const app = express();

const compiler = webpack(webpackConfig);

app.use(express.static(path.join(__dirname, "../public/dist/")))

app.use(devMiddleware(compiler, {
  writeToDisk: (filePath) => filePath.endsWith('.tpl'),
  publicPath: webpackConfig.output.publicPath,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization'
  }
}));

app.use(hotMiddleware(compiler, {
  log: () => {},
  path: `/${HMR_PATH}`
}));


console.info("please await webpack init complete")

app.listen(PORT, HOST, () => {
  console.log(`dev server listening on ${HOST}:${PORT}`)
})
