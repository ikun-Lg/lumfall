module.exports = (app) => {
  const BaseService = require("./base")(app);

  // 商品类型枚举（与 model/business/model.js 商品管理 schema 的 productType 字段对应）
  const PRODUCT_TYPE_ENUM_LIST = [
    { label: "电子数码", value: "electronics" },
    { label: "服饰鞋包", value: "clothing" },
    { label: "家居生活", value: "home" },
  ];

  // mock 数据池（基于 model/business/model.js 中商品管理 schema 的字段定义）
  const mockPool = Array.from({ length: 126 }, (_, i) => ({
    productId: `P${String(i + 1).padStart(6, "0")}`,
    productName: `测试商品${i + 1}`,
    productType: PRODUCT_TYPE_ENUM_LIST[i % PRODUCT_TYPE_ENUM_LIST.length].value,
    status: i % 2 === 0 ? "1" : "0",
    price: Math.round(Math.random() * 10000) / 100,
    inventory: Math.floor(Math.random() * 5000),
    createTime: new Date(Date.now() - i * 86400000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " "),
  }));

  return class BusinessService extends BaseService {
    /**
     * 获取业务列表（mock）
     * @param {{ page: number, size: number }} param0
     */
    getBusinessList({ page = 1, size = 50 }) {
      const start = (page - 1) * size;
      const end = start + size;
      const data = mockPool.slice(start, end);

      return {
        data,
        total: mockPool.length,
      };
    }

    /**
     * 删除业务数据（mock）
     * @param {{ productId: string }} param0
     * @returns {boolean} 是否删除成功
     */
    deleteBusinessList({ productId }) {
      const index = mockPool.findIndex((item) => item.productId === productId);

      if (index === -1) {
        return false;
      }

      mockPool.splice(index, 1);
      return true;
    }

    /**
     * 获取商品类型枚举列表（供搜索栏 dynamicSelect 拉取选项）
     * @returns {Array<{label: string, value: string}>}
     */
    getProductEnumList() {
      return PRODUCT_TYPE_ENUM_LIST.map(({ label, value }) => ({ label, value }));
    }
  };
};
