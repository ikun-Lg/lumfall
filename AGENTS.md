# AGENTS.md

Koa-based full-stack framework ("全栈框架"), published to npm as `lumfall`. `lumfall-core/` is the framework core, `app/` is the framework's built-in business code (health page, dashboard, view controller), and `config/` holds framework defaults. A sibling repository `lumfall-demo/` is a real business project that consumes this package via `require("lumfall")`.

## Layout & entrypoints

- `index.js` (root) — module entry: exports `Controller.Base`, `Service.Base`, `frontendBuild(env)` (only `local`/`prod`) and `serviceStart(options)`. Executing this file directly does **not** start an HTTP server.
- `lumfall-core/index.js` — app bootstrap: creates the Koa app, runs loaders in a fixed order, registers plugins and global middleware, starts the router, builds `app.diagnostics`, then `app.listen` on `PORT` (default 3000) / `IP` (default 0.0.0.0). Exposes `app.stop()` for teardown.
- `lumfall-core/loader/` — one loader per concern, all invoked as `loader(app)` synchronously during `start()`
- `lumfall-core/page-manifest.js` — shared `entry.*.js` page discovery used by both webpack and the view controller
- `lumfall-core/diagnostics.js` — `app.diagnostics.getManifest()`
- `lumfall-core/plugins.js` — dependency-ordered plugin registry
- `scripts/generate-page.js` — `pnpm new-page` scaffolding CLI
- `app/` — framework business code root; **`app.businessPath` = `process.cwd()/app`, not `__dirname`**

## Conventions (easy to miss)

- **Every loader is a factory**: `module.exports = (app) => {...}`, called with the Koa app instance during `start()`. Loaders attach to `app` (e.g. `app.middlewares`, `app.controllers`, `app.services`, `app.config`, `app.routerSchema`).
- **Loader execution order matters** (in `lumfall-core/index.js`): middleware → router-schema → controller → service → config → extend → router. E.g. middleware loads before config, so don't read `app.config` at load time — only inside request-time closures.
- **kebab/snake-case → camelCase** when exposing files: `app/middleware/custom-module/custom-middleware.js` becomes `app.middlewares.customModule.customMiddleware` (see `loader/middleware.js`, the reference implementation).
- **Middleware files export a factory**: `module.exports = (app) => (ctx, next) => {...}` — the loader invokes it with `app` at load time.
- **Env**: `process.env._ENV` ∈ `local | beta | prod`, defaults to `local` (`lumfall-core/env.js`). Not NODE_ENV.
- **File discovery**: use `glob` v7 (`glob.sync("**/*.js", { cwd: dir })`), already a dependency.
- **Path handling**: use `path.sep` (via `path.join`/`path.resolve`) instead of hardcoding `/` when building or splitting paths. Exception: `glob` v7 always returns `/`-separated results regardless of platform, so split glob output on `/` (or normalize it first).

## Robustness (loader conventions)

- **Resolve under `app.businessPath`, never `app.baseDir`/`__dirname`**: business dirs (`config/`, `controller/`, `service/`, ...) all live inside `app/`. Using `baseDir` silently points at the repo root and loads nothing.
- **Guard optional dirs**: check `fs.existsSync(dir)` before globbing when the directory may not exist (`config`, `router-schema`) — return early, don't throw. Required dirs (`middleware`, `controller`, `service`) let the missing-dir error surface naturally.
- **Fail fast on invalid exports**: throw descriptive errors (prefix `[<loader>]`) when a module exports the wrong shape — config must be a plain object, controller/service factories must return a class — never silently skip or merge garbage.
- **Fallback when dependencies are absent**: use optional chaining for optional app deps (e.g. `app.env?.get`), fall back to `local`. Do not assume every loader ran before you.
- **Never swallow errors**: no empty catch blocks. A loader error during `start()` is a programming error and should crash startup loudly, not be logged-and-ignored.

## Status

All loaders are implemented (`middleware`, `router-schema`, `controller`, `service`, `config`, `extend`, `router`), together with lifecycle hooks, the plugin registry, the diagnostics manifest, opt-in monitoring, the security policy middleware pair, page-manifest validation and the page scaffolding CLI. `pnpm test` covers these contracts.

## Commands

- Test: `pnpm test` (`_ENV=local` + Mocha; suites bind `PORT=0`, so they do not need a free fixed port)
- Lint: `pnpm lint` (`eslint --fix --ext js,vue .`)
- Scaffold: `pnpm new-page <name> [--header]`
- This repo has **no** `build:*`, `start:*` or `dev` script; frontend build and server startup belong to the business project (`lumfall-demo/` has `build:dev` / `build:prod` / `dev` / `prod`)
- `node --check <file>` for quick syntax verification
- `ghooks` + `validate-commit-msg` validate commit messages on commit (conventional commits)
- Releases are manual: bump `version`, commit, tag `vX.Y.Z`, then `npm publish --registry=https://registry.npmjs.org/`. npm 2FA is `auth-and-writes`, so the OTP must be typed by a human.
