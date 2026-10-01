# 健康检查

Sunset 提供两个不需要业务鉴权的 HTTP 探针：

- `GET /health/live`：进程存活检查。只确认 Koa 能响应，不检查数据库等依赖。
- `GET /health/ready`：流量就绪检查。并行执行已注册的应用依赖探针，全部成功返回 HTTP 200，任意探针失败或超时返回 HTTP 503。
- `/view/health`：人工查看 live/ready 状态及各依赖探针结果的页面。

两个接口设置 `Cache-Control: no-store`。响应只暴露探针名称和状态，不返回错误对象、连接串或异常信息。没有注册依赖探针时，readiness 表示 Sunset 已完成启动。

## 注册依赖探针

在业务 `app/extend/` 中注册探针。extend loader 执行时 services 和 config 已加载：

```js
module.exports = (app) => {
  app.health.register("database", async () => {
    await app.services.database.ping();
  });

  app.health.register(
    "cache",
    () => app.services.cache.ping(),
    { timeoutMs: 1000 },
  );

  return {};
};
```

探针抛错、超时或明确返回 `false` 都视为失败；其余返回值视为成功。默认超时为 3000ms，可通过 `register(name, probe, { timeoutMs })` 单独调整。探针应该轻量、只读且快速；为底层客户端同时配置连接/请求超时，因为框架超时只限制健康响应等待时间，不会取消底层操作。

## 编排建议

- Kubernetes `livenessProbe` 使用 `/health/live`，`readinessProbe` 使用 `/health/ready`。
- 不要把数据库等瞬时依赖放进 liveness。依赖短暂故障时应摘除流量，而不是让编排平台反复重启进程。
- 探针使用短超时和合理的检查周期；不要在探针中执行迁移、写操作或昂贵查询。
- 如需判断进程启动阶段，应由应用完成必要初始化后再启动监听；readiness 仅报告已经注册的依赖探针。