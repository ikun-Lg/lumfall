# Lumfall 全栈框架

Lumfall 是基于 Koa 2 的 Node.js 全栈框架，提供按目录自动加载的服务端扩展、路由和控制器，以及基于 Vue 3 与 Webpack 的页面构建能力。框架代码位于 `lumfall-core/` 和内置 `app/`；使用者在自己的项目中提供业务目录 `app/`、`config/` 和服务启动入口。

## 功能概览

- 基于 Koa 的应用启动与中间件管线
- 自动加载业务 middleware、controller、service、extend、router 和 router-schema
- 按 `_ENV` 选择并合并默认配置与环境配置
- Vue 页面入口自动发现、开发构建和生产构建
- 内置健康检查接口与状态页

## 环境要求

- Node.js
- pnpm（仓库声明的包管理器版本为 `pnpm@10.30.0`）

## 在业务项目中使用

将 Lumfall 安装为业务项目依赖。例如，在与本仓库相邻的本地业务项目中：

```sh
pnpm add lumfall
```

在业务项目入口显式启动服务：

```js
const { serviceStart } = require("lumfall");

serviceStart({
	name: "My application",
	homePath: "/view/health",
});
```

`serviceStart(options)` 返回 Koa app。未匹配的请求会重定向到 `options.homePath`，缺省为 `/`。服务默认监听 `0.0.0.0:3000`，可通过 `IP` 和 `PORT` 环境变量调整。

在业务项目目录下运行启动入口，使框架能从当前工作目录解析 `app/` 和 `config/`：

```sh
_ENV=local node server.js
```

环境标识 `_ENV` 支持 `local`、`beta`、`prod`，缺省为 `local`。`NODE_ENV` 不控制 Lumfall 的配置环境。

## 目录约定

```text
your-app/
├── server.js                 # 调用 serviceStart() 的应用入口
├── config/
│   ├── config.default.js
│   ├── config.local.js       # 可选
│   ├── config.beta.js        # 可选
│   └── config.prod.js        # 可选
├── model/
│   └── <modelKey>/            # Dashboard 模型与项目配置
└── app/
		├── middleware.js         # 注册全局 Koa 中间件，可选
		├── middleware/           # 可复用中间件
		├── router/               # 路由注册
		├── router-schema/        # API 参数 JSON Schema
		├── controller/           # 请求处理
		├── service/              # 业务服务
		├── extend/                # 挂载到 Koa app 的扩展
		├── pages/                 # Vue 页面及 entry.*.js 入口
		└── public/                # 静态文件与页面构建产物
```

框架以启动时的 `process.cwd()` 作为业务项目根目录，因此应从业务项目根目录启动进程。

## Page manifest

Webpack 与运行时共用 `entry.<name>.js` 页面发现规则。框架页和业务页重名时业务页覆盖框架页；同一来源中出现重复 page name 会在构建/启动时给出两个冲突入口路径。`/view/<name>` 只渲染已发现的页面：未知页面返回 HTTP 404（code `4041`），已发现但缺少 `app/public/dist/entry.<name>.tpl` 构建产物时返回 HTTP 503（code `5031`），不会静默重定向首页。

## 自动加载约定

框架内置实现与业务项目中同名类别的文件都会加载。文件名和子目录名会转换为 camelCase，例如 `app/service/user-service.js` 会挂载为 `app.services.userService`，`app/middleware/admin/auth-check.js` 会挂载为 `app.middlewares.admin.authCheck`。

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

## Security policy

`config.security` 集中控制 API 签名和 project key 策略。默认签名验证关闭以兼容现有客户端，`/api/project/**` 的 project key 校验默认开启；`/api/project/model_list` 与 `/api/project/list` 默认不要求 project key。

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

签名启用后使用 `md5(secret + "_" + timestamp)`，时间戳与当前时间的差值不能超过 `maxAgeMs`。生产环境应从环境变量或密钥管理系统提供 `secret`，不要提交真实密钥。

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
## Security policy

`config.security` 集中控制 API 签名和 project key 策略。默认签名验证关闭以兼容现有客户端，`/api/project/**` 的 project key 校验默认开启；`/api/project/model_list` 与 `/api/project/list` 默认不要求 project key。

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

签名启用后使用 `md5(secret + "_" + timestamp)`，时间戳与当前时间的差值不能超过 `maxAgeMs`。生产环境应从环境变量或密钥管理系统提供 `secret`，不要提交真实密钥。
## Diagnostics manifest

启动后可通过 `app.diagnostics.getManifest()` 获取 JSON 可序列化的运行时清单，包含 Lumfall 版本/环境、加载器名称、注册路由及方法、发现的页面入口、health check 名称和超时。业务页面与框架页面重名时，清单与构建行为一致，由业务页面覆盖。清单不会复制配置对象、凭证、探针函数或异常详情。

## Dashboard Model 配置

Dashboard 使用 Model + Project 两层 CommonJS 配置：Model 声明可复用的菜单骨架，Project 声明具体项目的信息和菜单差异。框架启动时扫描业务项目根目录下的 `model/`，将每个 Project 与所属 Model 合并；因此这些配置不放在 `app/` 中。

```text
model/
└── commerce/                 # Model key 由目录名决定
		├── model.js              # 公共模型配置
		└── project/
				└── store-a.js        # Project key 由文件名决定
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

脚手架以当前工作目录为目标；如果业务项目通过相邻目录安装 Lumfall，也可从业务项目根目录执行 `node ../lumfall/scripts/generate-page.js dashboard`（按实际安装路径调整）。

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

构建产物写入业务项目的 `app/public/dist/`，生产资源位于 `app/public/dist/prod/`。具体 Webpack 配置可在业务项目的 `app/webpack.config.js` 中扩展。

## 仓库开发命令

在 Lumfall 仓库根目录安装依赖后，可使用：

| 命令 | 用途 |
| --- | --- |
| `pnpm test` | 运行 Mocha 测试 |
| `pnpm lint` | ESLint 检查并自动修复 JS/Vue 文件 |
| `pnpm build:dev` | 启动 Webpack 开发构建服务 |
| `pnpm build:prod` | 构建生产前端资源 |
| `pnpm new-page <name>` | 生成页面模板 |
| `pnpm start:prod` | 构建前端资源并启动仓库内应用 |

根目录的 `index.js` 是模块入口，不会在直接执行时启动 HTTP 服务。业务项目应由自己的入口调用 `serviceStart()`；`pnpm dev` 当前仅通过 nodemon 执行该模块，不会启动业务 HTTP 服务。

## 健康检查

- `GET /health/live`：存活探针，只检查服务进程能否响应。
- `GET /health/ready`：就绪探针，执行已注册的依赖检查。
- `/view/health`：人工查看状态的页面。

依赖探针注册方式、超时行为和部署建议见[健康检查文档](docs/health-check.md)。
