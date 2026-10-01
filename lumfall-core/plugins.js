module.exports = (app, definitions = []) => {
  if (!Array.isArray(definitions)) {
    throw new TypeError("[plugin] options.plugins must be an array");
  }

  const pluginsByName = new Map();
  definitions.forEach((definition) => {
    if (!isPlainObject(definition)) {
      throw new TypeError("[plugin] each plugin must be a plain object");
    }
    if (typeof definition.name !== "string" || !definition.name.trim()) {
      throw new TypeError("[plugin] each plugin must have a non-empty name");
    }
    if (pluginsByName.has(definition.name)) {
      throw new Error(`[plugin] duplicate plugin name "${definition.name}"`);
    }
    if (typeof definition.register !== "function") {
      throw new TypeError(
        `[plugin] plugin "${definition.name}" must provide register(app)`,
      );
    }

    const dependencies = definition.dependencies ?? [];
    if (
      !Array.isArray(dependencies) ||
      dependencies.some((dependency) => typeof dependency !== "string" || !dependency.trim())
    ) {
      throw new TypeError(
        `[plugin] dependencies for "${definition.name}" must be an array of names`,
      );
    }

    pluginsByName.set(definition.name, {
      name: definition.name,
      dependencies,
      register: definition.register,
    });
  });

  const ordered = [];
  const visited = new Set();
  const visiting = [];

  function visit(plugin) {
    if (visited.has(plugin.name)) {
      return;
    }

    const cycleIndex = visiting.indexOf(plugin.name);
    if (cycleIndex >= 0) {
      const cycle = [...visiting.slice(cycleIndex), plugin.name].join(" -> ");
      throw new Error(`[plugin] dependency cycle detected: ${cycle}`);
    }

    visiting.push(plugin.name);
    plugin.dependencies.forEach((dependencyName) => {
      const dependency = pluginsByName.get(dependencyName);
      if (!dependency) {
        throw new Error(
          `[plugin] plugin "${plugin.name}" depends on unknown plugin "${dependencyName}"`,
        );
      }
      visit(dependency);
    });
    visiting.pop();
    visited.add(plugin.name);
    ordered.push(plugin);
  }

  pluginsByName.forEach(visit);
  app.plugins = {};

  ordered.forEach(({ name, register }) => {
    let result;
    try {
      result = register(app);
    } catch (error) {
      throw new Error(
        `[plugin] plugin "${name}" registration failed: ${error.message}`,
      );
    }
    if (result && typeof result.then === "function") {
      result.catch(() => {});
      throw new Error(`[plugin] plugin "${name}" register(app) must be synchronous`);
    }
    if (result !== undefined && !isPlainObject(result)) {
      throw new TypeError(
        `[plugin] plugin "${name}" register(app) must return a plain object or undefined`,
      );
    }
    app.plugins[name] = result || {};
  });
};

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}