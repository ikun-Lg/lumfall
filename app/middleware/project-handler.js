// 全局级接口：不属于任何具体项目（返回全量数据，或通过 query 传 projectKey），
// 用于项目列表页初始化，此时尚未选择项目，因此不强制要求 project_key header，
// 否则 /view/project-list 会因缺少项目上下文而返回 446。
// 其余 /api/project/** 业务接口都归属某个项目，必须携带 project_key。
const PROJECT_KEY_FREE_PATHS = new Set([
  "/api/project/model_list",
  "/api/project/list",
]);

// koa-router 默认非 strict 模式，/api/project/list 与 /api/project/list/ 等价
const normalizePath = (path = "") => path.replace(/\/+$/, "") || "/";

module.exports = (app) => {
  return async (ctx, next) => {
    if (ctx.path.indexOf("/api/project/") < 0) {
      return await next();
    }

    if (PROJECT_KEY_FREE_PATHS.has(normalizePath(ctx.path))) {
      return await next();
    }

    const { project_key } = ctx.request.headers;

    if (!project_key) {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: 446,
        message: "projectKey is not found",
      };
      return;
    }

    ctx.projectKey = project_key;

    await next();
  };
};
