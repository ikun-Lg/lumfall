---
name: lumfall
description: Lumfall framework + demo business project conventions. This repo contains the framework project in lumfall/ and a real business project in lumfall-demo/ that uses the framework via require("lumfall"). The skill describes the actual loader behavior, app path conventions, and the difference between framework-owned code and business-owned code.
---

# Lumfall 框架与 demo 业务项目约定

这个工作区里有两个层次：

- `lumfall/`：框架项目本体，负责 Koa 启动、loader、配置、路由、前端构建和通用能力。
- `lumfall-demo/`：业务项目，真正的应用代码放在这里，它通过 `require("lumfall")` 使用框架。

要写代码前，必须先分清：

- 框架自带目录：`lumfall/app/`, `lumfall/lumfall-core/`, `lumfall/config/`
- 业务目录：`lumfall-demo/app/`, `lumfall-demo/config/`, `lumfall-demo/model/`

框架启动时并不是只看当前仓库目录，而是用 `process.cwd()` 作为业务根目录；因此业务项目在实际运行时通常从 `lumfall-demo/` 目录启动，`app.businessPath` 会指向 `process.cwd()/app`。

## 1. 项目关系与入口

### 1.1 框架入口

在 `lumfall/index.js` 中，框架对外导出：

```js
module.exports = {
  Controller: { Base: require("./app/controller/base.js") },
  Service: { Base: require("./app/service/base.js") },
  frontendBuild(env) { ... },
  serviceStart(options = { homePath: "/view/health", name: "lumfall" }) {
    return LumfallCore.start(options);
  },
};
```

也就是说：

- `frontendBuild(env)` 负责前端构建
- `serviceStart(options)` 会创建 Koa app 并启动

### 1.2 业务项目入口

示例业务项目 `lumfall-demo/server.js`：

```js
const { serviceStart } = require("lumfall");
const app = serviceStart();
```

而 `lumfall-demo/build.js` 做的是前端构建：

```js
const { frontendBuild } = require("lumfall");
frontendBuild(process.env._ENV);
```

这说明：

- `lumfall-demo` 是业务项目
- `lumfall` 是框架项目
- 业务代码不应该在框架根目录里随意写；应该写在业务项目的 `app/`、`router/`、`service/` 等目录中

## 2. 真正的启动流程

`LumfallCore.start()` 在 `lumfall/lumfall-core/index.js` 中定义，顺序固定：

```text
middleware -> router-schema -> controller -> service -> config -> extend -> router
```

核心逻辑：

```js
const app = new Koa();
app.baseDir = process.cwd();
app.businessPath = path.resolve(app.baseDir, `.${sep}app`);
app.env = env();
```

启动时 framework 会按这个顺序装配 `app`：

- `app.middlewares`
- `app.routerSchema`
- `app.controllers`
- `app.services`
- `app.config`
- `app.customExtend`
- `router.routes() / router.allowedMethods()`

注意：

- `app.businessPath` 不是框架自己的 `__dirname`，而是运行时业务项目的 `process.cwd()/app`
- 所以把 `__dirname` 当业务路径会加载错目录；这是最常见错误

## 3. loader 约定

所有 loader 都是工厂函数，统一签名：

```js
module.exports = (app) => { ... }
```

### 3.1 controller

`lumfall/lumfall-core/loader/controller.js` 会扫描：

- framework 内置 `app/controller`
- business `app.businessPath/controller`

然后转成：

```js
app.controllers.customModule.customController
```

控制器工厂必须返回 class：

```js
module.exports = (app) => class UserController {
  async getList(ctx) { ... }
};
```

### 3.2 service

同样是工厂返回 class，挂载到 `app.services`。注意：

- controller 在 service 之前加载
- 因此不能在 controller 构造期间直接读取 `this.services`
- 推荐用 `this.app.services` 或 getter 延迟访问

### 3.3 middleware

`lumfall/lumfall-core/loader/middleware.js` 会把目录下文件挂到 `app.middlewares`：

```js
app.middlewares.apiParamsVerify
```

直接约定：

```js
module.exports = (app) => (ctx, next) => {
  // Koa middleware
};
```

而根级 `app/middleware.js`（例如 `lumfall-demo/app/middleware.js`）是全局注册入口，里面要显式：

```js
module.exports = (app) => {
  app.use(...)
};
```

### 3.4 extend

`app/extend/*.js` 直接挂到 `app` 顶层：

```js
app.logger
app.health
```

### 3.5 router

`lumfall/lumfall-core/loader/router.js` 会：

- 先加载业务路由目录
- 再加载框架路由目录
- 最后注册兜底路由：未命中时 `302` 重定向到 `app.options.homePath`

```js
router.get("*", async (ctx) => {
  ctx.status = 302;
  ctx.redirect(app?.options?.homePath || "/");
});
```

### 3.6 router-schema

在 `app/router-schema/*.js` 中导出的对象会合并到 `app.routerSchema`，用来配合参数校验中间件。

## 4. 命名和路径约定

文件名/目录名使用 `kebab-case` 或 `snake_case`，加载后会转成 `camelCase`：

- `api-params-verify.js` -> `app.middlewares.apiParamsVerify`
- `custom-module/custom-controller.js` -> `app.controllers.customModule.customController`
- `user-service.js` -> `app.services.userService`

重要：

- `app.controllers.xxx` 不是按原文件名访问，而是按 `camelCase` 访问
- `app.businessPath` 必须用 `process.cwd()/app`，不能用 `__dirname`
- 路径拼接用 `path.join` / `path.resolve`，不要硬编码 `/`

## 5. 配置加载

`lumfall/lumfall-core/loader/config.js` 实际做的是双层合并：

```js
const frameworkDefaultConfig = loadConfig("default", frameworkConfigDir);
const businessDefaultConfig = loadConfig("default", businessConfigDir);
const frameworkEnvConfig = loadConfig(env, frameworkConfigDir);
const businessEnvConfig = loadConfig(env, businessConfigDir);

app.config = {
  ...frameworkDefaultConfig,
  ...businessDefaultConfig,
  ...frameworkEnvConfig,
  ...businessEnvConfig,
};
```

覆盖顺序是：

```text
框架 default -> 业务 default -> 框架 env -> 业务 env
```

注意两点：

- 用 `process.env._ENV`，不是 `NODE_ENV`
- `config` 只能在请求阶段读取，不能在 loader 工厂执行期直接访问

## 6. demo 是业务项目的例子

`lumfall-demo` 里真实业务代码遵循的是框架约定，而不是框架本体结构：

- `lumfall-demo/app/controller/business.js` 返回 class Controller，使用 `app.services`
- `lumfall-demo/app/middleware.js` 注册全局 middleware
- `lumfall-demo/app/router/business.js` 注册接口
- `lumfall-demo/app/router-schema/business.js` 声明 schema
- `lumfall-demo/app/service/business.js` 提供业务逻辑

例如：

```js
module.exports = (app) => {
  const BaseController = require("lumfall").Controller.Base(app);
  return class BusinessController extends BaseController {
    async getBusinessList(ctx) {
      const { business: businessService } = app.services;
      const { data, total } = businessService.getBusinessList({
        page: Number(ctx.request.query.page) || 1,
        size: Number(ctx.request.query.pageSize) || 50,
      });
      await this.success(ctx, data, { total });
    }
  };
};
```

这说明：业务项目的代码目标是“扩展框架”，不是“改造框架本体”。

## 7. 真实开发时的判断方法

遇到新代码时，优先判断它属于哪一层：

- `lumfall/` 下：框架能力、loader、启动器、内置 app
- `lumfall-demo/` 下：业务实现、接口、页面、服务逻辑

如果文件在业务项目中：

- 放在 `app/controller`, `app/service`, `app/router`, `app/router-schema`, `config/`, `model/`
- 遵循工厂导出和 `camelCase` 挂载规则

如果文件在框架项目中：

- 只修正框架核心逻辑，例如 `lumfall-core/loader/*`, `lumfall/index.js`, `lumfall-core/env.js`
- 不要把业务应用逻辑硬编码进框架根目录

## 8. 常见误区

1. 把 `lumfall` 当业务项目写代码
   - 错：在 `lumfall/app/...` 里堆业务接口
   - 对：把业务代码写到 `lumfall-demo/app/...`

2. 用 `__dirname` 当业务目录
   - 错：会指向当前文件所在目录，而不是业务项目根目录
   - 对：用 `process.cwd()` + `app.businessPath`

3. 在工厂执行期读取 `app.config`
   - 错：加载期不可靠
   - 对：只在请求阶段或方法体中读取

4. 在 controller 构造时访问 `this.services`
   - 错：因为 service 是后加载的
   - 对：延迟获取或用 `this.app.services`

5. 直接用文件名访问 `app` 属性
   - 错：`app.middlewares.api-params-verify`
   - 对：`app.middlewares.apiParamsVerify`

## 9. 结论

Lumfall 的设计是：

- framework repo 负责“启动和装配能力”
- business repo 负责“具体业务实现”

`lumfall-demo` 是当前最好的业务项目示例；它证明了：你可以在另一个项目中依赖框架，并按 `app/controller` / `app/service` / `app/router` / `app/router-schema` 的约定扩展业务功能，而不必修改框架本体。

遵守这套分层和加载规则，才能避免“文件存在但没挂载”或“启动时路径错位”的问题。
