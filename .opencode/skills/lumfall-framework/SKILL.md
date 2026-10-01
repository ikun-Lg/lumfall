---
name: lumfall-framework
description: Lumfall 全栈框架(Koa)的写法规约与用法指南。Use when writing, modifying, or reviewing any code in this repo: app/ 下的 controller、service、middleware、extend、router、router-schema、config、pages/ 前端 Vue 代码，或 lumfall-core/ 框架本体与 loader、model/ 下的 Dashboard DSL。Covers loader 工厂模式、kebab/snake 转 camelCase 命名、动态挂载到 app、loader 加载顺序、_ENV 环境、JSON-Schema 参数校验、project_key 鉴权、错误码约定、前端构建链路、Dashboard DSL 结构，防止因不熟悉框架约定而产生的用法错误。
---

# Lumfall 全栈框架写法规约

Koa 2 全栈框架,核心是 **loader 动态装配**:启动时按固定顺序扫描目录、按文件名约定把模块实例挂到 `app` 上,业务代码通过 `app.xxx` 或 `this.xxx` 访问,不需要手动 `require` 注册。写业务代码前必须先理解这套约定,否则很容易写出"文件存在但框架没加载/挂载位置不对"的隐性 bug。

## 1. 项目布局

```
├── index.js                # 编程式入口:导出 frontendBuild(env)与 serviceStart(options,缺省 { homePath:"/view/health", name:"lumfall" })(见 §7.13)
├── lumfall-core/            # 框架核心(业务代码不要改)
│   ├── index.js            # 启动引导,编排 loader 顺序
│   ├── env.js              # 环境工具 (isLocal/isBeta/isProd/get)
│   └── loader/             # 每个 loader 一个文件,统一 loader(app) 同步调用
├── app/                    # 业务代码根目录(businessPath = process.cwd()/app)
│   ├── controller/         # 控制器(loader 挂载到 app.controllers):base/project/view/business/health
│   ├── service/            # 业务服务(挂载到 app.services):base/business
│   ├── middleware/         # 中间件(挂载到 app.middlewares):api-sign-verify/error-handler/api-params-verify/project-handler
│   ├── middleware.js       # 全局中间件注册(唯一手动 use 的地方)
│   ├── extend/             # 扩展,挂到 app 顶层(如 app.logger、app.health 健康探针注册器)
│   ├── router/             # 路由注册(工厂签名 (app, router)):view/business/health
│   ├── router-schema/      # API 参数 JSON-Schema:business
│   ├── view/               # 页面模板(nunjucks 渲染入口 entry.tpl,服务端注入 window.__LUMFALL__)
│   ├── pages/              # 前端 Vue 源码(见 §9:dashboard/、health/、widgets/、store/、common/)
│   ├── webpack/            # 前端构建配置(webpack base/dev/prod);业务仓库可另放 app/webpack.config.js 定制(见 §9.2)
│   └── public/             # 静态资源;webpack 产物在 public/dist/,静态文件在 public/static/
├── model/                  # Dashboard DSL 容器(见 §10):当前仅 index.js(扫描/合并引擎)与 docs/,Model/Project 示例文件已在 82ef279 清空
│   └── docs/               # DSL 权威文档:dsl-guide.md(编写规则)、dashboard-model.md(字段级速查)
├── docs/                   # docs/health-check.md(健康检查与探针注册,权威文档)
├── config/                 # 框架层配置(config.default.js;beta/prod 已删),与业务层 config 双层合并(见 §5.7)
├── test/                   # mocha 测试:test/controller/project.test.js + test/health.test.js
└── scripts/generate-page.js # 页面脚手架(pnpm new-page <name> [--header])
```

## 2. 加载顺序(最重要的约束)

`lumfall-core/index.js` 中 loader 的固定执行顺序:

```
middleware → router-schema → controller → service → config → extend → router
```

### 加载来源:框架内置目录 + 业务目录(双目录装配)

自 82ef279 升级后,lumfall-core 是可独立复用的框架,所有 loader 都是**双目录装配**:

- controller/service/middleware/extend/router-schema:先扫描**框架内置目录**(`<框架根>/app/xxx`,loader 内用 `__dirname` 解析,与 cwd 无关),再扫描**业务目录**(`app.businessPath/xxx`);两者 resolve 为同一路径时自动去重(本仓库二者相同,只加载一份)。
- router:**先注册业务路由,再注册框架路由**(路径不同才加载框架侧;目录不存在则跳过)。
- config:**双层合并**,见 §5.7。
- 全局 middleware.js 也是双份:先加载框架 `app/middleware.js`,业务侧存在**且路径不同**才再加载一份。

由此推导出的硬性规则:

- **middleware 在 config 之前加载** → 中间件工厂里**不要读 `app.config`**。配置只能在请求时(闭包内)访问。
- **service 在 controller 之后加载** → controller 构造函数里**不要访问 `this.services`**。参见 `app/controller/base.js` 的写法:用 getter 延迟解析。
- **extend 在 config/service 之后加载** → extend 工厂执行时**可以**安全读 `app.config` / `app.services`(health 探针注册正依赖此顺序,见 §5.4 与 docs/health-check.md)。
- **router 最后加载** → 此时 `app.controllers` 已就绪,路由文件里可以安全解构 `app.controllers`。
- 每个 loader 的产物依次挂到同一个 `app` 对象上,后加载的 loader 能拿到前一个的全部产物。

## 3. 每个 loader 都是工厂函数

所有 loader(含业务目录里的模块)统一导出工厂:`module.exports = (app) => {...}`,启动时由 loader 调用并拿到 Koa 实例。业务目录里被加载的模块也必须遵守这个工厂签名。

## 4. 命名约定:kebab/snake → camelCase

文件名/目录名用 kebab-case 或 snake_case,加载后自动转 camelCase 挂到 app:

| 文件/目录 | 挂载位置 |
|---|---|
| `app/controller/custom-module/custom-controller.js` | `app.controllers.customModule.customController` |
| `app/service/user-service.js` | `app.services.userService` |
| `app/middleware/api-params-verify.js` | `app.middlewares.apiParamsVerify` |
| `app/extend/custom-extend.js` | `app.customExtend`(extend 例外:直接挂 app 顶层,不包一层) |

转换规则(`lumfall-core/loader/utils.js` 的 `camelCase`):去掉 `-`/`_` 后紧跟的小写字母转大写。

**坑**:业务代码里用 `app.controllers.xxx` / `this.services.xxx` 时必须用 camelCase,用文件名原名会拿不到。

## 5. 各目录写法规约

### 5.1 controller (`app/controller/`)

```js
module.exports = (app) => {
  const BaseController = require("./base")(app); // 基类也是工厂
  return class ProjectController extends BaseController {
    async getList(ctx) {
      const { project: projectService } = this.services; // 延迟 getter,请求时才解析
      const res = await projectService.getList();
      this.success(ctx, res); // 统一响应结构
    }
  };
};
```

- 必须返回 **class**(loader 检查工厂返回值必须是 function,否则抛 `Controller xxx is not a class`;loader 会 `new controller(app)`)。
- 推荐继承 `app/controller/base.js` 以获得:统一响应 `this.success(ctx, data, metadata)` / `this.fail(ctx, message, code)`,以及延迟解析的 getter `this.services` / `this.config`(因 service 加载晚于 controller,构造期不能碰,getter 在请求时才取值)。
- **不继承基类也可以**:loader 只要求返回 class,方法签名仍是 `async method(ctx)`。此时自行处理响应(直接写 `ctx.body`)或 `ctx.render(...)`,且需自己管理 services/config 的访问(用 `this.app.services` / `this.app.config`)。参考 `app/controller/view.js`(独立 class,靠 `ctx.render` 渲染模板)与 `app/controller/health.js`(独立 class,live/ready 直接写 `ctx.status`/`ctx.body`)。
- 方法体从 `ctx` 取 `params/query/body/headers`。

### 5.2 service (`app/service/`)

```js
module.exports = (app) => {
  const BaseService = require("./base")(app);
  return class ProjectService extends BaseService {
    async getList() { ... }
  };
};
```

- 同样必须返回 class,同样继承基类。基类提供 `this.config` getter。

### 5.3 middleware (`app/middleware/`)

```js
module.exports = (app) => (ctx, next) => {
  // 工厂返回真正的 Koa 中间件函数
};
```

- **工厂返回函数,不是 class**(与 controller/service 不同)。
- 加载器会调用 `middleware(app)` 得到中间件并挂到 `app.middlewares.xxx`。
- 注意区分两个概念:
  - `app/middleware/` 目录下的文件 → 挂到 `app.middlewares.xxx`,供手动 `app.use` 或业务调用。
  - `app/middleware.js`(根文件)→ 全局中间件的**注册入口**,loader 执行完目录加载后单独加载它,在这里 `app.use(...)` 决定中间件的先后顺序。

### 5.4 extend (`app/extend/`)

```js
module.exports = (app) => {
  // 返回任意对象,直接挂到 app 顶层,如 app.logger
};
```

- 工厂返回的值直接挂到 `app.<camelCase文件名>`,**不包一层**,且**只取文件名 basename,忽略子目录**(不像 controller/service/middleware 会按目录嵌套)。所以 `app/extend/logger.js` 和 `app/extend/foo/logger.js` 都会挂到 `app.logger`,后者会覆盖前者。
- 若导出非函数(`module.exports` 不是工厂),loader 会 warn 并跳过(`[extend] skip ${name}: module.exports is not a function`),不会挂载。
- 若文件名与 app 已有属性冲突(如 `config`、`controllers`),会被跳过并 warn,不会覆盖框架内部属性。
- 示例:`app/extend/logger.js` → `app.logger`(local 下是 console,beta/prod 下是 log4js,含 `info/error` 等方法)。
- **健康探针注册**(`app/extend/health.js` → `app.health`):`register(name, probe, { timeoutMs = 3000 })` 注册依赖探针(返回解绑函数;重名抛 `TypeError`/`Error`),`readiness()` 并行执行全部探针——探针抛错、超时或返回 `false` 都判 error,其余视为成功,且**不向外泄露错误详情**。业务在自己的 extend 里调 `app.health.register("database", () => app.services.db.ping())`(extend 加载期 services 已就绪);liveness/readiness 接口、K8s 编排建议见 **docs/health-check.md**。

### 5.5 router (`app/router/`)

```js
module.exports = (app, router) => {
  const { project: projectController } = app.controllers;
  router.get("/api/project/list", projectController.getList.bind(projectController));
};
```

- 工厂签名是 `(app, router)`,多一个 `router` 参数(KoaRouter 实例)。
- 路由文件里解构 `app.controllers`,**必须 `.bind(controller)`** 否则方法里 `this` 丢失。
- 全部路由文件注册完后,router loader 会加一条兜底路由:未匹配路径 `302` 跳转 `app.options.homePath`(错误处理器里的模板未找到跳转同样用 `homePath`,两处已统一)。

### 5.6 router-schema (`app/router-schema/`)

```js
module.exports = {
  "/api/project/list": {
    get: {
      query: { type: "object", properties: { projectKey: { type: "string" } }, required: ["projectKey"] },
      body: {},
      params: {},
    },
  },
};
```

- 导出 `{ '${path}': { [method]: { headers?, body?, query?, params? } } }` 的映射,或工厂 `(app) => map`。
- **method 键必须小写**:`api-params-verify` 内部用 `method.toLowerCase()` 匹配(如写成 `GET` 会匹配不到而跳过校验)。示例里用 `get:` 正确。
- 配合 `app/middleware/api-params-verify.js` 用 ajv 校验,校验失败返回 `code: 442`。
- 只有 `path` 包含 `/api` 的请求才会走校验。
- 可校验四部分:headers / body / query / params(见 `api-params-verify.js` 的取值来源)。

### 5.7 config (`config/`)

- 文件名固定 `config.default.js` + `config.{local|beta|prod}.js`。**`config.js`(无后缀)不会被加载**——改它不生效;env 文件缺失不报错(按 `{}` 处理)。
- **双层合并**(82ef279 起):同时读**框架层 config/**(`lumfall-core` 同级,即仓库根)与**业务层 `baseDir/config/`**,覆盖顺序为 `框架default → 业务default → 框架env → 业务env`(业务 env 优先级最高)。本仓库两层都指向仓库根 config/;beta/prod 文件已删除,当前仅剩 config.default.js(+死文件 config.js)。
- 工厂支持:`module.exports = (app) => ({...})` 或直接导出对象。
- 必须导出纯对象,否则抛 `[config] config.<name>.js must export a plain object`。
- 访问方式:`app.config` 或 controller/service 的 `this.config`。**任何模块加载期间(工厂执行时)都不能读它,只能请求时读。**

## 6. 环境与路径约定

- 环境变量用 **`process.env._ENV`**(不是 NODE_ENV),取值 `local | beta | prod`,默认 `local`。npm scripts 里 `dev/beta/prod` 已配好。
- `app.env` 提供 `isLocal()/isBeta()/isProd()/get()`。
- **业务模块路径一律用 `app.businessPath`(= process.cwd()/app)**,不要用 `app.baseDir` 或 `__dirname`。业务目录都在 app/ 下,用 baseDir 会指向仓库根目录导致加载不到任何东西。
- **`config/` 在仓库根目录(非 app/ 内)**:config loader 双层读取框架根 config/ 与业务 `baseDir/config/`(见 §5.7),是唯一不按「框架 app/ + 业务 app/」双目录装配的 loader,不要照搬其它 loader 的写法。
- 拼路径用 `path.join`/`path.resolve`(自动处理 `path.sep`),不要硬编码 `/`。唯一例外:glob v7 的返回结果永远是 `/` 分隔,处理时先 split 再 join 或直接按 `/` 拆。
- 文件发现用 `glob.sync("**/*.js", { cwd: dir })`(glob v7 已是依赖)。
- 可选目录(`config`、`router-schema`)加载前先 `fs.existsSync` 守卫,目录不存在就 return,不要抛错;必选目录(`middleware`、`controller`、`service`)让缺失错误自然抛出。

## 7. 常见坑(写代码前必看)

1. **加载期 vs 请求期**:工厂函数执行时是加载期,此时 config/logger 可能还没挂上。只在请求时(中间件闭包、controller 方法体)读 `app.config`、`app.logger`。
2. **controller 构造期不能碰 services**:service 加载顺序晚于 controller。用基类 getter 延迟解析。
3. **路由 handler 忘记 `.bind(controller)`** → 方法里 `this` 变成 undefined,静默报错。
4. **文件名用原名访问 app 属性** → 必须用 camelCase。`api-params-verify.js` 挂的是 `app.middlewares.apiParamsVerify`,不是 `app.middlewares.api-params-verify`。
5. **middleware 工厂返回非函数** → 挂上去的中间件调用会炸。controller/service 返回非 class → loader 直接抛错。
6. **在 extend 里覆盖框架属性** → 被静默跳过(`app.config` 等永远安全),但容易误以为生效。同名时看启动日志的 `[extend] skip` 警告。
7. **统一用 `homePath` 作首页跳转键**:router 兜底跳转和 error-handler 模板未找到跳转统一读 `app.options.homePath`。`serviceStart(options)` 缺省 `{ homePath: "/view/health", name: "lumfall" }`,`start:prod` 也以 `/view/health` 为首页;`LumfallCore.start()` 直接调用无默认(测试各自显式传或接受 302 到 `/`)。不要再传 `homePage`,避免两处跳转失效。
8. **全局中间件顺序**由 `app/middleware.js` 决定,当前实际顺序:static → nunjucks → bodyparser → errorHandler → apiParamsVerify → projectHandler。**`apiSignVerify` 目前被注释停用**(签名校验不生效,重新启用时放回 errorHandler 之前则不被其兜底、之后则被包裹)。新增全局中间件时,要被错误处理器兜底就放在 errorHandler 之后,不要兜底就放在其之前。
9. **`/api` 路径约定**:api-params-verify 只处理 `ctx.path` 含 `/api` 的请求;非 `/api` 请求直接放行。路由里凡是要走参数校验的接口,路径必须包含 `/api`。
10. **API 错误码约定**:参数校验失败 `442`,签名校验失败 `445`(当前 apiSignVerify 停用,暂不会出现),缺少 `project_key` header `446`(project-handler,见下),运行时异常 `5000`(error-handler,HTTP 状态仍为 200),业务失败 `50000`(controller `this.fail`)。业务自定义错误码避开这些。
11. **`project_key` 鉴权**(project-handler 中间件):所有 `/api/project/**` 接口必须携带 `project_key` header,否则返回 `code: 446`;例外名单在中间件顶部 `PROJECT_KEY_FREE_PATHS`(`model_list`、`list` 这两个全局接口)。前端 `curl.js` 对 URL 含 `/api/project/` 且 `window.__LUMFALL__.projectKey` 非空的请求自动下发该头(服务端 `entry.tpl` 注入,project-list 等无项目上下文的页面不会带空头)。**router-schema 里登记的 path 必须与路由 path 完全一致**,否则该接口的参数校验会静默跳过(无 schema 直接放行)。
12. **改了前端不构建 = 页面 302 跳首页**:`/view/:page` 走 `app/controller/view.js` 的 `ctx.render('dist' + sep + 'entry.' + page)`,模板由 webpack 构建产出到 `public/dist/`。若没先跑 `build:dev`/`build:prod`,nunjucks 抛 "template not found",error-handler 会 302 跳到 `homePath`(看似"首页正常但页面打不开")。改 `pages/` 下的 Vue 源码后必须先构建。
13. **`pnpm dev/beta/prod` 不会启动后端服务**:`index.js` 是编程式入口(导出 `frontendBuild(env)` / `serviceStart(options)`),这三个 script 里 nodemon 拉起 index.js 后进程立即退出。会启动后端的只有 **`pnpm start:prod`**(= `build:prod` 一次性构建 + `_ENV='prod'` 下 `serviceStart`)。本地开发起后端:`node -e "require('./index').serviceStart({ name: 'Lumfall', homePath: '/view/health' })"`;前端 dev server:`pnpm build:dev`(见 §9.4)。
14. **`LumfallCore.start()` 固定监听 3000 端口/0.0.0.0**(`PORT`/`IP` 环境变量可覆盖)。跑测试或起多实例前确保 3000 空闲——`listen` 的 EADDRINUSE 是异步抛出的 uncaught error,会把整批用例带崩(表现为"启动服务"失败)。
15. **测试驱动用 `supertest(app.callback())`,不要用 `app.listen()`**:`listen()` 会再开一个 socket,`after()` 里没人关它,open handle 会让 mocha 打印完结果后挂起不退出(曾真实发生,`pnpm test` 因此永久挂起;现已改用 callback 驱动,`pnpm test` 可自行退出)。

## 8. 框架现状(截至本文档)

- 已实现 loader:`middleware` / `router-schema` / `controller` / `service` / `config` / `router` / `extend` + `env.js`(全部可用,不存在 stub),且都是「框架内置目录 + 业务目录」双目录装配(见 §2)。
- 业务示例:controller(`base`/`project`/`view`/`business`/`health`)、service(`base`/`project`/`business`,business 内置 mock 商品数据池)、middleware(`api-sign-verify`(已停用)/`error-handler`/`api-params-verify`/`project-handler`)、extend(`logger`/`health`)、router(`project`/`view`/`business`/`health`)、router-schema(`project`/`business`)。
- **健康检查体系**:`GET /health/live`(存活,恒 200 `{status:"ok"}`)与 `GET /health/ready`(就绪,并行跑 `app.health` 已注册探针,全过 200、任一失败/超时 503,响应不泄露探针错误详情;`Cache-Control: no-store`)。两接口都不在 `/api` 前缀下,不走参数校验与 `project_key` 鉴权。配套人工状态页 `/view/health`。权威文档 **docs/health-check.md**(探针注册示例 + K8s 编排建议)。
- **82ef279「完成 lumfall-core 和前端工程化的升级改造」要点**:① 全部 loader 双目录装配,路径解析不再依赖 `process.cwd()`,webpack 配置同步 `__dirname` 相对化 + `require.resolve`,框架可独立迁移复用;② router-schema 早期的半成品缺陷已修复;③ 前端构建统一收敛到 `index.js` 的 `frontendBuild(env)`(local→dev server,prod→一次性构建);④ `serviceStart(options)` 透传 options,homePath 由调用方负责;⑤ config 双层合并;⑥ `start()` 由 async 改为同步。
- **项目目录与 project API 属于宿主应用**:`lumfall-demo` 提供项目列表页及 project controller/service/router/schema;Lumfall 保留 dashboard 页面与通用项目鉴权中间件。`model/` 下仅保留扫描/合并引擎和 DSL 文档。
- 测试模板(`test/controller/project.test.js` + `test/health.test.js`,mocha + supertest):`await lumfallCore.start(options)` 启动(内部固定占 3000 端口,跑前确保空闲,见 §7.14),`supertest(app.callback())` 直接驱动 Koa callback(不开额外 socket,见 §7.15);请求手动带 `s_t`/`s_sign`(md5("lumfall_"+s_t),供 apiSignVerify 启用时使用)与 `project_key` 头;`after()` 里 `app.server.close()`。当前基线:**10 passing / 6 failing**(6 个失败 = model DSL 清空后的预期;health 用例 4 个全过)。新增接口测试照此模板。
- npm scripts(package.json):`dev`/`beta`/`prod` = `_ENV=... nodemon index.js`(**不会启动后端**,见 §7.13);**`start:prod`** = `build:prod` + serviceStart(唯一会构建并启动后端的 script);`build:dev` = 启动 webpack dev server(127.0.0.1:9002,HMR,长驻进程,**不再是单纯构建**);`build:prod` = 一次性生产构建;`dev:watch` = concurrently 同时跑 build:dev 与 dev(后端依旧不会起);`test` = mocha(可自行退出;测试驱动用 `app.callback()`,见 §7.15);`new-page` = 页面脚手架(生成的 entry/SFC 用 `$lumfallBoot`/`$lumfallHeaderContainer` 别名引框架资源);`lint` = `eslint --fix --ext js,vue .`(只认 js/vue,不碰 md/json)。
- 前端构建链:`pages/`(Vue 源码)→ `webpack/`(配置,扫描框架 `app/pages/` 与业务 `process.cwd()/app/pages/` 下的 `entry.*.js`;同名业务入口覆盖框架入口)→ 产出 `public/dist/entry.{page}.tpl` → `app/controller/view.js` 的 `renderPage` 用 `ctx.render('dist' + sep + 'entry.' + ctx.params.page)` 渲染。框架与业务页面共享框架依赖,业务页面的 `$lumfallPage` 等别名仍指向框架资源。改了前端源码必须重新构建,否则报 "template not found" → error-handler 302 跳 `homePath`。
- Dashboard DSL 的结构与写法见 **model/docs/dsl-guide.md**(权威编写规则)与 **model/docs/dashboard-model.md**(字段级速查);前端 schema 组件层的写法参考 `app/pages/widgets/` 下已有实现。
- 框架后续新增 loader 或约定时,本 skill 需同步更新。

## 9. 前端架构与构建约定(Vue 3 + Pinia + Arco Design)

框架自带一套 Vue 3 前端链路(`app/` 下的 `pages/`、`webpack/`、`view/`、`public/`)。改前端时必须理解这条流水线,否则页面会静默 302 跳首页。

### 9.1 目录职责与别名

| 目录/别名 | 作用 |
|---|---|
| `app/pages/dashboard/` | Dashboard 主页面:入口 `entry.dashboard.js`(vue-router history 路由表,基址 `/view/dashboard`)+ `dashboard.vue`(头部菜单 + router-view)+ `complex-view/`(header/sider/iframe/schema 四种视图)+ `route-path.js`(`dashboardPath()` 拼基址,页面内跳转一律走它)。schema 视图(`schema-view/`)下还有 `components/`(`component-config.js` 注册 createForm/editForm/detailPanel 三个动态抽屉组件)与 `hook/schema.js`(`useSchema`/`buildDtoSchema`,DSL → dto schema 的转换核心) |
| `app/pages/health/` | 框架健康状态页(`/view/health`),显示 `/health/live` 与 `/health/ready` 状态及业务注册的依赖探针 |
| `lumfall-demo/app/pages/project-list/` | 项目列表页,由 demo 宿主应用提供(GET `/api/project/model_list` 拉取模型与项目) |
| `$lumfallPage` `app/pages/` | 页面根目录别名(跨页面引用如 `$lumfallPage/dashboard/route-path.js`) |
| `$lumfallBoot` `app/pages/boot.js` | Vue 页面启动器 |
| `$lumfallHeaderContainer` `widgets/header-container/header-container.vue` | 通用页头组件 |
| `$lumfallSchemaForm` `widgets/schema-form/schema-form.vue` | DSL 驱动的动态表单 |
| `$lumfallSchemaSearchBar` `widgets/schema-search-bar/schema-search-bar.vue` | DSL 驱动的搜索栏 |
| `$lumfallSchemaTable` `widgets/schema-table/schema-table.vue` | DSL 驱动的表格 |
| `$lumfallSiderContainer` `widgets/sider-container/sider-container.vue` | 侧边栏布局容器 |
| `$lumfallStore` `app/pages/store/` | Pinia:`menu.js`(菜单树,含 `findMenuItem`/`findFirstMenuItem`)、`project.js`;`index.js` 导出 pinia 实例 |
| `$lumfallCommon` `app/pages/common/` | `curl.js`(统一请求封装,见 9.3)、`utils.js` |
| `$lumfallCurl` `app/pages/common/curl.js` | 前端统一 API 请求封装 |
| `$lumfallUtils` `app/pages/common/utils.js` | 前端通用工具函数 |
| `$lumfallWidgets` `app/pages/widgets/` | widgets 组件目录根路径 |
| `$lumfallAssert` `app/pages/assert/` | 静态样式等资源 |
| `app/pages/boot.js` | 应用启动器:创建 Vue app、注册 Arco/Pinia/图标,**有 routes 时用 `createWebHistory()`(history 模式,无 hash)**,`router.isReady()` 后再 mount |
| `app/view/entry.tpl` | nunjucks 模板,服务端注入 `window.__LUMFALL__ = { name, env, options, projectKey }`,前端(如 curl.js 下发 project_key)从这里读 |
| `app/public/dist/` | webpack 产物 `entry.{page}.tpl`,运行时真正被渲染的模板 |

> 旧的 `$page` / `$common` / `$widgets` / `$store` / `$assert` 别名**已删除**——还引用它们会 resolve 失败,统一迁移到上表 `$lumfall*` 别名。

### 9.2 渲染链路

```
浏览器 GET /view/:page(如 /view/dashboard、/view/health)
  → router(view.js): /view/:page 与 /view/:page/* 两条路由
  → ViewController.renderPage: ctx.render(`dist${sep}entry.${page}`, { name, env, options, projectKey })
      projectKey 取自 query(`?projectKey=xxx`),用于服务端注入
  → koa-nunjucks-2 在 app/public/ 下找 public/dist/entry.{page}.tpl
  → 找不到 → 抛 "template not found" → error-handler 302 跳 app.options.homePath
```

webpack 入口自动扫描框架 `app/pages/` 与业务 `process.cwd()/app/pages/` 下的 `entry.*.js`;同名时业务入口覆盖框架入口,**新增页面无需手动注册**。业务仓库可把自己的 webpack 扩展配置写在 **`app/webpack.config.js`**(可选文件),webpack.base.js 会用 `merge.smart` 把它合并进基座(追加 loader/插件/alias 等的标准入口)。`resolve.modules` 已包含框架自带 node_modules,业务仓库可直接 import 框架依赖而无需自装全套;业务页面一律用 `$lumfall*` 别名引用框架资源。`ViewController` 继承了 `require("./base")` 但并未 extends,是独立 class,靠 `ctx.render` 而非 `this.success` 出页面。

### 9.3 请求封装(curl.js)

前端所有 API 请求走 `$lumfallCurl`:

- 自动附带 `s_t`(时间戳)+ `s_sign`(`md5("lumfall_" + s_t)`)签名头(注意服务端 apiSignVerify 目前停用,头仍会发)。
- **URL 包含 `/api/project/` 且 `window.__LUMFALL__.projectKey` 非空**时才附带 `project_key` 头——demo 的 project-list 等无项目上下文页面不会带空头。
- 统一响应包络 `{ success, code, message, data, metadata }`;`success: false` 时按 code 弹 Message(442/445/446/50000 精确匹配,其余 code 走 default 弹调用方传入的 `errorMessage`,如 error-handler 的 5000),无论成败都 resolve(不 reject),调用方需自行判断 `res.success`。
- 列表接口的分页数据在 `res.metadata.total`。

### 9.4 开发命令与常见坑

- **前端开发**:`pnpm build:dev` 启动 webpack dev server(127.0.0.1:9002,HMR 热更新,长驻进程,产物同时 writeToDisk 到 `public/dist/`);**后端需另行启动**(见 §7.13 的 serviceStart 命令)。`dev:watch` 目前是 build:dev + dev 的组合,后端依旧不会起。
- **改了 `pages/` 下源码**:dev server 下 HMR 自动生效;不走 dev server 直接访问后端页面时,若未构建过则页面 302 跳首页(见 §7.12)。这是前端开发最高频的误操作。
- **新增页面**:`pnpm new-page <page-name> [--header]` 脚手架生成 `app/pages/<name>/`(entry + SFC,`--header` 带 HeaderContainer 布局);构建后访问 `/view/<name>`。路由 `/view/:page` 由服务端统一兜底,无需注册。
- **schema 组件契约**:搜索/表单组件统一接收 `schemaKey`/`schema` props、`v-bind="schema.option"` 透传 arco 配置、暴露 `getValue()`/`reset()`(表单项另有 `validate()`),搜索组件挂载时 emit `load`;表格列由 `schemaConfig.schema.properties` 中配了 `tableOption` 的字段驱动,搜索栏由配了 `searchOption` 的字段驱动,表单/详情由 `createFormOption`/`editFormOption`/`detailPanelOption` 驱动(见 §10)。完整 DSL 见 model/docs/dsl-guide.md。
- **模板路径拼写**:`renderPage` 用 `dist${sep}entry.${page}`,产物必须落在 `public/dist/` 下且文件名匹配,否则同样 302。

## 10. Dashboard DSL(model/ 目录)

后端通过 **Model + Project 两层 DSL**(`model/<modelKey>/model.js` + `model/<modelKey>/project/<projectKey>.js`)声明菜单与页面,`model/index.js` 启动时自动扫描并用 `lodash.mergeWith` 按数组元素 `key` 深度合并(Model 为默认骨架,Project 覆盖/追加)。前端经 `GET /api/project?projectKey=xxx` 拿到合并后的完整配置渲染菜单,`moduleType` 决定渲染方式:`custom`(路由页)/`iframe`(嵌入)/`sider`(侧边栏复合视图)/`schema`(搜索栏+表格列表页,本项目主要形态)。

**完整编写规则、字段说明、schema 模块 DSL(tableOption/searchOption/xxxFormOption/componentConfig/tableConfig)、接口契约,见 `model/docs/dsl-guide.md`(权威文档,改 DSL 相关代码时先读它)与 `model/docs/dashboard-model.md`(字段级速查;注意两份文档中的示例引用的 `model/business` 等文件已随 82ef279 清空,示例即重建模板)。** 关键约定速记:

- 文件/目录名即 key(自动注入,不要手写);`menu[]` 每项必须有唯一 `key`,否则合并不生效。
- `homePage`/`customConfig.path` 写**不带 `/view/dashboard` 前缀**的页面内路由;sider 子菜单里 custom 的 `path` **必须以 `/` 开头**(否则拼出 `/sidertaobao/...` 非法路由无法跳转,已删除的 `taobao.js` 示例曾踩此坑)。
- schema 模块的 `api` 是**基址**,完整 CRUD 契约:`GET <api>/list` 列表(query: 搜索字段+page/pageSize,响应须 `{ success, data: [...], metadata: { total } }`)、`GET <api>?<mainKey>=` 单条回显(editForm/detailPanel)、`POST <api>` 新增(createForm)、`PUT <api>` 更新(editForm,body 含 mainKey)、`DELETE <api>` 删除;`dateRange` 搜索值下发为 `<field>_start`/`<field>_end` 两个参数(空字符串=不过滤)。
- 动态表单/详情:注册在 `tableConfig.componentConfig`(createForm/editForm/detailPanel,key 固定),字段级配置用 `createFormOption`/`editFormOption`/`detailPanelOption`,按钮 `eventKey: "showComponent"` + `eventOption.comName` 触发;表单 `componentType` 目前仅 input/inputNumber/select;必填用 `schema.required` 数组(自动注入 option.required)。
- 新增 Model/Project 文件重启即生效(model/ 当前为空,直接按 dsl-guide 模板新建目录即可);新增 schema 接口需在 `app/router/business.js` + `app/router-schema/business.js` 登记(path 与 schema key 必须一致),`business.js` 全链路(mock 内存实现,商品 CRUD 测试覆盖)可作为 schema 后端的参考实现。