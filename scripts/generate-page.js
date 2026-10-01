const fs = require("fs");
const path = require("path");

const PAGE_NAME_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function generatePage({ rootDir = process.cwd(), name, withHeader = false }) {
  if (typeof name !== "string" || !PAGE_NAME_PATTERN.test(name)) {
    throw new Error(
      "page name must use lowercase kebab-case and start with a letter",
    );
  }

  const pageDirectory = path.resolve(rootDir, "app", "pages", name);
  if (fs.existsSync(pageDirectory)) {
    throw new Error(`page directory already exists: ${pageDirectory}`);
  }

  const title = name
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
  const entryPath = path.join(pageDirectory, `entry.${name}.js`);
  const componentPath = path.join(pageDirectory, `${name}.vue`);

  fs.mkdirSync(pageDirectory, { recursive: true });
  fs.writeFileSync(entryPath, createEntry(name));
  fs.writeFileSync(componentPath, createComponent(name, title, withHeader));

  return { pageDirectory, entryPath, componentPath };
}

function createEntry(name) {
  return `import boot from "$lumfallBoot";\nimport Page from "./${name}.vue";\n\nboot(Page);\n`;
}

function createComponent(name, title, withHeader) {
  if (withHeader) {
    return `<template>\n  <HeaderContainer title="${title}">\n    <template #main-content>\n      <main class="${name}-page">\n        <h1>${title}</h1>\n      </main>\n    </template>\n  </HeaderContainer>\n</template>\n\n<script setup>\nimport HeaderContainer from "$lumfallHeaderContainer";\n</script>\n`;
  }

  return `<template>\n  <main class="${name}-page">\n    <h1>${title}</h1>\n  </main>\n</template>\n`;
}

function main(args = process.argv.slice(2)) {
  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: pnpm new-page <page-name> [--header]");
    return;
  }

  const positionalArgs = args.filter((argument) => argument !== "--header");
  const unknownOptions = args.filter(
    (argument) => argument.startsWith("-") && argument !== "--header",
  );
  if (unknownOptions.length > 0 || positionalArgs.length !== 1) {
    throw new Error("Usage: pnpm new-page <page-name> [--header]");
  }

  const result = generatePage({
    name: positionalArgs[0],
    withHeader: args.includes("--header"),
  });
  console.log(`Created page "${positionalArgs[0]}" at ${result.pageDirectory}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`[new-page] ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { generatePage, main };