```json
{
  "mode": "dashboard",
  "name": "",
  "desc": "",
  "icon": "",
  "homePage": "",
  "menu": [
    {
      "key": "",
      "name": "",
      "menuType": "",
      "subMenu": [{}],
      "moduleType": "",
      "siderConfig": [
        {
          "menu": [
            {}
          ]
        }
      ],
      "iframeConfig": {
        "path": ""
      },
      "customConfig": {
        "path": ""
      },
      "schemaConfig": {
        "api": "",
        "schema": {
          "type": "object",
          "properties": {
            "key": {
              ...schema,
              "type": "",
              "label": "",
              "tableOption": {
                ...aTableColumnConfig, //标准acro-table-column 配置
                "toFixed": 0,
                "visible": true
              },
              "searchOption":{
                ...aComponentConfig, // 标准acro-component-column 配置
                "componentType":"", // 搜索项组件类型: input | select | dynamicSelect | dateRange
                "default":"", // componentType === dateRange 时为数组 []
                "enumList":[ // componentType === select 时生效, 项为 { label, value }, 映射为 a-select 的 options
                  {
                    "label": "",
                    "value": ""
                  }
                ],
                "api": "", // componentType === dynamicSelect 时生效, 搜索项挂载后请求该接口拉取选项, 响应 data 为 [{ label, value }]
                "valueFormat": "" // componentType === dateRange 时生效, 如 YYYY-MM-DD HH:mm:ss, 决定选中值的格式, 搜索值以 [start, end] 数组下发
              },

              "createFormOption":{
                 ...aComponentConfig,
                "componentType":"", // 创建表单项组件类型: input | select | dynamicSelect | dateRange
                "visible": true,
                "disabled": false,
                "default":"",

                "enumList":[],
              }
            },
            ...
          },
          "required":[], //标记哪些字段是必填项
        },
        "tableConfig": {
          "headerButtons": [
            {
              "label": "",
              "eventKey": "",
              "eventOption":{
                 "comName":"createForm"
              },
              "eventOption": {
                "componentName": "
              },
              ...aButtonConfig
            },
            ...
          ],
          "rowButtons": [
            {
              "label": "",
              "eventKey": "",
              "eventOption": {
                "componentName": "",
                "params": {
                  "paramKey": "rowValueKey",
                  ...
                }
              },
              ...aButtonConfig
            },
            ...
          ]
        },
        // search-bar config
        "searchConfig": {},
        // dynamic component config
        "componentConfig": {
          "createForm":{
            "title":"",
            "saveBtnText":""
          }
        }
      }
    }
  ]
}
```
