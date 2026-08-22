const merge = require("webpack-merge");
const path = require("path");
const webpack = require("webpack");

// base config
const baseConfig = require("./webpack.base.js");

// webpack-hot-middleware 的服务端/客户端连接配置
// 文档：https://github.com/webpack/webpack-hot-middleware
const DEV_SERVER_CONFIG = {
  // HMR 服务端监听地址（客户端也连这里）；用 127.0.0.1 而非 0.0.0.0 避免外网暴露热更新
  HOST: "127.0.0.1",
  // HMR 长连接服务端口
  PORT: 9002,
  // HMR 的握手/心跳路径，客户端通过此 path 连接服务端的 SSE(event-stream)
  HMR_PATH: "__WEBPACK_HMR",
  // 连接超时时间(ms)，超时后客户端回退为整页 reload
  TIMEOUT: 2000,
};
const {HMR_PATH,HOST,PORT,TIMEOUT} = DEV_SERVER_CONFIG
// 给每个业务入口(非 vendor)注入 HMR 客户端运行时，建立与服务端的 HMR 长连接
Object.keys(baseConfig.entry).forEach(v => {
  if (v !== 'vendor') {
    // 在原有入口前追加 webpack-hot-middleware 客户端：
    // path 指向 HMR 服务端地址；timeout 对应上面的超时；reload=true 表示 HMR 失败回退整页刷新
    baseConfig.entry[v] = [
      baseConfig.entry[v],
      `webpack-hot-middleware/client?path=http://${HOST}:${PORT}/${HMR_PATH}&timeout=${TIMEOUT}&reload=true`
    ]
  }
})

const webpackConfig = merge.smart(baseConfig, {
  // 开发模式：不压缩、保留 source map 与调试信息、开启 HMR 等相关 dev 优化
  mode: "development",
  // 开发环境下的 source map 配置：eval-cheap-module-source-map 提供更友好的调试信息，不包含列信息，适用于开发环境
  devtool: 'eval-cheap-module-source-map',
  output: {
    // 入口 chunk 产物文件名：[name] 取 entry 名，[chunkhash:8] 取内容 hash 前 8 位，
    // 内容不变则文件名不变，最利于浏览器长缓存 / 增量发布
    filename: "js/[name]_[chunkhash:8].bundle.js",
    // 产物输出到磁盘的绝对目录
    path: path.join(process.cwd(), "./app/public/dist/dev"),
    // 浏览器通过该 URL 前缀加载 chunk；与 HMR 服务端地址保持一致，否则热更新拉不到资源
    publicPath: `http://${HOST}:${PORT}/public/dist/dev`,
    // 指定 webpack 运行时挂载模块系统的全局对象，`'this'` 比默认的 `'window'`
    // 更能在非浏览器环境(SSR/Worker/测试)下不报 ReferenceError
    globalObject: 'this',
  },
  plugins: [
    // 开启模块热替换(HMR)：运行时替换变更的模块而无需整页刷新
    new webpack.HotModuleReplacementPlugin({
      // 多步模式：false 表示单次批量应用更新，true 会把更新拆成多个 step（旧版选项，通常保持 false）
      multiStep:false
    }),
  ]
});

module.exports = {
  webpackConfig,
  DEV_SERVER_CONFIG
};
