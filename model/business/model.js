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
              editFormOption: {
                componentType: "input",
                disabled: true,
              },
              detailPanelOption: {},
            },
            productName: {
              type: "string",
              label: "商品名称",
              maxLength: 10,
              minLength: 3,
              tableOption: {
                width: 200,
              },
              searchOption: {
                componentType: "input",
                default: "",
                placeholder: "请输入商品名称",
                allowClear: true,
                api: "/api/project/productEnum/list",
              },
              createFormOption: {
                componentType: "input",
                default: "10086",
              },
              editFormOption: {
                componentType: "input",
                // visible: false,
              },
              detailPanelOption: {},
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
              detailPanelOption: {},
            },
            price: {
              type: "number",
              label: "价格",
              maximum: 1000,
              minimum: 30,
              tableOption: {
                width: 200,
              },
              createFormOption: {
                componentType: "inputNumber",
              },
              editFormOption: {
                componentType: "inputNumber",
              },
              detailPanelOption: {},
            },
            inventory: {
              type: "number",
              label: "库存",
              tableOption: {
                width: 200,
              },
              createFormOption: {
                componentType: "select",
                enumList: [
                  {
                    label: "全部",
                    value: -1,
                  },
                  {
                    label: "100",
                    value: 100,
                  },
                ],
              },
              editFormOption: {
                componentType: "select",
                enumList: [
                  {
                    label: "全部",
                    value: -1,
                  },
                  {
                    label: "100",
                    value: 100,
                  },
                ],
              },
              detailPanelOption: {},
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
              detailPanelOption: {},
            },
          },
          required: ["productName"],
        },
        tableConfig: {
          headerButtons: [
            {
              label: "新增商品",
              eventKey: "showComponent",
              type: "outline",
              eventOption: {
                comName: "createForm",
              },
            },
          ],
          rowButtons: [
            {
              label: "查看",
              eventKey: "showComponent",
              type: "primary",
              eventOption: {
                comName: "detailPanel",
              },
            },
            {
              label: "修改",
              eventKey: "showComponent",
              type: "warning",
              eventOption: {
                comName: "editForm",
              },
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
          componentConfig: {
            createForm: {
              title: "新增商品",
              saveBtnText: "新增商品",
            },
            editForm: {
              mainKey: "productId",
              title: "修改商品",
              saveBtnText: "修改商品",
            },
            detailPanel: {
              mainKey: "productId",
              title: "商品详情",
            },
          },
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
