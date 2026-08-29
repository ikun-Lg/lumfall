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

  it("启动服务", async () => {
    // bind to an ephemeral port so the dev server (3000) never collides
    app = await sunsetCore.start();
    // drive the Koa request listener directly, no extra socket needed
    request = supertest(app.listen());
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

  after(() => {
    if (app && app.server) {
      app.server.close();
    }
  });
});
