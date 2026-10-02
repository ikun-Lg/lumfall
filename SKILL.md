---
name: lumfall
description: 用 Lumfall 框架开发业务项目的 AI 指南。当你要新建或修改一个 Koa + Vue + Webpack 的业务项目、并希望使用 lumfall 提供的目录自动加载、配置合并、路由与页面构建、安全策略、健康检查等能力时使用。覆盖业务项目初始化、目录约定与挂载点、写 API 与页面的步骤、配置、安全、生命周期、插件、诊断清单、monitoring，以及常见错误自查。
---

# Lumfall 框架使用指南

## 0. 这份文档怎么用

- 你要写的是**业务项目**：框架以 npm 包 `lumfall` 的形式被依赖，业务代码写在业务项目自己的目录里，**不要改框架本体**（`lumfall-core/`、框架自带的 `app/`）。
- 业务项目可以是任意目录、任意名字，下文统一用 `<app-root>` 表示业务项目根目录。框架对你项目叫什么、放在哪里没有假设。本工作区里：
  - `lumfall-basic-project/` — 基础业务项目骨架（最小示例 API + 页面，新建业务项目从这里复制起步）
  - `lumfall-business/` — B 端全栈模板（Dashboard、schema 组件、`model/` 配置的完整参考实现）
  - `lumfall-document/` — 技术文档站模板（对标 VitePress，内置 lumfall 技术文档内容）
  它们都只是参考：换一个目录名、换一套业务代码同样成立，不要把它们当成框架的固定结构。
- 分工：
  - 框架提供：启动器、loader、配置合并、路由、前端构建管线、health 接口、内置 dashboard/health 页面与 dashboard 数据 API、安全策略、生命周期、插件、诊断清单、monitoring
  - 业务提供：`config/`、`app/controller`、`app/service`、`app/router`、`app/router-schema`、`app/middleware`、`app/extend`、`app/pages`、`model/`
- **业务根目录 = 进程的 `process.cwd()`**：启动服务与执行构建都必须在 `<app-root>` 下运行，否则框架会加载错目录。

## 1. 框架是什么

Koa 2.7 + koa-router 7 + koa-nunjucks-2 + koa-bodyparser + Vue 3 + Webpack 5，按目录自动加载，用 `_ENV` 区分环境。

```sh
pnpm add lumfall
```

服务端只需要一个入口文件；前端由 Webpack 按页面入口自动打包，产物给 Koa 渲染。

## 2. 从零搭一个业务项目

```text
<app-root>/
├── server.js                  # 服务端入口：serviceStart()
├── build.js                   # 前端构建入口：frontendBuild()
├── package.json
├── config/
│   ├── config.default.js
│   ├── config.local.js        # 可选
│   ├── config.beta.js         # 可选
│   └── config.prod.js         # 可选
├── model/                     # 可选，Dashboard 的 Model + Project 配置
└── app/
    ├── middleware.js          # 可选，注册全局 Koa 中间件
    ├── middleware/            # 可复用中间件，挂到 app.middlewares
    ├── controller/            # 挂到 app.controllers
    ├── service/               # 挂到 app.services
    ├── router/                # 注册路由
    ├── router-schema/         # API 参数 JSON Schema
    ├── extend/                # 返回值直接挂到 app
    ├── pages/                 # Vue 页面，entry.<name>.js 是入口
    ├── webpack.config.js      # 可选，扩展 Webpack 配置
    └── public/                # 静态文件；构建产物在 app/public/dist/
```

`server.js`：

```js
const { serviceStart } = require("lumfall");

const app = serviceStart({
  name: "my-app",
  homePath: "/view/health",
});

module.exports = app;
```

`build.js`：

```js
const { frontendBuild } = require("lumfall");

frontendBuild(process.env._ENV);
```

`package.json`：

```json
{
  "scripts": {
    "dev": "_ENV=local node server.js",
    "prod": "_ENV=prod node server.js",
    "build:dev": "_ENV=local node build.js",
    "build:prod": "_ENV=prod node build.js",
    "start:prod": "pnpm build:prod && pnpm prod",
    "new-page": "node ./node_modules/lumfall/scripts/generate-page.js"
  }
}
```

`serviceStart(options)` 支持的选项：

| 选项 | 作用 |
| --- | --- |
| `name` | 应用名，渲染页面模板时使用 |
| `homePath` | 完全未命中路由时的 302 兜底目标 |
| `configSchema` | 校验合并后配置的 JSON Schema |
| `lifecycle` | 启动 / 停止 hook |
| `plugins` | 插件描述符数组 |
| `monitoring` | 请求级观测 hook |

注意：

- `homePath` 默认 `/view/health`、`name` 默认 `lumfall`，**部分传参也会套用默认值**（lumfall ≥ 1.1.2）；显式传入会覆盖默认值
- 服务默认监听 `0.0.0.0:3000`，用 `IP` / `PORT` 环境变量覆盖
- `frontendBuild(env)` 只认 `"local"`（启动 Webpack 开发服务，默认 `127.0.0.1:9002`）和 `"prod"`，其他值什么都不做
- 环境用 `_ENV` ∈ `local` / `beta` / `prod`（缺省 `local`），**不是** `NODE_ENV`
- **框架共享依赖对业务代码直接可用**（lumfall ≥ 1.1.1）：框架在 webpack.base 的 `resolve.alias` 维护共享依赖白名单（`sharedDeps`，alias 指向包目录、require.resolve 以框架为上下文），业务页面可直接 import `vue`、`vue-router`、`pinia`、`@arco-design/web-vue`、`@babel/runtime`、`axios`、`lodash`、`moment`、`md5` 及其子路径，无需重复安装，运行时单实例（框架解析优先于业务 node_modules）。要暴露更多库在 `sharedDeps` 加包名；框架没有的库仍需业务 `pnpm add`；旧版本（≤ 1.1.0）+ pnpm 下需显式声明

## 3. 启动流程与加载顺序

`serviceStart()` 内部固定按这个顺序装配，全部同步执行：

```js
app.baseDir = process.cwd();
app.businessPath = path.resolve(app.baseDir, "app");

middlewareLoader(app);      // app.middlewares
routerSchemaLoader(app);    // app.routerSchema
controllerLoader(app);      // app.controllers（类在这里被 new）
serviceLoader(app);         // app.services（类在这里被 new）
configLoader(app);          // app.config
extendLoader(app);          // app.<extendName>

registerPlugins(app, options.plugins);              // app.plugins

require("<lumfall>/app/middleware.js")(app);        // 框架全局中间件
require("<app-root>/app/middleware.js")(app);       // 业务全局中间件

routerLoader(app);                                  // app.router + 兜底 302 路由
app.diagnostics = createDiagnostics(app);           // app.diagnostics.getManifest()

app.server = app.listen(PORT || 3000, IP || "0.0.0.0");
```

由顺序推出三条硬约束：

- `app.config` 在 controller / service 工厂执行期还不存在 → 只在请求阶段读配置
- controller 比 service 先加载 → 不要在 controller 工厂或构造期取 `app.services`（基类的 `this.services` getter 是安全的）
- 任何 loader 遇到非法导出会直接抛错并中断启动，不会静默跳过 → 导出形状必须严格按约定

其他事实：`app.stop()` 返回 Promise（`beforeStop` → 关闭 server → `afterStop`，可重复调用）；框架与业务同名类别的文件都会被加载，页面入口同名时业务覆盖框架。

## 4. 目录约定与挂载点

文件名 / 目录名用 `kebab-case` 或 `snake_case`，加载后转 `camelCase`。

| 业务目录 | 导出约定 | 挂载结果 |
| --- | --- | --- |
| `app/middleware/**/*.js` | `(app) => (ctx, next) => {}` | `app.middlewares.<dir>.<name>` |
| `app/controller/**/*.js` | `(app) => class` | `app.controllers.<dir>.<name>`，启动时 `new` |
| `app/service/**/*.js` | `(app) => class` | `app.services.<dir>.<name>`，启动时 `new` |
| `app/extend/**/*.js` | `(app) => object` | 直接挂到 `app`，例如 `app.logger` |
| `app/router/**/*.js` | `(app, router) => {}` | 注册到 `app.router` |
| `app/router-schema/**/*.js` | schema 对象或 `(app) => map` | 合并进 `app.routerSchema` |
| `app/middleware.js` | `(app) => { app.use(...) }` | 全局中间件注册入口 |

例子：`app/service/user-service.js` → `app.services.userService`；`app/controller/admin/user-list.js` → `app.controllers.admin.userList`。

命名与路径注意：

- 一律用 `path.join` / `path.resolve` 和 `path.sep`，不要硬编码 `/`
- 例外：`glob` v7 的结果始终用 `/` 分隔，拼接前先按 `/` 拆开再 `join(path.sep)`
- 业务路径统一走 `app.businessPath`，不要用 `__dirname`

## 5. 写一个 API：四步

**1）service** — `app/service/<name>.js`，工厂返回 class：

```js
const BaseService = require("lumfall").Service.Base;

module.exports = (app) => class ArticleService extends BaseService(app) {
  async list({ page = 1, size = 20 }) {
    // 这里可以读 this.config / this.app.services
    return { data: [], total: 0, page, size };
  }
};
```

**2）controller** — `app/controller/<name>.js`，工厂返回 class，继承 `Controller.Base`：

```js
const BaseController = require("lumfall").Controller.Base;

module.exports = (app) => class ArticleController extends BaseController(app) {
  async getList(ctx) {
    const { article: articleService } = this.services; // 请求阶段取，安全
    const { data, total } = await articleService.list({
      page: Number(ctx.request.query.page) || 1,
      size: Number(ctx.request.query.pageSize) || 20,
    });
    return this.success(ctx, data, { total });
  }
};
```

基类给你 `this.services`（= `app.services`）、`this.config`（= `app.config`），以及两个统一响应方法：

- `this.success(ctx, data, metadata)` → `{ success: true, data, metadata }`
- `this.fail(ctx, message, code)` → `{ success: false, message, code }`

两者都是 HTTP 200 + 业务码，前端按 `success` / `code` 判断。

**3）router** — `app/router/<name>.js`：

```js
module.exports = (app, router) => {
  const { article: articleController } = app.controllers;
  router.get("/api/article/list", articleController.getList.bind(articleController));
};
```

路由文件只负责把 URL 绑到 controller 方法，可选挂中间件：
`router.post("/api/article", app.middlewares.apiParamsVerify, controller.create.bind(controller))`。

**4）router-schema** — `app/router-schema/<name>.js`，声明参数校验：

```js
module.exports = {
  "/api/article/list": {
    get: {
      query: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1 },
          pageSize: { type: "integer", minimum: 1, maximum: 200 },
        },
      },
    },
  },
};
```

约定与行为：

- key 必须是已注册路由的 path，method 必须全小写且该路由已注册，否则**启动失败**
- 只作用于 `/api/` 开头的请求，用 Ajv（JSON Schema draft-07 风格）校验 `headers` / `body` / `query` / `params`
- 校验失败返回 HTTP 200 + `{ success: false, code: 442, message }`

## 6. 写页面

页面放在 `app/pages/<page-name>/`，入口文件名必须是 `entry.<page-name>.js`：

```sh
# package.json 里配了 new-page 脚本时（见第 2 节）
pnpm new-page project-list            # 生成 entry.project-list.js + project-list.vue
pnpm new-page report --header         # 额外套 HeaderContainer

# 没有配脚本时直接调用框架的脚手架
node ./node_modules/lumfall/scripts/generate-page.js project-list
```

- 页面名必须是 kebab-case，已存在的目录会被拒绝
- 访问路径是 `/view/<page-name>`
- 未发现的页面 → HTTP 404 + code `4041`；页面已发现但没构建出 `app/public/dist/entry.<name>.tpl` → HTTP 503 + code `5031`
- 页面入口和框架自带页面重名时，业务页面生效

::: warning dev / prod 模板互相覆盖
dev 与 prod 构建把页面模板写到同一个 `app/public/dist/entry.<name>.tpl`，dev 构建产出的模板资源 URL 指向 webpack dev server（`127.0.0.1:9002`）。跑过 dev 构建后直接以 prod 模式启动（不重新 `build:prod`）会白屏——切换构建模式后必须重新执行对应构建。
:::

入口文件通常长这样（`$lumfallBoot` 是框架提供的启动器别名）：

```js
import boot from "$lumfallBoot";
import Page from "./project-list.vue";

boot(Page);
```

Webpack 别名可用：`$lumfallPage`、`$lumfallBoot`、`$lumfallCommon`、`$lumfallCurl`、`$lumfallUtils`、`$lumfallWidgets`、`$lumfallStore`、`$lumfallAssert`、`$lumfallHeaderContainer`、`$lumfallSchemaForm`、`$lumfallSchemaSearchBar`、`$lumfallSchemaTable`、`$lumfallSiderContainer`。

需要改 Webpack 时，在 `app/webpack.config.js` 导出配置对象，会与框架配置 `merge.smart` 合并。

构建产物：dev 在 `app/public/dist/dev/`，prod 在 `app/public/dist/prod/`；两种模式都会把页面模板写成 `app/public/dist/entry.<name>.tpl` 供 Koa 渲染。

## 7. 配置

四层浅合并，后面的覆盖前面的同名键：

```text
框架 config.default.js -> 业务 config.default.js -> 框架 config.<env>.js -> 业务 config.<env>.js
```

- 也可以导出 `(app) => object` 工厂，但必须返回普通对象（否则启动失败）
- 不在请求阶段不要读 `app.config`
- 需要强约束时用 `serviceStart({ configSchema })`，不匹配会让启动失败并指出环境、字段路径和原因

```js
// config/config.default.js
module.exports = {
  name: "my-app",
  apiBasePath: "/api",
  security: {
    apiSignature: { enabled: false, maxAgeMs: 600000 },
    projectKey: { enabled: true, headerName: "project_key" },
  },
};
```

## 8. 安全策略

`config.security` 两个开关，框架默认不提供这段配置，等价于「签名关闭 + project key 开启」：

- `apiSignature.enabled = true`：只校验 `/api` 请求，按 `md5(secret + "_" + timestamp)` 比对，客户端用 `ssign`（或 `s_sign`）传签名、`st`（或 `s_t`）传毫秒时间戳；时间差超过 `maxAgeMs` 或时间戳在未来都会失败；不配 `secret` 时退化为默认串 `lumfall`（只适合本地）
- `projectKey`：只作用于 `/api/project/` 路径；`/api/project/model_list`、`/api/project/list` 内置豁免（可用 `freePaths` 追加），其余需要请求头 `project_key`（`headerName` 可改）

错误码：

| 中间件 | 触发条件 | 响应 |
| --- | --- | --- |
| `apiParamsVerify` | router-schema 校验不通过 | code `442` |
| `apiSignVerify` | 缺签名、签名不匹配、时间戳非法或过期 | code `445` |
| `projectHandler` | 缺少 `project_key` | code `446` |

框架全局中间件的注册顺序是 static → nunjucks → bodyParser → errorHandler → monitoring → apiParamsVerify → securityPolicy。业务 `app/middleware.js` 是在框架之后执行 `app.use()` 的，所以业务中间件位于这一串的内层：请求会先经过框架的静态资源、模板、bodyParser、错误处理、参数校验和安全策略，再到业务中间件。

## 9. 生命周期

```js
serviceStart({
  lifecycle: {
    beforeStart(app) {},        // loader 之前
    beforeRouteLoad(app) {},    // 全局中间件之后、路由之前
    afterRouteLoad(app) {},     // 路由之后、listen 之前
    afterStart(app) {},         // listen 之后
    onError(error, app) {},     // 启动期异常，处理后错误仍会抛出
    async beforeStop(app) {},   // app.stop() 的第一步
    async afterStop(app) {},    // server 关闭之后
  },
});
```

- 启动期 hook 必须同步返回，返回 Promise 会让启动失败；异步初始化请在调用 `serviceStart()` 之前完成
- 未知 hook 名或非函数会启动失败
- teardown 用 `await app.stop()`

## 10. 插件

`serviceStart({ plugins })` 适合把「要先于业务中间件/路由初始化」的能力（数据库、缓存、feature 模块）组装起来：

```js
serviceStart({
  plugins: [
    { name: "database", register(app) { return { client: connect() }; } },
    {
      name: "article-module",
      dependencies: ["database"],
      register(app) { return { db: app.plugins.database.client }; },
    },
  ],
});
```

规则：`name` 唯一非空、`register(app)` 同步、返回值必须是普通对象或 `undefined`；依赖会先注册，重复名 / 缺依赖 / 循环依赖 / 异步 register 都会让启动失败；结果挂在 `app.plugins[name]`。注册时机在 loader、config、extend 之后，全局中间件与路由之前。

## 11. 诊断清单与请求观测

**诊断清单**（排查「文件明明写了却没生效」时非常有用）：

```js
const manifest = app.diagnostics.getManifest();
// { version, environment, loaders, routes, pages, healthChecks }
```

`routes` 是已注册路由及方法，`pages` 是发现的页面入口（带 `framework` / `business` 来源），`healthChecks` 是已注册探针。内容可 JSON 序列化，不含凭证与探针函数。

**请求观测**是可选配置，不配就是纯 passthrough：

```js
serviceStart({
  monitoring: {
    traceHeader: "x-trace-id",                  // 可选，默认 x-trace-id
    onRequestStart({ traceId, method, path }) {},
    onRequestEnd({ traceId, method, path, status, durationMs }) {},
    onRequestError({ traceId, method, path, error, durationMs }) {},
  },
});
```

请求头里已有该 header 就复用，否则生成一个并回显同名响应头，trace id 同时写入 `ctx.traceId`。hook 自己抛错只记 warning，不影响响应。monitoring 位于 `errorHandler` 内侧，因此内层异常会先被记录再渲染响应。

## 12. 健康检查

框架自带 `app.health`（extend）和两个接口，业务只需要注册自己的依赖探针：

```js
// app/extend/health-check.js
module.exports = (app) => {
  app.health.register("database", async () => {
    await app.services.db.ping();
  });
  return {};   // extend 的返回值会挂到 app.healthCheck（可返回 {} 占位）
};
```

- `GET /health/live`：只证明进程能响应
- `GET /health/ready`：并行执行已注册探针，全部通过 200，任一抛错 / 超时 / 返回 `false` 则 503；响应只含探针名与状态
- 默认超时 3000ms，可传 `{ timeoutMs }` 调整；`app.health.list()` 可查看已注册项
- `/view/health` 是人工查看状态的框架页面

## 13. Dashboard Model 配置（可选）

`model/` 放在业务项目根目录（不在 `app/` 里），框架在服务加载阶段扫描 `process.cwd()/model`。这是框架的**声明式 Dashboard DSL**：Model + Project 两层配置（按 key 深度合并）声明菜单与页面形态，schema 模块用一份字段 schema 驱动搜索栏/表格/表单/详情四个视图。**完整编写规则以框架包内两份文档为准**：

- `model/docs/dsl-guide.md` — DSL 编写规则（菜单项、moduleType 四形态、schema 模块、按钮与动态表单、接口契约、合并规则、注意事项）
- `model/docs/dashboard-model.md` — Model 字段级速查

```text
model/
└── commerce/                # 目录名 = Model key
    ├── model.js             # 公共模型：菜单骨架、显示名
    └── project/
        └── store-a.js       # 文件名 = Project key
```

- Project 与 Model 的菜单按 `key` 深度合并：同 key 覆盖字段，新 key 追加到末尾；数组元素必须带 `key`
- 扫描器自动注入 `key`、`modelKey`，不要手写
- `homePage` 是 Dashboard 内的路由，不含 `/view/dashboard` 前缀
- 内置数据接口：`GET /api/project/model_list`、`GET /api/project/list?projectKey=`、`GET /api/project?projectKey=`
- schema 模块的后端接口有固定契约：`api` 是基址，列表为 `GET <api>/list`，增删改走 `POST/PUT/DELETE <api>`
- 陷阱：路径里含 `index.js` 的文件会被扫描器跳过；sider 子菜单 custom 的 `path` 必须以 `/` 开头

菜单模块类型：`custom`、`iframe`、`sider`、`schema`；分组菜单用 `menuType: "group"` + `subMenu`。

**DSL 支持业务侧扩展**：在业务项目 `app/pages/` 下创建与框架同名的四个配置文件（搜索控件注册表 `widgets/schema-search-bar/complex-view/search-item-config.js`、表单控件注册表 `widgets/schema-form/form-item-config.js`、schema-view 动态组件注册表 `dashboard/complex-view/schema-view/components/component-config.js`、custom 路由 `dashboard/router.js`），框架经 webpack 别名（`$business*`）把业务注册表与默认注册表展开合并——同名覆盖、新名追加；文件不存在则用空模块，不影响默认能力。扩展契约见 lumfall-document 文档「扩展 DSL」篇。

## 14. 常见错误自查

1. 从错误的目录启动 / 构建 → 业务根目录必须是 `process.cwd()`，即 `<app-root>`
2. 用 `__dirname` 当业务路径 → 用 `app.businessPath`
3. 在 loader 工厂执行期读 `app.config` / `app.services` → 延迟到请求阶段，或 `this.services` getter
4. 用文件名访问挂载点 → `app.middlewares.apiParamsVerify` 而不是 `api-params-verify`
5. controller / service 工厂返回对象而不是 class → 启动会直接失败
6. `Controller.Base` / `Service.Base` 是工厂函数 → 必须 `Controller.Base(app)` 调用后再 `extends`，直接 `extends Controller.Base` 报 "not a constructor"
7. router-schema 的 path 写错或 method 写成大写 → 启动失败
8. 以为 `/view/<未知页面>` 会跳首页 → 实际是 404 `4041`（模板没构建则是 503 `5031`）
9. 忘了 `_ENV`，用 `NODE_ENV` 切环境 → 配置不会生效
10. `frontendBuild("beta")` 不做事 → 只支持 `local` / `prod`
11. 把业务代码写进框架仓库 → 业务代码写进 `<app-root>`，框架只作为依赖
12. 业务页面 import `vue` / `@arco-design/web-vue` 报 `Module not found` → 用 lumfall ≥ 1.1.1（`resolve.alias` 白名单已暴露共享依赖，见第 2 节）；旧版本需在业务 `package.json` 显式声明
13. 跑过 dev 构建后直接 prod 启动页面白屏 → dev/prod 模板同路径覆盖，重新 `_ENV=prod node build.js` 即可

## 15. 命令速查

| 场景 | 命令（在 `<app-root>` 下执行） |
| --- | --- |
| 本地开发（前端 dev server + 服务） | `pnpm build:dev` 与 `_ENV=local node server.js`，或用 concurrently 并行 |
| 生产构建 + 启动 | `pnpm build:prod && _ENV=prod node server.js` |
| 生成页面 | `node ./node_modules/lumfall/scripts/generate-page.js <name> [--header]` |
| 排查挂载问题 | 启动后读 `app.diagnostics.getManifest()` 的 `routes` / `pages` |

## 16. 参考实现（可选）

本工作区同级有三个可直接参考/复用的项目：

- `lumfall-basic-project/` — 基础业务项目骨架：`server.js` / `build.js` / `config/` / `app/` 全套目录约定 + 一套最小示例（`GET /api/demo/info` 读配置、`GET /api/demo/note/list` 分页、`POST /api/demo/note` 创建）和一个调用接口的示例页面（`/view/home`）。新建业务项目直接复制它起步。
- `lumfall-business/` — B 端全栈模板：演示 `model/`（Dashboard 的 Model + Project 配置）、schema 表格 / 表单 / 搜索栏等内置组件的落地、`app/pages/dashboard/router.js` 自定义路由等，可以直接看它怎么组织业务代码。
- `lumfall-document/` — 技术文档站模板（对标 VitePress）：`docs/` 下放 markdown，`app/pages/docs/docs-config.js` 配置导航 / 侧栏 / 首页，内置目录（TOC）、站内搜索（Ctrl/Cmd+K）、代码高亮复制、亮暗主题，自带 lumfall 技术文档内容。

它们都只是参考：换一个目录名、换一套业务代码同样成立，不要把它们当成框架的固定结构。
