const merge = require("webpack-merge");
const path = require("path");
const os = require("os");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CSSMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HtmlWebpackInjectAttributesPlugin = require("html-webpack-inject-attributes-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");

// base config
const baseConfig = require("./webpack.base.js");

// 用 webpack-merge 的 smart 模式把 base 配置与下方生产配置合并
//（相同 test 的 rule 会自动合并/覆盖 use，而不是简单拼接）
const webpackConfig = merge.smart(baseConfig, {
  // production：开启 tree-shaking、作用域提升、JS 压缩等生产优化（dev 用 development）
  mode: "production",
  output: {
    // 入口 chunk 产物文件名：[name] 取 entry 名，[chunkhash:8] 取内容 hash 前 8 位，
    // 内容不变则文件名不变，最利于浏览器长缓存 / 增量发布
    filename: "js/[name]_[chunkhash:8].bundle.js",
    // 产物输出到磁盘的绝对目录
    path: path.join(process.cwd(), "./app/public/dist/prod/"),
    // 运行时公共路径前缀：HTML 里引用的 js/css 都以 /dist/prod/ 开头。
    // 末尾斜杠不能省：webpack 运行时拼接异步 chunk URL 时直接用 publicPath + chunkFilename，
    // 少斜杠会导致 /dist/prod + js/xxx.js = /dist/prodjs/xxx.js，路径错误触发 ChunkLoadError。
    publicPath: "/dist/prod/",
    // 给 <script>/<link> 加 crossorigin="anonymous"，配合 CDN/CORS 做错误上报与缓存
    crossOriginLoading: "anonymous",
  },
  // 模块处理规则：告诉 webpack 不同后缀的文件该用哪些 loader 处理
  module: {
    // 规则数组：每条 rule 用 test 匹配文件名，用 use/include 决定处理方式
    rules: [
      {
        // 普通 .css：抽出为独立文件。base 里 .css 原用 style-loader 注入 <style>，这里被覆盖为抽取式
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, require.resolve("css-loader")],
      },
      {
        // 匹配 .less 文件
        test: /\.less$/,
        // use 数组“从右到左”生效（最右边的 loader 最先执行）：
        // less-loader → css-loader → (worker 池) → MiniCssExtract，最终产出独立 .css
        use: [
          // 1) 主线程：把编译结果抽成独立 .css 文件（抽取 loader 不能在 worker 里跑，必须留主线程）
          MiniCssExtractPlugin.loader,
          // 2) thread-loader：把“右侧”的 css-loader + less-loader 放进 worker 池并行编译
          {
            loader: require.resolve("thread-loader"),
            options: {
              // worker 数量 = CPU 逻辑核数，尽量吃满多核
              workers: os.cpus().length,
            },
          },
          // 3) css-loader：解析 @import / url() 依赖；importLoaders:1 表示
          //    @import 进来的资源还要再经过 1 个前置 loader（即 less-loader）处理
          {
            loader: require.resolve("css-loader"),
            options: { importLoaders: 1 },
          },
          // 4) less-loader：把 less 编译成 css
          require.resolve("less-loader"),
        ],
      },
      {
        // 匹配 .js 文件
        test: /\.js$/,
        // 仅编译业务页面目录，排除 node_modules（第三方走 vendor，由 splitChunks 处理）
        include: [
          path.resolve(__dirname, "../../pages"),
          path.resolve(process.cwd(), "app/pages"),
        ],
        use: [
          // thread-loader：HappyPack 的 webpack5 替代品，用 worker 池并行执行 babel
          {
            loader: require.resolve("thread-loader"),
            options: {
              // worker 数量 = CPU 逻辑核数
              workers: os.cpus().length,
            },
          },
          {
            loader: require.resolve("babel-loader"),
            options: {
              // 预设：按目标浏览器做语法降级（如编译到 ES5）
              presets: [require.resolve("@babel/preset-env")],
              // 插件：复用 @babel/runtime 里的 helper，避免每个文件重复注入、减小体积
              plugins: [require.resolve("@babel/plugin-transform-runtime")],
            },
          },
        ],
      },
    ],
  },
  // 关闭构建性能提示（如“单个资源超过 250KB”的告警），避免噪音
  performance: {
    hints: false,
  },
  plugins: [
    // 每次构建前清空产物目录（app/public/dist）。注意：当前是 clean-webpack-plugin v0.1 的旧式 API
    //（数组传路径 + root 等选项）；升到 v4 后需改用 new CleanWebpackPlugin() + cleanOnceBeforeBuildPatterns
    new CleanWebpackPlugin(["public/dist"], {
      // 被清空的目录相对 root 解析，这里是 app/，合起来即 app/public/dist
      root: path.resolve(process.cwd(), "./app/"),
      // 清空时要排除的文件/目录（空数组 = 不排除任何东西）
      exclude: [],
      // 是否在终端打印被删除的文件列表
      verbose: true,
      // true=只打印不真删（演练）；false=真正执行删除
      dry: false,
    }),
    // 把 JS 里 import 的 css 抽成独立 .css 文件（不再用 style-loader 注入 <style>）；
    // chunkFilename 用于非入口 chunk（如被 splitChunks 拆出的公共 css）的命名
    new MiniCssExtractPlugin({
      chunkFilename: "css/[name]_[contenthash:8].bundle.css",
      // Vue widget styles are scoped, so cross-entrypoint order does not affect the cascade.
      ignoreOrder: true,
    }),
    // 生产环境压缩 CSS（webpack5 下比内置压缩更可控），需配合上面的 MiniCssExtractPlugin
    new CSSMinimizerPlugin(),
    // 给 HtmlWebpackPlugin 生成的 <script>/<link> 注入属性，这里统一加 crossorigin="anonymous"
    //（需配合上面的 crossOriginLoading，否则该插件找不到作用对象）
    new HtmlWebpackInjectAttributesPlugin({
      // 给生成的 <script>/<link> 统一加 crossorigin="anonymous" 属性
      crossorigin: "anonymous",
    }),
  ],
  optimization: {
    // 开启压缩（生产环境应为 true）
    minimize: true,
    minimizer: [
      // 用 Terser 压缩 JS；parallel 多文件并行压缩以提速。
      // 注意：terser-webpack-plugin v5 内置 terser 5，支持 ES2020+ 语法（可选链、空值合并等），
      // v4 的 cache 选项已移除（webpack 5 自带持久化缓存）。
      new TerserWebpackPlugin({
        parallel: true,
        terserOptions: {
          compress: {
            // 删除所有 console.* 调用，减小体积并避免泄露调试信息
            drop_console: true,
          },
        },
      }),
    ],
  },
});

module.exports = webpackConfig;
