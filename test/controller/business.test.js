const assert = require("assert");
const supertest = require("supertest");
const md5 = require("md5");
const sunsetCore = require("../../sunset-core");

const signKey = "sunset";
const st = Date.now();

describe("测试商品业务接口", function () {
  this.timeout(60000);

  let app;
  let request;
  let createdProductId;

  it("启动服务", async () => {
    app = await sunsetCore.start();
    request = supertest(app.callback());
  });

  it("POST /api/project/product 创建商品", async () => {
    const res = await request
      .post("/api/project/product")
      .set("s_t", st)
      .set("s_sign", md5(`${signKey}_${st}`))
      .set("project_key", "test-project")
      .send({ productName: "新增测试商品", price: 12.5, inventory: 20 });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.productName, "新增测试商品");
    assert.strictEqual(res.body.data.price, 12.5);
    assert.strictEqual(res.body.data.inventory, 20);
    assert.match(res.body.data.productId, /^P\d{6}$/);
    createdProductId = res.body.data.productId;
  });

  it("GET /api/project/product 获取单个商品", async () => {
    const res = await request
      .get("/api/project/product")
      .query({ productId: createdProductId })
      .set("s_t", st)
      .set("s_sign", md5(`${signKey}_${st}`))
      .set("project_key", "test-project");

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.productId, createdProductId);
    assert.strictEqual(res.body.data.productName, "新增测试商品");
  });

  it("PUT /api/project/product 更新商品", async () => {
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

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.productId, createdProductId);
    assert.strictEqual(res.body.data.productName, "更新后的测试商品");
    assert.strictEqual(res.body.data.price, 18.5);
    assert.strictEqual(res.body.data.inventory, 35);
  });

  after(() => {
    if (app && app.server) {
      app.server.close();
    }
  });
});