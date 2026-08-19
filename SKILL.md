---
name: sunset-framework
description: Sunset 全栈框架(Koa)的写法规约与用法指南。Use when writing, modifying, or reviewing any code in this repo: app/ 下的 controller、service、middleware、extend、router、router-schema、config,或 sunset-core/ 框架本体与 loader。Covers loader 工厂模式、kebab/snake 转 camelCase 命名、动态挂载到 app、loader 加载顺序、_ENV 环境、JSON-Schema 参数校验、错误码约定,防止因不熟悉框架约定而产生的用法错误。
---

# Sunset 全栈框架写法规约

Koa 2 全栈框架,核心是 **loader 动态装配**:启动时按固定顺序扫描目录、按文件名约定把模块实例挂到 `app` 上,业务代码通过 `app.xxx` 或 `this.xxx` 访问,不需要手动 `require` 注册。写业务代码前必须先理解这套约定,否则很容易写出"文件存在但框架没加载/挂载位置不对"的隐性 bug。

## 1. 项目布局

```
├── index.js                # 入口:调用 SunsetCore.start({...})
├── sunset-core/            # 框架核心(业务代码不要改)
│   ├── index.js            # 启动引导,编排 loader 顺序
│   ├── env.js              # 环境工具 (isLocal/isBeta/isProd/get)
│   └── loader/             # 每个 loader 一个文件,统一 loader(app) 同步调用
├── app/                    # 业务代码根目录(businessPath = process.cwd()/app)
│   ├── controller/         # 控制器
│   ├── service/            # 业务服务
│   ├── middleware/         # 中间件
│   ├── middleware.js       # 全局中间件注册(唯一手动 use 的地方)
│   ├── extend/             # 扩展,挂到 app 上
│   ├── router/             # 路由注册
│   ├── router-schema/      # API 参数 JSON-Schema
│   └── public/             # 静态资源 + 模板
└── config/                 # 配置(config.{default|local|beta|prod}.js)
```

## 2. 加载顺序(最重要的约束)

`sunset-core/index.js` 中 loader 的固定执行顺序:

```
middleware → router-schema → controller → service → config → extend → router
```

由此推导出的硬性规则:

- **middleware 在 config 之前加载** → 中间件工厂里**不要读 `app.config`**。配置只能在请求时(闭包内)访问。
- **service 在 controller 之后加载** → controller 构造函数里**不要访问 `this.services`**。参见 `app/controller/base.js` 的写法:用 getter 延迟解析。
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

转换规则(`sunset-core/loader/utils.js` 的 `camelCase`):去掉 `-`/`_` 后紧跟的小写字母转大写。

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

- 必须返回 **class**(loader 会 `new`,非 class 直接抛 `[controller]` 错误)。
- 方法签名统一 `async method(ctx)`,从 `ctx` 取 `params/query/body/headers`。
- 响应统一走基类 `this.success(ctx, data, metadata)` / `this.fail(ctx, message, code)`。
- **服务/配置访问**:构造函数里不能碰,用基类提供的 getter(`this.services` / `this.config`)。

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

- 工厂返回的值直接挂到 `app.<camelCase文件名>`,**不包一层**。
- 若文件名与 app 已有属性冲突(如 `config`、`controllers`),会被跳过并 warn,不会覆盖框架内部属性。
- 示例:`app/extend/logger.js` → `app.logger`(local 下是 console,其他环境是 log4js,含 `info/error` 等方法)。

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
- 配合 `app/middleware/api-params-verify.js` 用 ajv 校验,校验失败返回 `code: 442`。
- 只有 `path` 包含 `/api` 的请求才会走校验。
- 可校验四部分:headers / body / query / params(见 `api-params-verify.js` 的取值来源)。

### 5.7 config (`config/`)

- 文件名固定 `config.default.js` + `config.{local|beta|prod}.js`。
- 合并规则:**default 为基础,env 同名键覆盖**。
- 工厂支持:`module.exports = (app) => ({...})` 或直接导出对象。
- 必须导出纯对象,否则抛 `[config]` 错误。
- 访问方式:`app.config` 或 controller/service 的 `this.config`。**任何模块加载期间(工厂执行时)都不能读它,只能请求时读。**

## 6. 环境与路径约定

- 环境变量用 **`process.env._ENV`**(不是 NODE_ENV),取值 `local | beta | prod`,默认 `local`。npm scripts 里 `dev/beta/prod` 已配好。
- `app.env` 提供 `isLocal()/isBeta()/isProd()/get()`。
- **路径解析一律用 `app.businessPath`(= process.cwd()/app),不要用 `app.baseDir` 或 `__dirname`**。业务目录都在 app/ 下,用 baseDir 会指向仓库根目录导致加载不到任何东西。
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
7. **统一用 `homePath` 作首页跳转键**(已修复):router 兜底跳转和 error-handler 模板未找到跳转统一读 `app.options.homePath`,入口 `index.js` 传入 `homePath: "/view/page1"`。不要再传 `homePage`,避免两处跳转失效。
8. **全局中间件顺序**由 `app/middleware.js` 决定:static → nunjucks → bodyparser → apiSignVerify → errorHandler → apiParamsVerify。新增全局中间件加在这里,并注意 errorHandler 要包住后续中间件(目前 apiSignVerify/apiParamsVerify 在其之前,不被 errorHandler 覆盖)。
9. **`/api` 路径约定**:api-sign-verify 和 api-params-verify 都只处理 `ctx.path` 含 `/api` 的请求;非 `/api` 请求直接放行。路由里凡是要走签名/参数校验的接口,路径必须包含 `/api`。
10. **API 错误码约定**:参数校验失败 `442`,签名校验失败 `445`,运行时异常 `5000`。业务自定义错误码避开这三个。

## 8. 框架现状(截至本文档)

- 已实现 loader:`middleware` / `router-schema` / `controller` / `service` / `config` / `router` / `extend` + `env.js`。
- 业务示例:controller(`base`/`project`/`view`)、service(`base`/`project`)、middleware(`api-sign-verify`/`error-handler`/`api-params-verify`)、extend(`logger`)、router(`project`/`view`)、router-schema(`project`)。
- 尚未实现/待完善:无 test/build/start 脚本(lint 是唯一 npm script);框架后续新增 loader 或约定时,本 skill 需同步更新。