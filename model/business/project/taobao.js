module.exports = {
  name: "淘宝",
  desc: "淘宝是中国最大的电子商务平台之一，提供商品买卖、物流配送等服务。",
  homePage: "",
  menu: [{
    key: "order",
    moduleType: "iframe",
    iframeConfig: {
      path: "http://www.taobao.com",
    }
  }, {
    key: "operation",
    name: "运营管理",
    menuType: "module",
    moduleType: "sider",
    siderConfig: {
      menu: [{
        key: "cpopon",
        name: "优惠券",
        menuType: "module",
        customConfig: {
          path: "taobao/cpopon",
        }
      }, {
        key: "limit",
        name: "限免",
        menuType: "module",
        customConfig: {
          path: "taobao/limit",
        }
      }, {
        key: "festival",
        name: "节日",
        menuType: "module",
        customConfig: {
          path: "taobao/festival",
        }
      }]
    }
  }]
}
