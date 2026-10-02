# Dashboard DSL 编写规则

## 1. 概述

本系统通过 **Model + Project 两层 DSL** 来声明式地定义仪表盘（Dashboard）的菜单结构、模块类型和页面路由。DSL 以 CommonJS 模块的形式存放在 `model/` 目录下，启动时由 `model/index.js` 自动扫描、合并，最终通过 API 返回给前端 Dashboard 页面消费。

页面渲染方式由 `moduleType` 决定，目前支持四种：`custom`（自定义路由页）、`iframe`（嵌入页）、`sider`（侧边栏复合视图）、`schema`（schema 驱动的列表页，本项目的主要形态）。

### 核心设计理念

- **Model（模型）** 定义一个业务域的**公共默认配置**（如菜单骨架），可被多个 Project 继承。
- **Project（项目）** 定义一个具体项目的**差异化配置**，会与所属 Model 深度合并（`projectExtendModel`）。
- 合并后的完整配置即为前端拿到的最终项目配置。

### 目录结构

```
model/
├── index.js                  # 扫描器 + 合并引擎（不要手动改）
├── business/                 # ← Model: 电商系统
│   ├── model.js              #    Model 配置（公共默认）
│   └── project/              #    该 Model 下的各 Project
│       ├── jd.js             #    京东
│       ├── pdd.js            #    拼多多
│       └── taobao.js         #    淘宝
└── course/                   # ← Model: 课程系统
    ├── model.js              #    Model 配置（公共默认）
    └── project/
        ├── bilibili.js       #    B站课堂
        └── douyin.js         #    抖音课堂
```

### 约定

- **每个 Model 目录**下必须有 `model.js`；`project/` 子目录下放各 Project 文件。
- **Model 目录名** = Model 的 `key`（如 `business`、`course`）。
- **Project 文件名**（去掉 `.js`）= Project 的 `key`（如 `jd`、`pdd`）。
- `key` 和 `modelKey` 由扫描器自动注入，**不要手动写**。

---

## 2. Model 配置（`model.js`）

### 完整字段说明

| 字段    | 类型     | 必填 | 说明                                           |
| ------- | -------- | ---- | ---------------------------------------------- |
| `model` | `string` | 是   | 模式类型标识，目前固定为 `"dashboard"`          |
| `name`  | `string` | 是   | Model 显示名称（如 `"电商系统"`）              |
| `menu`  | `array`  | 是   | 默认菜单数组，定义该 Model 下所有 Project 共享的菜单骨架 |

### 示例（当前实际 `model/business/model.js`，含 schema + 动态表单/详情）

```js
// model/business/model.js
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
              tableOption: { width: 200 },
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
              tableOption: { width: 200 },
              createFormOption: { componentType: "inputNumber" },
              editFormOption: { componentType: "inputNumber" },
              detailPanelOption: {},
            },
            inventory: {
              type: "number",
              label: "库存",
              tableOption: { width: 200 },
              createFormOption: {
                componentType: "select",
                enumList: [
                  { label: "全部", value: -1 },
                  { label: "100", value: 100 },
                ],
              },
              editFormOption: {
                componentType: "select",
                enumList: [
                  { label: "全部", value: -1 },
                  { label: "100", value: 100 },
                ],
              },
              detailPanelOption: {},
            },
            createTime: {
              type: "string",
              label: "创建时间",
              tableOption: { width: 180 },
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
              eventOption: { comName: "detailPanel" },
            },
            {
              label: "修改",
              eventKey: "showComponent",
              type: "warning",
              eventOption: { comName: "editForm" },
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
      customConfig: { path: "/order" },
    },
    {
      key: "client",
      name: "客户管理",
      menuType: "module",
      moduleType: "custom",
      customConfig: { path: "/todo" },
    },
  ],
};
```

> schema 模块各字段的完整规则见 [第 6 节：schema 模块 DSL](#6-schema-模块-dslmoduletype-schema)；其中动态表单/详情（`createFormOption`/`editFormOption`/`detailPanelOption`、`componentConfig`）见 6.5 与 6.8 节。

### 作用

- Model 的 `menu` 作为**默认菜单骨架**，会被注入到该 Model 下每个 Project 中。
- Project 可以通过相同 `key` **覆盖**某个菜单项的属性，也可以**新增** Model 中不存在的菜单项。
- 如果 Project 中某个菜单项的 `key` 在 Model 中存在，则深度合并；不存在则追加到菜单末尾。

---

## 3. Project 配置（`project/*.js`）

### 完整字段说明

| 字段       | 类型     | 必填 | 说明                                                                 |
| ---------- | -------- | ---- | -------------------------------------------------------------------- |
| `name`     | `string` | 是   | 项目显示名称                                                         |
| `desc`     | `string` | 是   | 项目描述                                                             |
| `homePage` | `string` | 是   | 默认首页路径（如 `/schema?projectKey=pdd&key=product`）              |
| `menu`     | `array`  | 是   | 项目菜单数组，会与 Model 的 `menu` 深度合并                          |
| `icon`     | `string` | 否   | 项目图标（预留字段）                                                 |

> `homePage` 是**不带 `/view/dashboard` 前缀**的页面内路由，前端跳转时会自动拼接基址（见第 9.3 节）。

### 示例（实际 `pdd.js`）

```js
// model/business/project/pdd.js
module.exports = {
  name: "拼多多",
  desc: "拼多多是中国最大的电商平台之一，提供商品买卖、物流配送等服务。",
  homePage: "/schema?projectKey=pdd&key=product",
  menu: [
    // 1. 覆盖 Model 中 key="product" 的菜单项（只写差异字段，其余继承）
    { key: "product", name: "商品管理(pdd)" },
    // 2. 覆盖 Model 中 key="client" 的菜单项，改为 schema 模块
    {
      key: "client",
      name: "客户管理(pdd)",
      moduleType: "schema",
      schemaConfig: {
        api: "/api/client",
        schema: {},
      },
    },
    // 3. 新增 sider 模块（Model 中不存在的菜单项，追加到末尾）
    {
      key: "data",
      name: "数据管理(pdd)",
      menuType: "module",
      moduleType: "sider",
      siderConfig: {
        menu: [
          {
            key: "analysis",
            name: "数据分析(pdd)",
            menuType: "module",
            moduleType: "custom",
            customConfig: { path: "/todo" },
          },
          {
            key: "sider-search",
            name: "搜索",
            menuType: "module",
            moduleType: "iframe",
            iframeConfig: { path: "https://example.com" },
          },
          {
            // sider 子菜单里也可以有 group 分组
            key: "categories",
            name: "分类数据",
            menuType: "group",
            subMenu: [
              {
                key: "categoty-1",
                name: "一级分类",
                menuType: "module",
                moduleType: "custom",
                customConfig: { path: "/todo" },
              },
              // ...
            ],
          },
        ],
      },
    },
    // 4. 新增 iframe 模块
    {
      key: "search",
      name: "搜索",
      menuType: "module",
      moduleType: "iframe",
      iframeConfig: { path: "https://example.com" },
    },
  ],
};
```

### 示例（实际 `taobao.js`，最简覆盖）

```js
// model/business/project/taobao.js
module.exports = {
  name: "淘宝",
  desc: "淘宝是中国最大的电子商务平台之一，提供商品买卖、物流配送等服务。",
  homePage: "/schema?projectKey=taobao&key=product",
  menu: [
    // 覆盖 Model 中 key="order" 的菜单项，改为 iframe 模块
    {
      key: "order",
      moduleType: "iframe",
      iframeConfig: { path: "http://www.taobao.com" },
    },
    // 新增 sider 模块
    {
      key: "operation",
      name: "运营管理",
      menuType: "module",
      moduleType: "sider",
      siderConfig: {
        menu: [
          { key: "cpopon", name: "优惠券", menuType: "module", moduleType: "custom", customConfig: { path: "taobao/cpopon" } },
          { key: "limit", name: "限免", menuType: "module", moduleType: "custom", customConfig: { path: "taobao/limit" } },
          { key: "festival", name: "节日", menuType: "module", moduleType: "custom", customConfig: { path: "taobao/festival" } },
        ],
      },
    },
  ],
};
```

---

## 4. 菜单项 DSL（`menu[]` 的每个元素）

菜单项是 DSL 的核心，定义 Dashboard 的导航结构和页面渲染方式。

### 4.1 通用字段

| 字段   | 类型     | 必填 | 说明                                               |
| ------ | -------- | ---- | -------------------------------------------------- |
| `key`  | `string` | 是   | 菜单项唯一标识，**用于路由 query 参数 `?key=xxx`** |
| `name` | `string` | 否   | 菜单项显示名称（不写则从 Model 继承）              |

### 4.2 `menuType` — 菜单层级类型

| 值         | 说明                                                  | 必填子字段                 |
| ---------- | ----------------------------------------------------- | -------------------------- |
| `"module"` | 普通菜单模块（可直接点击导航，或作为 sider 子菜单项） | `moduleType` + 对应 config |
| `"group"`  | 分组菜单（含子菜单，不可直接导航）                    | `subMenu`                  |

**默认行为**：如果不写 `menuType`，则该菜单项是一个**仅覆盖属性的 module**（从 Model 继承 `menuType`/`moduleType`/`customConfig` 等）。这是 Project 覆盖 Model 的常见用法。

> **注意**：前端渲染时，`header-view.vue` 和 `sider-view.vue` 实际上通过检查菜单项是否有 `subMenu` 属性来决定是否渲染为下拉子菜单（`a-sub-menu`），而非直接判断 `menuType === "group"`。因此 `menuType: "group"` 的菜单项**必须同时包含 `subMenu` 数组**才能正确渲染。

### 4.3 `moduleType` — 模块渲染类型

仅当 `menuType: "module"` 时有效，决定前端路由跳转目标：

| 值         | 前端路由                        | 必填 config    | 说明                                                  |
| ---------- | ------------------------------- | -------------- | ----------------------------------------------------- |
| `"custom"` | `customConfig.path`             | `customConfig` | 自定义路径，直接跳转到 `customConfig.path` 指定的路由 |
| `"sider"`  | `/view/dashboard/sider`         | `siderConfig`  | 侧边栏复合视图，在左侧渲染子菜单，右侧渲染子页面      |
| `"iframe"` | `/view/dashboard/iframe`        | `iframeConfig` | iframe 嵌入页，src 为 `iframeConfig.path`             |
| `"schema"` | `/view/dashboard/schema`        | `schemaConfig` | schema 驱动页面（搜索栏 + 表格 + 分页）               |

> **sider 子菜单路由说明**：当 `moduleType: "sider"` 时，头部菜单点击跳转到 `/view/dashboard/sider`，sider 组件内的子菜单点击会跳转到 `/sider/<子模块路由>`（如 `/sider/iframe`、`/sider/schema`、`/sider/todo`），并在 query 中额外携带 `siderKey` 参数标识当前选中的子菜单项。`custom` 子项的 `customConfig.path` 会**原样拼接**到 `/sider` 后，因此**必须以 `/` 开头**（如 `path: "/todo"` → `/sider/todo`）；只有命中 `/sider` 已注册子路由（`/iframe`、`/schema`、`/todo`）的路径右侧才有内容，其余路径由 `/sider/:chapters+` 通配路由兜底渲染 sider-view，但内容区为空。**不带前导斜杠的 path（如 `"taobao/cpopon"`）会拼出非法路由 `/sidertaobao/cpopon`，点击后无法跳转**——当前 `model/business/project/taobao.js` 即存在此问题，配置时务必避免。

---

## 5. group + subMenu（分组菜单）

```js
{
  key: "shop-setting",
  name: "店铺设置",
  menuType: "group",
  subMenu: [
    {
      key: "info-setting",
      name: "店铺信息设置",
      menuType: "module",
      moduleType: "custom",
      customConfig: { path: "/todo" },
    },
    {
      key: "quality-setting",
      name: "店铺资质",
      menuType: "module",
      moduleType: "iframe",
      iframeConfig: { path: "https://example.com" },
    },
  ],
}
```

- `menuType: "group"` 的菜单项在头部导航栏显示为**下拉子菜单**（`a-sub-menu`）。
- `subMenu` 中每一项的结构与顶层 `menu[]` 完全一致，支持任意嵌套。

---

## 6. schema 模块 DSL（`moduleType: "schema"`）

schema 模块是本系统的核心形态：由 JSON-Schema 驱动渲染 **搜索栏（schema-search-bar）+ 表格（schema-table）+ 分页**，并通过按钮配置支持行操作。

### 6.1 schemaConfig 总览

```js
{
  key: "product",
  name: "商品管理",
  menuType: "module",
  moduleType: "schema",
  schemaConfig: {
    api: "/api/project/product",  // 接口基址（不是完整列表地址，见 6.6 接口契约）
    schema: { ... },              // 字段 schema，驱动搜索栏/表格列/表单/详情（见 6.2）
    tableConfig: {
      headerButtons: [...],       // 表头按钮（见 6.5）
      rowButtons: [...],          // 行按钮（见 6.5）
      componentConfig: { ... },   // 动态组件注册：createForm / editForm / detailPanel（见 6.5）
    },
    searchConfig: {},             // 预留：随 schemaViewData 透传，前端暂未消费
    // 注意：动态组件的 schema 由 tableConfig.componentConfig 派生
    // （components = { comName: { schema, config } }，见 schema-view/hook/schema.js），
    // schemaConfig 顶层不要手写 components 字段
  },
}
```

### 6.2 `schema.properties` — 字段定义

每个字段是一个属性，`key` 即接口数据里的字段名：

```js
schema: {
  type: "object",
  properties: {
    "<fieldKey>": {
      type: "string",          // JSON-Schema 类型
      label: "显示名称",        // 表格列标题
      tableOption: { ... },    // 可选。配置了才进表格列
      searchOption: { ... },   // 可选。配置了才进搜索栏
    },
  },
}
```

**关键规则**（由 `schema-view/hook/schema.js` 的 `buildDtoSchema` 实现）：

- `buildDtoSchema` 是**通用机制**：按 `${comName}Option` 匹配字段——`tableOption`、`searchOption`、`createFormOption`、`editFormOption`、`detailPanelOption` 全部走同一套逻辑，只是消费方不同。
- 配置了 `tableOption` 的字段才出现在表格中；配置了 `searchOption` 的字段才出现在搜索栏中。两者互相独立，同一字段可以只配其一。
- 合并后的字段会挂到 `option` 属性上：表格列收到 `option = tableOption`，搜索项收到 `option = searchOption`；其余非 `xxxOption` 的键（`type`/`label`/约束字段等）原样保留。
- **`schema.required` 数组自动注入**：字段名出现在 `schema.required` 中时，其 dto `option` 会被注入 `required: true`（表单必填校验与红星，见 6.8），不要在各个 option 里手写。
- **URL query 预填搜索值**：若路由 query 中存在与字段同名的参数（如 `?productName=手机`），会覆盖该搜索项的 `option.default`，实现"从别处跳转过来带着搜索条件"。仅对标量组件（`input`/`select`/`dynamicSelect`）生效——`dateRange` 的重置逻辑忽略 `default`，预填无效。

### 6.3 `tableOption` — 表格列配置

透传给 arco 的 `<a-table-column>`（`v-bind`），因此所有标准 arco-table-column 配置（`width`、`ellipsis`、`tooltip`、`align`、`fixed` 等）均可直接使用。另有三个扩展字段（由 `schema-table` 消费）：

| 字段       | 类型      | 说明                                                       |
| ---------- | --------- | ---------------------------------------------------------- |
| `enumList` | `array`   | 枚举标签：项为 `{label, value}`，命中枚举值的单元格渲染为彩色 `<a-tag>`（颜色按索引循环取色），未命中显示原值 |
| `toFixed`  | `number`  | 数字保留 N 位小数（前端对返回数据做格式化）                |
| `visible`  | `boolean` | 设为 `false` 时该列不渲染（字段仍参与搜索/数据）           |

> 所有列默认带 `ellipsis: true, tooltip: true`（防止长文本撑破列宽），`tableOption` 中的同名配置可覆盖默认值。

### 6.4 `searchOption` — 搜索项配置

搜索项组件注册在 `app/pages/widgets/schema-search-bar/complex-view/search-item-config.js`，通过 `componentType` 选择，其余配置透传给对应的 arco 组件（`v-bind`）：

| `componentType`  | arco 组件        | 额外字段                                        | 搜索值形状                                        |
| ---------------- | ---------------- | ----------------------------------------------- | ------------------------------------------------- |
| `"input"`        | `a-input`        | 无（`placeholder`、`allowClear` 等直接透传）    | 标量，如 `{"productName": "xx"}`                  |
| `"select"`       | `a-select`       | `enumList`: 静态选项数组，项为 `{label, value}` | 标量                                              |
| `"dynamicSelect"`| `a-select`       | `api`: 选项接口地址，挂载后请求拉取，响应 `data` 须为 `[{label, value}]` | 标量 |
| `"dateRange"`    | `a-range-picker` | `valueFormat`: 选中值格式（如 `"YYYY-MM-DD HH:mm:ss"`），建议配合 `showTime: true` | 拆为 `<fieldKey>_start` / `<fieldKey>_end` 两个参数 |

通用字段与空值语义：

- `default`：初始/重置值。`input`/`select`/`dynamicSelect` 用标量（建议 `""` 表示不选）；`select`/`dynamicSelect` 未配置 `default` 时会**回退选中第一个枚举值**，因此建议始终显式配置 `default: ""`；`dateRange` 的重置值恒为 `[]`（组件忽略 `default`）。
- **空值语义**：`getValue()` 只在组件值为 `undefined` 时省略该字段；`""`（含 `default: ""`）会原样下发。即首次加载和清空输入框后，请求里可能带空字符串参数，**后端需把 `""` 视为「不过滤」**。
- **dateRange 下发格式**：选中后该字段被拆成 `<fieldKey>_start` 与 `<fieldKey>_end` 两个 query 参数，值固定为 `YYYY-MM-DD HH:mm:ss` 字符串（组件内用 moment 格式化，与 `valueFormat` 无关）；未选值时两个参数都不下发。

### 6.5 `tableConfig` — 按钮与动态组件配置

#### headerButtons / rowButtons 通用结构

每项透传给 `<a-button>`。`eventKey` 决定点击行为：

| `eventKey`       | 内置行为                                                                 | 触发位置       | `eventOption`                                                                                       |
| ---------------- | ------------------------------------------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------- |
| `"delete"`       | 确认框 → `DELETE <api>`（body 为 `{ <参数名>: <值> }`）→ 成功后刷新表格 | 仅行按钮有意义 | `params`: 目前**只取第一个键值对**，取值语法 `"schema::<fieldKey>"` 表示从行数据取字段值             |
| `"showComponent"`| 打开 `comName` 对应的动态组件抽屉（见下方 componentConfig）              | 表头/行按钮均可 | `comName`: `createForm` / `editForm` / `detailPanel`（**字段名是 `comName`，不是 `componentName`**） |
| 其他（如 `edit`）| 无内置行为，向上 emit `operate`（table-panel → schema-view 的 `onTableOperate`），可扩展 | —      | —                                                                                                    |

`showComponent` 细节：schema-view 渲染 componentConfig 注册的组件并收集 ref，点击后按 `eventOption.comName` 匹配组件暴露的 `name`，调用其 `show(rowData)`（表头按钮无 rowData；`createForm` 的 `show` 不接收参数）。组件保存/关闭成功后 emit `command`，目前仅处理 `loadTableData`（刷新表格）。

- 表头按钮渲染在表格上方右侧，`type` 直接映射 `<a-button>` 的 `type`（如 `outline`）。
- 行按钮渲染在表格最右侧固定的「操作」列，固定渲染为 text 按钮，`type` 映射为 `status`（状态色）。
- 操作列宽度自动估算：`30 + Σ(按钮 label 字数 × 14 + 26)`，未配置按钮时为 50，无需配置。

#### componentConfig（动态组件注册，位于 `tableConfig` 下）

```js
tableConfig: {
  componentConfig: {
    createForm:  { title: "", saveBtnText: "" },              // 新增表单（a-drawer，保存 POST <api>）
    editForm:    { mainKey: "", title: "", saveBtnText: "" }, // 编辑表单（GET 回显，保存 PUT <api>）
    detailPanel: { mainKey: "", title: "" },                  // 详情抽屉（GET 回显，只读）
  },
}
```

- key 固定为 `createForm` / `editForm` / `detailPanel`（前端组件注册表 `schema-view/components/component-config.js` 只有这三个；未注册的 key 不渲染）。
- `mainKey`：行数据主键字段名（如 `"productId"`）。editForm/detailPanel 用它 `GET <api>?<mainKey>=<值>` 回显单条数据，editForm 保存时 PUT body 会带上 `{ [mainKey]: 主键值 }`。**未配置 mainKey 时编辑/详情无法工作**。
- 组件以 a-drawer（宽 550）呈现：标题取 `title`（`createForm`/`detailPanel` 有默认值「创建」/「详情」），保存按钮文案取 `saveBtnText`（默认「保存」）。
- 表单项字段由各字段的 `xxxOption` 决定，见 6.8。

### 6.6 后端接口契约

schema 模块对 `schemaConfig.api` 有固定调用方式，后端需实现（按前端实际用到的能力取舍）：

| 调用             | 方法     | 入参                                                          | 响应                                        | 调用方                    |
| ---------------- | -------- | ------------------------------------------------------------- | -------------------------------------------- | ------------------------- |
| 查询列表         | `GET`    | `<api>/list`，query: 搜索字段 + `page` + `pageSize`（默认 50） | `{ success, data: [...], metadata: { total } }`，`total` 必须存在 | schema-table |
| 单条查询         | `GET`    | `<api>`，query: `{ [mainKey]: 值 }`                           | `{ success, data: {...} }`                   | editForm / detailPanel 回显 |
| 新增             | `POST`   | `<api>`，body: createForm 表单值                              | `{ success }`                                | createForm                |
| 更新             | `PUT`    | `<api>`，body: `{ [mainKey]: 值, ...editForm 表单值 }`        | `{ success }`                                | editForm                  |
| 删除（配了 delete 按钮时） | `DELETE` | `<api>`，body: `{ <参数名>: <值> }`                 | `{ success }`                                | table-panel               |
| 枚举选项         | `GET`    | 搜索项 `dynamicSelect` 配置的 `api` 原样请求                  | `{ success, data: [{label, value}] }`        | dynamic-select            |

> 注意 `api` 是**基址**：列表接口由前端自动拼接 `/list` 后缀。搜索字段值原样并入 query（`dateRange` 拆为 `<field>_start`/`<field>_end`，空字符串参数表示「不过滤」，见 6.4）。
>
> **参考实现**：`app/controller/business.js` + `app/service/business.js` + `app/router/business.js` + `app/router-schema/business.js`（内存 mock 数据，覆盖以上全部方法）。

### 6.7 搜索数据流

```
schema-search-bar（收集各搜索项 getValue）
  → search-panel（@load / @search / @reset 统一转为 search 事件）
  → schema-view（apiParams = searchValObj，provide 给 table-panel）
  → schema-table（watch apiParams → 重置分页 → GET <api>/list）
```

- 首次挂载：所有搜索项加载完成后通过 `@load` **自动触发一次带默认值的查询**（含 URL query 预填值）。
- 点「查询」：立即按当前值触发。
- 「重置」：各搜索项恢复为 `default` 后清空 `apiParams`（重新拉全量）。

### 6.8 动态表单与详情（`createFormOption` / `editFormOption` / `detailPanelOption`）

字段配置了对应的 `xxxOption` 后，会进入同名动态组件的 schema（由 `buildDtoSchema` 按 `${comName}Option` 拆出，见 6.2）：

```js
productName: {
  type: "string",
  label: "商品名称",
  minLength: 3,                 // JSON-Schema 约束：表单 ajv 校验 + placeholder 提示
  maxLength: 10,
  createFormOption: {           // 新增表单项
    componentType: "input",
    default: "10086",
  },
  editFormOption: {             // 编辑表单项
    componentType: "input",
    disabled: true,             // 如主键字段编辑时禁用
    // visible: false,          // 隐藏该项（v-show，字段仍随 getValue 提交）
  },
  detailPanelOption: {},        // 详情展示：配置即以「label: value」行展示该字段
},
```

表单项组件注册在 `app/pages/widgets/schema-form/form-item-config.js`：

| `componentType`   | arco 组件        | 说明                                                     |
| ----------------- | ---------------- | -------------------------------------------------------- |
| `"input"`         | `a-input`        | `placeholder` 等直接透传                                  |
| `"inputNumber"`   | `a-input-number` | 数值范围走 schema 的 `minimum`/`maximum`                  |
| `"select"`        | `a-select`       | `enumList`: `[{label, value}]`，保存时按枚举值做 ajv 校验 |

> `dynamicSelect`/`dateRange` 尚未在表单侧注册（`dashboard-model.md` 中的相关描述为规划项）；`componentType` 未注册时该项不渲染。

通用 option 字段：

- `required`：一般不手写——由 `schema.required` 数组自动注入（见 6.2），控制红星与「不能为空」校验。
- `visible`：`false` 时隐藏表单项（`v-show`）。
- `disabled` / `default` / `placeholder`：透传给 arco 组件。

**校验**：schema-form 注入 ajv 实例，每个表单项在 blur/保存时按字段级 JSON-Schema（`type`/`minLength`/`maxLength`/`pattern`/`minimum`/`maximum`/`enum`）校验，错误文案显示在项下方；任一项失败则整个表单不提交。

**数据流**：`showComponent` → `com.show(rowData)` → createForm 直接打开（保存 `POST <api>`）；editForm/detailPanel 先 `GET <api>?<mainKey>=<值>` 回显；保存成功后 emit `command: loadTableData` 刷新表格。

---

## 7. Model 与 Project 合并规则

合并逻辑在 `model/index.js` 的 `projectExtendModel` 函数中实现，使用 `lodash.mergeWith` 进行**深度合并**，但对**数组的合并有特殊规则**：

### 7.1 普通对象字段：深度合并

```js
// Model: { name: "商品管理", customConfig: { path: "/todo" } }
// Project: { name: "商品管理(pdd)" }
// Result:  { name: "商品管理(pdd)", customConfig: { path: "/todo" } }
```

Project 的同名属性覆盖 Model 的，Model 独有的属性保留。

### 7.2 数组字段（如 `menu`）：按 `key` 匹配合并

数组合并不是简单的拼接或覆盖，而是按元素的 `key` 字段做**智能合并**：

1. **遍历 Model 数组**：对每个 Model 元素，在 Project 数组中找同 `key` 的元素：
   - 找到 → 递归深度合并 → 放入结果数组
   - 没找到 → 直接放入结果数组（保留 Model 默认值）
2. **遍历 Project 数组**：对 Project 中 Model 没有的 `key`，追加到结果数组末尾。

```
Model.menu = [{ key: "product", name: "商品管理", customConfig: { path: "/todo" } },
              { key: "order",   name: "订单管理", customConfig: { path: "/order" } }]

Project.menu = [{ key: "product", name: "商品管理(pdd)" },
                 { key: "data",    name: "数据管理(pdd)", menuType: "module", moduleType: "sider", ... }]

Result = [{ key: "product", name: "商品管理(pdd)", customConfig: { path: "/todo" }, menuType: "module", moduleType: "custom" },
          { key: "order",   name: "订单管理", customConfig: { path: "/order" } },
          { key: "data",    name: "数据管理(pdd)", menuType: "module", moduleType: "sider", ... }]
```

### 7.3 数组内对象也需要 `key`

由于数组合并依赖 `key` 做匹配，**`menu` 数组中的每个元素都必须有 `key` 字段**，否则合并不生效。

### 7.4 合并的递归特性

`projectExtendModel` 是一个**递归函数**——在数组合并时，对于同 `key` 的元素，会递归调用自身进行深度合并。这意味着 `siderConfig.menu`、`subMenu` 等嵌套数组中的元素也会按 `key` 匹配合并，合并行为在所有层级一致。

---

## 8. 前端消费链路

理解前端如何消费 DSL，有助于写出正确的配置。项目列表页 `/view/project-list` 及其 project API 由 `lumfall-business` 宿主应用提供；`/view/dashboard` 是 Lumfall 的项目工作台页面，下述链路由宿主应用的 project 模块支持：

```
1. 浏览器访问 /view/dashboard/schema?projectKey=pdd&key=product
   （history 模式，服务端由 app/router/view.js 的 /view/:page/* 兜底）
2. dashboard.vue onMounted:
   ├── GET /api/project/list?projectKey=pdd  → 项目列表（用于头部项目切换）
   └── GET /api/project?projectKey=pdd       → 项目完整配置（含合并后的 menu）
3. menuStore.setMenuList(menu)               → 菜单存入 Pinia
4. header-view.vue 渲染菜单                  → 根据 subMenu 是否存在决定是 a-menu-item 还是 a-sub-menu
5. 点击菜单项 → handleMenuSelect(menuItem)   → 根据 moduleType 决定路由跳转
6. 路由匹配 → 渲染对应组件
   ├── custom  → /view/dashboard + customConfig.path（如 /todo）
   ├── sider   → /view/dashboard/sider → sider-view.vue（左侧子菜单 + 右侧子路由）
   │               └── 子菜单点击 → /sider/<子模块路由>?siderKey=xxx（无 siderKey 时默认选中第一个子项）
   ├── iframe  → /view/dashboard/iframe → iframe-view.vue
   └── schema  → /view/dashboard/schema → schema-view.vue
7. schema-view 内部：
   useSchema() 根据路由 query 的 key/siderKey 从 menuStore 找到菜单项
   → buildDtoSchema 拆出 tableSchema / searchSchema / components（见 6.2）
   → 搜索栏 + 表格渲染，URL query 同名字段预填搜索默认值
8. 动态组件（配置了 tableConfig.componentConfig 时）：
   schema-view 渲染 createForm/editForm/detailPanel 抽屉
   → 按钮 eventKey=showComponent + eventOption.comName 打开对应抽屉（见 6.5）
   → 保存成功 emit command: loadTableData → 刷新表格
```

### 前端路由表（`entry.dashboard.js`，基址 `/view/dashboard`）

| 路由路径            | 组件              | 说明                                                                     |
| ------------------- | ----------------- | ------------------------------------------------------------------------ |
| `/todo`             | `todo.vue`        | 占位页面                                                                 |
| `/sider`            | `sider-view.vue`  | 侧边栏复合视图，含子路由 `/sider/iframe`、`/sider/schema`、`/sider/todo` |
| `/iframe`           | `iframe-view.vue` | iframe 嵌入页                                                            |
| `/schema`           | `schema-view.vue` | schema 驱动页                                                            |
| `/sider/:chapters+` | `sider-view.vue`  | sider 多级路径匹配                                                       |

### 前端路由 query 参数

| 参数          | 说明                                          | 示例       |
| ------------- | --------------------------------------------- | ---------- |
| `projectKey`  | 当前项目标识（与 Project 文件名一致）          | `pdd`      |
| `key`         | 当前选中的头部菜单项 `key`                     | `product`  |
| `siderKey`    | 当前选中的 sider 子菜单项 `key`（仅 sider 模块） | `cpopon`   |
| （任意字段名）| 与 schema 字段同名时预填该搜索项默认值（仅 schema 模块） | `?productName=手机` |

---

## 9. 通用 API 约定

前端所有请求经 `app/pages/common/curl.js` 发出，后端响应遵循统一包络。

### 9.1 响应包络

```json
{
  "success": true,
  "data": {},          // 业务数据
  "metadata": {}       // 附加信息，列表接口的 total 放这里
}
```

失败时 `success: false`，附带 `code` 与 `message`。前端按 code 提示：

| code     | 含义                                                     | 来源                       |
| -------- | -------------------------------------------------------- | -------------------------- |
| `442`    | 参数校验失败（router-schema ajv 校验）                   | `api-params-verify` 中间件 |
| `445`    | 非法请求：签名校验失败，或 `s_t` 时间戳距当前超过 10 分钟 | `api-sign-verify` 中间件   |
| `446`    | 缺少 `project_key` header                                | `project-handler` 中间件   |
| `5000`   | 服务端未捕获异常（统一 Internal Server Error）           | `error-handler` 中间件     |
| `50000`  | 业务错误（message 为具体文案）                           | controller 调 `this.fail`  |
| `504`    | 请求超时（>60s）                                         | curl.js                    |

### 9.2 请求头

- `s_t` + `s_sign`：curl.js 自动附带时间戳与签名（`md5("lumfall_" + s_t)`），服务端校验签名并要求 `s_t` 距当前不超过 10 分钟，否则返回 `445`。
- `project_key`：URL 以 `/api/project/` 开头时自动携带，取自 `window.__LUMFALL__.projectKey`（服务端在 `entry.tpl` 注入）。**归属项目的接口必须带此头**（`project-handler` 中间件强制），例外名单：`/api/project/model_list`、`/api/project/list`。

### 9.3 页面路由基址

前端使用 history 路由，页面路由以 `/view/dashboard` 为基址（`route-path.js` 的 `DASHBOARD_BASE`），必须与服务端 `/view/:page/*` 路由前缀一致。DSL 中所有路径（`homePage`、`customConfig.path`）都写**不带基址**的页面内路由。

### 9.4 新增 schema 后端接口的登记步骤

1. 在 `app/service/business.js`（或新建 service）实现数据逻辑。
2. 在 `app/controller/business.js` 实现处理器，遵循 `this.success(ctx, data, { total })` / `this.fail(ctx, message, code)`。
3. 在 `app/router/business.js` 注册路由，注意与 6.6 的调用契约对齐（`GET <api>/list`、`GET/POST/PUT/DELETE <api>`、枚举选项接口）。
4. 在 `app/router-schema/business.js` 登记参数校验 schema——**登记的 key 必须与路由 path 完全一致**，否则校验静默不生效（无 schema 的 path 会直接放行）。

---

## 10. 新增 DSL 的完整步骤

### 步骤一：新增 Model

1. 在 `model/` 下创建目录（如 `model/finance/`）。
2. 创建 `model/finance/model.js`：

```js
module.exports = {
  model: "dashboard",
  name: "财务系统",
  menu: [
    {
      key: "report",
      name: "报表管理",
      menuType: "module",
      moduleType: "custom",
      customConfig: { path: "/todo" },
    },
  ],
};
```

### 步骤二：新增 Project

1. 在 `model/finance/project/` 下创建文件（如 `model/finance/project/bank.js`）。
2. 编写 Project 配置：

```js
module.exports = {
  name: "银行财务",
  desc: "银行财务管理系统",
  homePage: "/todo?projectKey=bank&key=report",
  menu: [
    // 覆盖 Model 中 key="report" 的菜单项
    { key: "report", name: "财务报表(银行)" },
    // 新增 sider 菜单项
    {
      key: "audit",
      name: "审计管理",
      menuType: "module",
      moduleType: "sider",
      siderConfig: {
        menu: [
          {
            key: "annual",
            name: "年度审计",
            menuType: "module",
            moduleType: "custom",
            customConfig: { path: "/todo" },
          },
        ],
      },
    },
  ],
};
```

### 步骤三：无需注册，自动加载

`model/index.js` 会自动扫描 `model/**/model.js` 和 `model/**/project/*.js`，无需手动注册。在包含 project 模块的宿主应用（如 `lumfall-business`）中，重启服务后可通过以下 API 访问：

| API                                    | 说明                                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| `GET /api/project/model_list`          | 返回所有 Model + Project 列表（DTO）。Model 仅含 `key/name/desc`；Project 仅含 `key/name/desc/homePage` |
| `GET /api/project/list?projectKey=xxx` | 按可选 projectKey 过滤返回项目列表，每项含 `key/name/desc/homePage/modelKey`           |
| `GET /api/project?projectKey=bank`     | 返回合并后的完整 Project 配置（含 menu）                                              |

若新增了 schema 模块，还需按 9.4 实现并登记其后端接口。

---

## 11. 完整 DSL 模板参考

以下是一个包含所有菜单类型的项目级模板（动态表单/详情的完整字段配置见第 2 节实际 model.js 示例与 6.8 节）：

```js
module.exports = {
  name: "示例项目",
  desc: "展示所有菜单类型的示例",
  homePage: "/schema?projectKey=demo&key=product",

  menu: [
    // ─── 1. custom 模块（自定义路由页面）───
    {
      key: "home",
      name: "首页",
      menuType: "module",
      moduleType: "custom",
      customConfig: { path: "/todo" },
    },

    // ─── 2. iframe 模块（嵌入外部页面）───
    {
      key: "external",
      name: "外部链接",
      menuType: "module",
      moduleType: "iframe",
      iframeConfig: { path: "https://example.com" },
    },

    // ─── 3. sider 模块（侧边栏复合视图）───
    {
      key: "management",
      name: "管理",
      menuType: "module",
      moduleType: "sider",
      siderConfig: {
        menu: [
          {
            key: "settings",
            name: "设置",
            menuType: "module",
            moduleType: "custom",
            customConfig: { path: "/todo" },
          },
          {
            key: "stats",
            name: "统计",
            menuType: "module",
            moduleType: "iframe",
            iframeConfig: { path: "https://stats.example.com" },
          },
        ],
      },
    },

    // ─── 4. schema 模块（搜索栏 + 表格）───
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
              tableOption: { width: 300, ellipsis: true, tooltip: true },
            },
            productName: {
              type: "string",
              label: "商品名称",
              tableOption: { width: 200 },
              searchOption: {
                componentType: "input",
                default: "",
                placeholder: "请输入商品名称",
                allowClear: true,
              },
            },
            status: {
              type: "string",
              label: "上架状态",
              tableOption: { width: 200 },
              searchOption: {
                componentType: "select",
                default: "",
                enumList: [
                  { label: "上架", value: "1" },
                  { label: "下架", value: "0" },
                ],
              },
            },
          },
        },
        tableConfig: {
          headerButtons: [
            { label: "新增商品", eventKey: "showComponent", type: "outline" },
          ],
          rowButtons: [
            {
              label: "删除",
              eventKey: "delete",
              type: "danger",
              eventOption: { params: { productId: "schema::productId" } },
            },
          ],
        },
      },
    },

    // ─── 5. group 分组（下拉子菜单）───
    {
      key: "system",
      name: "系统管理",
      menuType: "group",
      subMenu: [
        {
          key: "users",
          name: "用户管理",
          menuType: "module",
          moduleType: "custom",
          customConfig: { path: "/todo" },
        },
        {
          key: "roles",
          name: "角色管理",
          menuType: "module",
          moduleType: "custom",
          customConfig: { path: "/todo" },
        },
      ],
    },

    // ─── 6. 仅覆盖（从 Model 继承其余属性，只改 name）───
    { key: "report", name: "报表(自定义名称)" },
  ],
};
```

---

## 12. 编写注意事项

| #   | 注意点                                                             | 说明                                                                                       |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 1   | **`key` 必填且唯一**                                               | 菜单项合并、前端查找全部依赖 `key`，缺失会导致合并不生效、菜单点击无响应                   |
| 2   | **`homePage` 格式**                                                | 写页面内路由 `/path?projectKey=xxx&key=xxx`（不带 `/view/dashboard` 前缀），`projectKey` 必须与文件名一致 |
| 3   | **Project 覆盖 Model 菜单项只需写 `key` + 差异字段**               | 例如 `{ key: "product", name: "商品管理(pdd)" }` 即可覆盖名称，其余从 Model 继承            |
| 4   | **不要手动写 `key`/`modelKey` 到文件顶层**                         | 扫描器会自动注入 `project[key].key` 和 `project[key].modelKey`，手动写无意义               |
| 5   | **sider 子菜单支持任意 `moduleType`**                              | sider 的子菜单可以是 custom、iframe、schema，也支持嵌套 group（层级不宜过深）              |
| 6   | **group 的 `subMenu` 子项也必须写 `menuType: "module"`**           | 否则前端无法正确渲染子菜单项                                                               |
| 7   | **`moduleType` 为 `iframe` 时 `path` 可以是完整 URL 或内部路径**   | `path` 原样作为 `<iframe src>`：完整 URL（如 `http://www.taobao.com`）嵌入第三方页面；相对路径（如 `todo`）基于当前页面 URL 解析（`/view/dashboard/schema` 下的 `todo` → `/view/dashboard/todo`），同样落到服务端页面路由。未配置时显示空态提示 |
| 8   | **新增 Model/Project 无需修改任何代码**                            | 只需在 `model/` 下按目录约定放文件，重启服务即自动加载                                     |
| 9   | **注意 `menuType` 拼写**                                          | 字段名是 `menuType`（不是 `menuTye`），拼写错误会导致菜单项无法正确识别为 module/group     |
| 10  | **`siderConfig.menu` 子菜单项的 `key` 同样要唯一**                | sider 子菜单的路由 query 参数是 `siderKey`（不是 `key`），但子菜单项本身的 `key` 仍需与同级项唯一 |
| 11  | **覆盖时不要遗漏 `moduleType` 对应的 config**                      | 例如将 `moduleType` 改为 `iframe` 时，需同时提供 `iframeConfig`，否则前端路由跳转会失败   |
| 12  | **schema 字段不配 `tableOption`/`searchOption` 就不显示**          | 表格列与搜索栏互相独立，由各自 Option 的存在与否决定；`visible: false` 只是隐藏列          |
| 13  | **`api` 是基址，不是列表地址**                                     | 前端自动请求 `GET <api>/list`，删除走 `DELETE <api>`，后端实现时对齐 6.6 契约              |
| 14  | **router-schema 的 path 必须与路由 path 一致**                     | 不一致时该接口的参数校验会静默跳过（不报错），如曾经的 `/api/product` vs `/api/project/product` |
| 15  | **`dateRange` 搜索值拆为 `_start`/`_end`**                         | 选中后以 `<field>_start`、`<field>_end` 两个参数下发，值固定 `YYYY-MM-DD HH:mm:ss`；未选值时不下发；组件忽略 `default`，URL 预填对它无效             |
| 16  | **sider 子项 custom 的 `path` 必须以 `/` 开头**                    | 否则会拼出 `/sidertaobao/...` 之类的非法路由，点击无法跳转（当前 `taobao.js` 的 `taobao/cpopon` 即踩此坑）                                          |
| 17  | **`componentConfig` 必须放在 `tableConfig` 下**                    | hook/schema.js 读取的是 `schemaConfig.tableConfig.componentConfig`，写在 `schemaConfig` 顶层不生效                                                  |
| 18  | **`showComponent` 用 `eventOption.comName`**                       | 字段名是 `comName`（不是 `componentName`），取值 `createForm`/`editForm`/`detailPanel`                                                              |
| 19  | **表单 `componentType` 当前仅支持 `input`/`inputNumber`/`select`** | `dynamicSelect`/`dateRange` 未在表单侧注册；`select` 未配 `default` 时会回退选中第一个枚举值，建议显式 `default: ""`                                 |
| 20  | **必填校验用 `schema.required` 数组**                              | 自动注入到对应 `xxxOption.required`（红星 + 校验），不要在每个 option 里手写                                                                        |
