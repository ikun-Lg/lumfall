#!/usr/bin/env node
/**
 * 页面脚手架：快速创建一个新页面
 *
 * 用法：
 *   pnpm gen <page-name>          # 基础模板（空页面）
 *   pnpm gen <page-name> --header # 带 HeaderContainer 布局的模板
 *
 * 示例：
 *   pnpm gen project-list --header
 *   pnpm gen dashboard
 *
 * 会在 app/pages/<page-name>/ 下自动生成：
 *   - entry.<page-name>.js   （webpack 入口，boot 启动）
 *   - <page-name>.vue        （页面组件）
 *
 * webpack 会自动扫描 entry.*.js，无需手动注册路由。
 * 访问地址：/view/<page-name>
 */
const fs = require("fs");
const path = require("path");

const PAGES_DIR = path.resolve(process.cwd(), "app/pages");
const ENTRY_TPL = path.resolve(process.cwd(), "app/view/entry.tpl");

function toPascalCase(name) {
  return name
    .split(/[-_]/)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join("");
}

function buildVueTemplate(pageName, withHeader) {
  const componentName = toPascalCase(pageName);
  const title = pageName.replace(/[-_]/g, " ");

  if (withHeader) {
    return `<template>
    <HeaderContainer title="${title}">
        <template #main-content>
            <div>${title}</div>
        </template>
    </HeaderContainer>
</template>

<script setup>
import HeaderContainer from "$sunsetHeaderContainer";
</script>

<style lang="less" scoped>
</style>
`;
  }

  return `<template>
    <div class="${pageName}">
        ${title}
    </div>
</template>

<script setup>
</script>

<style lang="less" scoped>
.${pageName} {
    width: 100%;
    height: 100vh;
}
</style>
`;
}

function main() {
  const args = process.argv.slice(2);
  const withHeader = args.includes("--header") || args.includes("-h");
  const pageName = args.find((a) => !a.startsWith("-"));

  if (!pageName) {
    console.error("❌ 缺少页面名称！用法: pnpm gen <page-name> [--header]");
    console.error("   示例: pnpm gen dashboard --header");
    process.exit(1);
  }

  // 校验名称合法性（仅允许小写字母、数字、中划线）
  if (!/^[a-z][a-z0-9-]*$/.test(pageName)) {
    console.error(
      `❌ 页面名称 "${pageName}" 不合法，只能使用小写字母、数字和中划线，且以字母开头`,
    );
    process.exit(1);
  }

  const pageDir = path.join(PAGES_DIR, pageName);
  const entryFile = path.join(pageDir, `entry.${pageName}.js`);
  const vueFile = path.join(pageDir, `${pageName}.vue`);

  // 检查页面是否已存在
  if (fs.existsSync(pageDir)) {
    console.error(`❌ 页面 "${pageName}" 已存在: ${pageDir}`);
    process.exit(1);
  }

  // 检查 entry.tpl 模板文件是否存在
  if (!fs.existsSync(ENTRY_TPL)) {
    console.error(`❌ 找不到模板文件: ${ENTRY_TPL}`);
    process.exit(1);
  }

  // 创建目录
  fs.mkdirSync(pageDir, { recursive: true });

  // 生成 entry.<page-name>.js
  const entryContent = `import boot from "$sunsetBoot";
import ${toPascalCase(pageName)} from "./${pageName}.vue";

boot(${toPascalCase(pageName)});
`;
  fs.writeFileSync(entryFile, entryContent);

  // 生成 <page-name>.vue
  const vueContent = buildVueTemplate(pageName, withHeader);
  fs.writeFileSync(vueFile, vueContent);

  console.log("✅ 页面创建成功！");
  console.log(`   📁 ${pageDir}/`);
  console.log(`   📄 entry.${pageName}.js`);
  console.log(`   📄 ${pageName}.vue`);
  console.log("");
  console.log(`   🌐 访问地址: /view/${pageName}`);
  console.log(
    `   💡 webpack 会自动扫描 entry.*.js，无需手动注册`,
  );
}

main();
