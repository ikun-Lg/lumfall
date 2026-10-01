const DEFAULT_TIMEOUT_MS = 3000;

module.exports = () => {
  const checks = new Map();

  return {
    list() {
      return Array.from(checks, ([name, { timeoutMs }]) => ({ name, timeoutMs }))
        .sort((left, right) => left.name.localeCompare(right.name));
    },

    register(name, probe, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
      if (typeof name !== "string" || !name.trim()) {
        throw new TypeError("Health check name must be a non-empty string");
      }
      if (typeof probe !== "function") {
        throw new TypeError(`Health check ${name} must be a function`);
      }
      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        throw new TypeError(`Health check ${name} timeoutMs must be positive`);
      }
      if (checks.has(name)) {
        throw new Error(`Health check ${name} is already registered`);
      }

      checks.set(name, { probe, timeoutMs });
      return () => checks.delete(name);
    },

    async readiness() {
      const results = await Promise.all(
        Array.from(checks.entries(), async ([name, { probe, timeoutMs }]) => {
          let timeout;

          try {
            const result = await Promise.race([
              Promise.resolve().then(probe),
              new Promise((resolve, reject) => {
                timeout = setTimeout(
                  () => reject(new Error("Health check timed out")),
                  timeoutMs,
                );
              }),
            ]);

            return { name, status: result === false ? "error" : "ok" };
          } catch {
            return { name, status: "error" };
          } finally {
            clearTimeout(timeout);
          }
        }),
      );

      return {
        status: results.every((result) => result.status === "ok")
          ? "ok"
          : "error",
        checks: results,
      };
    },
  };
};