const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const { VueLoaderPlugin } = require("vue-loader");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const glob = require("glob");
const merge = require("webpack-merge");

const pageEntries = {};
const HtmlWebpackPluginList = [];

const pageDirectories = Array.from(
  new Set([
    path.resolve(__dirname, "../../pages"),
    path.resolve(process.cwd(), "app/pages"),
  ]),
).filter((directory) => fs.existsSync(directory));

// Business pages are scanned after framework pages and can replace an entry with the same name.
pageDirectories.forEach((directory) => {
  glob.sync("**/entry.*.js", { cwd: directory }).forEach((relativePath) => {
    const entryName = path.basename(relativePath, ".js");
    pageEntries[entryName] = path.resolve(directory, relativePath);
  });
});

Object.entries(pageEntries).forEach(([entryName, file]) => {
  HtmlWebpackPluginList.push(
    new HtmlWebpackPlugin({
      filename: path.resolve(
        process.cwd(),
        "./app/public/dist/",
        `${entryName}.tpl`,
      ),
      template: path.resolve(__dirname, "../../view/entry.tpl"),
      chunks: [entryName],
      // 模板里的 inline script 含 nunjucks 占位符 {{ name }}，交给后端渲染前不是合法 JS，
      // 因此必须关掉 inline JS 压缩，否则 production 构建会被 terser 解析报错。
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        minifyJS: false,
      },
    }),
  );
});

//  laod business webpack config
let businessWebpackConfig = {};
try {
  businessWebpackConfig = require(`${process.cwd()}/app/webpack.config.js`);
} catch (e) {}

/**
 *  webpack basic config
 */
module.exports = merge.smart(
  {
    // 打包入口：通过 glob 自动扫描 app/pages/**/entry.*.js 得到（见上方 pageEntries），
    // 删掉某个页面目录后无需手动改动这里。注意：下方不能有写死的 entry，否则会覆盖动态结果。
    entry: pageEntries,

    // 模块处理规则：配置不同文件类型对应的 loader（如 vue / js / less 等）
    module: {
      rules: [
        {
          test: /\.vue$/,
          use: {
            loader: require.resolve("vue-loader"),
          },
        },
        {
          test: /\.js$/,
          include: pageDirectories,
          use: {
            loader: require.resolve("babel-loader"),
          },
        },
        {
          test: /\.(png|jpe?g|gif)(\?.+)?$/,
          use: {
            loader: require.resolve("url-loader"),
            options: {
              limit: 300,
              esModule: false,
            },
          },
        },
        {
          test: /\.css$/,
          use: [require.resolve("style-loader"), require.resolve("css-loader")],
        },
        {
          test: /\.less$/,
          use: [
            require.resolve("style-loader"),
            require.resolve("css-loader"),
            require.resolve("less-loader"),
          ],
        },
        {
          test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
          use: [require.resolve("file-loader")],
        },
      ],
    },

    // 输出配置：构建产物的输出路径、文件名、公共路径 publicPath 等
    output: {},

    // 解析配置：设置模块解析规则，如别名 alias、扩展名 extensions、模块目录等
    resolve: {
      extensions: [".js", ".vue", ".less", ".css"],
      modules: [
        path.resolve(__dirname, "../../../node_modules"),
        "node_modules",
      ],
      alias: (() => {
        const businessDashboardRouterConfigPath = path.resolve(
          process.cwd(),
          "app/pages/dashboard/router.js",
        );
        const blankModulePath = path.resolve(__dirname, "../libs/blank.js");

        const businessComponentConfig = path.resolve(
          process.cwd(),
          "./app/pages/dashboard/complex-view/schema-view/components/component-config.js",
        );

        const businessFormItemConfig = path.resolve(
          process.cwd(),
          "./app/pages/widgets/schema-form/form-item-config.js",
        );

        const businessSearchItemConfig = path.resolve(
          process.cwd(),
          "./app/pages/widgets/schema-search-bar/complex-view/search-item-config.js",
        );

        return {
          vue: require.resolve("vue"),
          $lumfallPage: path.resolve(__dirname, "../../pages"),
          $lumfallBoot: path.resolve(__dirname, "../../pages/boot.js"),
          $lumfallCommon: path.resolve(__dirname, "../../pages/common"),
          $lumfallCurl: path.resolve(__dirname, "../../pages/common/curl.js"),
          $lumfallUtils: path.resolve(__dirname, "../../pages/common/utils.js"),
          $lumfallWidgets: path.resolve(__dirname, "../../pages/widgets"),
          $lumfallStore: path.resolve(__dirname, "../../pages/store"),
          $lumfallAssert: path.resolve(__dirname, "../../pages/assert"),
          $businessDashboardRouterConfig: fs.existsSync(
            businessDashboardRouterConfigPath,
          )
            ? businessDashboardRouterConfigPath
            : blankModulePath,
          $businessComponentConfig: fs.existsSync(businessComponentConfig)
            ? businessComponentConfig
            : blankModulePath,
          $businessFormItemConfig: fs.existsSync(businessFormItemConfig)
            ? businessFormItemConfig
            : blankModulePath,
          $businessSearchItemConfig: fs.existsSync(businessSearchItemConfig)
            ? businessSearchItemConfig
            : blankModulePath,
          // 业务组件
          $lumfallHeaderContainer: path.resolve(
            __dirname,
            "../../pages/widgets/header-container/header-container.vue",
          ),
          $lumfallSchemaForm: path.resolve(
            __dirname,
            "../../pages/widgets/schema-form/schema-form.vue",
          ),
          $lumfallSchemaSearchBar: path.resolve(
            __dirname,
            "../../pages/widgets/schema-search-bar/schema-search-bar.vue",
          ),
          $lumfallSchemaTable: path.resolve(
            __dirname,
            "../../pages/widgets/schema-table/schema-table.vue",
          ),
          $lumfallSiderContainer: path.resolve(
            __dirname,
            "../../pages/widgets/sider-container/sider-container.vue",
          ),
        };
      })(),
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
        axios: "axios",
        _: "lodash",
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
            test: /[\\/]common|widgets[\\/]/,
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
      runtimeChunk: true,
    },
  },
  businessWebpackConfig,
);
