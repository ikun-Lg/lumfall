# Lumfall 全栈框架

Lumfall 是基于 Koa 2 的 Node.js 全栈框架，提供按目录自动加载的服务端扩展、路由和控制器，以及基于 Vue 3 与 Webpack 的页面构建能力。框架代码位于 `lumfall-core/` 和内置 `app/`；使用者在自己的项目中提供业务目录 `app/`、`config/` 和服务启动入口。

## 功能概览

- 基于 Koa 的应用启动、中间件管线与生命周期 hook
- 按目录自动加载业务 middleware、controller、service、extend、router 和 router-schema，导出形状非法时启动即失败
- 按 `_ENV` 选择并合并默认配置与环境配置，可选用 JSON Schema 校验合并结果
- Vue 页面入口自动发现、开发构建与生产构建，页面重名和构建缺失有明确错误码
- 安全策略：API 签名校验与 project key 校验
- 可选插件机制、请求级 monitoring hook，以及运行时可读的诊断清单
- 内置健康检查接口与状态页，并提供页面脚手架命令

## 环境要求

- Node.js（Koa 2 + Vue 3 + Webpack 5，建议使用 LTS 版本）
- pnpm（仓库声明的包管理器版本为 `pnpm@10.30.0`）

## 在业务项目中使用

将 Lumfall 安装为业务项目依赖。例如，在与本仓库相邻的本地业务项目中：

```sh
pnpm add lumfall
```

本仓库同级的 `lumfall-business/` 就是一个可直接运行的业务项目示例，它通过 `require("lumfall")` 使用已发布的框架版本；本地联调框架改动时，也可以临时把它改成 `link:../lumfall`。

在业务项目入口显式启动服务：

```js
const { serviceStart } = require("lumfall");

serviceStart({
	name: "My application",
	homePath: "/view/health",
});
```

`serviceStart(options)` 返回 Koa app，服务默认监听 `0.0.0.0:3000`，可通过 `IP` 和 `PORT` 环境变量调整。可用选项：

| 选项 | 说明 |
| --- | --- |
| `name` | 应用名，渲染页面模板时使用 |
| `homePath` | 兜底重定向目标；未命中任何路由的请求会 302 到这里 |
| `configSchema` | 校验合并后配置的 JSON Schema，见「配置加载」 |
| `lifecycle` | 启动与停止 hook，见「生命周期」 |
| `plugins` | 插件描述符数组，见「插件（Plugins）」 |
| `monitoring` | 请求级观测 hook，见「请求观测（Monitoring 与 tracing）」 |

不传参数时 `homePath` 默认 `/view/health`；该默认值只在完全省略参数时生效，传入对象但未声明 `homePath` 时兜底重定向会退化为 `/`。另外，`/view/<name>` 由页面控制器显式处理，未知页面返回 404，不会走兜底重定向。

在业务项目目录下运行启动入口，使框架能从当前工作目录解析 `app/` 和 `config/`：

```sh
_ENV=local node server.js
```

环境标识 `_ENV` 支持 `local`、`beta`、`prod`，缺省为 `local`。`NODE_ENV` 不控制 Lumfall 的配置环境。

## 目录约定

```text
your-app/
├── server.js                  # 调用 serviceStart() 的应用入口
├── config/
│   ├── config.default.js
│   ├── config.local.js        # 可选
│   ├── config.beta.js         # 可选
│   └── config.prod.js         # 可选
├── model/
│   └── <modelKey>/            # Dashboard 模型与项目配置
└── app/
    ├── middleware.js          # 注册全局 Koa 中间件，可选
    ├── middleware/            # 可复用中间件
    ├── router/                # 路由注册
    ├── router-schema/         # API 参数 JSON Schema
    ├── controller/            # 请求处理
    ├── service/               # 业务服务
    ├── extend/                # 挂载到 Koa app 的扩展
    ├── pages/                 # Vue 页面及 entry.*.js 入口
    ├── public/                # 静态文件与页面构建产物
    └── webpack.config.js      # 可选，扩展 Webpack 配置
```

框架以启动时的 `process.cwd()` 作为业务项目根目录，因此应从业务项目根目录启动进程。

## 路由与页面渲染

路由由 `app/router/**/*.js` 注册；未命中任何路由的请求由框架兜底路由 302 重定向到 `options.homePath`。

Webpack 与运行时共用 `entry.<name>.js` 页面发现规则，扫描框架 `app/pages/` 与业务 `app/pages/`。框架页和业务页重名时业务页覆盖框架页；同一来源中出现重名的 page name 会在构建或启动时报错，并给出两个冲突入口路径。`/view/<name>` 只渲染已发现的页面，不会静默重定向首页：

| 情况 | 响应 |
| --- | --- |
| 页面已发现且模板已构建 | 渲染 `app/public/dist/{dev|prod}/entry.<name>.tpl`（按 _ENV 对应目录） |
| 页面未发现 | HTTP 404，code `4041` |
| 页面已发现但模板缺失（未构建） | HTTP 503，code `5031` |

`app.diagnostics.getManifest()` 返回同一份页面清单，见「诊断清单（Diagnostics manifest）」。

## 自动加载约定

框架内置实现与业务项目中同名类别的文件都会加载。文件名和子目录名会转换为 camelCase，例如 `app/service/user-service.js` 会挂载为 `app.services.userService`，`app/middleware/admin/auth-check.js` 会挂载为 `app.middlewares.admin.authCheck`。

Loader 装配顺序固定为 middleware → router-schema → controller → service → config → extend → router，随后依次注册插件、全局中间件和路由。也就是说 controller 与 service 的工厂函数执行时，`app.config` 和 `app.services` 还不存在，需要通过 `this.app.*` 或 getter 延迟到请求阶段读取。

| 目录/入口 | 导出约定 | 加载后的用法 |
| --- | --- | --- |
| `app/middleware/**/*.js` | `(app) => (ctx, next) => {}` | `app.middlewares`；由全局 middleware 或其他代码注册到 Koa |
| `app/controller/**/*.js` | `(app) => ControllerClass` | `app.controllers`；启动时实例化 |
| `app/service/**/*.js` | `(app) => ServiceClass` | `app.services`；启动时实例化 |
| `app/extend/**/*.js` | `(app) => extensionObject` | 直接挂载到 `app`，例如 `app.health` |
| `app/router/**/*.js` | `(app, router) => { router.get(...) }` | 向 Koa Router 注册路由 |
| `app/router-schema/**/*.js` | schema 映射对象或 `(app) => schemaMap` | 汇总到 `app.routerSchema`；启动时校验 path/method 对应已注册路由 |
| `app/middleware.js` | `(app) => { app.use(...) }` | 注册全局 Koa 中间件 |

Controller 和 Service 导出工厂函数，工厂返回类；路由文件负责把 URL 映射到控制器方法。全局中间件按需使用 `app.middlewares` 中已加载的中间件。

## 安全策略（Security policy）

`config.security` 集中控制 API 签名和 project key 策略。框架默认不提供 `security` 配置：签名校验视为关闭，`/api/project/**` 的 project key 校验默认开启；其中 `/api/project/model_list` 与 `/api/project/list` 是项目无关的全局接口，不受 project key 限制。配置文件本身的加载与合并规则见下一节「配置加载」。

被拦截时统一返回 HTTP 200 加业务错误码：

| 中间件 | 触发条件 | 响应 |
| --- | --- | --- |
| `apiParamsVerify` | router-schema 校验不通过 | code `442` |
| `apiSignVerify` | 缺少签名、签名不匹配、时间戳非数字或时间差超过 `maxAgeMs` | code `445` |
| `projectHandler` | project key 策略开启且请求未携带 `project_key` | code `446` |

中间件的注册顺序为 static → nunjucks → bodyParser → errorHandler → monitoring → apiParamsVerify → securityPolicy，即在参数校验之后先校验签名、再校验 project key。

```js
module.exports = {
	security: {
		apiSignature: {
			enabled: false,
			secret: process.env.API_SIGN_SECRET,
			maxAgeMs: 600000,
		},
		projectKey: {
			enabled: true,
			headerName: "project_key",
			freePaths: ["/api/project/public-list"],
		},
	},
};
```

签名启用后使用 `md5(secret + "_" + timestamp)`，时间戳与当前时间的差值不能超过 `maxAgeMs`。客户端通过 `ssign`（或 `s_sign`）请求头传签名、`st`（或 `s_t`）请求头传时间戳，请求头名在 Node 中统一为小写。未配置 `secret` 时会退化为内置默认串 `lumfall`，仅适合本地联调；生产环境应从环境变量或密钥管理系统提供 `secret`，不要提交真实密钥。

## 配置加载

配置按以下顺序浅合并，后面的配置覆盖前面的同名键：框架 `config.default.js`、业务 `config.default.js`、框架环境配置、业务环境配置。配置模块可导出对象，也可导出接收 `app` 并返回对象的函数。

可在 `serviceStart(options)` 中提供 JSON Schema 校验最终合并后的配置；不提供时保持现有自由扩展行为：

```js
serviceStart({
	homePath: "/view/health",
	name: "my-app",
	configSchema: {
		type: "object",
		required: ["port"],
		properties: {
			port: { type: "integer", minimum: 1, maximum: 65535 },
		},
	},
});
```

配置文件仍须导出普通对象。schema 不匹配时启动会失败，并指出环境、字段路径和约束原因。

## 生命周期

通过 `serviceStart({ lifecycle })` 注册启动 hook，顺序为 `beforeStart`、loader 装配、`beforeRouteLoad`、路由装载、`afterRouteLoad`、创建 HTTP server、`afterStart`。同步启动错误会传给 `onError(error, app)` 后原样抛出。为保持 `serviceStart()` 的同步 API，启动 hooks 必须同步返回；异步初始化应在调用启动前完成。

`app.stop()` 返回 Promise，按顺序等待 `beforeStop(app)`、关闭 HTTP server、`afterStop(app)`，可在测试或宿主 teardown 时 `await app.stop()`。

```js
const app = serviceStart({
	lifecycle: {
		beforeStart(app) {},
		beforeRouteLoad(app) {},
		afterRouteLoad(app) {},
		afterStart(app) {},
		onError(error, app) {},
		async beforeStop(app) {},
		async afterStop(app) {},
	},
});

await app.stop();
```

## 诊断清单（Diagnostics manifest）

启动后可通过 `app.diagnostics.getManifest()` 获取 JSON 可序列化的运行时清单，包含 Lumfall 版本与环境、加载器名称、已注册路由及其方法、发现的页面入口（标注 `framework` / `business` 来源）、health check 名称和超时。业务页面与框架页面重名时，清单与构建行为一致，由业务页面覆盖。清单不会复制配置对象、凭证、探针函数或异常详情。

## 插件（Plugins）

`serviceStart({ plugins })` 可选接收插件描述符数组。插件按声明顺序稳定排序；每个插件的 `dependencies` 会先于它注册。`register(app)` 在内置/业务 loader、config 和 extend 完成后、全局 middleware 与 router 注册前同步执行；返回的普通对象会挂载到 `app.plugins[name]`。省略 `plugins` 时保持原有启动路径。

```js
serviceStart({
	plugins: [
		{
			name: "database",
			register(app) {
				return { connect: () => app.services.database.connect() };
			},
		},
		{
			name: "feature-module",
			dependencies: ["database"],
			register(app) {
				return { database: app.plugins.database };
			},
		},
	],
});
```

插件必须有唯一非空 `name` 和同步 `register(app)` 函数。依赖缺失、循环、重复名称、异步注册或非法返回值都会使启动失败，并给出插件级诊断。

## Dashboard Model 配置

Dashboard 使用 Model + Project 两层 CommonJS 配置：Model 声明可复用的菜单骨架，Project 声明具体项目的信息和菜单差异。框架启动时扫描业务项目根目录下的 `model/`，将每个 Project 与所属 Model 合并；因此这些配置不放在 `app/` 中。

```text
model/
└── commerce/                # Model key 由目录名决定
    ├── model.js             # 公共模型配置
    └── project/
        └── store-a.js       # Project key 由文件名决定
```

Model 文件导出模式、显示名称和默认菜单：

```js
// model/commerce/model.js
module.exports = {
	model: "dashboard",
	name: "电商后台",
	menu: [
		{
			key: "product",
			name: "商品管理",
			menuType: "module",
			moduleType: "custom",
			customConfig: { path: "/todo" },
		},
	],
};
```

Project 文件填写项目元信息，并按菜单项 `key` 覆盖默认值或追加菜单：

```js
// model/commerce/project/store-a.js
module.exports = {
	name: "A 店铺",
	desc: "A 店铺管理后台",
	homePage: "/todo",
	menu: [
		{ key: "product", name: "店铺商品" },
		{
			key: "orders",
			name: "订单管理",
			menuType: "module",
			moduleType: "custom",
			customConfig: { path: "/todo" },
		},
	],
};
```

目录名 `commerce` 和文件名 `store-a` 分别成为 Model key 和 Project key；扫描器会自动注入 `key`、`modelKey`，不要手动填写。Project 与 Model 的菜单按 `key` 深度合并：相同 key 继承并覆盖字段，新增 key 追加到菜单末尾。`homePage` 是 Dashboard 页面内路由，不包含 `/view/dashboard` 前缀。菜单模块类型包括 `custom`、`iframe`、`sider`、`schema`，分组菜单使用 `menuType: "group"` 与 `subMenu`。

默认项目 API 可用于读取扫描结果：

- `GET /api/project/model_list`：Model 与 Project 的摘要列表。
- `GET /api/project/list`：Project 列表；传 `projectKey` 可筛选项目。
- `GET /api/project?projectKey=store-a`：读取指定 Project 与 Model 合并后的完整配置。

上面的示例使用 `custom` 模块；复杂菜单、`schema` 模块、字段选项、动态表单及接口契约见 [Dashboard DSL 编写指南](model/docs/dsl-guide.md) 和 [Model 字段参考](model/docs/dashboard-model.md)。

## 页面开发与构建

页面放在业务项目的 `app/pages/<page-name>/`，Webpack 会发现 `entry.*.js` 作为页面入口，页面可通过 `/view/<page-name>` 访问。当前仓库提供页面脚手架；从 Lumfall 仓库根目录运行可生成框架仓库自己的页面：

```sh
pnpm new-page dashboard
pnpm new-page project-list --header
```

脚手架以当前工作目录为目标：页面名必须是 kebab-case，已存在的同名目录会被拒绝，加 `--header` 会额外生成带 `HeaderContainer` 的页面。如果业务项目通过相邻目录安装 Lumfall，也可从业务项目根目录执行 `node ../lumfall/scripts/generate-page.js dashboard`（按实际安装路径调整），或把它接到自己的脚本里：

```json
{
	"scripts": {
		"new-page": "node ./node_modules/lumfall/scripts/generate-page.js"
	}
}
```

业务项目可在自己的 `build.js` 中调用框架构建入口：

```js
const { frontendBuild } = require("lumfall");

frontendBuild(process.env._ENV);
```

然后在业务项目的 `package.json` 中定义所需的构建命令，例如：

```json
{
	"scripts": {
		"build:dev": "_ENV=local node build.js",
		"build:prod": "_ENV=prod node build.js"
	}
}
```

`frontendBuild("local")` 会启动 Webpack 开发服务（默认 `127.0.0.1:9002`，产物在 `app/public/dist/dev/`），`frontendBuild("prod")` 输出到 `app/public/dist/prod/`；并把页面模板写到 `app/public/dist/dev|prod/entry.<name>.tpl`（按模式分目录），供 `/view/<name>` 渲染。具体 Webpack 配置可在业务项目的 `app/webpack.config.js` 中扩展。

## 仓库开发命令

在 Lumfall 仓库根目录安装依赖后，可用脚本只有以下三个：

| 命令 | 用途 |
| --- | --- |
| `pnpm test` | 运行 Mocha 测试（`_ENV=local`） |
| `pnpm lint` | ESLint 检查并自动修复 JS/Vue 文件 |
| `pnpm new-page <name> [--header]` | 在 `app/pages/` 下生成页面模板 |

仓库自身没有 `build:*`、`start:*` 或 `dev` 脚本：前端构建与启动入口都由业务项目负责。需要在框架仓库内临时验证时，可直接调用构建入口：

```sh
_ENV=local node -e "require('./index').frontendBuild('local')"  # 开发构建服务
_ENV=prod node -e "require('./index').frontendBuild('prod')"    # 生产构建
```

根目录的 `index.js` 只是模块入口，直接执行不会启动 HTTP 服务；业务项目应由自己的入口调用 `serviceStart()`。

## 测试矩阵

`pnpm test` 覆盖以下核心契约：

| 范围 | 覆盖内容 |
| --- | --- |
| 健康检查 | `/health/live` 不触发依赖检查；`/health/ready` 全部通过返回 200，失败或超时返回 503 且不泄露探针错误 |
| 框架 API | `/api/project/model_list`、`/api/project/list`、`/api/project` 及其 router-schema 参数校验（`projectKey` 必填、查不到项目返回业务错误码） |
| loader | controller、service、middleware、extend、router-schema 的有效导出挂载；非法导出抛出 `[<loader>]` 前缀错误 |
| config | 默认/环境配置合并优先级、导出形状校验、`configSchema` 校验与字段级错误定位 |
| 路由对齐 | router-schema 的 path 与 method 必须匹配已注册路由，method 必须小写 |
| security | `project_key` 豁免/拒绝/透传、签名验签与时间戳窗口，以及参数校验失败返回 `442` |
| 页面 | 同源页面重名报错、业务页覆盖框架页、未知页面返回 `4041`、模板缺失返回 `5031` |
| 生命周期 | 启动 hook 顺序、`onError` 回传并重抛、未知或异步启动 hook 被拒绝、`app.stop()` 等待 teardown |
| 插件 | 依赖拓扑排序、重复名称、缺失依赖、循环依赖、异步注册与非法返回值 |
| diagnostics | 清单结构稳定、可序列化、页面入口相对路径与来源标注 |
| monitoring | 未配置时纯 passthrough、trace id 生成与复用、自定义 trace header、hook 自身异常不影响响应 |
| 脚手架 | 生成入口与组件、`--header` 使用框架别名、非法参数与已存在目录被拒绝 |

测试通过 `PORT=0` 使用随机端口并在结束后等待 server 关闭，因此可重复运行，不依赖固定端口是否空闲。

## 请求观测（Monitoring 与 tracing）

`serviceStart({ monitoring })` 是可选的请求级观测入口；不配置时监控中间件为纯 passthrough，不写入任何响应头。配置后该中间件位于 `errorHandler` 内侧，因此内层抛出的异常会先被记录，再交给 `errorHandler` 渲染响应。

```js
serviceStart({
  monitoring: {
    traceHeader: "x-trace-id", // 可选，默认 x-trace-id
    onRequestStart({ traceId, method, path }) {},
    onRequestEnd({ traceId, method, path, status, durationMs }) {},
    onRequestError({ traceId, method, path, error, durationMs }) {},
  },
});
```

生命周期：`onRequestStart` 在进入内层中间件前触发；请求正常结束时触发 `onRequestEnd`（携带最终 `status` 与 `durationMs`）；内层抛错时触发 `onRequestError`（携带 `error` 与 `durationMs`）后原样重抛。

关联规则：请求头 `traceHeader` 非空时直接复用，否则生成一个 trace id，并通过同名响应头回显。trace id 同时写入 `ctx.traceId`。hook 抛出的异常只记录 warning，不会改变响应状态、响应体或原始错误；配置中的未知键、非函数 hook、空 `traceHeader` 会在启动时报错。

## 健康检查

- `GET /health/live`：存活探针，只检查服务进程能否响应。
- `GET /health/ready`：就绪探针，并行执行已注册的依赖检查；全部通过返回 200，任一失败或超时返回 503。
- `/view/health`：人工查看 live/ready 状态与各依赖探针结果的页面。

两个探针都返回 `Cache-Control: no-store`，响应只包含探针名称与状态，不返回错误对象或连接信息。探针注册方式、超时行为和部署建议见[健康检查文档](docs/health-check.md)。
