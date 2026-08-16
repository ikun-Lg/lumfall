# AGENTS.md

Early-stage Koa-based full-stack framework ("全栈框架"). `sunset-core/` is the framework core; `app/` is where business code lives. Only 2 commits — most of the framework is still stubs.

## Layout & entrypoints

- `index.js` (root) — entrypoint: calls `SunsetCore.start({...})`
- `sunset-core/index.js` — app bootstrap: creates Koa app, runs loaders in fixed order, `app.listen` on `PORT` (default 3000) / `IP` (default 0.0.0.0)
- `sunset-core/loader/` — one loader per concern, all invoked as `loader(app)` synchronously during `start()`
- `app/` — business code root; **`app.businessPath` = `process.cwd()/app`, not `__dirname`**

## Conventions (easy to miss)

- **Every loader is a factory**: `module.exports = (app) => {...}`, called with the Koa app instance during `start()`. Loaders attach to `app` (e.g. `app.middleware`, `app.config`, `app.service`).
- **Loader execution order matters** (in `sunset-core/index.js`): middleware → router-schema → controller → service → config → extend → router. E.g. middleware loads before config, so don't read `app.config` at load time — only inside request-time closures.
- **kebab/snake-case → camelCase** when exposing files: `app/middleware/custom-module/custom-middleware.js` becomes `app.middleware.customModule.customMiddleware` (see `loader/middleware.js`, the reference implementation).
- **Middleware files export a factory**: `module.exports = (app) => (ctx, next) => {...}` — the loader invokes it with `app` at load time.
- **Env**: `process.env._ENV` ∈ `local | beta | prod`, defaults to `local` (`sunset-core/env.js`). Not NODE_ENV.
- **File discovery**: use `glob` v7 (`glob.sync("**/*.js", { cwd: dir })`), already a dependency.
- **Path handling**: use `path.sep` (via `path.join`/`path.resolve`) instead of hardcoding `/` when building or splitting paths. Exception: `glob` v7 always returns `/`-separated results regardless of platform, so split glob output on `/` (or normalize it first).

## Status

Unimplemented stubs (empty `module.exports = (app) => {}`): `loader/controller.js`, `loader/service.js`, `loader/config.js`, `loader/extend.js`, `loader/router.js`, `loader/router-schema.js`. `loader/middleware.js` and `env.js` are done. Follow the middleware loader's factory style when implementing the rest.

## Commands

- Lint: `pnpm lint` (runs `eslint --fix --ext js,vue .`) — this is the **only** npm script; there is no test/build/start script yet
- `node --check <file>` for syntax verification
- Dependencies live in root `node_modules`; framework files must be run from repo root or with `NODE_PATH` set
- `ghooks` validates commit messages on commit (`validate-commit-msg`); commits so far use `init: <描述>` style
