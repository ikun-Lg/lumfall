/**
 * dashboard 页面的前端路由基址。
 * history 模式下路由就是真实 URL，必须和服务端 `router.get("/view/:page/*")`
 * （app/router/view.js）的前缀保持一致，否则刷新会 404 / 被兜底重定向到 homePath。
 */
export const DASHBOARD_BASE = "/view/dashboard";

/**
 * 拼接 dashboard 下的完整前端路由
 * @param {string} path 模块路由，可带或不带前导斜杠（如 "/todo" 或 "todo"）
 */
export function dashboardPath(path = "") {
  if (!path) {
    return DASHBOARD_BASE;
  }
  return `${DASHBOARD_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
