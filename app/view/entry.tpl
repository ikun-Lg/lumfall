<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{name}}</title>
    {# 服务端注入的全局配置：nunjucks 渲染后写入 window.__SUNSET__ 给前端读取。
       字符串字段走 dump(JSON 序列化)，避免引号/特殊字符破坏 JS 字面量；
       options 在 controller 里已 JSON.stringify，这里只需 | safe 防止被 HTML 转义。 #}
    <script>
      window.__SUNSET__ = {
        name: {{ name | default("", true) | dump | safe }},
        env: {{ env | default("", true) | dump | safe }},
        options: {{ options | default("{}", true) | safe }},
        projectKey: {{ projectKey | default("", true) | dump | safe }},
      };
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
