/* eslint-disable vue/one-component-per-file */
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const routerLoader = require("../lumfall-core/loader/router");

describe("route and router-schema alignment", () => {
  let businessPath;

  beforeEach(() => {
    businessPath = fs.mkdtempSync(path.join(os.tmpdir(), "lumfall-routes-"));
    fs.mkdirSync(path.join(businessPath, "router"));
  });

  afterEach(() => {
    fs.rmSync(businessPath, { recursive: true, force: true });
  });

  function createApp(routerSchema) {
    const controllerMethod = () => {};

    return {
      businessPath,
      routerSchema,
      controllers: {
        health: { live: controllerMethod, ready: controllerMethod },
        project: {
          getModelList: controllerMethod,
          getProjectList: controllerMethod,
          getProject: controllerMethod,
        },
        view: { renderPage: controllerMethod },
      },
      use() {},
    };
  }

  it("accepts schema paths and lowercase methods registered by the router", () => {
    const app = createApp({
      "/api/project/model_list": { get: {} },
    });

    assert.doesNotThrow(() => routerLoader(app));
  });

  it("rejects schema paths that are not registered", () => {
    const app = createApp({ "/api/missing": { get: {} } });

    assert.throws(
      () => routerLoader(app),
      /\[router\].*\/api\/missing.*does not match a registered route/,
    );
  });

  it("rejects schema methods that are not registered for the path", () => {
    const app = createApp({
      "/api/project/model_list": { post: {} },
    });

    assert.throws(
      () => routerLoader(app),
      /\[router\].*method "post".*does not match a registered route/,
    );
  });

  it("rejects uppercase schema methods with an actionable message", () => {
    const app = createApp({
      "/api/project/model_list": { GET: {} },
    });

    assert.throws(
      () => routerLoader(app),
      /\[router\].*method "GET".*must be lowercase/,
    );
  });
});