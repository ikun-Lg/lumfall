const webpack = require("webpack");
const webProdConfig = require("./config/webpack.prod.js");

console.log(`\nbuilding\n`);

webpack(webProdConfig, (err, stats) => {
  if (err) {
    throw err;
  }
  process.stdout.write(
    `${stats.toString({
      color: true, // 终端输出是否带颜色高亮
      modules: false, // 不展示每个 module 的构建信息（精简输出）
      children: false, // 不展示子编译器（如 loader 内部）的构建信息
      chunks: false, // 不展示 chunk 体积/组成等详情
      chunkModules: true, // 展示 chunk 内包含的 modules（配合 chunks:false 时仍给出模块清单）
    })}\n`,
  );
});
