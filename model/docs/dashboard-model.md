# Dashboard DSL 字段参考（Model 结构标准）

<!-- schema 子对象以 JSON-Schema draft-07 为标准 https://json-schema.org/draft-07/schema
     本文件是字段级速查；合并规则、消费链路与完整可运行示例见 docs/dsl-guide.md。
     含注释，非合法 JSON，仅作结构示意。 -->

## Model 顶层（`model/<modelKey>/model.js`）

```js
{
  "model": "dashboard",   // 模式类型标识，固定 "dashboard"（注意字段名是 model，不是 mode）
  "name": "",             // Model 显示名称
  "menu": [ /* 菜单项数组，见下 */ ],
}
```

> `key` 由扫描器按目录名自动注入，不要手写。`desc`/`icon`/`homePage` 是 **Project 顶层字段**（`model/<modelKey>/project/<projectKey>.js`），不属于 Model：
>
> ```js
> // Project 顶层
> {
>   "name": "",      // 项目显示名称（必填）
>   "desc": "",      // 项目描述（必填）
>   "homePage": "",  // 默认首页，页面内路由如 "/schema?projectKey=xxx&key=yyy"（必填）
>   "icon": "",      // 预留
>   "menu": [ /* 与 Model 的 menu 深度合并 */ ],
> }
> ```

## 菜单项（`menu[]` 元素）

```js
{
  "key": "",            // 必填且同级唯一：数组合并、路由 query（key / siderKey）都依赖它
  "name": "",           // 显示名称；Project 覆盖时可省略（继承 Model）
  "menuType": "",       // "module" | "group"
  "moduleType": "",     // menuType=module 时：custom | iframe | sider | schema

  // ── menuType=group 时必填；元素结构与 menu[] 完全一致，支持嵌套 ──
  "subMenu": [],

  // ── moduleType=custom ──
  "customConfig": {
    "path": ""          // 页面内路由，sider 子项中必须以 / 开头
  },

  // ── moduleType=iframe ──
  "iframeConfig": {
    "path": ""          // 完整 URL 或页面内路径；未配置时显示空态
  },

  // ── moduleType=sider（注意是对象，不是数组）──
  "siderConfig": {
    "menu": []          // 子菜单，元素结构与 menu[] 一致（不支持再嵌套 sider）
  },

  // ── moduleType=schema ──
  "schemaConfig": { /* 见下 */ },
}
```

## `schemaConfig`

```js
{
  // 接口基址（不是完整列表地址）：
  // GET <api>/list 列表；GET <api>?<mainKey>= 单条回显；POST/PUT/DELETE <api> 增/改/删
  "api": "",

  "schema": {
    "type": "object",
    "properties": {
      "<fieldKey>": {
        "type": "",        // JSON-Schema 类型；表单项按此做 ajv 校验
        "label": "",       // 表格列标题 / 表单 label / 详情行 label
        // 可选 JSON-Schema 约束：仅表单侧消费（校验 + placeholder 提示）
        "minLength": 0, "maxLength": 0, "pattern": "",
        "minimum": 0, "maximum": 0,

        // ── 可选：配置了才进表格列（透传 arco-table-column 标准配置）──
        "tableOption": {
          "enumList": [],  // 枚举标签 [{label, value}]，命中值渲染为彩色 a-tag
          "toFixed": 0,    // 数字保留 N 位小数
          "visible": true  // false 隐藏该列
        },

        // ── 可选：配置了才进搜索栏（透传 arco 组件配置）──
        "searchOption": {
          "componentType": "", // input | select | dynamicSelect | dateRange
          "default": "",       // dateRange 恒为 []（组件忽略该值）；select 未配置时回退第一个枚举值，建议显式 ""
          "enumList": [],      // componentType=select：[{label, value}]
          "api": "",           // componentType=dynamicSelect：挂载后请求，响应 data 须为 [{label, value}]
          "valueFormat": "",   // componentType=dateRange：如 YYYY-MM-DD HH:mm:ss（建议配合 showTime: true）
          // 下发格式：标量为同名字段；dateRange 拆为 <fieldKey>_start / <fieldKey>_end（固定 YYYY-MM-DD HH:mm:ss）
        },

        // ── 可选：新增表单项（需 tableConfig.componentConfig.createForm）──
        "createFormOption": {
          "componentType": "", // input | inputNumber | select（dynamicSelect/dateRange 尚未注册）
          "visible": true,     // false 隐藏（v-show，字段仍随 getValue 提交）
          "disabled": false,
          "default": "",
          "enumList": []       // componentType=select
        },

        // ── 可选：编辑表单项（需 componentConfig.editForm），字段同 createFormOption ──
        "editFormOption": {},

        // ── 可选：详情展示（需 componentConfig.detailPanel），配置即以 label: value 行展示 ──
        "detailPanelOption": {},
      },
    },
    "required": [],  // 字段名数组：自动注入对应 option.required → 表单红星 + 必填校验
  },

  "tableConfig": {
    "headerButtons": [
      {
        "label": "",
        "eventKey": "",      // delete | showComponent 有内置行为，其余向上 emit operate
        "eventOption": {
          "comName": "createForm"  // eventKey=showComponent 时必填：createForm | editForm | detailPanel
        },                         // （注意字段名是 comName，不是 componentName）
        // "...": "arco button 标准配置（type/status 等），透传 a-button"
      },
    ],
    "rowButtons": [
      {
        "label": "",
        "eventKey": "",      // 渲染为 text 按钮，type 映射状态色（status）
        "eventOption": {
          "comName": "",     // eventKey=showComponent
          "params": {        // eventKey=delete：目前只取第一组键值对
            "paramKey": "schema::<rowField>"
          },
        },
      },
    ],
    // 动态组件注册：必须放在 tableConfig 下（hook/schema.js 读取 tableConfig.componentConfig）
    "componentConfig": {
      "createForm": {
        "title": "",        // 默认「创建」
        "saveBtnText": ""   // 默认「保存」
      },
      "editForm": {
        "mainKey": "",      // 行数据主键字段名：GET 回显 + PUT body 携带 { [mainKey]: 值 }，必配
        "title": "",
        "saveBtnText": ""
      },
      "detailPanel": {
        "mainKey": "",      // GET 回显主键，必配
        "title": ""         // 默认「详情」
      }
    },
  },

  // 预留：随 schemaViewData 透传，前端暂未消费
  "searchConfig": {},
}
```

## 后端接口契约速查

| 调用     | 方法     | 地址                                       | 响应                          |
| -------- | -------- | ------------------------------------------ | ----------------------------- |
| 列表     | `GET`    | `<api>/list?搜索字段&page&pageSize`        | `{ success, data: [], metadata: { total } }` |
| 单条回显 | `GET`    | `<api>?<mainKey>=<值>`                     | `{ success, data: {} }`       |
| 新增     | `POST`   | `<api>`，body: createForm 表单值           | `{ success }`                 |
| 更新     | `PUT`    | `<api>`，body: `{ [mainKey]: 值, ...表单值 }` | `{ success }`              |
| 删除     | `DELETE` | `<api>`，body: `{ <参数名>: <值> }`        | `{ success }`                 |
| 枚举选项 | `GET`    | dynamicSelect 的 `api`                     | `{ success, data: [{label, value}] }` |
