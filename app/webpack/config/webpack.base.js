const path = require("path");
const webpack = require("webpack");
const { VueLoaderPlugin } = require("vue-loader");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const glob = require("glob");

const pageEntries = {};
const HtmlWebpackPluginList = [];

// get app/pages all entry files(entry.xx.js)
const entryList = path.resolve(process.cwd(), "./app/pages/**/entry.*.js");
glob.sync(entryList).forEach((file) => {
  const entryName = path.basename(file, ".js");
  pageEntries[entryName] = file;
  HtmlWebpackPluginList.push(
    new HtmlWebpackPlugin({
      filename: path.resolve(
        process.cwd(),
        "./app/public/dist/",
        `${entryName}.tpl`,
      ),
      template: path.resolve(process.cwd(), "./app/view/entry.tpl"),
      chunks: [entryName],
    }),
  );
});

/**
 *  webpack basic config
 */
module.exports = {
  // 打包入口：指定从哪些文件开始构建依赖图，可以是字符串、数组或对象（多入口）
  entry: {
    "entry.page1": "./app/pages/page1/entry.page1.js",
    "entry.page2": "./app/pages/page2/entry.page2.js",
  },

  // 模块处理规则：配置不同文件类型对应的 loader（如 vue / js / less 等）
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: {
          loader: "vue-loader",
        },
      },
      {
        test: /\.js$/,
        include: [path.resolve(process.cwd(), "./app/pages")],
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.(png|jpe?g|gif)(\?.+)?$/,
        use: {
          loader: "url-loader",
          options: {
            limit: 300,
            esModule: false,
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.less$/,
        use: ["style-loader", "css-loader", "less-loader"],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
        use: ["file-loader"],
      },
    ],
  },

  // 输出配置：构建产物的输出路径、文件名、公共路径 publicPath 等
  output: {},

  // 解析配置：设置模块解析规则，如别名 alias、扩展名 extensions、模块目录等
  resolve: {
    extensions: [".js", ".vue", ".less", ".css"],
    alias: {
      $page: path.resolve(process.cwd(), "./app/pages"),
      $common: path.resolve(process.cwd(), "./app/pages/common"),
      $widgets: path.resolve(process.cwd(), "./app/pages/common"),
      store: path.resolve(process.cwd(), "./app/pages/store"),
    },
  },

  // 插件列表：用于执行范围更广的任务（如 html 生成、代码分割、环境变量注入等）
  plugins: [
    // VueLoaderPlugin（vue-loader@15+ 必需）。它会读取上面的 module.rules，
    // 把其中的 loader 规则“克隆”一份并分别应用到 .vue 单文件组件的
    // <template>/<script>/<style> 等语言块上：例如 <style lang="less">
    // 会走 less-loader → css-loader → style-loader，<script> 会走 babel-loader。
    // 没有它，.vue 内部的模板/脚本/样式不会被分别编译，构建会直接报错。
    new VueLoaderPlugin(),
    // 把第三方库暴露到window下
    new webpack.ProvidePlugin({
      Vue: "vue",
    }),
    // 定义全局变量
    new webpack.DefinePlugin({
      // 是否开启 Vue 3 的 Options API（data/methods/computed 等选项式写法）支持。
      // true=支持; false=仅支持 Composition API，可减小打包体积。
      __VUE_OPTIONS_API__: "true",
      // 生产环境是否启用 Vue Devtools。生产环境设为 false 既避免暴露调试信息，也减小体积。
      __VUE_PROD_DEVTOOLS__: "false",
      // 生产环境下 SSR hydration 不匹配时是否输出详细警告。false=生产关掉以提升性能。
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
    }),
    // 构造最终渲染页面的模板
    ...HtmlWebpackPluginList,
  ],

  // 优化项：控制代码压缩、 Tree-Shaking、分包 splitChunks 等构建优化策略
  optimization: {
    /**
     * 把js文件打包成3中类型
     * 1. vendor: 第三方 lib 库，基本不会改动，除非依赖版本升级
     * 2. common: 业务组件代码的公共部分抽取出来，改动较少
     * 3. entry.{page}: 不同页面 entry 里的业务组件代码的差异部分，会经常改动
     * 目的：把改动和引用频率不一样的 js 区分出来，以达到更好利用浏览器缓存的效果
     */
    splitChunks: {
      // 对哪些 chunk 进行代码分割：
      // "all" = 同时处理入口(initial)与按需(async)加载的 chunk；
      // "initial" 只处理入口 chunk，"async" 只处理动态 import 的 chunk。
      chunks: "all",
      // 按需加载时，单个入口最多能并行请求的异步 chunk 数量上限（超出部分会合并）。
      maxAsyncRequests: 10,
      // 页面首屏（入口）加载时，最多能并行请求的内联 chunk 数量上限。
      maxInitialRequests: 10,
      // 缓存组：把满足条件（test/minChunks/minSize）的模块归类到同一个 chunk，
      // 从而把“很少改动/被多处引用”的代码从业务代码里拆出来，利于浏览器长缓存。
      cacheGroups: {
        vendor: {
          // 只命中 node_modules 下的第三方依赖。
          test: /[\\/]node_modules[\\/]/,
          // 拆分出的 chunk 名称固定为 "vendor"。
          name: "vendor",
          // 优先级，数值越大越优先；此处 priority: 20 高于 common 的 10，
          // 确保所有 node_modules（含被多处引用的第三方库）都进入 vendor，
          // 而非被 common 抢走，从而让 vendor 保持“几乎不变”的稳定长缓存。
          priority: 20,
          // 忽略 minSize/minChunks 等下限限制，强制把符合条件的模块打进 vendor。
          enforce: true,
          // 复用已存在的 chunk，避免重复打包相同模块（原拼写 requestExistingChunk 无效，已修正）。
          reuseExistingChunk: true,
        },
        common: {
          // 拆分出的 chunk 名称固定为 "common"。
          name: "common",
          // 被至少 2 个 chunk 引用的模块才进入 common（提升公共复用率）。
          minChunks: 2,
          // 体积达到 1 字节即拆分（几乎“满足条件就拆”）；生产可酌情调大以减少碎片。
          minSize: 1,
          // 优先级 10 < vendor 的 20，因此同时命中两者的模块（如共享第三方库）
          // 优先进 vendor；common 只收共享业务代码，保证自身不被第三方变动污染。
          priority: 10,
          // 同上，复用已存在的 chunk（原拼写 requestExistingChunk 无效，已修正）。
          reuseExistingChunk: true,
        },
      },
    },
    // runtime的代码单独打包成js
    runtimeChunk:true
  },
};
