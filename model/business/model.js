module.exports = {
  model: "dashboard",
  name: "电商系统",
  menu: [
    {
      key: "product",
      name: "商品管理",
      menuType: "module",
      moduleType: "schema",
      schemaConfig: {
        api: "/api/project/product",
        schema: {
          type: "object",
          properties: {
            productId: {
              type: "string",
              label: "商品ID",
              tableOption: {
                width: 300,
                ellipsis: true,
                tooltip: true,
              },
            },
            productName: {
              type: "string",
              label: "商品名称",
              tableOption: {
                width: 200,
              },
              searchOption: {
                componentType: "input",
                default: "",
                placeholder: "请输入商品名称",
                allowClear: true,
              },
            },
            productType: {
              type: "string",
              label: "商品类型",
              tableOption: {
                width: 160,
                enumList: [
                  { label: "电子产品", value: "electronics" },
                  { label: "服装鞋帽", value: "clothing" },
                  { label: "家居用品", value: "home" },
                ],
              },
              searchOption: {
                componentType: "dynamicSelect",
                default: "",
                api: "/api/project/productEnum/list",
              },
            },
            status: {
              type: "string",
              label: "上架状态",
              tableOption: {
                width: 120,
                enumList: [
                  { label: "上架", value: "1" },
                  { label: "下架", value: "0" },
                ],
              },
              searchOption: {
                componentType: "select",
                default: "",
                enumList: [
                  { label: "上架", value: "1" },
                  { label: "下架", value: "0" },
                ],
              },
            },
            price: {
              type: "number",
              label: "价格",
              tableOption: {
                width: 200,
              },
            },
            inventory: {
              type: "number",
              label: "库存",
              tableOption: {
                width: 200,
              },
            },
            createTime: {
              type: "string",
              label: "创建时间",
              tableOption: {
                width: 180,
              },
              searchOption: {
                componentType: "dateRange",
                default: [],
                showTime: true,
                valueFormat: "YYYY-MM-DD HH:mm:ss",
              },
            },
          },
        },
        tableConfig: {
          headerButtons: [
            {
              label: "新增商品",
              eventKey: "showComponent",
              type: "outline",
            },
          ],
          rowButtons: [
            {
              label: "修改",
              eventKey: "edit",
              type: "warning",
            },
            {
              label: "删除",
              eventKey: "delete",
              type: "danger",
              eventOption: {
                params: {
                  productId: "schema::productId",
                },
              },
            },
          ],
        },
      },
    },
    {
      key: "order",
      name: "订单管理",
      menuType: "module",
      moduleType: "custom",
      customConfig: {
        path: "/order",
      },
    },
    {
      key: "client",
      name: "客户管理",
      menuType: "module",
      moduleType: "custom",
      customConfig: {
        path: "/todo",
      },
    },
  ],
};
