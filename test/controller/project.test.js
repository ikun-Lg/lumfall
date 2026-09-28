const assert = require("assert");
const supertest = require("supertest");
const md5 = require("md5");
const sunsetCore = require("../../sunset-core");

const signKey = "sunset"; // must match app/middleware/api-sign-verify.js
const st = Date.now();

describe("测试project 相关接口", function () {
  this.timeout(60000);

  let app;
  let request;
  let createdProductId;

  it("启动服务", async () => {
    // bind to an ephemeral port so the dev server (3000) never collides
    app = await sunsetCore.start();
    // drive the Koa request listener directly, no extra socket needed
    request = supertest(app.listen());
  });

  it("POST /api/project/product — 创建商品", async () => {
    const res = await request
      .post("/api/project/product")
      .set("s_t", st)
      .set("s_sign", md5(`${signKey}_${st}`))
      .set("project_key", "test-project")
      .send({ productName: "新增测试商品", price: 12.5, inventory: 20 });

    assert.strictEqual(res.status, 200, "响应状态码应为 200");
    assert.strictEqual(res.body.success, true, "创建成功时 success 应为 true");
    assert.strictEqual(res.body.data.productName, "新增测试商品");
    assert.strictEqual(res.body.data.price, 12.5);
    assert.strictEqual(res.body.data.inventory, 20);
    assert.match(res.body.data.productId, /^P\d{6}$/);
    createdProductId = res.body.data.productId;
  });

  it("GET /api/project/product — 获取单个商品", async () => {
    const res = await request
      .get("/api/project/product")
      .query({ productId: createdProductId })
      .set("s_t", st)
      .set("s_sign", md5(`${signKey}_${st}`))
      .set("project_key", "test-project");

    assert.strictEqual(res.status, 200, "响应状态码应为 200");
    assert.strictEqual(res.body.success, true, "查询成功时 success 应为 true");
    assert.strictEqual(res.body.data.productId, createdProductId);
    assert.strictEqual(res.body.data.productName, "新增测试商品");
  });

  it("PUT /api/project/product — 更新商品", async () => {
    const res = await request
      .put("/api/project/product")
      .set("s_t", st)
      .set("s_sign", md5(`${signKey}_${st}`))
      .set("project_key", "test-project")
      .send({
        productId: createdProductId,
        productName: "更新后的测试商品",
        price: 18.5,
        inventory: 35,
      });

    assert.strictEqual(res.status, 200, "响应状态码应为 200");
    assert.strictEqual(res.body.success, true, "更新成功时 success 应为 true");
    assert.strictEqual(res.body.data.productId, createdProductId);
    assert.strictEqual(res.body.data.productName, "更新后的测试商品");
    assert.strictEqual(res.body.data.price, 18.5);
    assert.strictEqual(res.body.data.inventory, 35);
  });

  it("GET /api/project/model_list", async () => {
    const res = await request
      .get("/api/project/model_list")
      .set("s_t", st)
      .set("s_sign", md5(`${signKey}_${st}`));

    // transport layer
    assert.strictEqual(res.status, 200, "响应状态码应为 200");
    assert.match(res.headers["content-type"], /application\/json/, "响应应为 JSON");

    // union response envelope
    assert.strictEqual(res.body.success, true, "success 字段应为 true");
    assert(res.body.code === undefined, "成功响应不应携带 code");
    assert(res.body.message === undefined, "成功响应不应携带 message");

    // data is a non-empty array
    const { data } = res.body;
    assert(Array.isArray(data), "data 应为数组");
    assert(data.length > 0, "data 不应为空");

    // each item: model + project
    for (const item of data) {
      assert(item && typeof item === "object", "每个元素应为对象");

      assert(item.model && typeof item.model === "object", "item.model 应为对象");
      assert.strictEqual(typeof item.model.key, "string", "item.model.key 应为字符串");
      assert.strictEqual(typeof item.model.name, "string", "item.model.name 应为字符串");
      // assert("desc" in item.model, "item.model 应包含 desc 字段");

      assert(item.project && typeof item.project === "object", "item.project 应为对象");
      assert(!Array.isArray(item.project), "item.project 应为键值对象而非数组");

      const projectKeys = Object.keys(item.project);
      assert(projectKeys.length > 0, "item.project 不应为空");

      for (const projectKey of projectKeys) {
        const project = item.project[projectKey];
        assert(project && typeof project === "object", "project 应为对象");
        assert.strictEqual(project.key, projectKey, "project.key 应与外层键一致");
        assert.strictEqual(typeof project.name, "string", "project.name 应为字符串");
        assert.strictEqual(typeof project.desc, "string", "project.desc 应为字符串");
        // assert.strictEqual(typeof project.homePage, "string", "project.homePage 应为字符串");
      }
    }

    // known models from the business code are present
    const modelKeys = data.map((item) => item.model.key);
    for (const expected of ["business", "course"]) {
      assert(modelKeys.includes(expected), `data 应包含模型 ${expected}`);
    }
  });

  it("GET /api/project/list", async () => {
    const res = await request
      .get("/api/project/list")
      .set("s_t", st)
      .set("s_sign", md5(`${signKey}_${st}`));

    // transport layer
    assert.strictEqual(res.status, 200, "响应状态码应为 200");
    assert.match(res.headers["content-type"], /application\/json/, "响应应为 JSON");

    // union response envelope
    assert.strictEqual(res.body.success, true, "success 字段应为 true");
    assert(res.body.code === undefined, "成功响应不应携带 code");
    assert(res.body.message === undefined, "成功响应不应携带 message");

    // data 是所有模型下项目的扁平数组
    const { data } = res.body;
    assert(Array.isArray(data), "data 应为数组");
    assert(data.length > 0, "data 不应为空");

    for (const item of data) {
      assert(item && typeof item === "object", "每个元素应为对象");
      assert.strictEqual(typeof item.key, "string", "item.key 应为字符串");
      assert.strictEqual(typeof item.name, "string", "item.name 应为字符串");
      assert.strictEqual(typeof item.desc, "string", "item.desc 应为字符串");
      // homePage 可能为空串；扁平化后的数据里 modelKey 恒为 undefined
      assert(item.homePage === undefined || typeof item.homePage === "string", "item.homePage 应为字符串或空");
    }

    // 已知项目（business: pdd/taobao, course: bilibili/douyin）都应出现
    const projectKeys = data.map((item) => item.key);
    for (const expected of ["pdd", "taobao", "bilibili", "douyin"]) {
      assert(projectKeys.includes(expected), `data 应包含项目 ${expected}`);
    }

    // projectKey 过滤：不存在的 key 应返回空数组
    const res2 = await request
      .get("/api/project/list")
      .query({ projectKey: "not_exist_key" })
      .set("s_t", st)
      .set("s_sign", md5(`${signKey}_${st}`));

    assert.strictEqual(res2.status, 200, "过滤请求状态码应为 200");
    assert.strictEqual(res2.body.success, true, "过滤成功响应 success 应为 true");
    assert.deepStrictEqual(res2.body.data, [], "不存在的 projectKey 应返回空数组");

    // projectKey 过滤：存在的 key 应返回对应模型下的项目
    const res3 = await request
      .get("/api/project/list")
      .query({ projectKey: "pdd" })
      .set("s_t", st)
      .set("s_sign", md5(`${signKey}_${st}`));

    assert.strictEqual(res3.status, 200, "过滤请求状态码应为 200");
    assert(Array.isArray(res3.body.data), "过滤结果应为数组");
    assert(res3.body.data.length > 0, "存在 projectKey 应返回非空数组");
    for (const item of res3.body.data) {
      assert.strictEqual(typeof item.key, "string", "过滤结果 item.key 应为字符串");
    }
  });

  it("GET /api/project/list (without projectKey) — 返回全部项目的扁平数组", async () => {
    const res = await request
      .get("/api/project/list")
      .set("s_t", st)
      .set("s_sign", md5(`${signKey}_${st}`));

    // transport layer
    assert.strictEqual(res.status, 200, "响应状态码应为 200");
    assert.match(res.headers["content-type"], /application\/json/, "响应应为 JSON");

    // union response envelope
    assert.strictEqual(res.body.success, true, "success 字段应为 true");
    assert(res.body.code === undefined, "成功响应不应携带 code");
    assert(res.body.message === undefined, "成功响应不应携带 message");

    // data 应为包含所有项目的非空数组
    const { data } = res.body;
    assert(Array.isArray(data), "data 应为数组");
    assert(data.length > 0, "data 不应为空");

    // 每个元素的基本结构校验
    for (const item of data) {
      assert(item && typeof item === "object", "每个元素应为对象");
      assert.strictEqual(typeof item.key, "string", "item.key 应为字符串");
      assert.strictEqual(typeof item.name, "string", "item.name 应为字符串");
      assert.strictEqual(typeof item.desc, "string", "item.desc 应为字符串");
      assert(item.homePage === undefined || typeof item.homePage === "string", "item.homePage 应为字符串或空");
    }

    // 从 model_list 动态获取全部期望的项目 key，避免硬编码
    const resModelList = await request
      .get("/api/project/model_list")
      .set("s_t", st)
      .set("s_sign", md5(`${signKey}_${st}`));

    const expectedKeys = [];
    for (const modelItem of resModelList.body.data) {
      for (const pKey in modelItem.project) {
        expectedKeys.push(pKey);
      }
    }

    // 不带 projectKey 时应返回全部项目（与 model_list 中的项目集合一致）
    const projectKeys = data.map((item) => item.key);
    assert.strictEqual(
      projectKeys.length,
      expectedKeys.length,
      "不带 projectKey 返回的项目数量应与 model_list 一致",
    );
    for (const expected of expectedKeys) {
      assert(projectKeys.includes(expected), `data 应包含项目 ${expected}`);
    }

    // 不带 projectKey 时返回的数据量应 >= 任一 projectKey 过滤的结果
    // 取第一个项目 key 做过滤对比
    const sampleKey = expectedKeys[0];
    const resFiltered = await request
      .get("/api/project/list")
      .query({ projectKey: sampleKey })
      .set("s_t", st)
      .set("s_sign", md5(`${signKey}_${st}`));

    assert(Array.isArray(resFiltered.body.data), "过滤结果应为数组");
    assert(
      data.length >= resFiltered.body.data.length,
      "不带 projectKey 的返回数量应不少于带 projectKey 的返回数量",
    );
  });

  it("GET /api/project — 缺少 projectKey 应失败", async () => {
    const res = await request
      .get("/api/project")
      .set("s_t", st)
      .set("s_sign", md5(`${signKey}_${st}`));

    // router-schema 声明了 required: ["projectKey"]，缺少时应被拦截
    assert.strictEqual(res.status, 200, "响应状态码应为 200");
    assert.match(res.headers["content-type"], /application\/json/, "响应应为 JSON");
    assert.strictEqual(res.body.success, false, "缺少 projectKey 时 success 应为 false");
  });

  it("GET /api/project?projectKey=pdd — 返回对应项目的完整配置", async () => {
    const res = await request
      .get("/api/project")
      .query({ projectKey: "pdd" })
      .set("s_t", st)
      .set("s_sign", md5(`${signKey}_${st}`));

    // transport layer
    assert.strictEqual(res.status, 200, "响应状态码应为 200");
    assert.match(res.headers["content-type"], /application\/json/, "响应应为 JSON");

    // union response envelope
    assert.strictEqual(res.body.success, true, "success 字段应为 true");
    assert(res.body.code === undefined, "成功响应不应携带 code");
    assert(res.body.message === undefined, "成功响应不应携带 message");

    // data 应为项目配置对象
    const { data } = res.body;
    assert(data && typeof data === "object", "data 应为对象");
    assert(!Array.isArray(data), "data 不应为数组");

    // 项目的基本字段
    assert.strictEqual(data.key, "pdd", "data.key 应为 pdd");
    assert.strictEqual(typeof data.name, "string", "data.name 应为字符串");
    assert.strictEqual(typeof data.desc, "string", "data.desc 应为字符串");
    assert.strictEqual(typeof data.modelKey, "string", "data.modelKey 应为字符串");
    assert.strictEqual(data.modelKey, "business", "data.modelKey 应为 business");

    // 项目应包含 menu（由 model extend 而来）
    assert(Array.isArray(data.menu), "data.menu 应为数组");
    assert(data.menu.length > 0, "data.menu 不应为空");

    // menu 中应包含 model 级别的 key（如 order，只在 model 中定义）
    const menuKeys = data.menu.map((item) => item.key);
    assert(menuKeys.includes("order"), "menu 应包含 model 级别的 order 项");
    // menu 中应包含 project 级别的 key（如 product）
    assert(menuKeys.includes("product"), "menu 应包含 product 项");
  });

  it("GET /api/project?projectKey=taobao — 返回 taobao 项目配置", async () => {
    const res = await request
      .get("/api/project")
      .query({ projectKey: "taobao" })
      .set("s_t", st)
      .set("s_sign", md5(`${signKey}_${st}`));

    assert.strictEqual(res.status, 200, "响应状态码应为 200");
    assert.strictEqual(res.body.success, true, "success 字段应为 true");
    assert.strictEqual(res.body.data.key, "taobao", "data.key 应为 taobao");
    assert.strictEqual(res.body.data.modelKey, "business", "data.modelKey 应为 business");
  });

  it("GET /api/project?projectKey=bilibili — 跨模型返回 course 下的项目", async () => {
    const res = await request
      .get("/api/project")
      .query({ projectKey: "bilibili" })
      .set("s_t", st)
      .set("s_sign", md5(`${signKey}_${st}`));

    assert.strictEqual(res.status, 200, "响应状态码应为 200");
    assert.strictEqual(res.body.success, true, "success 字段应为 true");
    assert.strictEqual(res.body.data.key, "bilibili", "data.key 应为 bilibili");
    assert.strictEqual(res.body.data.modelKey, "course", "data.modelKey 应为 course");
  });

  it("GET /api/project?projectKey=not_exist — 不存在的项目应返回失败", async () => {
    const res = await request
      .get("/api/project")
      .query({ projectKey: "not_exist_key" })
      .set("s_t", st)
      .set("s_sign", md5(`${signKey}_${st}`));

    assert.strictEqual(res.status, 200, "响应状态码应为 200");
    assert.strictEqual(res.body.success, false, "不存在的项目 success 应为 false");
    assert.strictEqual(res.body.code, 50000, "不存在的项目 code 应为 50000");
    assert.strictEqual(typeof res.body.message, "string", "失败响应应携带 message");
  });

  after(() => {
    if (app && app.server) {
      app.server.close();
    }
  });
});
