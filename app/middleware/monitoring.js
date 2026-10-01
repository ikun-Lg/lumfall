const crypto = require("crypto");

const MONITORING_HOOKS = new Set([
  "onRequestStart",
  "onRequestEnd",
  "onRequestError",
]);

/**
 * monitoring middleware
 * @param {object} app Koa instance
 *
 * Opt-in via `options.monitoring`. When absent the middleware is a passthrough,
 * so the default startup path is unchanged.
 *
 * options.monitoring = {
 *   traceHeader: "x-trace-id",       // optional, default "x-trace-id"
 *   onRequestStart({ traceId, method, path }),
 *   onRequestEnd({ traceId, method, path, status, durationMs }),
 *   onRequestError({ traceId, method, path, error, durationMs }),
 * }
 *
 * The middleware sits outside errorHandler, so it can observe errors thrown by
 * inner middleware; hook failures are logged and never change the response.
 */
module.exports = (app) => {
  const monitoring = app.options?.monitoring;

  if (monitoring === undefined) {
    return async (_ctx, next) => next();
  }

  if (!isPlainObject(monitoring)) {
    throw new TypeError("[monitoring] options.monitoring must be a plain object");
  }

  Object.entries(monitoring).forEach(([name, value]) => {
    if (name === "traceHeader") {
      if (typeof value !== "string" || !value.trim()) {
        throw new TypeError("[monitoring] traceHeader must be a non-empty string");
      }
      return;
    }
    if (!MONITORING_HOOKS.has(name)) {
      throw new Error(`[monitoring] unknown option or hook "${name}"`);
    }
    if (typeof value !== "function") {
      throw new TypeError(`[monitoring] hook "${name}" must be a function`);
    }
  });

  const traceHeader = (monitoring.traceHeader || "x-trace-id").toLowerCase();
  const responseHeader = traceHeader
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");

  const runHook = (name, payload) => {
    const hook = monitoring[name];
    if (typeof hook !== "function") {
      return;
    }
    try {
      hook(payload);
    } catch (error) {
      // A broken hook must not change the request outcome.
      const message = `[monitoring] ${name} hook failed: ${error.message}`;
      if (typeof app.logger?.warn === "function") {
        app.logger.warn(message);
      } else {
        console.warn(message);
      }
    }
  };

  return async (ctx, next) => {
    const traceId = resolveTraceId(ctx, traceHeader);
    ctx.traceId = traceId;
    ctx.set(responseHeader, traceId);

    const startedAt = Date.now();
    const basePayload = { traceId, method: ctx.method, path: ctx.path };

    runHook("onRequestStart", { ...basePayload });

    try {
      await next();
      runHook("onRequestEnd", {
        ...basePayload,
        status: ctx.status,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      runHook("onRequestError", {
        ...basePayload,
        error,
        durationMs: Date.now() - startedAt,
      });
      throw error;
    }
  };
};

function resolveTraceId(ctx, traceHeader) {
  const incoming = ctx.request?.headers?.[traceHeader];
  if (typeof incoming === "string" && incoming.trim()) {
    return incoming.trim();
  }
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString("hex");
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
